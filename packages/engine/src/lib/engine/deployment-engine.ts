import { StackStatus } from '../states/stack-status';
import { ResourceStatus } from '../states/resource-status';
import { EventBus } from '../events/event-bus';
import { EngineEvent } from '../events/engine-event';
import { EngineStateManager } from '../state/engine-state-manager';
import { StatePersistence } from '../state/state-persistence';
import type { ProviderAdapter } from '../adapter/provider-adapter';
import type { AssemblyStack } from '../assembly/assembly-types';
import type { DeploymentPlan } from '../planner/deployment-plan';

// ─── Public types ─────────────────────────────────────────────────────────────

/**
 * Result for a single resource after deployment.
 */
export interface ResourceDeploymentResult {
  /** Logical resource ID. */
  readonly logicalId: string;
  /** `true` if the resource was created successfully. */
  readonly success: boolean;
  /** Provider-assigned physical ID (set on success). */
  readonly physicalId?: string;
  /** Error message (set on failure). */
  readonly error?: string;
}

/**
 * Result for a single stack after deployment.
 */
export interface StackDeploymentResult {
  /** Artifact ID of the stack. */
  readonly stackId: string;
  /** `true` if all resources were created successfully. */
  readonly success: boolean;
  /** Per-resource results. */
  readonly resources: ResourceDeploymentResult[];
  /** Error message if the stack failed. */
  readonly error?: string;
}

/**
 * Final result of a complete deployment run.
 */
export interface DeploymentResult {
  /** `true` only when every stack succeeded. */
  readonly success: boolean;
  /** Per-stack results in deployment order. */
  readonly stacks: StackDeploymentResult[];
}

/**
 * Options for constructing a `DeploymentEngine`.
 */
export interface DeploymentEngineOptions {
  /**
   * Map from provider identifier (e.g. `'hetzner'`) to the adapter that
   * handles that provider's API calls.
   */
  readonly adapters: Record<string, ProviderAdapter>;

  /**
   * Absolute path to the cloud assembly output directory.
   * Used to initialise `StatePersistence`.
   */
  readonly outdir: string;

  /**
   * Optional pre-built `EngineStateManager`. If not provided, a new one
   * is created with a fresh `EventBus` and `StatePersistence`.
   * Primarily used in tests for injecting a pre-configured manager.
   */
  readonly stateManager?: EngineStateManager;

  /**
   * Optional `EventBus` to subscribe to engine events.
   * If not provided, a new one is created internally.
   */
  readonly eventBus?: EventBus<EngineEvent>;
}

// ─── DeploymentEngine ─────────────────────────────────────────────────────────

/**
 * Orchestrates the full deployment of a cloud assembly.
 *
 * Given a `DeploymentPlan` and the parsed `AssemblyStack[]`, the engine:
 * 1. Iterates stacks in `plan.stackOrder`.
 * 2. For each stack, iterates resources in `plan.resourceOrders[stackId]`.
 * 3. For each resource:
 *    a. Resolves `{ ref, attr }` tokens by looking up completed resources in
 *       `EngineState`.
 *    b. Calls `adapter.create()`.
 *    c. On success: records the physical ID and outputs in `EngineStateManager`.
 *    d. On failure: initiates stack rollback (delete already-created resources
 *       in reverse order), then marks the stack as failed and aborts.
 * 4. After all resources succeed, reads stack-level outputs from the template
 *    and stores them in `EngineState` for cross-stack resolution.
 *
 * Stacks execute **in series** (not parallel). Resources within a stack also
 * execute **in series** in topological order.
 */
export class DeploymentEngine {
  private readonly stateManager: EngineStateManager;
  private readonly eventBus: EventBus<EngineEvent>;

  constructor(private readonly options: DeploymentEngineOptions) {
    this.eventBus = options.eventBus ?? new EventBus<EngineEvent>();
    const persistence = new StatePersistence(options.outdir);
    this.stateManager =
      options.stateManager ??
      new EngineStateManager(this.eventBus, persistence);
  }

  /**
   * Subscribe to engine events emitted during deployment.
   * Returns an unsubscribe function.
   */
  public subscribe(handler: (event: EngineEvent) => void): () => void {
    return this.eventBus.subscribe(handler);
  }

