import { Naming } from '../../internal/naming.js';
import type {
  DeployMode,
  IrComponentNode,
  IrProperty,
  IrPropertyType,
  IrResourceNode,
} from '../ir/ir.js';

const SUPPORTED_DIALECT = 'draft-07';
const DEFINITION_REF_PATTERN = /^#\/definitions\/([^/]+)$/;

/**
 * A draft-07 JSON Schema property/subschema. Deliberately narrow — only the
 * keywords this adapter actually interprets, not a full JSON Schema type.
 */
export interface JsonSchemaProperty {
  readonly $ref?: string;
  readonly type?:
    'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
  readonly description?: string;
  readonly enum?: readonly string[];
  readonly items?: JsonSchemaProperty;
  readonly properties?: Record<string, JsonSchemaProperty>;
  readonly required?: readonly string[];
  readonly additionalProperties?: JsonSchemaProperty | boolean;
}

/**
 * A vendored draft-07 JSON Schema file's root — one such file produces
 * exactly one {@link IrResourceNode}.
 */
export interface JsonSchema extends JsonSchemaProperty {
  readonly $schema?: string;
  readonly title?: string;
  readonly definitions?: Record<string, JsonSchemaProperty>;
}

/**
 * Classification input a caller (the `generate-l1` Nx executor, ultimately)
 * supplies per vendored schema file — deliberately not derived from the
 * schema itself, since none of this is reliably inferable (see the L1
 * codegen plan's decision to make classification explicit, not
 * heuristic).
 */
export interface JsonSchemaAdapterOptions {
  /** PascalCase, e.g. `"Workflow"` — becomes `Resource.resourceType`. */
  readonly resourceType: string;
  /** e.g. `"github.cdk-x.com/v1"` — becomes `Resource.apiVersion`. */
  readonly apiVersion: string;
  readonly deploy: DeployMode;
}

export interface JsonSchemaAdapterResult {
  readonly resource: IrResourceNode;
  readonly components: readonly IrComponentNode[];
}

/**
 * Converts one vendored draft-07 JSON Schema file into IR: the schema's own
 * root becomes an {@link IrResourceNode}, and every named `definitions`
 * entry transitively reachable from it (via `$ref`) becomes an
 * {@link IrComponentNode}. Plain value shapes (enums, records, scalars,
 * anonymous nested objects) are never separately classified — they're
 * always inlined into the referencing property's {@link IrPropertyType}.
 */
export class JsonSchemaAdapter {
  private constructor() {} // no instances — static-only class

  /**
   * Confirms a schema declares a supported `$schema` dialect.
   *
   * @param schema - the parsed schema (or any object with a `$schema`
   * field).
   * @returns the detected dialect name.
   * @example
   * JsonSchemaAdapter.detectDialect(schema); // 'draft-07'
   */
  public static detectDialect(schema: { readonly $schema?: string }): string {
    const uri = schema.$schema ?? '';
    if (uri.includes(SUPPORTED_DIALECT)) return SUPPORTED_DIALECT;
    throw new Error(
      `Unsupported JSON Schema dialect${uri ? ` "${uri}"` : ' (missing "$schema")'}. ` +
        `Only ${SUPPORTED_DIALECT} is supported.`,
    );
  }

  /**
   * Converts a parsed JSON Schema into IR.
   *
   * @param schema - the parsed, vendored schema file.
   * @param options - classification metadata for the schema's root
   * Resource.
   * @returns the root Resource plus every reachable Component, in
   * first-reached order.
   * @example
   * const { resource, components } = JsonSchemaAdapter.toIr(schema, {
   *   resourceType: 'Workflow',
   *   apiVersion: 'github.cdk-x.com/v1',
   *   deploy: 'render',
   * });
   */
  public static toIr(
    schema: JsonSchema,
    options: JsonSchemaAdapterOptions,
  ): JsonSchemaAdapterResult {
    JsonSchemaAdapter.detectDialect(schema);

    const definitions = schema.definitions ?? {};
    const components = new Map<string, IrComponentNode>();

    const resolveComponent = (definitionName: string): IrComponentNode => {
      const existing = components.get(definitionName);
      if (existing) return existing;

      const definition = definitions[definitionName];
      if (!definition) {
        throw new Error(
          `Unresolvable $ref: "#/definitions/${definitionName}" is not defined.`,
        );
      }

      const name = Naming.toPascalCase(definitionName);
      // Reserve the slot before recursing into this definition's own
      // properties, so a self- or mutually-referencing definition can't
      // recurse infinitely.
      components.set(definitionName, { name, properties: [] });

      const properties = JsonSchemaAdapter.toIrProperties(
        definition.properties ?? {},
        definition.required ?? [],
        resolveComponent,
      );
      const resolved: IrComponentNode = {
        name,
        description: definition.description,
        properties,
      };
      components.set(definitionName, resolved);
      return resolved;
    };

    const properties = JsonSchemaAdapter.toIrProperties(
      schema.properties ?? {},
      schema.required ?? [],
      resolveComponent,
    );

    const resource: IrResourceNode = {
      resourceType: options.resourceType,
      apiVersion: options.apiVersion,
      deploy: options.deploy,
      description: schema.description,
      properties,
    };

    return { resource, components: [...components.values()] };
  }

