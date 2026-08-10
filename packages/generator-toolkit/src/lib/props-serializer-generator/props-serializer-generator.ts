import type { JSONSchema4 } from 'json-schema';
import { PropertyNaming } from '../property-naming/property-naming.js';
import type { ResourceRootDescriptor } from '../schema-classifier/schema-classifier.js';
import { TypeNaming } from '../type-naming/type-naming.js';
import {
  UnionOverrideMatcher,
  type UnionOverride,
} from '../union-override/union-override.js';

interface StructToEmit {
  readonly typeName: string;
  readonly def: JSONSchema4;
}

export interface PropsSerializerGeneratorOptions {
  /** The name of the emitted static-only serializer class, e.g. `"WorkflowSerializer"`. */
  readonly serializerClassName: string;

  /** Must match the `unionOverrides` passed to {@link Json2jsiiAdapter} for the same Resource. */
  readonly unionOverrides?: readonly UnionOverride[];
}

/**
 * Generates the `toProperties()` serialization logic `Json2jsiiAdapter`
 * deliberately no longer generates (see its class doc): walks the same
 * normalized schema independently and emits one static-only class per
 * Resource file, with one `toJson<Type>` method per reachable struct type
 * — satisfying this workspace's OOP-only rule (CLAUDE.md: no loose exported
 * functions, only static methods on classes) without post-processing
 * json2jsii's own rendered text.
 *
 * **The emitted class is deliberately not `export`ed.** It's pure
 * implementation detail of the `Resource` subclass generated alongside it
 * in the same file (`ResourceWrapperGenerator`'s output references it
 * directly, same-module) — nothing outside that file has any legitimate
 * reason to call `toJson<Type>()` directly. Not exporting it (rather than
 * exporting it with an `@internal` JSDoc tag, jsii's usual convention for
 * hiding a *member* on an otherwise-public class, e.g.
 * `Resource._toProperties()`) is a stronger guarantee here: the class is
 * invisible even in raw TypeScript/npm usage, not just stripped from
 * jsii's cross-language assembly and generated docs, since it's a whole
 * class with no other legitimate public surface, not one method on a class
 * that otherwise needs to be public.
 *
 * **Why this can't drift from the interfaces `Json2jsiiAdapter` generates**:
 * both property names (via the `camelcase` package, pinned to the exact
 * version json2jsii itself depends on) and nested type names (via
 * {@link TypeNaming}, which wraps `TypeGenerator.normalizeTypeName()` — a
 * public static method re-exported directly from json2jsii) are derived
 * using json2jsii's own naming primitives, not a reimplementation of them —
 * so a future json2jsii version bump that changes its *interface* naming
 * would change both sides identically, and a bump that changes only its
 * (now-unused, `toJson: false`) serialization-function rendering has no
 * effect on this generator at all.
 */
export class PropsSerializerGenerator {
  private constructor() {} // no instances — static-only class

  /**
   * Generates the serializer class for one Resource root.
   *
   * @param schema - the normalized schema document (see
   * {@link SchemaNormalizer}) — must be the same document passed to
   * `Json2jsiiAdapter.generate()` for this root.
   * @param root - the Resource root to generate serialization for.
   * @param propsTypeName - the root props type name, e.g. `"WorkflowProps"`
   * (as returned by `Json2jsiiAdapter.generate()` — passed through rather
   * than re-derived, since the root has no `$ref`-derived name to recompute).
   * @param options - the serializer class name and any union overrides
   * (must match what was passed to `Json2jsiiAdapter.generate()`).
   * @returns the generated static-only class source.
   */
  public static generate(
    schema: JSONSchema4,
    root: ResourceRootDescriptor,
    propsTypeName: string,
    options: PropsSerializerGeneratorOptions,
  ): string {
    const definitions = schema.definitions ?? {};
    const rootDef = PropsSerializerGenerator.resolvePointer(
      schema,
      root.pointer,
    );
    const unionOverrides = options.unionOverrides ?? [];

    const queue: StructToEmit[] = [{ typeName: propsTypeName, def: rootDef }];
    const emitted = new Set<string>();
    const methods: string[] = [];

    while (queue.length > 0) {
      const next = queue.shift();
      if (!next || emitted.has(next.typeName)) {
        continue;
      }
      emitted.add(next.typeName);
      methods.push(
        PropsSerializerGenerator.emitStructMethod(
          next.typeName,
          next.def,
          definitions,
          unionOverrides,
          queue,
        ),
      );
    }

    return [
      `class ${options.serializerClassName} {`,
      '  private constructor() {} // no instances — static-only class',
      '',
      methods.join('\n\n'),
      '}',
      '',
    ].join('\n');
  }

