import { StackStatus } from '../states/stack-status';
import { ResourceStatus } from '../states/resource-status';
import { EventBus } from '../events/event-bus';
import { EngineEvent } from '../events/engine-event';
import { StatePersistence } from './state-persistence';
import {
  EngineState,
  StackState,
  ResourceState,
  TransitionStackOptions,
  TransitionResourceOptions,
} from './engine-state';

/**
 * Manages the mutable runtime state of all stacks and resources.
 *
 * Responsibilities:
 * - Holds `EngineState` in memory.
 * - Validates and applies state transitions.
 * - Emits an `EngineEvent` on every transition via the injected `EventBus`.
 * - Persists the updated state to disk via the injected `StatePersistence`.
 *
 * The manager is the single source of truth during a deployment run. All
 * engine components must go through this class to mutate state.
 */
export class EngineStateManager {
  private state: EngineState;

  public constructor(
    private readonly eventBus: EventBus<EngineEvent>,
    private readonly persistence: StatePersistence,
    initialState?: EngineState,
  ) {
    this.state = initialState ?? { stacks: {} };
  }

  // ─── Stack operations ────────────────────────────────────────────────────

  /**
   * Registers a new stack in the engine state with an initial status of
   * `CREATE_IN_PROGRESS`. Throws if the stack is already registered.
   */
  public initStack(stackId: string, options?: TransitionStackOptions): void {
    if (this.state.stacks[stackId] !== undefined) {
      throw new Error(
        `Stack '${stackId}' is already registered in the engine state.`,
      );
    }
    this.applyStackTransition(
      stackId,
      StackStatus.CREATE_IN_PROGRESS,
      { status: StackStatus.CREATE_IN_PROGRESS, resources: {} },
      options,
    );
  }

  /**
   * Stores resolved output values on an existing stack state.
   * Called after all of the stack's resources complete successfully.
   * Throws if the stack has not been registered via `initStack()`.
   */
  public setStackOutputs(
    stackId: string,
    outputs: Record<string, unknown>,
  ): void {
    const existing = this.requireStack(stackId);
    const updatedStack: StackState = { ...existing, outputs };
    this.state = {
      stacks: { ...this.state.stacks, [stackId]: updatedStack },
    };
    this.persistence.save(this.state);
  }

  /**
   * Transitions an existing stack to the given `StackStatus`.
   * Throws if the stack has not been registered via `initStack()`.
   */
  public transitionStack(
    stackId: string,
    status: StackStatus,
    options?: TransitionStackOptions,
  ): void {
    const existing = this.requireStack(stackId);
    this.applyStackTransition(
      stackId,
      status,
      { ...existing, status },
      options,
    );
  }

  // ─── Resource operations ─────────────────────────────────────────────────

  /**
   * Registers a new resource in the given stack with an initial status of
   * `CREATE_IN_PROGRESS`. Throws if the stack is not registered, or if the
   * resource logical ID is already present.
   */
  public initResource(
    stackId: string,
    logicalId: string,
    resourceType: string,
    properties: Record<string, unknown>,
    options?: TransitionResourceOptions,
  ): void {
    const stackState = this.requireStack(stackId);

    if (stackState.resources[logicalId] !== undefined) {
      throw new Error(
        `Resource '${logicalId}' is already registered in stack '${stackId}'.`,
      );
    }

    const resourceState: ResourceState = {
      status: ResourceStatus.CREATE_IN_PROGRESS,
      type: resourceType,
      properties,
    };

    this.applyResourceTransition(
      stackId,
      logicalId,
      resourceType,
      ResourceStatus.CREATE_IN_PROGRESS,
      stackState,
      resourceState,
      options,
    );
  }

