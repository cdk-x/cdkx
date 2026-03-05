/**
 * Lifecycle states for an individual resource within a Stack deployment.
 *
 * Follows the same CloudFormation pattern as StackStatus but scoped to a
 * single resource. Each transition emits an EngineEvent.
 */
export enum ResourceStatus {
  // ── Creation ─────────────────────────────────────────────────────────────
  /** Resource is in the process of being created. */
  CREATE_IN_PROGRESS = 'CREATE_IN_PROGRESS',
  /** Resource was created successfully. */
  CREATE_COMPLETE = 'CREATE_COMPLETE',
  /** Resource creation failed. */
  CREATE_FAILED = 'CREATE_FAILED',

  // ── Update ───────────────────────────────────────────────────────────────
  /** Resource is in the process of being updated. */
  UPDATE_IN_PROGRESS = 'UPDATE_IN_PROGRESS',
  /** Resource was updated successfully. */
  UPDATE_COMPLETE = 'UPDATE_COMPLETE',
  /** Resource update failed. */
  UPDATE_FAILED = 'UPDATE_FAILED',
  /** Post-update cleanup in progress (e.g. removing old properties). */
  UPDATE_COMPLETE_CLEANUP_IN_PROGRESS = 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
  /** Automatic rollback of a failed resource update is in progress. */
  UPDATE_ROLLBACK_IN_PROGRESS = 'UPDATE_ROLLBACK_IN_PROGRESS',
  /** Rollback of the failed resource update completed successfully. */
  UPDATE_ROLLBACK_COMPLETE = 'UPDATE_ROLLBACK_COMPLETE',
  /** Rollback of the failed resource update also failed. */
  UPDATE_ROLLBACK_FAILED = 'UPDATE_ROLLBACK_FAILED',

  // ── Deletion ─────────────────────────────────────────────────────────────
  /** Resource is in the process of being deleted. */
  DELETE_IN_PROGRESS = 'DELETE_IN_PROGRESS',
  /** Resource was deleted successfully. */
  DELETE_COMPLETE = 'DELETE_COMPLETE',
  /** Resource deletion failed. */
  DELETE_FAILED = 'DELETE_FAILED',
}
