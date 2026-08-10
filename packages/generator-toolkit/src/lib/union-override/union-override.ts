/**
 * One branch of a {@link UnionOverride}: a definition that becomes one of
 * the union's real member types.
 */
export interface UnionVariant {
  /** The key of this variant's schema in the document's `definitions`. */
  readonly definitionName: string;

  /** The PascalCase type name this variant's struct is emitted under. */
  readonly typeName: string;

  /**
   * Builds the JS boolean expression that identifies a runtime value as
   * this variant, given the expression referring to the value (e.g.
   * `(x) => \`'uses' in (${x})\`` for `ReusableWorkflowCallJob`). Not
   * consulted for the *last* variant in {@link UnionOverride.variants},
   * which is used as the unconditional fallback.
   */
  readonly isVariant: (valueExpression: string) => string;
}

/**
 * Configuration for one real structural-variant `oneOf`/`anyOf` (branches
 * `$ref` different named object definitions) that {@link SchemaNormalizer}
 * deliberately leaves untouched, since a plain schema-driven walk can't
 * resolve it to a single type on its own — an entire flagship type would
 * otherwise never get generated. Consumed by both {@link Json2jsiiAdapter}
 * (to emit the union's TypeScript type) and {@link PropsSerializerGenerator}
 * (to emit its discriminated `toJson` conversion) — shared here so both
 * stay in lockstep with a single source of truth.
 */
export interface UnionOverride {
  /**
   * The union's own PascalCase type name (e.g. `"Job"`), matching what
   * json2jsii's own naming would compute for a `$ref` to `definitionName`.
   */
  readonly unionTypeName: string;

  /** Every real variant, in the order checked when discriminating. */
  readonly variants: readonly UnionVariant[];
}

/**
 * Matches a schema node against a {@link UnionOverride}: true if the node
 * is an *inline* `oneOf`/`anyOf` whose branches are exactly `{ $ref }` to
 * the override's variant definitions (in any order) — the real, unnamed-
 * union shape produced by, e.g., GitHub's `jobs` property after
 * {@link SchemaNormalizer}'s `patternProperties` rewrite. Shared by
 * {@link Json2jsiiAdapter} (to redirect the union's TypeScript type) and
 * {@link PropsSerializerGenerator} (to redirect its `toJson` conversion) so
 * both always agree on exactly the same occurrences.
 */
export class UnionOverrideMatcher {
  private constructor() {} // no instances — static-only class

  public static matches(node: unknown, override: UnionOverride): boolean {
    if (node === null || typeof node !== 'object') {
      return false;
    }
    const expectedRefs = new Set(
      override.variants.map((v) => `#/definitions/${v.definitionName}`),
    );
    const branches =
      (node as Record<string, unknown>)['oneOf'] ??
      (node as Record<string, unknown>)['anyOf'];
    if (!Array.isArray(branches) || branches.length !== expectedRefs.size) {
      return false;
    }
    const refs = branches.map(
      (branch) => (branch as Record<string, unknown> | null)?.['$ref'],
    );
    if (refs.some((ref) => typeof ref !== 'string')) {
      return false;
    }
    const refSet = new Set(refs as string[]);
    return (
      refSet.size === expectedRefs.size &&
      [...refSet].every((ref) => expectedRefs.has(ref))
    );
  }
}
