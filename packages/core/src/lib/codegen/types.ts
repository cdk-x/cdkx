/**
 * Central data contract for the cdkx code generation pipeline.
 *
 * A `ResourceSpec` is produced by an `OpenAPIExtractor` implementation and
 * consumed by two independent generators:
 *
 * 1. `ResourceCodeGenerator` — emits TypeScript interfaces + L1 construct classes
 *    that developers use at synthesis time.
 *
 * 2. `ResourceSpecWriter` — serialises the spec to JSON so the runtime engine can
 *    resolve CRUD endpoints, response shapes, and async polling without any
 *    provider-specific hard-coding.
 */

// ---------------------------------------------------------------------------
// OpenAPI raw schema types (minimal — only what the extractors need)
// ---------------------------------------------------------------------------

/** Minimal representation of an OpenAPI 3.x Schema Object. */
export interface OpenAPISchema {
  type?: string;
  format?: string;
  description?: string;
  nullable?: boolean;
  enum?: string[];
  'x-enumDescriptions'?: Record<string, string>;
  properties?: Record<string, OpenAPISchema>;
  additionalProperties?: OpenAPISchema | boolean;
  items?: OpenAPISchema;
  required?: string[];
  title?: string;
  /** Inline $ref — not used by Hetzner but kept for extensibility. */
  $ref?: string;
}

/** Minimal representation of an OpenAPI 3.x Path Item. */
export interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  parameters?: unknown[];
}

/** Minimal representation of an OpenAPI 3.x Operation Object. */
export interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  requestBody?: {
    required?: boolean;
    content: {
      'application/json'?: {
        schema: OpenAPISchema;
      };
    };
  };
  responses: Record<
    string,
    {
      description?: string;
      content?: {
        'application/json'?: {
          schema: OpenAPISchema;
        };
      };
    }
  >;
}

/** Root structure of an OpenAPI 3.x document (only the fields we use). */
export interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, OpenAPIPathItem>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
  };
}

// ---------------------------------------------------------------------------
// ResourceSpec — the central data model
// ---------------------------------------------------------------------------

/**
 * Complete specification for a single provider resource.
 *
 * Produced by an `OpenAPIExtractor` and consumed by both the code generator
 * (to emit L1 TypeScript files) and the spec writer (to emit the engine JSON).
 */
export interface ResourceSpec {
  /** Pascal-case resource name. e.g. "Network", "FloatingIp". */
  resourceName: string;

  /**
   * Logical grouping / directory name for the generated files.
   * e.g. "Networking", "Compute", "Storage", "Security".
   */
  domain: string;

  /**
   * Fully-qualified provider type identifier written into the synthesised
   * manifest and used by the engine to look up this spec at runtime.
   * e.g. "Hetzner::Networking::Network".
   */
  providerType: string;

  /** Properties derived from the CREATE request body → generates the TS interface. */
  createProps: PropertySpec[];

  /**
   * Output attributes available after creation.
   * Each becomes an `IResolvable` getter on the L1 class.
   * At minimum always contains `{resourceName}Id`.
   */
  attributes: AttributeSpec[];

  /**
   * Enums detected in the create props (including nested objects).
   * Each becomes a TypeScript `enum` declaration at the top of the generated file.
   */
  enums: EnumSpec[];

  /**
   * Interfaces for complex inline objects found in create props
   * (e.g. `FirewallRule`, `ServerPublicNet`).
   * Each becomes a TypeScript `interface` declaration above the main interface.
   */
  nestedInterfaces: NestedInterfaceSpec[];

  /** API metadata for the engine — CRUD endpoints, async behaviour, etc. */
  api: ApiSpec;
}

// ---------------------------------------------------------------------------
// PropertySpec
// ---------------------------------------------------------------------------

/**
 * A single property on a resource's create-request schema.
 */
export interface PropertySpec {
  /** camelCase name used in generated TypeScript. e.g. "ipRange". */
  name: string;

  /** Original snake_case name from the OpenAPI spec. e.g. "ip_range". */
  originalName: string;

  /**
   * TypeScript type string for the generated interface.
   * Primitive: "string" | "number" | "boolean".
   * Cross-ref:  "string | number | IResolvable".
   * Enum ref:   the enum name, e.g. "CertificateType".
   * Nested obj: the nested interface name, e.g. "FirewallRule".
   * Array:      "string[]", "FirewallRule[]", "Array<number | IResolvable>".
   * Map:        "Record<string, string>".
   */
  type: string;

  /** Whether this field is required in the create request. */
  required: boolean;

  /** Human-readable description from the OpenAPI spec. */
  description: string;

  /**
   * True when the type is an enum defined in `ResourceSpec.enums`.
   * The `type` field will be set to the enum name.
   */
  isEnum: boolean;

  /** Name of the referenced enum when `isEnum === true`. */
  enumRef?: string;