  private static emitStructMethod(
    typeName: string,
    def: JSONSchema4,
    definitions: Record<string, JSONSchema4>,
    unionOverrides: readonly UnionOverride[],
    queue: StructToEmit[],
  ): string {
    const properties = def.properties ?? {};
    const lines: string[] = [
      `  public static toJson${typeName}(obj: ${typeName} | undefined): Record<string, unknown> | undefined {`,
      '    if (obj === undefined) {',
      '      return undefined;',
      '    }',
      '    const result: Record<string, unknown> = {',
    ];
    for (const [originalKey, propSchema] of Object.entries(properties)) {
      const tsName = PropertyNaming.tsPropertyName(originalKey);
      const expr = PropsSerializerGenerator.conversionExpr(
        `obj.${tsName}`,
        propSchema,
        definitions,
        unionOverrides,
        queue,
      );
      lines.push(`      ${JSON.stringify(originalKey)}: ${expr},`);
    }
    lines.push(
      '    };',
      '    return Object.fromEntries(',
      '      Object.entries(result).filter(([, value]) => value !== undefined),',
      '    );',
      '  }',
    );
    return lines.join('\n');
  }

  /**
   * Builds the conversion expression for one property/value, recursing
   * (and enqueuing any newly-discovered struct type) as needed. Mirrors
   * json2jsii's own `emitTypeInternal` dispatch order closely enough for
   * serialization purposes: anything that dispatch would resolve to a
   * plain/permissive TypeScript type (primitive, enum, `any`) needs no
   * conversion at all — only nested structs (recurse), arrays, and maps
   * need real handling.
   */
  private static conversionExpr(
    accessor: string,
    propSchema: JSONSchema4,
    definitions: Record<string, JSONSchema4>,
    unionOverrides: readonly UnionOverride[],
    queue: StructToEmit[],
  ): string {
    const override = unionOverrides.find((candidate) =>
      UnionOverrideMatcher.matches(propSchema, candidate),
    );
    if (override) {
      return PropsSerializerGenerator.discriminatedExpr(
        accessor,
        override,
        definitions,
        queue,
      );
    }

    if (typeof propSchema.$ref === 'string') {
      const definitionName = TypeNaming.extractDefinitionName(propSchema.$ref);
      const targetDef = definitions[definitionName];
      if (targetDef?.properties) {
        const typeName = TypeNaming.typeNameFromDefinitionName(definitionName);
        queue.push({ typeName, def: targetDef });
        return `this.toJson${typeName}(${accessor})`;
      }
      return accessor; // enum, or a definition codegen left permissive — passthrough
    }

    if (
      propSchema.additionalProperties &&
      typeof propSchema.additionalProperties === 'object'
    ) {
      const valueExpr = PropsSerializerGenerator.conversionExpr(
        'entry[1]',
        propSchema.additionalProperties,
        definitions,
        unionOverrides,
        queue,
      );
      return `((${accessor}) === undefined) ? undefined : Object.fromEntries(Object.entries(${accessor}).map((entry): [string, unknown] => [entry[0], ${valueExpr}]))`;
    }

    if (propSchema.type === 'array') {
      const itemExpr = PropsSerializerGenerator.conversionExpr(
        'item',
        Array.isArray(propSchema.items) ? {} : (propSchema.items ?? {}),
        definitions,
        unionOverrides,
        queue,
      );
      return `${accessor}?.map((item: any) => ${itemExpr})`;
    }

    return accessor; // primitive, permissive/any, or plain enum value — identity
  }

  private static discriminatedExpr(
    accessor: string,
    override: UnionOverride,
    definitions: Record<string, JSONSchema4>,
    queue: StructToEmit[],
  ): string {
    for (const variant of override.variants) {
      const def = definitions[variant.definitionName];
      if (def) {
        queue.push({ typeName: variant.typeName, def });
      }
    }
    const last = override.variants[override.variants.length - 1];
    if (!last) {
      throw new Error(
        `Union override "${override.unionTypeName}" must declare at least one variant.`,
      );
    }
    const rest = override.variants.slice(0, -1);
    return rest.reduceRight(
      (elseExpr, variant) =>
        `(${variant.isVariant(accessor)}) ? this.toJson${variant.typeName}(${accessor} as ${variant.typeName}) : ${elseExpr}`,
      `this.toJson${last.typeName}(${accessor} as ${last.typeName})`,
    );
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
