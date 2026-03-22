import { CycleDetector } from '@cdkx-io/core';
import type {
  AssemblyResource,
  AssemblyStack,
} from '../assembly/assembly-types';
import type { DeploymentPlan } from './deployment-plan';

// ─── Token helpers ────────────────────────────────────────────────────────────

/**
 * The shape of a `{ ref, attr }` cross-resource token in synthesized JSON.
 */
interface RefAttrToken {
  ref: string;
  attr: string;
}

/**
 * Returns `true` if `value` is a `{ ref, attr }` token object.
 */
function isRefAttrToken(value: unknown): value is RefAttrToken {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj['ref'] === 'string' && typeof obj['attr'] === 'string';
}

/**
 * Recursively collect all `{ ref }` values from an arbitrary value tree.
 */
function collectRefs(value: unknown, refs: Set<string>): void {
  if (value === null || value === undefined) return;

  if (isRefAttrToken(value)) {
    refs.add(value.ref);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectRefs(item, refs);
    }
    return;
  }

  if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectRefs(v, refs);
    }
  }
}

// ─── Topological sort with level assignment ───────────────────────────────────

/**
 * Kahn's algorithm — topological sort with level (wave) assignment.
 *
 * Assigns each node to a level based on the longest dependency path from the root:
 * - Level 0 = no dependencies
 * - Level N = max(levels of all dependencies) + 1
 *
 * @param ids    All node IDs.
 * @param edges  `edges[id]` = set of IDs that `id` depends on (must come before `id`).
 * @returns      Object with `waves` (grouped by level) and `levels` (map of id → level).
 * @throws       `CycleError` if a cycle is detected.
 */
function topologicalSortWithLevels(
  ids: string[],
  edges: Map<string, Set<string>>,
): { waves: string[][]; levels: Map<string, number> } {
  // Build in-degree map and adjacency list (dependents, not dependencies).
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>(); // id → list of nodes that depend on id
  const levels = new Map<string, number>();

  for (const id of ids) {
    if (!inDegree.has(id)) inDegree.set(id, 0);
    if (!dependents.has(id)) dependents.set(id, []);
    if (!levels.has(id)) levels.set(id, 0);
  }

  for (const [id, deps] of edges.entries()) {
    for (const dep of deps) {
      if (!inDegree.has(dep)) inDegree.set(dep, 0);
      if (!dependents.has(dep)) dependents.set(dep, []);
      if (!levels.has(dep)) levels.set(dep, 0);
      inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
      const depList = dependents.get(dep) ?? [];
      depList.push(id);
      dependents.set(dep, depList);
    }
  }

  // Start with nodes that have no dependencies (level 0).
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }

  // Stable sort the initial queue so output is deterministic.
  queue.sort();

  const result: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === undefined) break;
    result.push(node);

    const currentLevel = levels.get(node) ?? 0;

    const nodesDependingOnThis = dependents.get(node) ?? [];
    const sorted = [...nodesDependingOnThis].sort();
    for (const dependent of sorted) {
      const newDeg = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, newDeg);

      // Update level: max of all dependencies + 1.
      const depLevel = Math.max(levels.get(dependent) ?? 0, currentLevel + 1);
      levels.set(dependent, depLevel);

      if (newDeg === 0) {
        queue.push(dependent);
        queue.sort();
      }
    }
  }

  if (result.length !== ids.length) {
    // Cycle detected — find the nodes in the cycle.
    const inCycle = ids.filter((id) => !result.includes(id));
    throw new CycleError(inCycle);
  }

  // Group by level to produce waves.
  const maxLevel = Math.max(...Array.from(levels.values()), -1);
  const waves: string[][] = [];
  for (let i = 0; i <= maxLevel; i++) {
    const wave = ids.filter((id) => levels.get(id) === i);
    wave.sort(); // deterministic order within wave
    waves.push(wave);
  }

  return { waves, levels };
}

// ─── CycleError ───────────────────────────────────────────────────────────────

/**
 * Thrown by `DeploymentPlanner` when a dependency cycle is detected.
 */
export class CycleError extends Error {
  constructor(
    /** The node IDs involved in the cycle. */
    public readonly cycleNodes: string[],
  ) {
    super(
      `Deployment cycle detected involving: ${cycleNodes.join(', ')}. ` +
        `A resource (or stack) cannot depend on itself, directly or indirectly.`,
    );
    this.name = 'CycleError';
  }
}