  /**
   * Execute the deployment described by `plan` for the given `stacks`.
   *
   * Stacks are deployed in `plan.stackOrder`. Resources within each stack
   * are deployed in `plan.resourceOrders[stackId]`.
   */
  public async deploy(
    stacks: AssemblyStack[],
    plan: DeploymentPlan,
  ): Promise<DeploymentResult> {
    const stackById = new Map<string, AssemblyStack>(
      stacks.map((s) => [s.id, s]),
    );

    const stackResults: StackDeploymentResult[] = [];

    for (const stackId of plan.stackOrder) {
      const stack = stackById.get(stackId);
      if (stack === undefined) {
        // Defensive: plan references a stack not in the stacks array.
        const result: StackDeploymentResult = {
          stackId,
          success: false,
          resources: [],
          error: `Stack '${stackId}' not found in assembly stacks.`,
        };
        stackResults.push(result);
        return { success: false, stacks: stackResults };
      }

      const result = await this.deployStack(
        stack,
        plan.resourceOrders[stackId] ?? [],
      );
      stackResults.push(result);

      if (!result.success) {
        return { success: false, stacks: stackResults };
      }
    }

    return { success: true, stacks: stackResults };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async deployStack(
    stack: AssemblyStack,
    resourceOrder: string[],
  ): Promise<StackDeploymentResult> {
    const adapter = this.options.adapters[stack.provider];
    if (adapter === undefined) {
      return {
        stackId: stack.id,
        success: false,
        resources: [],
        error: `No adapter registered for provider '${stack.provider}'.`,
      };
    }

    this.stateManager.initStack(stack.id);

    const resourceById = new Map(stack.resources.map((r) => [r.logicalId, r]));
    const createdInOrder: string[] = []; // track for rollback
    const resourceResults: ResourceDeploymentResult[] = [];

    for (const logicalId of resourceOrder) {
      const resource = resourceById.get(logicalId);
      if (resource === undefined) continue;

      // Resolve { ref, attr } tokens in properties.
      const resolvedProperties = this.resolveProperties(
        resource.properties,
        stack.id,
      );

      this.stateManager.initResource(
        stack.id,
        logicalId,
        resource.type,
        resolvedProperties,
      );

      try {
        const createResult = await adapter.create({
          logicalId,
          type: resource.type,
          properties: resolvedProperties,
          stackId: stack.id,
          provider: stack.provider,
        });

        this.stateManager.transitionResource(
          stack.id,
          logicalId,
          resource.type,
          ResourceStatus.CREATE_COMPLETE,
          {
            physicalId: createResult.physicalId,
            outputs: createResult.outputs,
          },
        );

        createdInOrder.push(logicalId);
        resourceResults.push({
          logicalId,
          success: true,
          physicalId: createResult.physicalId,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        this.stateManager.transitionResource(
          stack.id,
          logicalId,
          resource.type,
          ResourceStatus.CREATE_FAILED,
          { reason: message },
        );

        resourceResults.push({ logicalId, success: false, error: message });

        // Rollback already-created resources in reverse order.
        await this.rollback(stack, createdInOrder, resourceById, adapter);

        this.stateManager.transitionStack(
          stack.id,
          StackStatus.ROLLBACK_COMPLETE,
          { reason: `Resource '${logicalId}' failed: ${message}` },
        );

        return {
          stackId: stack.id,
          success: false,
          resources: resourceResults,
          error: `Resource '${logicalId}' failed: ${message}`,
        };
      }
    }

    this.stateManager.transitionStack(stack.id, StackStatus.CREATE_COMPLETE);

    return {
      stackId: stack.id,
      success: true,
      resources: resourceResults,
    };
  }

  /**
   * Delete already-created resources in reverse creation order (rollback).
   * Failures during rollback are swallowed — we log via the event bus but do
   * not propagate exceptions, so the rollback continues as far as possible.
   */
  private async rollback(
    stack: AssemblyStack,
    createdInOrder: string[],
    resourceById: Map<
      string,
      { logicalId: string; type: string; properties: Record<string, unknown> }
    >,
    adapter: ProviderAdapter,
  ): Promise<void> {
    this.stateManager.transitionStack(
      stack.id,
      StackStatus.ROLLBACK_IN_PROGRESS,
    );

    const reversed = [...createdInOrder].reverse();

    for (const logicalId of reversed) {
      const resource = resourceById.get(logicalId);
      if (resource === undefined) continue;

      // physicalId retained for future use (e.g. optimistic deletes by provider ID).
      void this.stateManager.getResourceState(stack.id, logicalId)?.physicalId;

      this.stateManager.transitionResource(
        stack.id,
        logicalId,
        resource.type,
        ResourceStatus.DELETE_IN_PROGRESS,
      );

      try {
        await adapter.delete({
          logicalId,
          type: resource.type,
          properties: resource.properties,
          stackId: stack.id,
          provider: stack.provider,
        });

        this.stateManager.transitionResource(
          stack.id,
          logicalId,
          resource.type,
          ResourceStatus.DELETE_COMPLETE,
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.stateManager.transitionResource(
          stack.id,
          logicalId,
          resource.type,
          ResourceStatus.DELETE_FAILED,
          { reason: message },
        );
      }
    }
  }

  /**
   * Recursively walk `properties` and replace every `{ ref, attr }` token
   * with the actual value read from `EngineState.outputs` of the referenced
   * resource.
   *
   * If the referenced resource hasn't been created yet (or has no matching
   * output), the token is left as-is. The `DeploymentPlanner` guarantees
   * that intra-stack dependencies are deployed in the correct order, so
   * unresolved tokens at this point indicate cross-stack references (which
   * are already resolved before their dependent stack is deployed) or
   * misconfigured constructs.
   */
  private resolveProperties(
    properties: Record<string, unknown>,
    stackId: string,
  ): Record<string, unknown> {
    return this.resolveValue(properties, stackId) as Record<string, unknown>;
  }

  private resolveValue(value: unknown, stackId: string): unknown {
    if (value === null || value === undefined) return value;

    if (this.isRefAttrToken(value)) {
      return this.resolveToken(value.ref, value.attr, stackId);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolveValue(item, stackId));
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const resolved: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        resolved[k] = this.resolveValue(v, stackId);
      }
      return resolved;
    }

    return value;
  }

  private isRefAttrToken(
    value: unknown,
  ): value is { ref: string; attr: string } {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    const obj = value as Record<string, unknown>;
    return typeof obj['ref'] === 'string' && typeof obj['attr'] === 'string';
  }

  private resolveToken(ref: string, attr: string, stackId: string): unknown {
    // Try intra-stack resolution first.
    const resourceState = this.stateManager.getResourceState(stackId, ref);
    if (
      resourceState !== undefined &&
      resourceState.outputs !== undefined &&
      attr in resourceState.outputs
    ) {
      return resourceState.outputs[attr];
    }

    // If not found in the current stack, search all stacks (cross-stack).
    const allStacks = this.stateManager.getState().stacks;
    for (const [, stackState] of Object.entries(allStacks)) {
      const res = stackState.resources[ref];
      if (
        res !== undefined &&
        res.outputs !== undefined &&
        attr in res.outputs
      ) {
        return res.outputs[attr];
      }
    }

    // Return the token as-is if not resolvable.
    return { ref, attr };
  }
}
