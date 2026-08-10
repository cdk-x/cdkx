import type { JSONSchema4 } from 'json-schema';
import { TypeGenerator } from 'json2jsii';
import type { ResourceRootDescriptor } from '../schema-classifier/schema-classifier.js';
import {
  UnionOverrideMatcher,
  type UnionOverride,
} from '../union-override/union-override.js';

export interface Json2jsiiAdapterOptions {
  /**
   * Real structural-variant unions to hand-roll instead of accepting
   * json2jsii's default `any` fallback. GitHub's `jobs` (normalJob |
   * reusableWorkflowCallJob) is the only one needed for this toolkit's
   * current scope — see the provider wiring for how it's supplied.
   */
  readonly unionOverrides?: readonly UnionOverride[];
}

export interface Json2jsiiResult {
  /** The name of the emitted root struct, e.g. `"WorkflowProps"`. */
  readonly propsTypeName: string;

  /** The rendered TypeScript source: interfaces, enums, and union types only. */
  readonly source: string;
}

/**
 * Thin wrapper around `json2jsii`'s `TypeGenerator`: turns a normalized
 * schema document's Resource root into a jsii-safe `<ResourceType>Props`
 * interface plus every reachable nested interface/enum, with an explicit
 * escape hatch for real structural-variant unions.
 *
 * **Types only — never serialization.** json2jsii's `toJson: true` mode
 * would also emit standalone top-level `export function toJson_<Type>(...)`
 * functions, which conflicts with this workspace's OOP-only rule (see
 * CLAUDE.md: no loose exported functions, only static methods on classes).
 * Deliberately generated with `toJson: false` here; serialization is
 * generated separately, as static methods, by
 * {@link PropsSerializerGenerator} — which walks the same normalized
 * schema independently and uses `TypeGenerator.normalizeTypeName()` (this
 * adapter's own naming primitive, re-exported by json2jsii) to guarantee
 * its method names line up with the types generated here.
 *
 * **Why the union override needs emission-order control, not just
 * `emitCustomType()`**: `TypeGenerator`'s own `$ref` resolution
 * (`typeForRef`) only ever returns an already-fully-*rendered* type
 * (`this.emittedTypes[typeName]`) — never a merely-*registered* one
 * (`this.typesToEmit[typeName]`, which is where `emitCustomType()` on its
 * own leaves a type, since `TypeGenerator` renders everything lazily via a
 * FIFO queue). So a naive `gen.emitCustomType('Job', ...)` call, however
 * it's timed, never actually gets *found* by the `jobs` property's own
 * `$ref` resolution — confirmed empirically, not just by reading the
 * source — it re-derives from the raw (unrepresentable) `oneOf` schema
 * every time and falls back to `any` regardless. The fix is emission
 * **order**: this adapter constructs its own `TypeGenerator` (not
 * `TypeGenerator.forStruct()`, which always emits the root struct first)
 * and explicitly emits every union override's variant types, then the
 * union type itself, **before** emitting the root struct — so by the time
 * the root struct's own emitter runs (during `.render()`) and resolves
 * `jobs`'s `$ref`, the union type is already in `emittedTypes` and the
 * cache hit in `typeForRef` returns it directly.
 *
 * **A second, related wrinkle**: the ordering trick above only works when
 * the property actually reaches the union via a `$ref` (so `typeForRef`
 * runs at all) — but a real structural-variant union is often written
 * *inline* at its use site with no intermediate named `$ref` (this is
 * exactly GitHub's real `jobs` shape: `additionalProperties: { oneOf:
 * [{ $ref: normalJob }, { $ref: reusableWorkflowCallJob }] } }`, not
 * `additionalProperties: { $ref: '#/definitions/job' }`). For an inline
 * union, `typeForProperty` calls `emitTypeInternal` directly on the literal
 * `oneOf` object — `typeForRef`, and therefore the `emittedTypes` cache
 * check, is never consulted at all. So before applying the ordering trick,
 * `generate()` first rewrites every inline occurrence structurally matching
 * an override's variant `$ref` set into a `$ref` to the override's own
 * `unionTypeName` — turning the inline case into the already-solved named-
 * `$ref` case.
 */
export class Json2jsiiAdapter {
  private constructor() {} // no instances — static-only class

