// ─── CycleError ───────────────────────────────────────────────────────────────

/**
 * Thrown when a circular dependency is detected between stacks at synthesis
 * time. Deployment is aborted and no output files are written.
 */
export class CycleError extends Error {
  constructor(
    /** The stack IDs involved in the cycle. */
    public readonly cycleNodes: string[],
  ) {
    super(
      `Circular dependency detected involving: ${cycleNodes.join(', ')}. ` +
        `A stack cannot depend on itself, directly or indirectly.`,
    );
    this.name = 'CycleError';
  }
}

// ─── CycleDetector ────────────────────────────────────────────────────────────

/**
 * Pure utility for detecting cycles in a dependency graph.
 *
 * Operates on a plain `Record<string, string[]>` dependency map where each key
 * is a node ID and its value is the list of node IDs it depends on.
 */
export class CycleDetector {
  /**
   * Detects cycles in a dependency graph using Kahn's topological sort.
   *
   * @param deps - Map of node ID → list of dependency IDs.
   * @returns `null` if the graph is acyclic, or an array of node IDs involved
   *          in a cycle if one is found.
   */
  public static detect(deps: Record<string, string[]>): string[] | null {
    const ids = Object.keys(deps);
    if (ids.length === 0) return null;

    // Collect all nodes (keys + any deps not present as keys)
    const allNodes = new Set<string>(ids);
    for (const depList of Object.values(deps)) {
      for (const dep of depList) {
        allNodes.add(dep);
      }
    }

    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const node of allNodes) {
      inDegree.set(node, 0);
      dependents.set(node, []);
    }

    for (const [node, depList] of Object.entries(deps)) {
      for (const dep of depList) {
        inDegree.set(node, (inDegree.get(node) ?? 0) + 1);
        const list = dependents.get(dep) ?? [];
        list.push(node);
        dependents.set(dep, list);
      }
    }

    const queue: string[] = [];
    for (const [node, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(node);
    }
    queue.sort();

    const processed: string[] = [];
    while (queue.length > 0) {
      const node = queue.shift() as string;
      processed.push(node);
      const nodesDependingOnThis = [...(dependents.get(node) ?? [])].sort();
      for (const dependent of nodesDependingOnThis) {
        const newDeg = (inDegree.get(dependent) ?? 1) - 1;
        inDegree.set(dependent, newDeg);
        if (newDeg === 0) {
          queue.push(dependent);
          queue.sort();
        }
      }
    }

    if (processed.length < allNodes.size) {
      // Nodes not processed are in the cycle
      const inCycle = [...allNodes].filter((n) => !processed.includes(n));
      return inCycle;
    }

    return null;
  }
}
