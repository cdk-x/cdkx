import { StackStatus } from '../states/stack-status';
import { ResourceStatus } from '../states/resource-status';

/**
 * A single event emitted by the engine whenever a stack or resource changes
 * state. Mirrors the CloudFormation event model.
 *
 * Stack-level events (StackStatus) use the stack's own artifactId as both
 * `logicalResourceId` and `stackId`. Resource-level events (ResourceStatus)
 * carry the resource's logical ID in `logicalResourceId`.
 */
export interface EngineEvent {
  /** ISO timestamp of when the state transition occurred. */
  readonly timestamp: Date;

  /** The artifact ID of the stack this event belongs to. */
  readonly stackId: string;

  /**
   * The logical ID of the resource (key in the stack template JSON), or the
   * stack's own artifact ID for stack-level events.
   */
  readonly logicalResourceId: string;

  /**
   * The provider-assigned physical ID of the resource (e.g. Hetzner server id,
   * Kubernetes resource name). Set after a successful CREATE_COMPLETE or
   * UPDATE_COMPLETE transition. Undefined until the resource is created.
   */
  readonly physicalResourceId?: string;

  /**
   * The provider resource type string (e.g. `'Hetzner::Compute::Server'`,
   * `'cdkx::stack'` for stack-level events).
   */
  readonly resourceType: string;

  /**
   * The new state of the resource or stack after this transition.
   * Can be either a ResourceStatus or a StackStatus.
   */
  readonly resourceStatus: ResourceStatus | StackStatus;

  /**
   * Human-readable explanation of why the state changed. Typically set for
   * failure states or rollback events.
   */
  readonly resourceStatusReason?: string;
}
