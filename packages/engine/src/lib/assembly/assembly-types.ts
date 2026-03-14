/**
 * A resolved output value declared by a stack.
 * Corresponds to a `StackOutput` construct in the synthesized JSON.
 */
export interface AssemblyOutput {
  /** The resolved value of the output (may be a literal or token). */
  readonly value: unknown;
  /** Optional human-readable description. */
  readonly description?: string;
}

/**
 * A single resource entry from a stack template file.
 */
export interface AssemblyResource {
  /** Logical resource ID — the key in the stack template's `resources` map. */
  readonly logicalId: string;
  /** Resource type string (e.g. `'Hetzner::Compute::Server'`). */
  readonly type: string;
  /** Provider identifier (e.g. `'hetzner'`, `'ansible'`). Derived from type prefix. */
  readonly provider: string;
  /**
   * Resolved properties as synthesized. May contain `{ ref, attr }` tokens
   * for cross-resource references — the planner resolves these at deploy time.
   */
  readonly properties: Record<string, unknown>;
  /** Synthesizer metadata (e.g. `{ 'cdkx:path': '...' }`). */
  readonly metadata?: Record<string, unknown>;
  /**
   * Explicit and implicit dependency logical IDs, as emitted by the synthesizer.
   *
   * The synthesizer (`ProviderResource.toJson()`) populates this as the
   * deduplicated union of:
   * - Logical IDs from explicit `addDependency()` calls on the construct.
   * - Logical IDs referenced by `{ ref, attr }` tokens found anywhere in the
   *   resolved properties tree.
   *
   * The `DeploymentPlanner` uses this field (in addition to scanning `{ ref, attr }`
   * tokens at plan time) to build the intra-stack dependency graph for topological
   * sorting. Absent (undefined) when the resource has no dependencies.
   */
  readonly dependsOn?: string[];
}

/**
 * Fully parsed representation of a stack, combining data from `manifest.json`
 * and the stack's template JSON file.
 */
export interface AssemblyStack {
  /** Artifact ID — the key in `manifest.json`'s `artifacts` map. */
  readonly id: string;
  /** File name of the stack template (e.g. `'HetznerStack.json'`). */
  readonly templateFile: string;
  /** Human-readable display name. */
  readonly displayName?: string;
  /** Resources declared in the stack template, in stable insertion order. */
  readonly resources: AssemblyResource[];
  /**
   * Output values declared in the stack template.
   * Keyed by output key (e.g. `'NetworkId'`).
   */
  readonly outputs: Record<string, AssemblyOutput>;
  /**
   * Keys of all outputs declared by this stack.
   * Derived from `manifest.json`'s `outputKeys` field.
   */
  readonly outputKeys: string[];
  /**
   * IDs of stacks that this stack depends on.
   * Derived by scanning `outputKeys` cross-references in the manifest.
   * Populated by `CloudAssemblyReader` after reading all stacks.
   */
  readonly dependencies: string[];
}