  private static toIrProperties(
    properties: Record<string, JsonSchemaProperty>,
    required: readonly string[],
    resolveComponent: (definitionName: string) => IrComponentNode,
  ): IrProperty[] {
    const requiredNames = new Set(required);
    return Object.entries(properties).map(([name, property]) => ({
      name,
      type: JsonSchemaAdapter.toIrPropertyType(
        name,
        property,
        resolveComponent,
      ),
      required: requiredNames.has(name),
      description: property.description,
    }));
  }

  private static toIrPropertyType(
    propertyName: string,
    property: JsonSchemaProperty,
    resolveComponent: (definitionName: string) => IrComponentNode,
  ): IrPropertyType {
    if (property.$ref) {
      const component = resolveComponent(
        JsonSchemaAdapter.definitionNameFromRef(property.$ref),
      );
      return {
        shape: 'component-ref',
        target: component.name,
        collection: 'single',
      };
    }

    if (property.type === 'array') {
      const items = property.items;
      if (items?.$ref) {
        const component = resolveComponent(
          JsonSchemaAdapter.definitionNameFromRef(items.$ref),
        );
        return {
          shape: 'component-ref',
          target: component.name,
          collection: 'array',
        };
      }
      return {
        shape: 'array',
        items: JsonSchemaAdapter.toIrPropertyType(
          propertyName,
          items ?? {},
          resolveComponent,
        ),
      };
    }

    if (property.type === 'object') {
      if (
        property.additionalProperties &&
        typeof property.additionalProperties === 'object'
      ) {
        const valueSchema = property.additionalProperties;
        if (valueSchema.$ref) {
          const component = resolveComponent(
            JsonSchemaAdapter.definitionNameFromRef(valueSchema.$ref),
          );
          return {
            shape: 'component-ref',
            target: component.name,
            collection: 'map',
          };
        }
        return {
          shape: 'record',
          valueType: JsonSchemaAdapter.toIrPropertyType(
            propertyName,
            valueSchema,
            resolveComponent,
          ),
        };
      }
      if (property.properties) {
        return {
          shape: 'inline-shape',
          name: Naming.toPascalCase(propertyName),
          properties: JsonSchemaAdapter.toIrProperties(
            property.properties,
            property.required ?? [],
            resolveComponent,
          ),
        };
      }
      // A bare `{ "type": "object" }` with no further shape (e.g. GitHub's
      // deliberately-untyped `on` trigger block) — treated as opaque.
      return { shape: 'unknown' };
    }

    if (property.enum) {
      return {
        shape: 'enum',
        name: Naming.toPascalCase(propertyName),
        values: property.enum,
      };
    }

    if (property.type === 'string' || property.type === 'boolean') {
      return { shape: 'primitive', primitive: property.type };
    }
    if (property.type === 'number' || property.type === 'integer') {
      return { shape: 'primitive', primitive: 'number' };
    }

    // No declared type at all — treated as opaque.
    return { shape: 'unknown' };
  }

  private static definitionNameFromRef(ref: string): string {
    const match = DEFINITION_REF_PATTERN.exec(ref);
    if (!match) {
      throw new Error(
        `Unsupported $ref "${ref}" — only local "#/definitions/<name>" refs are supported.`,
      );
    }
    return match[1];
  }
}
