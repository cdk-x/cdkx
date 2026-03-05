/**
 * The deployment plan produced by `DeploymentPlanner`.
 */
export interface DeploymentPlan {
  /**
   * Stack IDs in topological (deployment) order.
   * Stacks with no dependencies come first; stacks that depend on others come later.
   */
  readonly stackOrder: string[];

  /**
   * Per-stack resource deployment order.
   * Keyed by stack ID. Each value is an array of logical resource IDs in the
   * order they should be created — earlier entries have no dependencies on
   * later entries within the same stack.
   */
  readonly resourceOrders: Record<string, string[]>;
}
