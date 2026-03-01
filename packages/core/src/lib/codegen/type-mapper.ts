import type { OpenAPISchema } from './types.js';

/**
 * Maps OpenAPI 3.x schema objects to TypeScript type strings.
 *
 * All methods are static — this is a pure utility class with no instance state.
 * It is used by `OpenAPIExtractor` implementations when building `PropertySpec`
 * objects from a provider's OpenAPI specification.
 */
export abstract class TypeMapper {
  // ---------------------------------------------------------------------------
  // Type mapping
  // ---------------------------------------------------------------------------

  /**
   * Maps an OpenAPI schema to a TypeScript type string.
   *
   * The `context` parameter carries information the mapper needs to produce
   * meaningful names for enums and nested interfaces (e.g. "CertificateType"
   * instead of a generic "Enum").
   *
   * @param schema       - The OpenAPI schema to map.
   * @param context      - Naming context for derived type names.
   * @param context.propName     - snake_case property name (e.g. "ip_range").
   * @param context.resourceName - PascalCase resource name (e.g. "Certificate").
   * @returns A TypeScript type string.
   */
  static map(
    schema: OpenAPISchema,
    context: { propName: string; resourceName: string },
  ): string {
    const { propName, resourceName } = context;

    // Cross-resource reference: property name ends in "_id" or "Id"
    // (but not the bare "id" field itself)
    if (TypeMapper.isCrossRef(propName)) {
      return 'string | number | IResolvable';
    }

    // Enum — inline string enum
    if (schema.enum) {
      return TypeMapper.toEnumName(propName, resourceName);
    }

    // Array
    if (schema.type === 'array' && schema.items) {
      const itemType = TypeMapper.mapItems(schema.items, context);
      // Arrays of cross-ref IDs (e.g. ssh_keys: integer[]) need IResolvable too
      if (
        (schema.items.type === 'integer' || schema.items.type === 'number') &&
        TypeMapper.isIdArrayProp(propName)
      ) {
        return 'Array<number | IResolvable>';
      }
      return `${itemType}[]`;
    }

    // Object with additionalProperties — map/dictionary type
    if (schema.type === 'object' && schema.additionalProperties) {
      if (
        typeof schema.additionalProperties === 'object' &&
        schema.additionalProperties.type === 'string'
      ) {
        return 'Record<string, string>';
      }
      return 'Record<string, unknown>';
    }

    // Complex inline object with own properties
    if (schema.type === 'object' && schema.properties) {
      return TypeMapper.toNestedInterfaceName(propName, resourceName);
    }

    // Primitive types
    const base = TypeMapper.mapPrimitive(schema);

    if (schema.nullable) {
      return `${base} | null`;
    }

    return base;
  }

  // ---------------------------------------------------------------------------
  // Name helpers
  // ---------------------------------------------------------------------------

  /**
   * Converts a snake_case property name to camelCase.
   *
   * @example
   * TypeMapper.toCamelCase('ip_range')        // → 'ipRange'
   * TypeMapper.toCamelCase('expose_routes')   // → 'exposeRoutes'
   * TypeMapper.toCamelCase('name')            // → 'name'
   */
  static toCamelCase(snake: string): string {
    return snake.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  }

