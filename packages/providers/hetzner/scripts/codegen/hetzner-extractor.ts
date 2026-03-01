import {
  OpenAPIExtractor,
  TypeMapper,
  type ApiSpec,
  type AttributeSpec,
  type EnumSpec,
  type EnumValueSpec,
  type NestedInterfaceSpec,
  type OpenAPISchema,
  type PropertySpec,
  type ResourceSpec,
} from '@cdk-x/core';
import {
  HETZNER_DOMAIN_MAP,
  HETZNER_RESOURCE_PATHS,
} from './hetzner-domain-map.js';

/**
 * Extracts `ResourceSpec[]` from the Hetzner Cloud OpenAPI specification.
 *
 * For each resource in {@link HETZNER_RESOURCE_PATHS}:
 * 1. Locates the POST operation on the collection path (e.g. `/networks`).
 * 2. Extracts the request body schema → `createProps`.
 * 3. Detects enums and nested interfaces recursively.
 * 4. Derives the `api` metadata (paths, methods, async detection).
 * 5. Returns the assembled `ResourceSpec`.
 *
 * @example
 * const extractor = new HetznerExtractor();
 * await extractor.loadSpec();
 * const specs = extractor.extractResources();
 */
export class HetznerExtractor extends OpenAPIExtractor {
  private static readonly SPEC_URL =
    'https://docs.hetzner.cloud/cloud.spec.json';

  /**
   * @param cacheDir - Directory for cached spec files.
   *                   Relative paths are resolved from `process.cwd()`.
   *                   Defaults to `'scripts/.cache'`.
   */
  constructor(cacheDir = 'scripts/.cache') {
    super(HetznerExtractor.SPEC_URL, cacheDir, 'hetzner');
  }

  // ---------------------------------------------------------------------------
  // OpenAPIExtractor implementation
  // ---------------------------------------------------------------------------

