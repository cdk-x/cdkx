import { StackStatus } from '../states/stack-status';
import { ResourceStatus } from '../states/resource-status';

/**
 * Runtime state of a single resource within a stack.
 */
export interface ResourceState {
  /** Current lifecycle status of the resource. */
  readonly status: ResourceStatus;

  /**
   * Provider resource type string (e.g. `'Hetzner::Compute::Server'`).
   * Stored so that the engine can emit correctly-typed events when operating
   * on resources that are no longer present in the new assembly (e.g. during
   * reconcile deletes).
   */
  readonly type?: string;

  /**
   * Provider-assigned physical ID (e.g. Hetzner server id, Kubernetes
   * resource name). Populated after a successful CREATE_COMPLETE transition.
   */
  readonly physicalId?: string;

  /**
   * Cloud Resource Name (CRN) for this resource.
   * Populated from `CreateResult.crn` after a successful CREATE_COMPLETE.
   * Format: crn:cdkx:<provider>:<domain>[:<region>][:<account>]:<resource-type>/<resource-id>
   */
  readonly crn?: string;

  /**
   * The resolved properties passed to the provider adapter.
   * After token substitution, all `{ ref, attr }` values have been replaced
   * with real provider outputs.
   */
  readonly properties: Record<string, unknown>;

  /**
   * The resolved input properties that were last successfully applied to this
   * resource (i.e. the properties at the time of the last `CREATE_COMPLETE` or
   * `UPDATE_COMPLETE` transition).
   *
   * This is the rollback target for phase 2 (restore updated resources) and is
   * written to the pre-deployment snapshot so that crash recovery can restore
   * resources to their last known-good state.
   *
   * Stores **resolved** values — never raw `{ ref, attr }` tokens.
   * `undefined` until the resource has successfully completed its first create.
   */
  readonly lastAppliedProperties?: Record<string, unknown>;

  /**
   * Provider-returned output values for this resource.
   * Keyed by attribute name (e.g. `'networkId'`, `'serverId'`).
   * Populated from `CreateResult.outputs` after a successful CREATE_COMPLETE.
   * Used by the engine to resolve `{ ref, attr }` tokens in dependent resources.
   */
  readonly outputs?: Record<string, unknown>;
}

/**
 * Runtime state of a stack and all of its resources.
 */
export interface StackState {
  /** Current lifecycle status of the stack. */
  readonly status: StackStatus;

  /**
   * Resource states keyed by logical resource ID (the key in the stack
   * template JSON file).
   */
  readonly resources: Record<string, ResourceState>;

  /**
   * Resolved stack output values, eagerly stored after all of the stack's
   * resources have been successfully deployed.
   *
   * Keyed by output key (the `StackOutput` construct id).
   * Used by `DeployTimeResolver` to substitute `{ stackRef, outputKey }`
   * tokens in dependent stacks.
   */
  readonly outputs?: Record<string, unknown>;
}

/**
 * Top-level engine state. Holds the runtime state for every stack that the
 * engine knows about.
 *
 * This structure can be serialised to `engine-state.json` for crash recovery
 * and deployment resumption.
 */
export interface EngineState {
  /**
   * Stack states keyed by artifact ID (the key in `manifest.json`'s
   * `artifacts` map, e.g. `'HetznerNetworkStack'`).
   */
  readonly stacks: Record<string, StackState>;
}

// ─── Transition option types ─────────────────────────────────────────────────

/** Options for transitioning a stack's status. */
export interface TransitionStackOptions {
  /** Human-readable reason for the transition (used in failure events). */
  readonly reason?: string;
}

/** Options for transitioning a resource's status. */
export interface TransitionResourceOptions {
  /**
   * Provider-assigned physical ID to record on the resource state.
   * Should be supplied when transitioning to CREATE_COMPLETE.
   */
  readonly physicalId?: string;

  /**
   * Cloud Resource Name (CRN) to record on the resource state.
   * Should be supplied when transitioning to CREATE_COMPLETE.
   */
  readonly crn?: string;

  /** Human-readable reason for the transition (used in failure events). */
  readonly reason?: string;

  /**
   * Updated resolved properties to record on the resource state.
   * Used when a token substitution occurs after a dependency is created.
   */
  readonly properties?: Record<string, unknown>;

  /**
   * Provider-returned output values for this resource.
   * Supplied when transitioning to CREATE_COMPLETE with adapter-returned outputs.
   * Keyed by attribute name (e.g. `'networkId'`).
   */
  readonly outputs?: Record<string, unknown>;

  /**
   * The resolved input properties to record as the last successfully applied
   * state. Should be supplied when transitioning to `CREATE_COMPLETE` or
   * `UPDATE_COMPLETE`.
   */
  readonly lastAppliedProperties?: Record<string, unknown>;
}
