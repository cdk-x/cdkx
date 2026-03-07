import type { JsonSchema, JsonSchemaProperty } from './schema-reader.js';

/** Context for type mapping — carries the resource name for derived names. */
export interface TypeContext {
  /** The PascalCase resource name (e.g. `"Firewall"`, `"Server"`). */
  resourceName: string;
}

/**
 * Maps JSON Schema property definitions to TypeScript type strings.
 *
 * All methods are static. No instances should be created.
 *
 * Type mapping rules:
 * - `{ type: "string" }` → `string`
 * - `{ type: "integer" }` → `number`
 * - `{ type: "boolean" }` → `boolean`
 * - `{ type: "array", items: { type: "string" } }` → `string[]`
 * - `{ type: "array", items: { $ref: "#/definitions/Foo" } }` → `Foo[]`
 * - `{ additionalProperties: { type: "string" } }` → `Record<string, string>`
 * - `{ $ref: "#/definitions/FooEnum" }` → `FooEnum` (same-file enum or object ref)
 * - `{ enum: [...] }` → literal union (inline) or named enum ref (via definitions)
 * - `nullable: true` → `T | null`
 * - integer properties whose name ends in `Id` / `_id` (cross-references, e.g. `networkId`)
 *   → `number | IResolvable`
 */
export class TypeMapper {
  /**
   * Maps a JSON Schema property to a TypeScript type string.
   *
   * @param prop - The property schema to map.
   * @param ctx - Contextual information (resource name) for derived type names.
   * @param propName - The camelCase property name (used for derived names).
   * @param localDefs - All definitions available for `$ref` resolution.
   */
  public static mapType(
    prop: JsonSchemaProperty,
    ctx: TypeContext,
    propName: string,
    localDefs?: Record<string, JsonSchema>,
  ): string {
    let base = TypeMapper.mapBase(prop, ctx, propName, localDefs);
    if (prop.nullable) {
      base = `${base} | null`;
    }
    return base;
  }

  /**
   * Returns `true` if the property name indicates a cross-resource ID reference.
   * Matches names ending in `Id` or `_id`, but NOT the bare `id` property itself.
   *
   * Examples:
   *   `networkId`  → true
   *   `serverId`   → true
   *   `network_id` → true
   *   `id`         → false
   *   `port`       → false
   */
  public static isCrossRefId(propName: string): boolean {
    if (propName === 'id') return false;
    return /Id$|_id$/.test(propName);
  }

  /**
   * Converts a `snake_case` or `kebab-case` string to `camelCase`.
   */
  public static toCamelCase(str: string): string {
    return str.replace(/[-_]([a-z])/g, (_, c: string) => c.toUpperCase());
  }

  /**
   * Converts a `camelCase` or `PascalCase` string to `PascalCase`.
   */
  public static toPascalCase(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Derives an enum type name from a property name and resource name.
   * e.g. `"direction"` + `"FirewallRule"` → `"FirewallRuleDirection"`
   */
  public static toEnumName(propName: string, resourceName: string): string {
    return `${resourceName}${TypeMapper.toPascalCase(propName)}`;
  }

  /**
   * Derives a nested interface name from a property name and resource name.
   * e.g. `"rules"` + `"Firewall"` → `"FirewallRule"`
   * e.g. `"publicNet"` + `"Server"` → `"ServerPublicNet"`
   */
  public static toNestedInterfaceName(
    propName: string,
    resourceName: string,
  ): string {
    return `${resourceName}${TypeMapper.toPascalCase(propName)}`;
  }

  /**
   * Converts an `attr` pointer name to a PascalCase attribute member name.
   * e.g. `"networkId"` → `"NetworkId"` (to be used as `attrNetworkId`)
   */
  public static toAttrMemberName(attrName: string): string {
    return TypeMapper.toPascalCase(attrName);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private static mapBase(
    prop: JsonSchemaProperty,
    ctx: TypeContext,
    propName: string,
    localDefs?: Record<string, JsonSchema>,
  ): string {
    // Handle $ref — same-file (#/definitions/Foo) or already-inlined cross-file.
    if (prop.$ref) {
      return TypeMapper.mapRef(prop.$ref, ctx, propName);
    }

    // Handle inline enum (shouldn't normally appear in properties — but handle defensively).
    if (prop.enum) {
      return prop.enum.map((v) => `'${v}'`).join(' | ');
    }

    // additionalProperties: { type: "string" } → Record<string, string>
    if (
      prop.type === 'object' &&
      prop.additionalProperties &&
      typeof prop.additionalProperties === 'object' &&
      'type' in prop.additionalProperties
    ) {
      const valType = TypeMapper.mapPrimitive(
        (prop.additionalProperties as JsonSchemaProperty).type,
      );
      return `Record<string, ${valType}>`;
    }

    // Inline object with properties → named nested interface
    if (prop.type === 'object' && prop.properties) {
      return TypeMapper.toNestedInterfaceName(propName, ctx.resourceName);
    }

    // array
    if (prop.type === 'array') {
      const itemType = TypeMapper.mapArrayItems(prop, ctx, propName, localDefs);
      const needsParens = itemType.includes('|');
      return needsParens ? `(${itemType})[]` : `${itemType}[]`;
    }

    // primitives — integer cross-ref IDs get `| IResolvable`
    if (prop.type) {
      const primitive = TypeMapper.mapPrimitive(prop.type);
      if (primitive === 'number' && TypeMapper.isCrossRefId(propName)) {
        return 'number | IResolvable';
      }
      return primitive;
    }

    return 'unknown';
  }

  /**
   * Maps a `$ref` string to a TypeScript type.
   * Same-file refs like `#/definitions/FooEnum` → `FooEnum`.
   * Cross-file refs that were already inlined come in as definition names
   * resolved to their type (handled by callers who inline before passing here).
   */
  private static mapRef(
    ref: string,
    _ctx: TypeContext,
    _propName: string,
  ): string {
    if (ref.startsWith('#/definitions/')) {
      return ref.replace('#/definitions/', '');
    }
    // Cross-file ref that was NOT inlined — extract definition name.
    const hashIdx = ref.indexOf('#');
    if (hashIdx !== -1) {
      const defPart = ref.slice(hashIdx + 1);
      const parts = defPart.split('/').filter(Boolean);
      return parts[parts.length - 1] ?? 'unknown';
    }
    return 'unknown';
  }

  /**
   * Maps the `items` of an array property to a type string.
   */
  private static mapArrayItems(
    prop: JsonSchemaProperty,
    ctx: TypeContext,
    propName: string,
    _localDefs?: Record<string, JsonSchema>,
  ): string {
    const items = prop.items;
    if (!items) return 'unknown';

    if (items.$ref) {
      return TypeMapper.mapRef(items.$ref, ctx, propName);
    }

    if (items.type) {
      const primitive = TypeMapper.mapPrimitive(items.type);
      if (primitive === 'number') {
        return 'number | IResolvable';
      }
      return primitive;
    }

    return 'unknown';
  }

  /**
   * Maps a primitive JSON Schema type string to a TypeScript type string.
   */
  private static mapPrimitive(type: string | undefined): string {
    switch (type) {
      case 'string':
        return 'string';
      case 'integer':
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'Record<string, unknown>';
      default:
        return 'unknown';
    }
  }
}