  /**
   * Converts a snake_case or camelCase string to PascalCase.
   *
   * @example
   * TypeMapper.toPascalCase('network_zone')   // → 'NetworkZone'
   * TypeMapper.toPascalCase('ipRange')        // → 'IpRange'
   * TypeMapper.toPascalCase('server')         // → 'Server'
   */
  static toPascalCase(name: string): string {
    const camel = TypeMapper.toCamelCase(name);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  /**
   * Converts a snake_case or camelCase string to SCREAMING_SNAKE_CASE.
   * Used for enum member labels.
   *
   * @example
   * TypeMapper.toScreamingSnake('uploaded')         // → 'UPLOADED'
   * TypeMapper.toScreamingSnake('eu-central')       // → 'EU_CENTRAL'
   * TypeMapper.toScreamingSnake('ipv4')             // → 'IPV4'
   */
  static toScreamingSnake(value: string): string {
    return value
      .replace(/-/g, '_')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toUpperCase();
  }

  /**
   * Derives the PascalCase enum name from a property name and its resource.
   *
   * Rules:
   * - `type` on resource "Certificate" → "CertificateType"
   * - `type` on resource "PrimaryIp"   → "PrimaryIpType"
   * - `network_zone`                   → "NetworkZone" (standalone, no resource prefix)
   * - `direction` on "FirewallRule"    → "FirewallRuleDirection"
   *
   * @example
   * TypeMapper.toEnumName('type', 'Certificate')      // → 'CertificateType'
   * TypeMapper.toEnumName('network_zone', 'Subnet')   // → 'NetworkZone'
   * TypeMapper.toEnumName('direction', 'Firewall')    // → 'FirewallDirection'
   */
  static toEnumName(propName: string, resourceName: string): string {
    const pascal = TypeMapper.toPascalCase(propName);

    // Props that map to well-known standalone enum names (no resource prefix)
    const standaloneEnums: Record<string, string> = {
      NetworkZone: 'NetworkZone',
    };
    if (standaloneEnums[pascal]) {
      return standaloneEnums[pascal];
    }

    // Generic prop names get resource prefix
    const genericProps = new Set(['type', 'status', 'mode', 'format']);
    if (genericProps.has(propName)) {
      return `${resourceName}${pascal}`;
    }

    // Descriptive prop names (e.g. "direction", "protocol") use a composite name
    return `${resourceName}${pascal}`;
  }

  /**
   * Derives a PascalCase interface name for an inline nested object.
   *
   * @example
   * TypeMapper.toNestedInterfaceName('rules', 'Firewall')      // → 'FirewallRule'
   * TypeMapper.toNestedInterfaceName('public_net', 'Server')   // → 'ServerPublicNet'
   */
  static toNestedInterfaceName(propName: string, resourceName: string): string {
    const pascal = TypeMapper.toPascalCase(propName);
    // Singularise common plural suffixes
    const singular = pascal.endsWith('s') ? pascal.slice(0, -1) : pascal;
    return `${resourceName}${singular}`;
  }

  // ---------------------------------------------------------------------------
  // Cross-reference detection
  // ---------------------------------------------------------------------------

  /**
   * Returns true if the property name indicates a cross-resource reference.
   *
   * A cross-reference is any property that ends in `_id` or `Id` but is NOT
   * the resource's own `id` field.
   *
   * @example
   * TypeMapper.isCrossRef('network_id')   // → true
   * TypeMapper.isCrossRef('networkId')    // → true
   * TypeMapper.isCrossRef('vswitch_id')   // → true
   * TypeMapper.isCrossRef('id')           // → false
   * TypeMapper.isCrossRef('name')         // → false
   */
  static isCrossRef(propName: string): boolean {
    if (propName === 'id') return false;
    return /(^|[_a-z])id$/i.test(propName) && propName.toLowerCase() !== 'id';
  }

  /**
   * Returns true if the property is an array of resource IDs.
   * e.g. `ssh_keys`, `networks`, `volumes`, `firewalls` on a Server.
   *
   * Used to produce `Array<number | IResolvable>` instead of `number[]`.
   */
  static isIdArrayProp(propName: string): boolean {
    const knownIdArrays = new Set([
      'ssh_keys',
      'networks',
      'volumes',
      'firewalls',
      'servers',
      'load_balancers',
    ]);
    return knownIdArrays.has(propName);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private static mapPrimitive(schema: OpenAPISchema): string {
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'integer':
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      default:
        return 'unknown';
    }
  }

  private static mapItems(
    items: OpenAPISchema,
    context: { propName: string; resourceName: string },
  ): string {
    if (items.enum) {
      return TypeMapper.toEnumName(context.propName, context.resourceName);
    }
    if (items.type === 'object' && items.properties) {
      // Inline array item objects — derive a name from the property
      return TypeMapper.toNestedInterfaceName(
        context.propName,
        context.resourceName,
      );
    }
    if (items.type === 'string') return 'string';
    if (items.type === 'integer' || items.type === 'number') return 'number';
    if (items.type === 'boolean') return 'boolean';
    return 'unknown';
  }
}