// ─── DeploymentPlanner ────────────────────────────────────────────────────────

/**
 * Builds a `DeploymentPlan` from a list of `AssemblyStack` objects.
 *
 * Responsibilities:
 * 1. Topologically sort stacks into waves using the `dependencies` array on each stack.
 * 2. For each stack, topologically sort resources into waves by combining:
 *    - `{ ref, attr }` tokens found in resource properties (implicit deps), and
 *    - the `dependsOn` array on each `AssemblyResource` (explicit deps, e.g. from
 *      `resource.addDependency()` calls serialized by the synthesizer).
 * 3. Detect cycles at both the stack and resource levels and throw `CycleError`.
 *
 * Stacks and resources within the same wave have no mutual dependencies and can
 * be deployed in parallel. Waves are executed sequentially.
 *
 * Cross-stack resource references (token `ref` pointing to a resource in a
 * different stack) are NOT treated as intra-stack dependencies — they are
 * resolved by the engine at runtime from `EngineState`.
 *
 * @example
 * ```ts
 * const planner = new DeploymentPlanner();
 * const plan = planner.plan(stacks);
 * ```
 */
export class DeploymentPlanner {
  /**
   * Compute the `DeploymentPlan` for the given stacks.
   *
   * @throws `CycleError` if a cycle is detected among stacks or resources.
   */
  /**
   * Query-only cycle detection on a plain dependency map.
   *
   * Unlike `plan()`, this method does not throw — it returns the cycle nodes
   * or `null`, leaving error handling to the caller.
   *
   * @param dependencies - Map of node ID → list of dependency IDs.
   * @returns Array of node IDs in the cycle, or `null` if the graph is acyclic.
   */
  public static detectCycles(
    dependencies: Record<string, string[]>,
  ): string[] | null {
    return CycleDetector.detect(dependencies);
  }

  public plan(stacks: AssemblyStack[]): DeploymentPlan {
    const stackWaves = this.planStacks(stacks);
    const resourceWaves = this.planResources(stacks);
    return { stackWaves, resourceWaves };
  }

  // ─── Stack ordering ─────────────────────────────────────────────────────────

  private planStacks(stacks: AssemblyStack[]): string[][] {
    const ids = stacks.map((s) => s.id);
    const edges = new Map<string, Set<string>>();

    for (const stack of stacks) {
      edges.set(stack.id, new Set(stack.dependencies));
    }

    return topologicalSortWithLevels(ids, edges).waves;
  }

  // ─── Resource ordering (per stack) ─────────────────────────────────────────

  private planResources(stacks: AssemblyStack[]): Record<string, string[][]> {
    const result: Record<string, string[][]> = {};

    for (const stack of stacks) {
      result[stack.id] = this.planStackResources(stack);
    }

    return result;
  }

  private planStackResources(stack: AssemblyStack): string[][] {
    const resources = stack.resources;
    const ids = resources.map((r) => r.logicalId);

    // Build a set of logical IDs in this stack for fast lookup.
    const localIds = new Set(ids);

    // Build intra-stack dependency edges.
    // A resource B depends on resource A if B's properties contain
    // { ref: A.logicalId, attr: ... }.
    const edges = new Map<string, Set<string>>();

    for (const resource of resources) {
      const deps = this.collectIntraStackDeps(resource, localIds);
      edges.set(resource.logicalId, deps);
    }

    return topologicalSortWithLevels(ids, edges).waves;
  }

  private collectIntraStackDeps(
    resource: AssemblyResource,
    localIds: Set<string>,
  ): Set<string> {
    const refs = new Set<string>();
    collectRefs(resource.properties, refs);

    // Also include explicit dependsOn entries (kept for backward compat —
    // { ref, attr } token scanning already covers the implicit ones, but
    // dependsOn is the canonical list emitted by the synthesizer and covers
    // addDependency() calls that produce no token in properties).
    for (const dep of resource.dependsOn ?? []) {
      refs.add(dep);
    }

    // Keep only refs that point to resources within the same stack.
    const deps = new Set<string>();
    for (const ref of refs) {
      if (localIds.has(ref) && ref !== resource.logicalId) {
        deps.add(ref);
      }
    }
    return deps;
  }
}