  /**
   * Generates the `<ResourceType>Props` interface (and every reachable
   * nested type) for one Resource root.
   *
   * @param schema - the normalized schema document (see
   * {@link SchemaNormalizer}).
   * @param root - the Resource root to generate a props type for.
   * @param options - real structural-variant union overrides, if any.
   * @returns the generated props type name and full rendered source.
   */
  public static generate(
    schema: JSONSchema4,
    root: ResourceRootDescriptor,
    options: Json2jsiiAdapterOptions = {},
  ): Json2jsiiResult {
    let workingSchema = schema;
    for (const override of options.unionOverrides ?? []) {
      workingSchema = Json2jsiiAdapter.rewriteInlineUnionOccurrences(
        workingSchema,
        override,
      );
    }

    const definitions: Record<string, JSONSchema4> = {
      ...workingSchema.definitions,
      ...(workingSchema as { $defs?: Record<string, JSONSchema4> }).$defs,
    };
    const gen = new TypeGenerator({ definitions, toJson: false });

    for (const override of options.unionOverrides ?? []) {
      Json2jsiiAdapter.registerUnionOverride(gen, definitions, override);
    }

    const propsTypeName = `${root.resourceType}Props`;
    const rootSchema = Json2jsiiAdapter.resolvePointer(
      workingSchema,
      root.pointer,
    );
    gen.emitType(propsTypeName, rootSchema);

    return { propsTypeName, source: gen.render() };
  }

  /**
   * Rewrites every occurrence of an *inline* `oneOf`/`anyOf` whose branches
   * are exactly `{ $ref }` to `override`'s variant definitions into a
   * `$ref` to `override.unionTypeName` — see the class doc's second
   * wrinkle. Also ensures `unionTypeName` exists as a (placeholder)
   * definition, though it's never actually resolved through in practice
   * since {@link registerUnionOverride} always wins the `emittedTypes`
   * cache race.
   */
  private static rewriteInlineUnionOccurrences(
    schema: JSONSchema4,
    override: UnionOverride,
  ): JSONSchema4 {
    const replacement = { $ref: `#/definitions/${override.unionTypeName}` };

    const rewrite = (value: unknown): unknown => {
      if (UnionOverrideMatcher.matches(value, override)) {
        return replacement;
      }
      if (Array.isArray(value)) {
        return value.map(rewrite);
      }
      if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [key, child] of Object.entries(
          value as Record<string, unknown>,
        )) {
          out[key] = rewrite(child);
        }
        return out;
      }
      return value;
    };

    const rewritten = rewrite(schema) as JSONSchema4;
    return {
      ...rewritten,
      definitions: {
        ...rewritten.definitions,
        [override.unionTypeName]:
          rewritten.definitions?.[override.unionTypeName] ?? {},
      },
    };
  }

  private static registerUnionOverride(
    gen: TypeGenerator,
    definitions: Record<string, JSONSchema4>,
    override: UnionOverride,
  ): void {
    for (const variant of override.variants) {
      const def = definitions[variant.definitionName];
      if (!def) {
        throw new Error(
          `Union override for "${override.unionTypeName}" references unknown definition "${variant.definitionName}".`,
        );
      }
      gen.emitType(variant.typeName, def);
    }

    gen.emitCustomType(override.unionTypeName, (code) => {
      const typeExpr = override.variants.map((v) => v.typeName).join(' | ');
      code.line(`export type ${override.unionTypeName} = ${typeExpr};`);
      // toJson is unused: this adapter runs with toJson:false, and
      // PropsSerializerGenerator generates the real (discriminated)
      // conversion for this union independently — see the class doc.
      return { type: override.unionTypeName, toJson: (x) => x };
    });
  }

  private static resolvePointer(
    schema: JSONSchema4,
    pointer: string,
  ): JSONSchema4 {
    if (pointer === '#') {
      return schema;
    }
    const match = /^#\/definitions\/(.+)$/.exec(pointer);
    const definitionName = match?.[1];
    if (!definitionName) {
      throw new Error(`Unsupported Resource root pointer "${pointer}".`);
    }
    const def = schema.definitions?.[definitionName];
    if (!def) {
      throw new Error(`No definition found for root pointer "${pointer}".`);
    }
    return def;
  }
}