  /**
   * Transitions an existing resource to the given `ResourceStatus`.
   * Throws if the stack or resource has not been registered.
   */
  public transitionResource(
    stackId: string,
    logicalId: string,
    resourceType: string,
    status: ResourceStatus,
    options?: TransitionResourceOptions,
  ): void {
    const stackState = this.requireStack(stackId);
    const existing = this.requireResource(stackId, logicalId, stackState);

    const updated: ResourceState = {
      ...existing,
      status,
      ...(options?.physicalId !== undefined && {
        physicalId: options.physicalId,
      }),
      ...(options?.properties !== undefined && {
        properties: options.properties,
      }),
      ...(options?.outputs !== undefined && {
        outputs: options.outputs,
      }),
      ...(options?.lastAppliedProperties !== undefined && {
        lastAppliedProperties: options.lastAppliedProperties,
      }),
    };

    this.applyResourceTransition(
      stackId,
      logicalId,
      resourceType,
      status,
      stackState,
      updated,
      options,
    );
  }

  /**
   * Removes a resource entry from the stack state after a successful reconcile
   * delete. Persists the updated state to disk.
   *
   * No event is emitted — the caller is responsible for emitting the
   * `DELETE_COMPLETE` event via `transitionResource()` before calling this.
   *
   * Throws if the stack or resource is not registered.
   */
  public removeResource(stackId: string, logicalId: string): void {
    const stackState = this.requireStack(stackId);
    this.requireResource(stackId, logicalId, stackState);

    const { [logicalId]: _removed, ...remainingResources } =
      stackState.resources;

    const updatedStack: StackState = {
      ...stackState,
      resources: remainingResources,
    };

    this.state = {
      stacks: {
        ...this.state.stacks,
        [stackId]: updatedStack,
      },
    };

    this.persistence.save(this.state);
  }

  // ─── State accessors ─────────────────────────────────────────────────────

  /** Returns the current immutable engine state snapshot. */
  public getState(): EngineState {
    return this.state;
  }

  /** Returns the state of the given stack, or `undefined` if not found. */
  public getStackState(stackId: string): StackState | undefined {
    return this.state.stacks[stackId];
  }

  /** Returns the state of the given resource, or `undefined` if not found. */
  public getResourceState(
    stackId: string,
    logicalId: string,
  ): ResourceState | undefined {
    return this.state.stacks[stackId]?.resources[logicalId];
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private applyStackTransition(
    stackId: string,
    status: StackStatus,
    newStackState: StackState,
    options?: TransitionStackOptions,
  ): void {
    this.state = {
      stacks: {
        ...this.state.stacks,
        [stackId]: newStackState,
      },
    };

    const event: EngineEvent = {
      timestamp: new Date(),
      stackId,
      logicalResourceId: stackId,
      resourceType: 'cdkx::stack',
      resourceStatus: status,
      ...(options?.reason !== undefined && {
        resourceStatusReason: options.reason,
      }),
    };

    this.eventBus.emit(event);
    this.persistence.save(this.state);
  }

  private applyResourceTransition(
    stackId: string,
    logicalId: string,
    resourceType: string,
    status: ResourceStatus,
    stackState: StackState,
    newResourceState: ResourceState,
    options?: TransitionResourceOptions,
  ): void {
    const updatedStack: StackState = {
      ...stackState,
      resources: {
        ...stackState.resources,
        [logicalId]: newResourceState,
      },
    };

    this.state = {
      stacks: {
        ...this.state.stacks,
        [stackId]: updatedStack,
      },
    };

    const event: EngineEvent = {
      timestamp: new Date(),
      stackId,
      logicalResourceId: logicalId,
      resourceType,
      resourceStatus: status,
      ...(newResourceState.physicalId !== undefined && {
        physicalResourceId: newResourceState.physicalId,
      }),
      ...(options?.reason !== undefined && {
        resourceStatusReason: options.reason,
      }),
    };

    this.eventBus.emit(event);
    this.persistence.save(this.state);
  }

  private requireStack(stackId: string): StackState {
    const stack = this.state.stacks[stackId];
    if (stack === undefined) {
      throw new Error(
        `Stack '${stackId}' is not registered in the engine state. ` +
          `Call initStack() first.`,
      );
    }
    return stack;
  }

  private requireResource(
    stackId: string,
    logicalId: string,
    stackState: StackState,
  ): ResourceState {
    const resource = stackState.resources[logicalId];
    if (resource === undefined) {
      throw new Error(
        `Resource '${logicalId}' is not registered in stack '${stackId}'. ` +
          `Call initResource() first.`,
      );
    }
    return resource;
  }
}
