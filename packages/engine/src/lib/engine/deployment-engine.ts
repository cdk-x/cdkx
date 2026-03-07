import { StackStatus } from '../states/stack-status';
import { ResourceStatus } from '../states/resource-status';
import { EventBus } from '../events/event-bus';
import { EngineEvent } from '../events/engine-event';
import { EngineStateManager } from '../state/engine-state-manager';
import { StatePersistence } from '../state/state-persistence';
import type { ProviderAdapter } from '../adapter/provider-adapter';
import type {
  AssemblyStack,
  AssemblyResource,
} from '../assembly/assembly-types';
import type { DeploymentPlan } from '../planner/deployment-plan';
import {
  ReconcileValidationError,
  type BlockedDelete,
} from './reconcile-validation-error';

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
   * Contains `manifest.json` and stack template files.
   * Read by `CloudAssemblyReader` — the engine itself does not write here.
   */
  readonly assemblyDir: string;

  /**
   * Absolute path to the engine state directory (e.g. `<projectRoot>/.cdkx/`).
   * `engine-state.json` is written here after every state transition.
   * Kept separate from `assemblyDir` so state lives in a gitignored local
   * directory rather than alongside the committed assembly output.
   */
  readonly stateDir: string;

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
 * 1. Loads any prior `engine-state.json` from `stateDir` (if it exists).
 * 2. For each stack in `plan.stackOrder`:
 *    a. **Reconciles** the stack — deletes resources that exist in prior state
 *       but are absent from the new assembly.
 *    b. **Creates** resources that are present in the new assembly but absent
 *       from prior state (or have no prior state at all).
 *    c. **Updates** resources that are already `CREATE_COMPLETE` in prior state
 *       when their resolved properties differ from the stored properties.
 *    d. Skips resources that are already `CREATE_COMPLETE` and have no property
 *       changes.
 * 3. Uses `UPDATE_IN_PROGRESS → UPDATE_COMPLETE` lifecycle for stacks that
 *    already have prior state; `CREATE_IN_PROGRESS → CREATE_COMPLETE` for new
 *    stacks.
 * 4. On failure: rolls back already-created resources in reverse order.
 *
 * Stacks execute **in series** (not parallel). Resources within a stack also
 * execute **in series** in topological order.
 */
export class DeploymentEngine {
  private readonly stateManager: EngineStateManager;
  private readonly eventBus: EventBus<EngineEvent>;

