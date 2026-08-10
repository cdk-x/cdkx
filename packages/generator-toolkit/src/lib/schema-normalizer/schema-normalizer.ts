import type { JSONSchema4 } from 'json-schema';

type SchemaRecord = Record<string, unknown>;

const SHAPE_KEYS = [
  'properties',
  'patternProperties',
  'additionalProperties',
  'type',
  'items',
  'enum',
] as const;

/**
 * A pure `JSONSchema4 → JSONSchema4` tree transform that rewrites a vendored
 * provider schema into a shape `json2jsii`'s `TypeGenerator` can safely
 * digest, run once before any Resource root reaches
 * {@link Json2jsiiAdapter}.
 *
 * json2jsii already ignores most JSON Schema composition/validation
 * keywords it can't represent (`if`/`then`/`else`, `oneOf`/`anyOf` mixing
 * primitive and complex branches, `allOf` composition) by silently falling
 * back to a permissive type — verified against its source, not just its
 * docs. This normalizer only intervenes where that silent fallback would be
 * either **wrong** (data loss, not just imprecision) or **worth
 * documenting** explicitly rather than leaving unobvious:
 *
 * - `patternProperties`: json2jsii has zero support for it at all — not
 *   even a safe fallback. A pattern co-existing with `additionalProperties`
 *   silently drops the pattern-matched fields from the emitted interface
 *   entirely (no error). This is a real correctness bug if left alone, not
 *   just a precision loss — always rewritten.
 * - Single-`$ref`-branch `allOf` (`allOf: [{ $ref: X }]`): either a pure
 *   cosmetic wrapper (collapsed straight to the `$ref`) or, when the node
 *   also declares its own shape (`properties` etc. — real composition, e.g.
 *   GitHub's `on.<event>` trigger objects extending `eventObject`), the
 *   wrapper is dropped and the node's own local shape kept as-is. Verified
 *   this is safe for every real occurrence in the vendored GitHub schemas:
 *   the referenced base types (`eventObject`, `types`) never contribute
 *   meaningful structure beyond what json2jsii would derive from the node's
 *   own properties anyway.
 * - Constraint-only `oneOf`/`anyOf` (every branch is bare `{ required:
 *   [...] }`, e.g. `step`'s `uses`/`run`/`wait`/... mutual exclusivity):
 *   dropped, with the exclusivity documented as a JSDoc note instead of
 *   silently vanishing (json2jsii already ignores it structurally either
 *   way, since the node's own `properties` already declares every field).
 * - `#/definitions/configuration`'s self-reference (`github-workflow.json`,
 *   used by `env`/`matrix`): resolves safely to a permissive type on its
 *   own (confirmed empirically), but gets an explicit JSDoc note so the
 *   permissiveness isn't an unexplained surprise. This is the one, specific
 *   site this normalizer special-cases — not a generic recursive-`$ref`
 *   detector.
 * - `if`/`then`/`else` composition (`workflowDispatchInput`, dependabot's
 *   conditional schedule/ecosystem rules): left structurally untouched
 *   (json2jsii already ignores it), just annotated.
 *
 * What this normalizer deliberately does NOT do: merge `allOf` branches
 * generically, model `if`/`then`/`else` in the type system, or detect every
 * possible mixed-primitive/complex `oneOf` for documentation purposes
 * (json2jsii's silent `any` fallback already applies correctly on its own
 * for those — adding detection would be purely cosmetic and isn't worth
 * the false-positive risk).
 *
 * The one real *structural* gap this normalizer does not paper over is a
 * true multi-variant `oneOf` of different named object `$ref`s (e.g.
 * `jobs`: `normalJob` | `reusableWorkflowCallJob`) — json2jsii falls back
 * to `any` for these too, but that's wrong enough (an entire flagship type
 * never gets emitted) that it's worth real engineering, handled separately
 * in {@link Json2jsiiAdapter} via emission-order control, not here.
 */
