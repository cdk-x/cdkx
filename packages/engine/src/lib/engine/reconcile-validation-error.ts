/**
 * Describes a single blocked deletion: a resource that cannot be deleted
 * because a resource remaining in the new assembly still references it.
 */
export interface BlockedDelete {
  /** Logical ID of the resource that would be deleted. */
  readonly toDeleteLogicalId: string;
  /** Resource type of the resource that would be deleted. */
  readonly toDeleteType: string;
  /** Logical ID of the resource in the new assembly that references it. */
  readonly dependentLogicalId: string;
  /** Resource type of the dependent resource. */
  readonly dependentType: string;
  /** The attribute name used in the `{ ref, attr }` token. */
  readonly attr: string;
}

/**
 * Thrown by `reconcileStack()` when one or more resources scheduled for
 * deletion are still referenced by resources that remain in the new assembly.
 *
 * The deployment is aborted before any API call is made — no partial state
 * is left behind.
 */
export class ReconcileValidationError extends Error {
  readonly blockedDeletes: BlockedDelete[];

  constructor(blockedDeletes: BlockedDelete[]) {
    const lines = blockedDeletes.map(
      (b) =>
        `  - '${b.toDeleteLogicalId}' (${b.toDeleteType}) is referenced by ` +
        `'${b.dependentLogicalId}' (${b.dependentType}) via attr '${b.attr}'`,
    );
    super(
      `Cannot delete ${blockedDeletes.length} resource(s) — they are still ` +
        `referenced by resources in the new assembly:\n${lines.join('\n')}`,
    );
    this.name = 'ReconcileValidationError';
    this.blockedDeletes = blockedDeletes;
  }
}
