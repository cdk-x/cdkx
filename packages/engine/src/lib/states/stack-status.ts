/**
 * Lifecycle states for a Stack deployment.
 *
 * Follows the CloudFormation state machine pattern:
 *   <operation>_IN_PROGRESS → <operation>_COMPLETE | <operation>_FAILED
 *
 * Creation rollback states apply when a CREATE operation fails and the engine
 * automatically rolls back the partially-created stack.
 */
export enum StackStatus {
  // ── Creation ─────────────────────────────────────────────────────────────
  /** Stack is in the process of being created. */
  CREATE_IN_PROGRESS = 'CREATE_IN_PROGRESS',
  /** Stack was created successfully. */
  CREATE_COMPLETE = 'CREATE_COMPLETE',
  /** Stack failed to create. A rollback may have been initiated. */
  CREATE_FAILED = 'CREATE_FAILED',

  // ── Update ───────────────────────────────────────────────────────────────
  /** Stack is in the process of being updated. */
  UPDATE_IN_PROGRESS = 'UPDATE_IN_PROGRESS',
  /** Stack was updated successfully. */
  UPDATE_COMPLETE = 'UPDATE_COMPLETE',
  /** Stack update failed. */
  UPDATE_FAILED = 'UPDATE_FAILED',
  /** Automatic rollback initiated after a failed update. */
  UPDATE_ROLLBACK_IN_PROGRESS = 'UPDATE_ROLLBACK_IN_PROGRESS',
  /** Rollback of the failed update completed successfully. */
  UPDATE_ROLLBACK_COMPLETE = 'UPDATE_ROLLBACK_COMPLETE',
  /** Rollback of the failed update also failed. Manual intervention required. */
  UPDATE_ROLLBACK_FAILED = 'UPDATE_ROLLBACK_FAILED',

  // ── Deletion ─────────────────────────────────────────────────────────────
  /** Stack is in the process of being deleted. */
  DELETE_IN_PROGRESS = 'DELETE_IN_PROGRESS',
  /** Stack was deleted successfully. */
  DELETE_COMPLETE = 'DELETE_COMPLETE',
  /** Stack deletion failed. */
  DELETE_FAILED = 'DELETE_FAILED',

  // ── Creation rollback ────────────────────────────────────────────────────
  /** Automatic rollback of a failed creation is in progress. */
  ROLLBACK_IN_PROGRESS = 'ROLLBACK_IN_PROGRESS',
  /** Rollback of the failed creation completed successfully. */
  ROLLBACK_COMPLETE = 'ROLLBACK_COMPLETE',
  /** Rollback of the failed creation also failed. Manual intervention required. */
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
}
