/**
 * The deployment plan produced by `DeploymentPlanner`.
 */
export interface DeploymentPlan {
  /**
   * Stack deployment waves.
   * Each inner array is a wave (set of stacks that can run in parallel).
   * Waves are executed sequentially — wave N+1 starts only after wave N completes.
   * Stacks with no dependencies are in wave 0; stacks depending on others are in later waves.
   */
  readonly stackWaves: string[][];

  /**
   * Per-stack resource deployment waves.
   * Keyed by stack ID. Each inner array is a wave (set of resources that can run in parallel).
   * Waves are executed sequentially within a stack — wave N+1 starts only after wave N completes.
   * Resources with no intra-stack dependencies are in wave 0; dependent resources are in later waves.
   */
  readonly resourceWaves: Record<string, string[][]>;
}
