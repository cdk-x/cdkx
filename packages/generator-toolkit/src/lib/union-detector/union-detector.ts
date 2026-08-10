import type { JSONSchema4 } from 'json-schema';
import { PropertyNaming } from '../property-naming/property-naming.js';
import { TypeNaming } from '../type-naming/type-naming.js';
import type {
  UnionOverride,
  UnionVariant,
} from '../union-override/union-override.js';

interface VariantInfo {
  readonly definitionName: string;
  readonly typeName: string;
  readonly required: ReadonlySet<string>;
}

/**
 * Auto-detects real structural-variant `oneOf`/`anyOf` unions (every branch
 * a pure `{ $ref }`, e.g. `jobs`: `normalJob` | `reusableWorkflowCallJob`)
 * and resolves each one into a {@link UnionOverride} — a discriminant field
 * and a union type name — without requiring a human to enumerate them.
 *
 * **Why this exists**: hand-writing a `unionOverrides` entry per real union
 * doesn't scale to a large schema (a Kubernetes-scale OpenAPI document could
 * have dozens), and worse, a schema update introducing a *new* one would
 * previously generate silently-incomplete output (json2jsii's own fallback
 * for an unhandled union is a silent `any`, not an error) — a real risk
 * nobody would notice until the missing type was needed. `detectAndResolve`
 * instead **throws** for any detected union it can't confidently resolve,
 * so a schema change that needs a new discriminant fails the build
 * immediately instead of degrading quietly. An explicit `UnionOverride`
 * (matched by its variants' definition names) always wins over
 * auto-resolution when supplied — a true escape hatch for the rare
 * genuinely-ambiguous case, not the default path.
 *
 * **How auto-resolution works**: for each variant, a field counts as a
 * usable discriminant only if it's in that variant's own `required` array
 * *and* isn't even a declared property (required or not) on any other
 * variant — a strong, schema-only guarantee that a value carrying that
 * field cannot validate against any other variant. At most one variant may
 * lack such a field (it becomes the unconditional fallback); more than one
 * without a discriminant is genuinely ambiguous and throws. The union's own
 * type name is the longest common PascalCase-word suffix of the variants'
 * type names (`NormalJob` / `ReusableWorkflowCallJob` → `Job`), falling
 * back to joining every variant name with `Or` when there's no shared
 * suffix.
 */
export class UnionDetector {
  private constructor() {} // no instances — static-only class

  /**
   * Finds every real structural-variant union in `schema` and resolves each
   * one, preferring a matching entry from `explicitOverrides` when present.
   *
   * @param schema - the normalized schema document to scan (see
   * {@link SchemaNormalizer}).
   * @param explicitOverrides - hand-configured overrides, matched by their
   * variants' definition names (order-independent) against each detected
   * union; used as-is instead of auto-resolving when they match.
   * @returns every detected union, resolved.
   * @throws if a detected union can't be auto-resolved and has no matching
   * explicit override.
   */
  public static detectAndResolve(
    schema: JSONSchema4,
    explicitOverrides: readonly UnionOverride[] = [],
  ): readonly UnionOverride[] {
    const definitions = schema.definitions ?? {};
    const candidates = UnionDetector.findCandidates(schema);

    return candidates.map((definitionNames) => {
      const explicit = explicitOverrides.find((override) =>
        UnionDetector.sameDefinitionNames(override, definitionNames),
      );
      return (
        explicit ?? UnionDetector.autoResolve(definitionNames, definitions)
      );
    });
  }

  /**
   * Walks the whole document for `oneOf`/`anyOf` nodes whose branches are
   * *all* pure `{ $ref }` (2 or more) — the structural signature of a real
   * variant union, as opposed to a constraint-only union (branches are
   * `{ required: [...] }`, already flat — see `SchemaNormalizer`) or a
   * mixed primitive/complex union (left as an accepted permissive
   * fallback). Deduplicated by the *set* of variant definition names, since
   * the same union shape can appear at more than one property.
   */
  private static findCandidates(
    schema: JSONSchema4,
  ): readonly (readonly string[])[] {
    const seen = new Set<string>();
    const candidates: string[][] = [];

    const visit = (node: unknown): void => {
      if (Array.isArray(node)) {
        for (const item of node) {
          visit(item);
        }
        return;
      }
      if (node === null || typeof node !== 'object') {
        return;
      }
      const record = node as Record<string, unknown>;
      const branches = record['oneOf'] ?? record['anyOf'];
      if (
        Array.isArray(branches) &&
        branches.length >= 2 &&
        branches.every(UnionDetector.isPureRef)
      ) {
        const definitionNames = (branches as { $ref: string }[]).map((branch) =>
          TypeNaming.extractDefinitionName(branch.$ref),
        );
        const key = [...definitionNames].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          candidates.push(definitionNames);
        }
      }
      for (const value of Object.values(record)) {
        visit(value);
      }
    };