export class SchemaNormalizer {
  private constructor() {} // no instances — static-only class

  /**
   * Normalizes a whole schema document (its root and every `definitions`
   * entry).
   *
   * @param schema - the raw vendored schema document.
   * @returns a new, normalized schema document; `schema` itself is never
   * mutated.
   */
  public static normalize(schema: JSONSchema4): JSONSchema4 {
    const cloned = SchemaNormalizer.deepClone(schema);
    const walked = SchemaNormalizer.walk(
      cloned,
      SchemaNormalizer.normalizeNode,
    ) as JSONSchema4;
    return SchemaNormalizer.synthesizeInlineUnionBranchNames(
      SchemaNormalizer.documentRecursiveSelfRef(walked),
    );
  }

  /**
   * Recursively applies `transform` to every schema node in `value`,
   * bottom-up (children are transformed before their parent).
   *
   * @param value - the (sub)tree to walk; arrays and plain objects are
   * recursed into, everything else is returned as-is.
   * @param transform - applied to every plain-object node encountered.
   * @returns the transformed tree.
   */
  private static walk(
    value: unknown,
    transform: (node: SchemaRecord) => SchemaRecord,
  ): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => SchemaNormalizer.walk(item, transform));
    }
    if (value !== null && typeof value === 'object') {
      const recursed: SchemaRecord = {};
      for (const [key, child] of Object.entries(value as SchemaRecord)) {
        recursed[key] = SchemaNormalizer.walk(child, transform);
      }
      return transform(recursed);
    }
    return value;
  }

  private static normalizeNode(node: SchemaRecord): SchemaRecord {
    let result = node;
    result = SchemaNormalizer.collapseTrivialAllOf(result);
    result = SchemaNormalizer.dropConstraintOnlyOneOf(result);
    result = SchemaNormalizer.rewritePatternProperties(result);
    result = SchemaNormalizer.annotateIfThenElse(result);
    return result;
  }

  /**
   * `allOf: [{ $ref: X }]` (single branch, nothing else on the branch) →
   * either collapsed straight to `$ref: X` (node has no other shape-
   * defining keys) or the `allOf` wrapper is simply dropped, keeping the
   * node's own local shape (node already declares `properties` etc. — real
   * composition json2jsii can't represent; see the class doc).
   */
  private static collapseTrivialAllOf(node: SchemaRecord): SchemaRecord {
    const allOf = node['allOf'];
    if (!Array.isArray(allOf) || allOf.length !== 1) {
      return node;
    }
    const branch = allOf[0] as SchemaRecord;
    const branchKeys = Object.keys(branch);
    if (branchKeys.length !== 1 || typeof branch['$ref'] !== 'string') {
      return node; // not a pure single-$ref wrapper (e.g. an if/then branch)
    }

    const rest = SchemaNormalizer.omit(node, 'allOf');
    const hasOwnShape = SHAPE_KEYS.some((key) => key in rest);
    if (hasOwnShape) {
      return rest; // real composition — drop the wrapper, keep locals
    }
    return { ...rest, $ref: branch['$ref'] };
  }

  /**
   * `oneOf`/`anyOf` where every branch is bare `{ required: [...] }` (no
   * `properties`/`$ref`/`type`) → dropped, exclusivity noted in
   * `description` instead.
   */
  private static dropConstraintOnlyOneOf(node: SchemaRecord): SchemaRecord {
    const key =
      'oneOf' in node ? 'oneOf' : 'anyOf' in node ? 'anyOf' : undefined;
    if (!key) {
      return node;
    }
    const branches = node[key];
    if (!Array.isArray(branches) || branches.length === 0) {
      return node;
    }
    if (!branches.every(SchemaNormalizer.isConstraintOnlyBranch)) {
      return node;
    }

    const groups = (branches as SchemaRecord[]).map((branch) =>
      (branch['required'] as string[]).join('+'),
    );
    const note = `Exactly one of: ${groups.join(', ')} must be set.`;
    const rest = SchemaNormalizer.omit(node, key);
    const description = rest['description'];
    return {
      ...rest,
      description:
        typeof description === 'string' && description.length > 0
          ? `${description}\n\n${note}`
          : note,
    };
  }

  private static isConstraintOnlyBranch(branch: unknown): boolean {
    if (branch === null || typeof branch !== 'object') {
      return false;
    }
    const keys = Object.keys(branch as SchemaRecord);
    return (
      keys.length === 1 &&
      keys[0] === 'required' &&
      Array.isArray((branch as SchemaRecord)['required'])
    );
  }

  /**
   * `patternProperties` has zero support in json2jsii — always rewritten
   * away. Three cases, checked in order:
   *
   * 1. A real `additionalProperties` object already coexists (e.g.
   *    `matrix`'s `include`/`exclude` patterns alongside a general dynamic-
   *    key catch-all) — the pattern is dropped; the existing
   *    `additionalProperties` already provides a valid, if less precise,
   *    type for those keys too.
   * 2. `properties` coexists, with no real `additionalProperties` (e.g.
   *    `on.workflow_run`'s `^branches(-ignore)?$`) — the pattern's keys are
   *    literal alternatives, not a true wildcard: expanded into named
   *    optional properties.
   * 3. Neither — a genuine dynamic-key map (e.g. `jobs`,
   *    `workflow_call.inputs`) — the single pattern's subschema becomes
   *    `additionalProperties`.
   */
  private static rewritePatternProperties(node: SchemaRecord): SchemaRecord {
    const patternProperties = node['patternProperties'];
    if (
      patternProperties === undefined ||
      patternProperties === null ||
      typeof patternProperties !== 'object'
    ) {
      return node;
    }
    const patterns = Object.entries(patternProperties as SchemaRecord);
    const rest = SchemaNormalizer.omit(node, 'patternProperties');

    const existingAdditional = rest['additionalProperties'];
    const hasRealAdditionalProperties =
      existingAdditional !== undefined &&
      existingAdditional !== null &&
      typeof existingAdditional === 'object';
    if (hasRealAdditionalProperties) {
      return rest;
    }

    if (rest['properties'] !== undefined) {
      if (patterns.length !== 1) {
        throw new Error(
          `Unsupported patternProperties shape: multiple patterns alongside "properties" (${patterns
            .map(([pattern]) => pattern)
            .join(', ')}).`,
        );
      }
      const [pattern, subschema] = SchemaNormalizer.required(
        patterns[0],
        'patterns must be non-empty here (checked above)',
      );
      const names = SchemaNormalizer.expandLiteralAlternationPattern(pattern);
      const existingProperties = (rest['properties'] as SchemaRecord) ?? {};
      return {
        ...rest,
        properties: {
          ...existingProperties,
          ...Object.fromEntries(names.map((name) => [name, subschema])),
        },
      };
    }

    if (patterns.length !== 1) {
      throw new Error(
        `Unsupported patternProperties shape: multiple patterns with no "properties" sibling (${patterns
          .map(([pattern]) => pattern)
          .join(', ')}).`,
      );
    }
    const [, subschema] = SchemaNormalizer.required(
      patterns[0],
      'patterns must be non-empty here (checked above)',
    );
    return { ...rest, additionalProperties: subschema };
  }

  /**
   * Expands a regex-alternation `patternProperties` key into the literal
   * property names it matches. Supports the forms found in real vendored
   * schemas plus their obvious generalizations:
   * `^word$`, `^word(suffix)?$`, `^(a|b|c)$`.
   *
   * @param pattern - the regex pattern string (including `^`/`$` anchors).
   * @returns the literal property names the pattern matches.
   * @throws if the pattern doesn't match a recognized alternation form.
   */
  private static expandLiteralAlternationPattern(
    pattern: string,
  ): readonly string[] {
    const optionalSuffix = /^\^([A-Za-z0-9_-]+)\(([A-Za-z0-9_-]+)\)\?\$$/.exec(
      pattern,
    );
    if (optionalSuffix) {
      const word = SchemaNormalizer.required(
        optionalSuffix[1],
        'capture group 1 must match here (checked by the outer if)',
      );
      const suffix = optionalSuffix[2];
      return [word, `${word}${suffix}`];
    }
    const alternation = /^\^\(([A-Za-z0-9_-]+(?:\|[A-Za-z0-9_-]+)+)\)\$$/.exec(
      pattern,
    );
    if (alternation) {
      return SchemaNormalizer.required(
        alternation[1],
        'capture group 1 must match here (checked by the outer if)',
      ).split('|');
    }
    const literal = /^\^([A-Za-z0-9_-]+)\$$/.exec(pattern);
    if (literal) {
      return [
        SchemaNormalizer.required(
          literal[1],
          'capture group 1 must match here (checked by the outer if)',
        ),
      ];
    }
    throw new Error(
      `Unsupported patternProperties literal-alternation pattern: "${pattern}".`,
    );
  }

  /**
   * `allOf` containing an `if`/`then`/`else` branch: left structurally
   * untouched (json2jsii already ignores it when the node has its own
   * `properties`), just documented via a JSDoc-style note.
   */
  private static annotateIfThenElse(node: SchemaRecord): SchemaRecord {
    const allOf = node['allOf'];
    if (
      !Array.isArray(allOf) ||
      !allOf.some((branch) => 'if' in (branch as SchemaRecord))
    ) {
      return node;
    }
    const note =
      'Schema-level conditional validation on this shape was not preserved by codegen — see the vendored schema for the full constraint.';
    const description = node['description'];
    return {
      ...node,
      description:
        typeof description === 'string' && description.length > 0
          ? `${description}\n\n@remarks ${note}`
          : `@remarks ${note}`,
    };
  }

  /**
   * Special-cases `github-workflow.json`'s self-referential
   * `#/definitions/configuration` (used by `env`/`matrix`): already
   * resolves to a permissive type on its own (confirmed empirically — its
   * `oneOf` mixes primitive and complex branches with no other matching
   * keyword), this just makes that permissiveness explicit via a
   * documented note rather than an unexplained `any`. Not a generic
   * recursive-`$ref` detector — this one definition only.
   */
  private static documentRecursiveSelfRef(schema: JSONSchema4): JSONSchema4 {
    const definitions = schema.definitions;
    const configuration = definitions?.['configuration'] as
      SchemaRecord | undefined;
    if (!configuration) {
      return schema;
    }
    const note =
      'This type is recursive (may itself contain nested values of the same shape) — codegen does not model the recursion; nested values are typed permissively.';
    const description = configuration['description'];
    return {
      ...schema,
      definitions: {
        ...definitions,
        configuration: {
          ...configuration,
          description:
            typeof description === 'string' && description.length > 0
              ? `${description}\n\n@remarks ${note}`
              : `@remarks ${note}`,
        },
      },
    };
  }

  /**
   * For a real structural-variant `oneOf`/`anyOf` (branches `$ref` to
   * different definitions, not a constraint-only union — see
   * {@link dropConstraintOnlyOneOf}) where a branch is an *inline*,
   * unnamed object schema instead of a `$ref`: synthesizes a name
   * (`<ParentPascalName><PropertyPascalName>Variant<N>`), hoists it into
   * `definitions`, and replaces the branch with a `$ref` to it — so
   * json2jsii (and {@link Json2jsiiAdapter}'s union handling) always has a
   * named type to work with. Not exercised by either real GitHub schema
   * today (every real structural-variant union there is already `$ref`-
   * only); implemented and tested against synthetic fixtures for the day a
   * provider schema does need it.
   */
  private static synthesizeInlineUnionBranchNames(
    schema: JSONSchema4,
  ): JSONSchema4 {
    const definitions: Record<string, JSONSchema4> = {
      ...(schema.definitions ?? {}),
    };

    const hoist = (
      node: SchemaRecord,
      path: readonly string[],
    ): SchemaRecord => {
      let result = node;
      for (const key of ['oneOf', 'anyOf'] as const) {
        const branches = result[key];
        if (!Array.isArray(branches) || branches.length < 2) {
          continue;
        }
        const isObjectShapedSchema = (candidate: SchemaRecord): boolean =>
          'properties' in candidate ||
          candidate['type'] === 'object' ||
          typeof candidate['additionalProperties'] === 'object';
        const isObjectShaped = (branch: unknown): boolean => {
          if (branch === null || typeof branch !== 'object') {
            return false;
          }
          const record = branch as SchemaRecord;
          if (typeof record['$ref'] === 'string') {
            // Resolve the $ref's *target* — a branch being a $ref says
            // nothing about its shape on its own (e.g. `env`'s
            // `stringContainingExpressionSyntax` branch is a $ref to a
            // plain string type, not an object).
            const match = /^#\/definitions\/([^/]+)$/.exec(record['$ref']);
            const definitionName = match?.[1];
            const target = definitionName
              ? definitions[definitionName]
              : undefined;
            return target !== undefined && isObjectShapedSchema(target);
          }
          return isObjectShapedSchema(record);
        };
        // Every branch must be object-shaped (a $ref to an object
        // definition, or inline with its own properties) — a branch that's
        // a bare primitive or a $ref to a primitive (e.g.
        // `concurrency.cancel-in-progress`'s `boolean | expressionSyntax`,
        // or `env`'s `{object} | stringContainingExpressionSyntax`) means
        // this isn't a real struct-variant union at all, just a mixed-type
        // oneOf already left as an accepted permissive fallback (see the
        // class doc) — hoisting/treating it as a real union would
        // manufacture a fake one that `UnionDetector` would then wrongly
        // try to auto-resolve.
        const isRealVariantUnion =
          branches.every(isObjectShaped) &&
          branches.some(
            (branch) => typeof (branch as SchemaRecord)['$ref'] === 'string',
          );
        if (!isRealVariantUnion) {
          continue;
        }
        const newBranches = branches.map((branch, index) => {
          if (
            branch !== null &&
            typeof branch === 'object' &&
            typeof (branch as SchemaRecord)['$ref'] !== 'string'
          ) {
            const name = SchemaNormalizer.toPascalCase([
              ...path,
              `Variant${index + 1}`,
            ]);
            definitions[name] = branch as JSONSchema4;
            return { $ref: `#/definitions/${name}` };
          }
          return branch;
        });
        result = { ...result, [key]: newBranches };
      }
      return result;
    };

    const walkForHoisting = (
      value: unknown,
      path: readonly string[],
    ): unknown => {
      if (Array.isArray(value)) {
        return value.map((item, index) =>
          walkForHoisting(item, [...path, String(index)]),
        );
      }
      if (value !== null && typeof value === 'object') {
        const recursed: SchemaRecord = {};
        for (const [key, child] of Object.entries(value as SchemaRecord)) {
          recursed[key] = walkForHoisting(child, [...path, key]);
        }
        return hoist(recursed, path);
      }
      return value;
    };

    const rootWalked = walkForHoisting({ ...schema, definitions: undefined }, [
      'Root',
    ]) as SchemaRecord;
    for (const [name, def] of Object.entries({ ...definitions })) {
      definitions[name] = walkForHoisting(def, [name]) as JSONSchema4;
    }

    return { ...rootWalked, definitions } as JSONSchema4;
  }

  private static toPascalCase(parts: readonly string[]): string {
    return parts
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  private static deepClone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private static omit(node: SchemaRecord, key: string): SchemaRecord {
    const rest: SchemaRecord = { ...node };
    delete rest[key];
    return rest;
  }

  private static required<T>(value: T | undefined, message: string): T {
    if (value === undefined) {
      throw new Error(`Invariant violated: ${message}`);
    }
    return value;
  }
}