  constructor(private readonly options: DeploymentEngineOptions) {
    this.eventBus = options.eventBus ?? new EventBus<EngineEvent>();

    if (options.stateManager !== undefined) {
      this.stateManager = options.stateManager;
    } else {
      const persistence = new StatePersistence(options.stateDir);
      const loadedState = persistence.load() ?? undefined;
      this.stateManager = new EngineStateManager(
        this.eventBus,
        persistence,
        loadedState,
      );
    }
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

    // Deploy stacks wave by wave (parallel within each wave).
    for (const wave of plan.stackWaves) {
      const waveResults = await Promise.allSettled(
        wave.map(async (stackId) => {
          const stack = stackById.get(stackId);
          if (stack === undefined) {
            // Defensive: plan references a stack not in the stacks array.
            return {
              stackId,
              success: false,
              resources: [],
              error: `Stack '${stackId}' not found in assembly stacks.`,
            } as StackDeploymentResult;
          }

          return await this.deployStack(
            stack,
            plan.resourceWaves[stackId] ?? [],
          );
        }),
      );

      // Collect results and check for failures.
      for (const settledResult of waveResults) {
        if (settledResult.status === 'fulfilled') {
          stackResults.push(settledResult.value);
          if (!settledResult.value.success) {
            return { success: false, stacks: stackResults };
          }
        } else {
          // Rejection from Promise.allSettled — should not happen since
          // deployStack() catches all errors, but handle defensively.
          const error =
            settledResult.reason instanceof Error
              ? settledResult.reason.message
              : String(settledResult.reason);
          stackResults.push({
            stackId: '(unknown)',
            success: false,
            resources: [],
            error: `Unhandled error: ${error}`,
          });
          return { success: false, stacks: stackResults };
        }
      }
    }

    return { success: true, stacks: stackResults };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async deployStack(
    stack: AssemblyStack,
    resourceWaves: string[][],
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

    // Determine whether this stack already exists in loaded state.
    const isUpdate = this.stateManager.getStackState(stack.id) !== undefined;

    if (isUpdate) {
      this.stateManager.transitionStack(
        stack.id,
        StackStatus.UPDATE_IN_PROGRESS,
      );
    } else {
      this.stateManager.initStack(stack.id);
    }

    // Reconcile: delete resources that exist in prior state but are absent
    // from the new assembly. Only runs when prior state exists.
    let reconciledCount = 0;
    try {
      reconciledCount = await this.reconcileStack(stack, adapter);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.stateManager.transitionStack(
        stack.id,
        isUpdate ? StackStatus.UPDATE_FAILED : StackStatus.CREATE_FAILED,
        { reason: `Reconcile failed: ${message}` },
      );
      return {
        stackId: stack.id,
        success: false,
        resources: [],
        error: `Reconcile failed: ${message}`,
      };
    }

    const resourceById = new Map(stack.resources.map((r) => [r.logicalId, r]));
    const createdInOrder: string[] = []; // track for rollback
    const resourceResults: ResourceDeploymentResult[] = [];
    let anyCreated = false;
    let anyUpdated = false;

    // Deploy resources wave by wave. Resources in the same wave can run in
    // parallel; waves execute sequentially to respect dependencies.
    for (const wave of resourceWaves) {
      const wavePromises = wave.map((logicalId) =>
        this.deployResource(stack, logicalId, resourceById, adapter, isUpdate),
      );

      const waveResults = await Promise.allSettled(wavePromises);

      // Collect results from this wave in wave order (not completion order)
      // to maintain deterministic createdInOrder for rollback.
      for (let i = 0; i < wave.length; i++) {
        const logicalId = wave[i];
        const settled = waveResults[i];

        if (settled.status === 'rejected') {
          const message =
            settled.reason instanceof Error
              ? settled.reason.message
              : String(settled.reason);

          resourceResults.push({ logicalId, success: false, error: message });

          // Wait for all other resources in this wave to settle before rolling back.
          await Promise.allSettled(wavePromises);

          await this.rollback(
            stack,
            createdInOrder,
            resourceById,
            adapter,
            isUpdate,
          );

          const rollbackComplete = isUpdate
            ? StackStatus.UPDATE_ROLLBACK_COMPLETE
            : StackStatus.ROLLBACK_COMPLETE;

          this.stateManager.transitionStack(stack.id, rollbackComplete, {
            reason: `Resource '${logicalId}' failed: ${message}`,
          });

          return {
            stackId: stack.id,
            success: false,
            resources: resourceResults,
            error: `Resource '${logicalId}' failed: ${message}`,
          };
        }

        const result = settled.value;
        resourceResults.push(result);

        // Track flags and createdInOrder in wave order.
        if (result.success) {
          if (result.physicalId !== undefined && !result.wasSkipped) {
            if (result.wasCreated) {
              anyCreated = true;
              createdInOrder.push(logicalId);
            } else if (result.wasUpdated) {
              anyUpdated = true;
            }
          }
        }
      }
    }

    // A deploy is a no-op when nothing was created, updated, or reconciled.
    // On a first deploy (isUpdate = false) this only applies when the stack
    // has no resources at all. On a re-deploy (isUpdate = true) it applies
    // whenever all resources were already CREATE_COMPLETE with unchanged
    // properties and nothing needed to be deleted.
    const totalResourceCount = resourceWaves.flat().length;
    const isNoOp =
      !anyCreated &&
      !anyUpdated &&
      reconciledCount === 0 &&
      (isUpdate || totalResourceCount === 0);

    this.stateManager.transitionStack(
      stack.id,
      isNoOp
        ? StackStatus.NO_CHANGES
        : isUpdate
          ? StackStatus.UPDATE_COMPLETE
          : StackStatus.CREATE_COMPLETE,
    );

    return {
      stackId: stack.id,
      success: true,
      resources: resourceResults,
    };
  }

  /**
   * Deploy a single resource: resolve tokens, check if it needs create/update/skip.
   *
   * Returns a result object with flags indicating what action was taken.
   * Throws on any adapter failure — caught by the caller in the wave loop.
   */
  private async deployResource(
    stack: AssemblyStack,
    logicalId: string,
    resourceById: Map<string, AssemblyResource>,
    adapter: ProviderAdapter,
    isUpdate: boolean,
  ): Promise<
    ResourceDeploymentResult & {
      wasCreated?: boolean;
      wasUpdated?: boolean;
      wasSkipped?: boolean;
    }
  > {
    const resource = resourceById.get(logicalId);
    if (resource === undefined) {
      // Should never happen — planner guarantees all IDs are valid.
      return {
        logicalId,
        success: false,
        error: 'Resource not found in assembly',
      };
    }

    // Resolve { ref, attr } tokens in properties.
    const resolvedProperties = this.resolveProperties(
      resource.properties,
      stack.id,
    );

    // If this resource already exists as CREATE_COMPLETE in prior state,
    // compute a diff to decide whether to update or skip.
    const existingState = this.stateManager.getResourceState(
      stack.id,
      logicalId,
    );

    if (existingState?.status === ResourceStatus.CREATE_COMPLETE) {
      const patch = this.computePatch(
        existingState.properties,
        resolvedProperties,
      );

      if (patch === undefined) {
        // No change — skip this resource entirely.
        return {
          logicalId,
          success: true,
          physicalId: existingState.physicalId,
          wasSkipped: true,
        };
      }

      // Strip create-only properties from the patch. The adapter (if it
      // implements getCreateOnlyProps) tells us which props cannot be
      // changed in-place. If the filtered patch is empty, all differences
      // are create-only — treat this resource as a no-op.
      const createOnlyProps =
        adapter.getCreateOnlyProps?.(resource.type) ?? new Set<string>();
      const filteredPatch: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(patch)) {
        if (!createOnlyProps.has(key)) {
          filteredPatch[key] = value;
        }
      }

      if (Object.keys(filteredPatch).length === 0) {
        // All differing props are create-only — no mutable change to apply.
        return {
          logicalId,
          success: true,
          physicalId: existingState.physicalId,
          wasSkipped: true,
        };
      }

      // Properties changed — call adapter.update().
      this.stateManager.transitionResource(
        stack.id,
        logicalId,
        resource.type,
        ResourceStatus.UPDATE_IN_PROGRESS,
      );

      try {
        const updateResult = await adapter.update(
          {
            logicalId,
            type: resource.type,
            properties: resolvedProperties,
            stackId: stack.id,
            provider: stack.provider,
            physicalId: existingState.physicalId,
          },
          filteredPatch,
        );

        this.stateManager.transitionResource(
          stack.id,
          logicalId,
          resource.type,
          ResourceStatus.UPDATE_COMPLETE,
          {
            properties: resolvedProperties,
            ...(updateResult?.outputs !== undefined && {
              outputs: updateResult.outputs,
            }),
          },
        );

        return {
          logicalId,
          success: true,
          physicalId: existingState.physicalId,
          wasUpdated: true,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.stateManager.transitionResource(
          stack.id,
          logicalId,
          resource.type,
          ResourceStatus.UPDATE_FAILED,
          { reason: message },
        );
        throw err; // Re-throw for wave-level handling
      }
    }

    // Resource does not exist — create it.
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

      return {
        logicalId,
        success: true,
        physicalId: createResult.physicalId,
        wasCreated: true,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.stateManager.transitionResource(
        stack.id,
        logicalId,
        resource.type,
        ResourceStatus.CREATE_FAILED,
        { reason: message },
      );
      throw err; // Re-throw for wave-level handling
    }
  }

  /**
   * Reconcile the stack: delete resources that exist in prior state with
   * status `CREATE_COMPLETE` but are absent from the new assembly.
   *
   * Before making any API calls, validates that none of the resources
   * scheduled for deletion are still referenced by resources that remain in
   * the new assembly. Throws `ReconcileValidationError` if any conflict is
   * found — no API calls are made in that case.
   *
   * Deletes are performed in reverse insertion order of the prior state
   * (approximate reverse-creation order). A single delete failure aborts
   * reconcile and the error is re-thrown to the caller.
   *
   * No-op if the stack has no prior state.
   */
  private async reconcileStack(
    stack: AssemblyStack,
    adapter: ProviderAdapter,
  ): Promise<number> {
    const prevState = this.stateManager.getStackState(stack.id);
    if (prevState === undefined) return 0;

    const newIds = new Set(stack.resources.map((r) => r.logicalId));

    // Find resources to delete: CREATE_COMPLETE in prior state, absent from
    // new assembly.
    const toDelete = Object.entries(prevState.resources)
      .filter(
        ([logicalId, resourceState]) =>
          resourceState.status === ResourceStatus.CREATE_COMPLETE &&
          !newIds.has(logicalId),
      )
      .reverse(); // reverse insertion order ≈ reverse-creation order

    if (toDelete.length === 0) return 0;

    // Validate that no resource staying in the new assembly references any
    // resource scheduled for deletion.
    this.validateReconcile(
      toDelete.map(([logicalId, rs]) => ({
        logicalId,
        type: rs.type ?? 'unknown',
      })),
      stack.resources,
    );

    for (const [logicalId, resourceState] of toDelete) {
      const resourceType = resourceState.type ?? 'unknown';

      this.stateManager.transitionResource(
        stack.id,
        logicalId,
        resourceType,
        ResourceStatus.DELETE_IN_PROGRESS,
      );

      try {
        await adapter.delete({
          logicalId,
          type: resourceType,
          properties: resourceState.properties,
          physicalId: resourceState.physicalId,
          stackId: stack.id,
          provider: stack.provider,
        });

        this.stateManager.transitionResource(
          stack.id,
          logicalId,
          resourceType,
          ResourceStatus.DELETE_COMPLETE,
        );

        this.stateManager.removeResource(stack.id, logicalId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.stateManager.transitionResource(
          stack.id,
          logicalId,
          resourceType,
          ResourceStatus.DELETE_FAILED,
          { reason: message },
        );
        throw err; // abort reconcile
      }
    }

    return toDelete.length;
  }

  /**
   * Validate that no resource in the new assembly (a resource that stays)
   * references — via a `{ ref, attr }` token — a resource scheduled for
   * deletion.
   *
   * The "silent case": if the referencing resource is itself also scheduled
   * for deletion, there is no conflict (both are removed in the same run,
   * and reverse-creation order guarantees correct delete ordering).
   *
   * Throws `ReconcileValidationError` if any conflict is detected. No API
   * calls have been made at the point this throws.
   */
  private validateReconcile(
    toDelete: { logicalId: string; type: string }[],
    assemblyResources: AssemblyResource[],
  ): void {
    const toDeleteIds = new Set(toDelete.map((r) => r.logicalId));
    const toDeleteTypeMap = new Map(toDelete.map((r) => [r.logicalId, r.type]));

    const blockedDeletes: BlockedDelete[] = [];

    for (const resource of assemblyResources) {
      // Silent case: if this resource is also being deleted, skip it.
      if (toDeleteIds.has(resource.logicalId)) continue;

      this.collectBlockedDeletes(
        resource.properties,
        resource.logicalId,
        resource.type,
        toDeleteIds,
        toDeleteTypeMap,
        blockedDeletes,
      );
    }

    if (blockedDeletes.length > 0) {
      throw new ReconcileValidationError(blockedDeletes);
    }
  }

  /**
   * Recursively walk `value` and collect any `{ ref, attr }` tokens whose
   * `ref` is in `toDeleteIds` into `blockedDeletes`.
   */
  private collectBlockedDeletes(
    value: unknown,
    dependentLogicalId: string,
    dependentType: string,
    toDeleteIds: Set<string>,
    toDeleteTypeMap: Map<string, string>,
    blockedDeletes: BlockedDelete[],
  ): void {
    if (value === null || value === undefined) return;

    if (this.isRefAttrToken(value)) {
      if (toDeleteIds.has(value.ref)) {
        blockedDeletes.push({
          toDeleteLogicalId: value.ref,
          toDeleteType: toDeleteTypeMap.get(value.ref) ?? 'unknown',
          dependentLogicalId,
          dependentType,
          attr: value.attr,
        });
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        this.collectBlockedDeletes(
          item,
          dependentLogicalId,
          dependentType,
          toDeleteIds,
          toDeleteTypeMap,
          blockedDeletes,
        );
      }
      return;
    }

    if (typeof value === 'object') {
      for (const v of Object.values(value as Record<string, unknown>)) {
        this.collectBlockedDeletes(
          v,
          dependentLogicalId,
          dependentType,
          toDeleteIds,
          toDeleteTypeMap,
          blockedDeletes,
        );
      }
    }
  }

  /**
   * Delete already-created resources in reverse creation order (rollback).
   * Failures during rollback are swallowed — we log via the event bus but do
   * not propagate exceptions, so the rollback continues as far as possible.
   *
   * Only rolls back resources that were newly created in this run — resources
   * that were pre-existing (skipped during the create loop) are not deleted.
   */
  private async rollback(
    stack: AssemblyStack,
    createdInOrder: string[],
    resourceById: Map<
      string,
      { logicalId: string; type: string; properties: Record<string, unknown> }
    >,
    adapter: ProviderAdapter,
    isUpdate: boolean,
  ): Promise<void> {
    this.stateManager.transitionStack(
      stack.id,
      isUpdate
        ? StackStatus.UPDATE_ROLLBACK_IN_PROGRESS
        : StackStatus.ROLLBACK_IN_PROGRESS,
    );

    const reversed = [...createdInOrder].reverse();

    for (const logicalId of reversed) {
      const resource = resourceById.get(logicalId);
      if (resource === undefined) continue;

      // Skip pre-existing resources — don't delete what we didn't create.
      const resourceState = this.stateManager.getResourceState(
        stack.id,
        logicalId,
      );
      if (
        resourceState === undefined ||
        resourceState.status !== ResourceStatus.CREATE_COMPLETE
      )
        continue;

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
          // Use the resolved properties stored at creation time, not the raw
          // assembly properties which may still contain unresolved { ref, attr }
          // tokens (e.g. networkId for action resources).
          properties: resourceState.properties,
          stackId: stack.id,
          provider: stack.provider,
          physicalId: resourceState.physicalId,
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
   * Compute a shallow-keyed patch between `prior` and `next` property maps.
   *
   * Returns an object containing only the keys where the values differ
   * (deep equality). Returns `undefined` when there are no differences at all
   * — signalling that the resource is unchanged and can be skipped.
   *
   * New keys (present in `next` but absent in `prior`) are included in the
   * patch. Removed keys (present in `prior` but absent in `next`) are
   * represented as `undefined` in the patch so the adapter can handle them.
   */
  private computePatch(
    prior: Record<string, unknown>,
    next: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    const patch: Record<string, unknown> = {};

    const allKeys = new Set([...Object.keys(prior), ...Object.keys(next)]);
    for (const key of allKeys) {
      const priorVal = prior[key];
      const nextVal = next[key];
      if (!this.deepEqual(priorVal, nextVal)) {
        patch[key] = nextVal;
      }
    }

    return Object.keys(patch).length === 0 ? undefined : patch;
  }

  /**
   * Deep equality check for JSON-compatible values (primitives, arrays,
   * plain objects). Class instances and functions are compared by reference.
   */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if (Array.isArray(a) || Array.isArray(b)) return false;

    if (typeof a === 'object' && typeof b === 'object') {
      const aObj = a as Record<string, unknown>;
      const bObj = b as Record<string, unknown>;
      const aKeys = Object.keys(aObj);
      const bKeys = Object.keys(bObj);
      if (aKeys.length !== bKeys.length) return false;
      for (const key of aKeys) {
        if (!this.deepEqual(aObj[key], bObj[key])) return false;
      }
      return true;
    }

    return false;
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

  // ─── Destroy ──────────────────────────────────────────────────────────────────

  /**
   * Destroys all resources in the given stacks in reverse dependency order.
   * Stacks are processed in reverse wave order (last wave first), and within
   * each stack, resources are deleted in reverse wave order as well.
   *
   * @param stacks - The stacks to destroy (from the assembly).
   * @param plan - The deployment plan (used to determine reverse order).
   * @returns A result indicating success or failure.
   */
  public async destroy(
    stacks: AssemblyStack[],
    plan: DeploymentPlan,
  ): Promise<DeploymentResult> {
    const stackById = new Map<string, AssemblyStack>(
      stacks.map((s) => [s.id, s]),
    );

    const stackResults: StackDeploymentResult[] = [];

    // Destroy stacks in reverse wave order (last wave first).
    const reversedStackWaves = [...plan.stackWaves].reverse();

    for (const wave of reversedStackWaves) {
      const waveResults = await Promise.allSettled(
        wave.map(async (stackId) => {
          const stack = stackById.get(stackId);
          if (stack === undefined) {
            return {
              stackId,
              success: false,
              resources: [],
              error: `Stack '${stackId}' not found in assembly stacks.`,
            } as StackDeploymentResult;
          }

          // Get resource waves in reverse order for this stack.
          const resourceWaves = plan.resourceWaves[stackId] ?? [];
          const reversedResourceWaves = [...resourceWaves].reverse();

          return await this.destroyStack(stack, reversedResourceWaves);
        }),
      );

      // Collect results and check for failures.
      for (const settledResult of waveResults) {
        if (settledResult.status === 'fulfilled') {
          stackResults.push(settledResult.value);
          if (!settledResult.value.success) {
            return { success: false, stacks: stackResults };
          }
        } else {
          const error =
            settledResult.reason instanceof Error
              ? settledResult.reason.message
              : String(settledResult.reason);
          stackResults.push({
            stackId: '(unknown)',
            success: false,
            resources: [],
            error: `Unhandled error: ${error}`,
          });
          return { success: false, stacks: stackResults };
        }
      }
    }

    return { success: true, stacks: stackResults };
  }

  /**
   * Destroys all resources in a single stack in reverse wave order.
   *
   * @param stack - The stack to destroy.
   * @param reversedResourceWaves - Resource waves in reverse order (last wave first).
   * @returns A result indicating success or failure.
   */
  private async destroyStack(
    stack: AssemblyStack,
    reversedResourceWaves: string[][],
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

    try {
      // Transition stack to DELETE_IN_PROGRESS.
      this.stateManager.transitionStack(
        stack.id,
        StackStatus.DELETE_IN_PROGRESS,
      );

      const resourceResults: ResourceDeploymentResult[] = [];
      const resourceById = new Map<string, AssemblyResource>(
        stack.resources.map((r) => [r.logicalId, r]),
      );

      // Delete resources wave by wave in reverse order (parallel within each wave).
      for (const wave of reversedResourceWaves) {
        const waveResults = await Promise.allSettled(
          wave.map(async (logicalId) => {
            const resource = resourceById.get(logicalId);
            if (resource === undefined) {
              return {
                logicalId,
                success: false,
                error: `Resource '${logicalId}' not found in stack resources.`,
              } as ResourceDeploymentResult;
            }

            return await this.destroyResource(stack, resource, adapter);
          }),
        );

        // Collect results and check for failures.
        for (const settledResult of waveResults) {
          if (settledResult.status === 'fulfilled') {
            resourceResults.push(settledResult.value);
            if (!settledResult.value.success) {
              // On failure, transition stack to DELETE_FAILED and abort.
              this.stateManager.transitionStack(
                stack.id,
                StackStatus.DELETE_FAILED,
                {
                  reason: `Resource ${settledResult.value.logicalId} failed to delete.`,
                },
              );
              return {
                stackId: stack.id,
                success: false,
                resources: resourceResults,
                error: `Resource ${settledResult.value.logicalId} failed to delete.`,
              };
            }
          } else {
            const error =
              settledResult.reason instanceof Error
                ? settledResult.reason.message
                : String(settledResult.reason);
            resourceResults.push({
              logicalId: '(unknown)',
              success: false,
              error: `Unhandled error: ${error}`,
            });
            this.stateManager.transitionStack(
              stack.id,
              StackStatus.DELETE_FAILED,
              { reason: error },
            );
            return {
              stackId: stack.id,
              success: false,
              resources: resourceResults,
              error,
            };
          }
        }
      }

      // All resources deleted successfully — mark stack as DELETE_COMPLETE.
      this.stateManager.transitionStack(stack.id, StackStatus.DELETE_COMPLETE);

      return {
        stackId: stack.id,
        success: true,
        resources: resourceResults,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.stateManager.transitionStack(stack.id, StackStatus.DELETE_FAILED, {
        reason: message,
      });
      return {
        stackId: stack.id,
        success: false,
        resources: [],
        error: message,
      };
    }
  }

  /**
   * Destroys a single resource by calling the adapter's delete method.
   *
   * @param stack - The stack containing the resource.
   * @param resource - The resource to destroy.
   * @param adapter - The provider adapter.
   * @returns A result indicating success or failure.
   */
  private async destroyResource(
    stack: AssemblyStack,
    resource: AssemblyResource,
    adapter: ProviderAdapter,
  ): Promise<ResourceDeploymentResult> {
    const resourceState = this.stateManager.getResourceState(
      stack.id,
      resource.logicalId,
    );

    // Skip resources that don't exist in state (not yet created).
    if (resourceState === undefined) {
      return {
        logicalId: resource.logicalId,
        success: true,
      };
    }

    // Skip resources that are already deleted.
    if (
      resourceState.status === ResourceStatus.DELETE_COMPLETE ||
      resourceState.status === ResourceStatus.DELETE_IN_PROGRESS
    ) {
      return {
        logicalId: resource.logicalId,
        success: true,
      };
    }

    try {
      // Transition to DELETE_IN_PROGRESS.
      this.stateManager.transitionResource(
        stack.id,
        resource.logicalId,
        resource.type,
        ResourceStatus.DELETE_IN_PROGRESS,
      );

      // Call adapter.delete() with resolved properties and physicalId from state.
      await adapter.delete({
        logicalId: resource.logicalId,
        type: resource.type,
        properties: resourceState.properties,
        stackId: stack.id,
        provider: stack.provider,
        physicalId: resourceState.physicalId,
      });

      // Transition to DELETE_COMPLETE.
      this.stateManager.transitionResource(
        stack.id,
        resource.logicalId,
        resource.type,
        ResourceStatus.DELETE_COMPLETE,
      );

      // Remove resource from state after successful deletion.
      this.stateManager.removeResource(stack.id, resource.logicalId);

      return {
        logicalId: resource.logicalId,
        success: true,
        physicalId: resourceState.physicalId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.stateManager.transitionResource(
        stack.id,
        resource.logicalId,
        resource.type,
        ResourceStatus.DELETE_FAILED,
        { reason: message },
      );
      return {
        logicalId: resource.logicalId,
        success: false,
        error: message,
      };
    }
  }
}