    visit(schema);
    return candidates;
  }

  private static isPureRef(branch: unknown): branch is { $ref: string } {
    if (branch === null || typeof branch !== 'object') {
      return false;
    }
    const keys = Object.keys(branch as Record<string, unknown>);
    return (
      keys.length === 1 &&
      typeof (branch as Record<string, unknown>)['$ref'] === 'string'
    );
  }

  private static sameDefinitionNames(
    override: UnionOverride,
    definitionNames: readonly string[],
  ): boolean {
    const a = [...override.variants.map((v) => v.definitionName)].sort();
    const b = [...definitionNames].sort();
    return a.length === b.length && a.every((name, index) => name === b[index]);
  }

  private static autoResolve(
    definitionNames: readonly string[],
    definitions: Record<string, JSONSchema4>,
  ): UnionOverride {
    const infos: VariantInfo[] = definitionNames.map((definitionName) => {
      const def = definitions[definitionName];
      if (!def) {
        throw new Error(
          `Detected a real structural-variant union (${definitionNames.join(' | ')}) ` +
            `but "${definitionName}" has no definition.`,
        );
      }
      return {
        definitionName,
        typeName: TypeNaming.typeNameFromDefinitionName(definitionName),
        required: new Set(Array.isArray(def.required) ? def.required : []),
      };
    });

    const ownedByExactlyOne = (field: string): boolean =>
      infos.filter(
        (info) => field in (definitions[info.definitionName]?.properties ?? {}),
      ).length === 1;

    const discriminants = new Map<string, string>(); // definitionName -> field
    for (const info of infos) {
      const field = [...info.required].find(ownedByExactlyOne);
      if (field) {
        discriminants.set(info.definitionName, field);
      }
    }

    const withoutDiscriminant = infos.filter(
      (info) => !discriminants.has(info.definitionName),
    );
    if (withoutDiscriminant.length > 1) {
      throw new Error(
        `Cannot auto-resolve the union between ${definitionNames.join(', ')}: ` +
          `${withoutDiscriminant.map((info) => info.definitionName).join(', ')} have no ` +
          'uniquely-required discriminant field. Add an explicit unionOverrides entry ' +
          'for this union.',
      );
    }

    const fallback = withoutDiscriminant[0];
    const ordered = fallback
      ? [...infos.filter((info) => info !== fallback), fallback]
      : infos;

    const variants: UnionVariant[] = ordered.map((info, index) => {
      const isLast = index === ordered.length - 1;
      const field = discriminants.get(info.definitionName);
      if (isLast || !field) {
        return {
          definitionName: info.definitionName,
          typeName: info.typeName,
          isVariant: () => 'true',
        };
      }
      // The discriminant check runs against the *TypeScript* value (still
      // camelCased at serialization time, before conversion back to the
      // original schema key) — so it must check the TS property name
      // (PropertyNaming.tsPropertyName), not the raw schema key `field`
      // itself (e.g. "runsOn", not "runs-on").
      const tsField = PropertyNaming.tsPropertyName(field);
      return {
        definitionName: info.definitionName,
        typeName: info.typeName,
        isVariant: (x: string) => `'${tsField}' in (${x})`,
      };
    });

    return {
      unionTypeName: UnionDetector.deriveUnionName(
        infos.map((info) => info.typeName),
      ),
      variants,
    };
  }

  private static deriveUnionName(typeNames: readonly string[]): string {
    const rawSuffix = typeNames.reduce((acc, name) =>
      UnionDetector.commonSuffix(acc, name),
    );
    const firstUpper = [...rawSuffix].findIndex(
      (char) => char >= 'A' && char <= 'Z',
    );
    const suffix = firstUpper >= 0 ? rawSuffix.slice(firstUpper) : '';
    return suffix.length > 0 ? suffix : typeNames.join('Or');
  }

  private static commonSuffix(a: string, b: string): string {
    let i = 0;
    while (
      i < a.length &&
      i < b.length &&
      a[a.length - 1 - i] === b[b.length - 1 - i]
    ) {
      i++;
    }
    return a.slice(a.length - i);
  }
}