  extractResources(): ResourceSpec[] {
    if (!this.spec) {
      throw new Error('Spec not loaded — call loadSpec() first.');
    }

    const results: ResourceSpec[] = [];

    for (const [pathSegment, resourceName] of Object.entries(
      HETZNER_RESOURCE_PATHS,
    )) {
      const collectionPath = `/${pathSegment}`;
      const pathItem = this.spec.paths[collectionPath];

      if (!pathItem?.post) {
        continue;
      }

      const domain = HETZNER_DOMAIN_MAP[resourceName];
      if (!domain) continue;

      const spec = this.buildResourceSpec(
        resourceName,
        domain,
        collectionPath,
        pathItem.post,
      );

      results.push(spec);
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Private — ResourceSpec assembly
  // ---------------------------------------------------------------------------

  private buildResourceSpec(
    resourceName: string,
    domain: string,
    collectionPath: string,
    postOp: NonNullable<ReturnType<typeof this.getPostOp>>,
  ): ResourceSpec {
    const schema =
      postOp.requestBody?.content['application/json']?.schema ?? {};

    const requiredFields = new Set(schema.required ?? []);
    const properties = schema.properties ?? {};

    const enums: EnumSpec[] = [];
    const nestedInterfaces: NestedInterfaceSpec[] = [];

    const createProps = this.extractProps(
      properties,
      requiredFields,
      resourceName,
      enums,
      nestedInterfaces,
    );

    const api = this.buildApiSpec(resourceName, collectionPath, postOp, domain);

    const attributes: AttributeSpec[] = [
      {
        name: `${TypeMapper.toCamelCase(resourceName.toLowerCase())}Id`,
        description: `Cloud-assigned ID of this ${resourceName.toLowerCase()} resource.`,
      },
    ];

    return {
      resourceName,
      domain,
      providerType: `Hetzner::${domain}::${resourceName}`,
      createProps,
      attributes,
      enums,
      nestedInterfaces,
      api,
    };
  }

  private getPostOp(
    _path: string,
  ): NonNullable<typeof this.spec>['paths'][string]['post'] {
    return undefined;
  }

  // ---------------------------------------------------------------------------
  // Private — property extraction
  // ---------------------------------------------------------------------------

  private extractProps(
    properties: Record<string, OpenAPISchema>,
    requiredFields: Set<string>,
    resourceName: string,
    enums: EnumSpec[],
    nestedInterfaces: NestedInterfaceSpec[],
  ): PropertySpec[] {
    const props: PropertySpec[] = [];

    for (const [originalName, schema] of Object.entries(properties)) {
      if (originalName === 'id') continue; // skip the resource's own id field

      const name = TypeMapper.toCamelCase(originalName);

      // Detect enums (top-level and array-items)
      const effectiveSchema = this.effectiveItemSchema(schema);
      if (effectiveSchema.enum) {
        const enumName = TypeMapper.toEnumName(originalName, resourceName);
        if (!enums.find((e) => e.name === enumName)) {
          enums.push(
            this.buildEnum(enumName, effectiveSchema, schema.description),
          );
        }
      }

      // Detect nested object (inline object with properties — not additionalProperties)
      if (
        (schema.type === 'object' && schema.properties) ||
        (schema.type === 'array' &&
          schema.items?.type === 'object' &&
          schema.items.properties)
      ) {
        const itemSchema =
          schema.type === 'array' && schema.items ? schema.items : schema;
        const nestedName = TypeMapper.toNestedInterfaceName(
          originalName,
          resourceName,
        );
        if (!nestedInterfaces.find((ni) => ni.name === nestedName)) {
          nestedInterfaces.push(
            this.buildNestedInterface(
              nestedName,
              itemSchema,
              schema.description,
              enums,
              nestedInterfaces,
            ),
          );
        }
      }

      const type = this.mapType(schema, {
        propName: originalName,
        resourceName,
      });

      props.push({
        name,
        originalName,
        type,
        required: requiredFields.has(originalName),
        description: schema.description ?? '',
        isEnum: !!effectiveSchema.enum,
        enumRef: effectiveSchema.enum
          ? TypeMapper.toEnumName(originalName, resourceName)
          : undefined,
        isCrossRef: TypeMapper.isCrossRef(originalName),
        isNestedObject:
          schema.type === 'object' && !!schema.properties
            ? true
            : schema.type === 'array' &&
                schema.items?.type === 'object' &&
                !!schema.items.properties
              ? true
              : false,
        nestedInterfaceName:
          schema.type === 'object' && schema.properties
            ? TypeMapper.toNestedInterfaceName(originalName, resourceName)
            : undefined,
        isArray: schema.type === 'array',
        isNullable: schema.nullable ?? false,
      });
    }

    return props;
  }

  /**
   * Returns the "effective" schema for enum detection:
   * - For arrays, returns `items` so we detect enums inside array items.
   * - Otherwise returns the schema itself.
   */
  private effectiveItemSchema(schema: OpenAPISchema): OpenAPISchema {
    if (schema.type === 'array' && schema.items) {
      return schema.items;
    }
    return schema;
  }

  // ---------------------------------------------------------------------------
  // Private — enum building
  // ---------------------------------------------------------------------------

  private buildEnum(
    name: string,
    schema: OpenAPISchema,
    descriptionOverride?: string,
  ): EnumSpec {
    const enumDescriptions = schema['x-enumDescriptions'] ?? {};
    const values: EnumValueSpec[] = (schema.enum ?? []).map((v) => ({
      label: TypeMapper.toScreamingSnake(v),
      value: v,
      description: enumDescriptions[v],
    }));

    return {
      name,
      description: descriptionOverride ?? schema.description,
      values,
    };
  }

  // ---------------------------------------------------------------------------
  // Private — nested interface building
  // ---------------------------------------------------------------------------

  private buildNestedInterface(
    name: string,
    schema: OpenAPISchema,
    description: string | undefined,
    enums: EnumSpec[],
    nestedInterfaces: NestedInterfaceSpec[],
  ): NestedInterfaceSpec {
    const nestedProps = schema.properties ?? {};
    const requiredFields = new Set(schema.required ?? []);

    const properties = this.extractProps(
      nestedProps,
      requiredFields,
      name, // use the nested interface name as the resourceName for nested enums
      enums,
      nestedInterfaces,
    );

    return { name, description, properties };
  }

  // ---------------------------------------------------------------------------
  // Private — ApiSpec building
  // ---------------------------------------------------------------------------

  private buildApiSpec(
    resourceName: string,
    collectionPath: string,
    postOp: NonNullable<ReturnType<typeof this.getPostOp>>,
    _domain: string,
  ): ApiSpec {
    if (!this.spec) throw new Error('Spec not loaded');

    const idPath = `${collectionPath}/{id}`;
    const pathItem = this.spec.paths[idPath] ?? {};

    // Detect async: POST 201 response contains an "action" key
    // Special case: firewalls uses "actions" (plural)
    const post201Schema =
      postOp.responses['201']?.content?.['application/json']?.schema;
    const post201Keys = Object.keys(post201Schema?.properties ?? {});
    const isAsync =
      post201Keys.includes('action') || post201Keys.includes('actions');

    // responseResourceKey: the key in the POST 201 response containing the resource
    const responseResourceKey = resourceName.toLowerCase();

    return {
      createPath: collectionPath,
      idPath,
      createMethod: 'post',
      updateMethod: pathItem.put ? 'put' : pathItem.patch ? 'patch' : null,
      deleteMethod: pathItem.delete ? 'delete' : null,
      getMethod: pathItem.get ? 'get' : null,
      responseResourceKey,
      idField: 'id',
      isAsync,
      actionPath: isAsync ? '/actions/{id}' : null,
    };
  }
}