  /**
   * True when the property is a cross-resource reference
   * (property name ends in `_id` or `Id`, excluding the bare `id` field).
   * Generated type: `string | number | IResolvable`.
   */
  isCrossRef: boolean;

  /**
   * True when the property is a complex inline object with its own properties
   * (not a simple `Record<string, ...>`).
   * The `type` field will be set to `nestedInterfaceName`.
   */
  isNestedObject: boolean;

  /** Name of the generated nested interface when `isNestedObject === true`. */
  nestedInterfaceName?: string;

  /** True when the property is an array. */
  isArray: boolean;

  /**
   * True when the property can be `null` according to the OpenAPI spec
   * (i.e. `nullable: true`).
   */
  isNullable: boolean;
}

// ---------------------------------------------------------------------------
// AttributeSpec
// ---------------------------------------------------------------------------

/**
 * An output attribute exposed as an `IResolvable` getter on the L1 class.
 *
 * At minimum, every resource has a `{resourceName}Id` attribute derived from
 * the `id` field in the GET response.  Additional attributes can be added per
 * resource if the engine needs to reference other output fields.
 */
export interface AttributeSpec {
  /** camelCase attribute name. e.g. "networkId". */
  name: string;

  /** Human-readable description for the generated JSDoc comment. */
  description: string;
}

// ---------------------------------------------------------------------------
// EnumSpec
// ---------------------------------------------------------------------------

/** A TypeScript enum to be generated at the top of the resource file. */
export interface EnumSpec {
  /** PascalCase enum name. e.g. "CertificateType", "FirewallRuleDirection". */
  name: string;

  /** Optional description for the generated JSDoc comment. */
  description?: string;

  /** The enum members. */
  values: EnumValueSpec[];
}

/** A single member of a generated enum. */
export interface EnumValueSpec {
  /** SCREAMING_SNAKE_CASE label. e.g. "UPLOADED". */
  label: string;

  /** The runtime string value. e.g. "uploaded". */
  value: string;

  /** Optional per-member description for the generated JSDoc comment. */
  description?: string;
}

// ---------------------------------------------------------------------------
// NestedInterfaceSpec
// ---------------------------------------------------------------------------

/**
 * A TypeScript interface for a complex inline object property
 * (e.g. a firewall rule, a server's public network config).
 */
export interface NestedInterfaceSpec {
  /** PascalCase interface name. e.g. "FirewallRule". */
  name: string;

  /** Optional description for the generated JSDoc comment. */
  description?: string;

  /** The properties of this nested interface. */
  properties: PropertySpec[];
}

// ---------------------------------------------------------------------------
// ApiSpec — engine metadata
// ---------------------------------------------------------------------------

/**
 * CRUD API metadata for the engine.
 *
 * The engine uses this to make the correct HTTP calls without any
 * provider-specific hard-coding — it simply looks up the `ResourceSpec`
 * by `providerType` and reads these values.
 */
export interface ApiSpec {
  /**
   * Path used to CREATE the resource (POST).
   * e.g. "/networks".
   */
  createPath: string;

  /**
   * Path used to GET, UPDATE, or DELETE a specific resource by ID.
   * e.g. "/networks/{id}".
   */
  idPath: string;

  /** HTTP method for creation. Always "post". */
  createMethod: 'post';

  /**
   * HTTP method for full updates, or `null` if the resource is immutable.
   * Hetzner uses "put" for all updates.
   */
  updateMethod: 'put' | 'patch' | null;

  /** HTTP method for deletion, or `null` if the resource cannot be deleted. */
  deleteMethod: 'delete' | null;

  /** HTTP method for reading a single resource, or `null` if not supported. */
  getMethod: 'get' | null;

  /**
   * The key in the CREATE response body that contains the resource object.
   * e.g. "network" for POST /networks → `{ network: { id: 42, ... } }`.
   */
  responseResourceKey: string;

  /**
   * The field within the resource object that holds its cloud-assigned ID.
   * Almost always "id".
   */
  idField: string;

  /**
   * Whether the CREATE operation is asynchronous.
   * True when the 201 response includes an `action` key, meaning the engine
   * must poll the action endpoint until `action.status === "success"`.
   */
  isAsync: boolean;

  /**
   * Path to poll for async action completion.
   * e.g. "/actions/{id}".
   * Only relevant when `isAsync === true`.
   */
  actionPath: string | null;
}

// ---------------------------------------------------------------------------
// GeneratedFile — output of the code generator
// ---------------------------------------------------------------------------

/**
 * A single TypeScript file produced by `ResourceCodeGenerator`.
 */
export interface GeneratedFile {
  /**
   * Path relative to the provider's `src/lib/` directory.
   * e.g. "networking/ntv-hetzner-network.ts".
   */
  relativePath: string;

  /** Full TypeScript source code, ready to be written to disk. */
  content: string;
}
