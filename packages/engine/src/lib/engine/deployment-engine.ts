import { StackStatus } from '../states/stack-status';
import { ResourceStatus } from '../states/resource-status';
import { EventBus } from '../events/event-bus';
import { EngineEvent } from '../events/engine-event';
import { EngineStateManager } from '../state/engine-state-manager';
import { StatePersistence } from '../state/state-persistence';
import { DeployLock } from '../deploy-lock';
import { CloudAssemblyReader } from '../assembly/cloud-assembly-reader';
import { DeploymentPlanner } from '../planner/deployment-planner';
import { PluginManager } from '../plugins/plugin-manager';
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
import type { Logger } from '@cdkx-io/logger';
import type { StabilizeConfig } from '@cdkx-io/core';

// ─── Output Handler types ─────────────────────────────────────────────────────

/**
 * Handler for outputting deployment events.
 * Used by the engine to output formatted deployment status to console or remote.
 */
export type OutputHandler = (event: EngineEvent) => void;

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
   * Absolute path to the cloud assembly output directory.
   * Contains `manifest.json` and stack template files.
   * The engine reads the assembly from this directory.
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
   * Optional map from provider identifier to adapter.
   * If not provided, the engine will automatically load adapters using
   * the PluginManager based on providers found in the assembly.
   */
  readonly adapters?: Record<string, ProviderAdapter>;

  /**
   * Optional environment variables for provider adapter configuration.
   * Passed to adapter factories when adapters are loaded dynamically.
   * Default: `process.env`
   */
  readonly env?: NodeJS.ProcessEnv;

  /**
   * Optional output handler for receiving formatted deployment events.
   * Used by the CLI to receive events for remote transmission (e.g., WebSocket).
   * When not provided, the engine handles console output internally.
   */
  readonly outputHandler?: OutputHandler;

  /**
   * Optional pre-built `EngineStateManager`. If not provided, a new one
   * is created with a fresh `EventBus` and `StatePersistence`.
   * Primarily used in tests for injecting a pre-configured manager.
   */
  readonly stateManager?: EngineStateManager;

  /**
   * Optional `StatePersistence` instance used for snapshot operations
   * (write before deployment, delete on success).
   * When not provided alongside `stateManager`, a new instance is created
   * from `stateDir`. Pass a mock in tests to observe or suppress snapshot I/O.
   */
  readonly persistence?: StatePersistence;

  /**
   * Optional `EventBus` to subscribe to engine events.
   * If not provided, a new one is created internally.
   */
  readonly eventBus?: EventBus<EngineEvent>;

  /**
   * Optional logger for capturing all deployment events.
   * The engine subscribes the logger to the internal `EventBus` on construction,
   * logging every state transition (stack and resource) with structured event data.
   * If not provided, a default logger with console output is created.
   */
  readonly logger?: Logger;

  /**
   * Optional DeployLock instance for preventing concurrent deployments.
   * If not provided, a new DeployLock is created and acquire() is called.
   * Pass a mock for testing to avoid file system operations.
   * Pass null to disable locking entirely (useful for tests).
   */
  readonly deployLock?: DeployLock | null;

  /**
   * Optional stabilization configuration for resource readiness polling.
   * Merged with defaults: `{ intervalMs: 5000, timeoutMs: 600_000 }`.
   * Propagated to all adapters so that handlers can read it via
   * `ctx.stabilizeConfig`.
   */
  readonly stabilize?: Partial<StabilizeConfig>;
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
  private readonly adapters: Record<string, ProviderAdapter>;
  private readonly deployLock: DeployLock;
  private readonly persistence: StatePersistence;

  /**
   * Resources updated in the current deployment run, in the order they reached
   * `UPDATE_COMPLETE`. Used by rollback phase 2 to restore prior properties.
   */
  private readonly updatedInOrder: Array<{
    logicalId: string;
    stackId: string;
  }> = [];

  /**
   * Resources deleted during reconcile in the current deployment run, captured
   * with their prior properties and outputs. Stub — populated in a later slice.
   * Used by rollback phase 3 to recreate reconcile-deleted resources.
   */
  private readonly reconciledDeletedInOrder: Array<{
    logicalId: string;
    stackId: string;
    priorProperties: Record<string, unknown>;
    priorOutputs: Record<string, unknown>;
  }> = [];

  constructor(private readonly options: DeploymentEngineOptions) {
    // Acquire deploy lock to prevent concurrent deployments
    this.deployLock = options.deployLock ?? new DeployLock(options.stateDir);
    this.deployLock.acquire();

    this.eventBus = options.eventBus ?? new EventBus<EngineEvent>();

    // Set up state manager and persistence
    if (options.stateManager !== undefined) {
      this.stateManager = options.stateManager;
      this.persistence =
        options.persistence ?? new StatePersistence(options.stateDir);
    } else {
      this.persistence =
        options.persistence ?? new StatePersistence(options.stateDir);
      const loadedState = this.persistence.load() ?? undefined;
      this.stateManager = new EngineStateManager(
        this.eventBus,
        this.persistence,
        loadedState,
      );
    }

    // Load adapters - either use provided ones or load dynamically via PluginManager
    if (options.adapters !== undefined) {
      this.adapters = options.adapters;
    } else {
      // Load adapters dynamically based on providers found in resources
      const stacks = this.readAssembly();
      const providerIds = new Set<string>();

      // Collect all providers from resources across all stacks
      for (const stack of stacks) {
        for (const resource of stack.resources) {
          providerIds.add(resource.provider);
        }
      }

      const pluginManager = new PluginManager();
      this.adapters = pluginManager.buildAdapters(
        [...providerIds],
        options.env ?? process.env,
      );
    }

    // Subscribe output handler if provided (for remote/CLI integration)
    if (options.outputHandler !== undefined) {
      this.eventBus.subscribe(options.outputHandler);
    }

    // Subscribe the logger to the EventBus if provided.
    if (options.logger !== undefined) {
      this.subscribeLogger(options.logger);

      // Propagate logger to all adapters that support it.
      for (const adapter of Object.values(this.adapters)) {
        if (adapter.setLogger !== undefined) {
          adapter.setLogger(options.logger);
        }
      }
    }

    // Merge stabilize options with defaults and propagate to all adapters.
    const stabilizeConfig: StabilizeConfig = {
      intervalMs: options.stabilize?.intervalMs ?? 5000,
      timeoutMs: options.stabilize?.timeoutMs ?? 600_000,
    };
    for (const adapter of Object.values(this.adapters)) {
      if (adapter.setStabilizeConfig !== undefined) {
        adapter.setStabilizeConfig(stabilizeConfig);
      }
    }
  }

  /**
   * Reads the cloud assembly from the configured assemblyDir.
   * Used internally when adapters are loaded dynamically.
   */
  private readAssembly(): AssemblyStack[] {
    const reader = new CloudAssemblyReader(this.options.assemblyDir);
    return reader.read();
  }

  /**
   * Creates a deployment plan from the assembly stacks.
   */
  private createPlan(stacks: AssemblyStack[]): DeploymentPlan {
    const planner = new DeploymentPlanner();
    return planner.plan(stacks);
  }

  /**
   * Subscribe to engine events emitted during deployment.
   * Returns an unsubscribe function.
   */
  public subscribe(handler: (event: EngineEvent) => void): () => void {
    return this.eventBus.subscribe(handler);
  }

  /**
   * Returns the list of resources that reached `UPDATE_COMPLETE` in the
   * current deployment run, in the order they were updated. Used by rollback
   * phase 2 to restore updated resources to their prior properties.
   */
  public getUpdatedInOrder(): ReadonlyArray<{
    logicalId: string;
    stackId: string;
  }> {
    return this.updatedInOrder;
  }

  /**
   * Subscribe the logger to the EventBus, converting each `EngineEvent` to
   * a structured `LogEvent`.
   */
  private subscribeLogger(logger: Logger): void {
    this.eventBus.subscribe((event) => {
      // Map ResourceStatus/StackStatus to LogLevel
      const status = event.resourceStatus;
      let level: 'debug' | 'info' | 'warn' | 'error' = 'info';

      if (status.endsWith('_FAILED') || status.endsWith('ROLLBACK_COMPLETE')) {
        level = 'error';
      } else if (status.endsWith('ROLLBACK_IN_PROGRESS')) {
        level = 'warn';
      } else if (status.endsWith('_IN_PROGRESS')) {
        level = 'debug';
      } else if (status.endsWith('_COMPLETE') || status === 'NO_CHANGES') {
        level = 'info';
      }

      // Determine the event type namespace
      const isStackEvent = event.resourceType === 'cdkx::stack';
      const category = isStackEvent ? 'state.stack' : 'state.resource';
      const type = `engine.${category}.transition`;

      // Build the data payload
      const data: Record<string, unknown> = {
        resourceType: event.resourceType,
        resourceStatus: event.resourceStatus,
      };

      if (event.physicalResourceId !== undefined) {
        data.physicalResourceId = event.physicalResourceId;
      }

      if (event.resourceStatusReason !== undefined) {
        data.resourceStatusReason = event.resourceStatusReason;
      }

      // Log via the appropriate level
      const logData = {
        stackId: event.stackId,
        resourceId: event.logicalResourceId,
        data,
      };

      if (level === 'error' && event.resourceStatusReason !== undefined) {
        logger.error(type, logData, new Error(event.resourceStatusReason));
      } else if (level === 'warn') {
        logger.warn(type, logData);
      } else if (level === 'debug') {
        logger.debug(type, logData);
      } else {
        logger.info(type, logData);
      }
    });
  }

  /**
   * Execute deployment of the cloud assembly.
   *
   * If no stacks and plan are provided, the engine reads the assembly
   * from `assemblyDir` and creates the deployment plan automatically.
   *
   * Stacks are deployed in `plan.stackOrder`. Resources within each stack
   * are deployed in `plan.resourceOrders[stackId]`.
   */
  public async deploy(): Promise<DeploymentResult>;
  public async deploy(
    stacks: AssemblyStack[],
    plan: DeploymentPlan,
  ): Promise<DeploymentResult>;
  public async deploy(
    stacks?: AssemblyStack[],
    plan?: DeploymentPlan,
  ): Promise<DeploymentResult> {
    // If no stacks provided, read assembly and create plan internally
    const actualStacks = stacks ?? this.readAssembly();
    const actualPlan = plan ?? this.createPlan(actualStacks);

    // Write a snapshot of the current known-good state before any mutations.
    // On a first deployment this writes an empty state (no-op for rollback).
    // The snapshot is deleted only after a fully successful deployment.
    this.persistence.writeSnapshot(this.stateManager.getState());

    const stackById = new Map<string, AssemblyStack>(
      actualStacks.map((s) => [s.id, s]),
    );

    const stackResults: StackDeploymentResult[] = [];

    // Deploy stacks wave by wave (parallel within each wave).
    for (const wave of actualPlan.stackWaves) {
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
            actualPlan.resourceWaves[stackId] ?? [],
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
          this.deployLock.release();
          return { success: false, stacks: stackResults };
        }
      }
    }

    // All stacks succeeded — delete the snapshot so the working directory
    // stays clean. Snapshot is preserved on failure for crash recovery.
    this.persistence.deleteSnapshot();

    this.deployLock.release();
    return { success: true, stacks: stackResults };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async deployStack(
    stack: AssemblyStack,
    resourceWaves: string[][],
  ): Promise<StackDeploymentResult> {
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
      reconciledCount = await this.reconcileStack(stack, this.adapters);
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
    // Wave-structured creation tracking: each sub-array is one deployment wave.
    // Rollback iterates waves in reverse; resources within each wave in reverse.
    const createdInOrder: string[][] = [];
    const resourceResults: ResourceDeploymentResult[] = [];
    let anyCreated = false;
    let anyUpdated = false;

    // Deploy resources wave by wave. Resources in the same wave can run in
    // parallel; waves execute sequentially to respect dependencies.
    for (const wave of resourceWaves) {
      const wavePromises = wave.map((logicalId) =>
        this.deployResource(
          stack,
          logicalId,
          resourceById,
          this.adapters,
          isUpdate,
        ),
      );

      const waveResults = await Promise.allSettled(wavePromises);

      // Resources created in the current wave (populated in wave order).
      const waveCreated: string[] = [];

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

          // Collect any concurrently-created resources from this wave (j > i).
          for (let j = i + 1; j < wave.length; j++) {
            const s = waveResults[j];
            if (
              s.status === 'fulfilled' &&
              s.value.wasCreated &&
              s.value.physicalId !== undefined
            ) {
              waveCreated.push(wave[j]);
            }
          }
          if (waveCreated.length > 0) {
            createdInOrder.push([...waveCreated]);
          }

          // Wait for all other resources in this wave to settle before rolling back.
          await Promise.allSettled(wavePromises);

          await this.rollback(
            stack,
            createdInOrder,
            resourceById,
            this.adapters,
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

        // If resource failed (but didn't throw), mark stack as failed
        if (!result.success) {
          // Collect any concurrently-created resources from this wave (j > i).
          for (let j = i + 1; j < wave.length; j++) {
            const s = waveResults[j];
            if (
              s.status === 'fulfilled' &&
              s.value.wasCreated &&
              s.value.physicalId !== undefined
            ) {
              waveCreated.push(wave[j]);
            }
          }
          if (waveCreated.length > 0) {
            createdInOrder.push([...waveCreated]);
          }

          // Wait for all other resources in this wave to settle before rolling back.
          await Promise.allSettled(wavePromises);

          await this.rollback(
            stack,
            createdInOrder,
            resourceById,
            this.adapters,
            isUpdate,
          );

          const rollbackComplete = isUpdate
            ? StackStatus.UPDATE_ROLLBACK_COMPLETE
            : StackStatus.ROLLBACK_COMPLETE;

          this.stateManager.transitionStack(stack.id, rollbackComplete, {
            reason: `Resource '${logicalId}' failed: ${result.error}`,
          });

          return {
            stackId: stack.id,
            success: false,
            resources: resourceResults,
            error: `Resource '${logicalId}' failed: ${result.error}`,
          };
        }

        // Track flags and createdInOrder in wave order.
        if (result.physicalId !== undefined && !result.wasSkipped) {
          if (result.wasCreated) {
            anyCreated = true;
            waveCreated.push(logicalId);
          } else if (result.wasUpdated) {
            anyUpdated = true;
            this.updatedInOrder.push({ logicalId, stackId: stack.id });
          }
        }
      }

      // Wave completed successfully — record as one wave entry for rollback.
      if (waveCreated.length > 0) {
        createdInOrder.push([...waveCreated]);
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
    adapters: Record<string, ProviderAdapter>,
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

    // Get the adapter for this resource's provider
    const adapter = adapters[resource.provider];
    if (adapter === undefined) {
      return {
        logicalId,
        success: false,
        error: `No adapter registered for provider '${resource.provider}'.`,
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
            provider: resource.provider,
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
            lastAppliedProperties: resolvedProperties,
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
        provider: resource.provider,
      });

      this.stateManager.transitionResource(
        stack.id,
        logicalId,
        resource.type,
        ResourceStatus.CREATE_COMPLETE,
        {
          physicalId: createResult.physicalId,
          outputs: createResult.outputs,
          lastAppliedProperties: resolvedProperties,
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
    adapters: Record<string, ProviderAdapter>,
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

      // Extract provider from resource type
      const providerId = resourceType.split('::')[0].toLowerCase();
      const adapter = adapters[providerId];

      if (adapter === undefined) {
        throw new Error(
          `No adapter registered for provider '${providerId}' (resource type '${resourceType}').`,
        );
      }

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
          provider: providerId,
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
   * Delete newly-created resources in reverse wave order (rollback phase 1).
   * Within each wave, resources are deleted in reverse order.
   *
   * Failures during rollback are swallowed — we log via the event bus but do
   * not propagate exceptions, so the rollback continues as far as possible.
   *
   * Only rolls back resources that were newly created in this run — resources
   * that were pre-existing (skipped during the create loop) are not deleted.
   *
   * @param createdInOrder - Wave-structured array from `deployStack()`. Each
   *   sub-array contains the logical IDs created in one deployment wave, in
   *   wave order. Rollback iterates waves in reverse; resources within each
   *   wave in reverse.
   */
  private async rollback(
    stack: AssemblyStack,
    createdInOrder: string[][],
    resourceById: Map<
      string,
      { logicalId: string; type: string; properties: Record<string, unknown> }
    >,
    adapters: Record<string, ProviderAdapter>,
    isUpdate: boolean,
  ): Promise<void> {
    this.stateManager.transitionStack(
      stack.id,
      isUpdate
        ? StackStatus.UPDATE_ROLLBACK_IN_PROGRESS
        : StackStatus.ROLLBACK_IN_PROGRESS,
    );

    // Iterate waves in reverse order; within each wave, iterate in reverse.
    for (const wave of [...createdInOrder].reverse()) {
      for (const logicalId of [...wave].reverse()) {
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

        // Extract provider from resource type
        const providerId = resource.type.split('::')[0].toLowerCase();
        const adapter = adapters[providerId];

        if (adapter === undefined) {
          this.stateManager.transitionResource(
            stack.id,
            logicalId,
            resource.type,
            ResourceStatus.DELETE_FAILED,
            { reason: `No adapter registered for provider '${providerId}'.` },
          );
          continue;
        }

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
            provider: providerId,
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
   * Destroys all resources in the cloud assembly.
   *
   * If no stacks and plan are provided, the engine reads the assembly
   * from `assemblyDir` and creates the destruction plan automatically.
   *
   * Stacks are processed in reverse wave order (last wave first), and within
   * each stack, resources are deleted in reverse wave order as well.
   */
  public async destroy(): Promise<DeploymentResult>;
  public async destroy(
    stacks: AssemblyStack[],
    plan: DeploymentPlan,
  ): Promise<DeploymentResult>;
  public async destroy(
    stacks?: AssemblyStack[],
    plan?: DeploymentPlan,
  ): Promise<DeploymentResult> {
    // If no stacks provided, read assembly and create plan internally
    const actualStacks = stacks ?? this.readAssembly();
    const actualPlan = plan ?? this.createPlan(actualStacks);

    const stackById = new Map<string, AssemblyStack>(
      actualStacks.map((s) => [s.id, s]),
    );

    const stackResults: StackDeploymentResult[] = [];

    // Destroy stacks in reverse wave order (last wave first).
    const reversedStackWaves = [...actualPlan.stackWaves].reverse();

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
          const resourceWaves = actualPlan.resourceWaves[stackId] ?? [];
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
          this.deployLock.release();
          return { success: false, stacks: stackResults };
        }
      }
    }

    this.deployLock.release();
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

            return await this.destroyResource(stack, resource, this.adapters);
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
   * @param adapters - Map of provider adapters keyed by provider ID.
   * @returns A result indicating success or failure.
   */
  private async destroyResource(
    stack: AssemblyStack,
    resource: AssemblyResource,
    adapters: Record<string, ProviderAdapter>,
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

    // Get the adapter for this resource's provider
    const adapter = adapters[resource.provider];
    if (adapter === undefined) {
      return {
        logicalId: resource.logicalId,
        success: false,
        error: `No adapter registered for provider '${resource.provider}'.`,
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
        provider: resource.provider,
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
