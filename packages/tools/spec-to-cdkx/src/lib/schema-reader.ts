import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// JSON Schema types (draft-07 subset used by cdkx schemas)
// ---------------------------------------------------------------------------

/** A JSON Schema definition (draft-07 subset). */
export interface JsonSchema {
  $schema?: string;
  title?: string;
  description?: string;
  typeName?: string;
  domain?: string;
  type?: string;
  enum?: string[];
  properties?: Record<string, JsonSchemaProperty>;
  definitions?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchemaProperty;
  nullable?: boolean;
  $ref?: string;
  readOnlyProperties?: string[];
  attrProperties?: string[];
  createOnlyProperties?: string[];
  primaryIdentifier?: string[];
}

/** A property entry within a JSON Schema `properties` map. */
export interface JsonSchemaProperty {
  type?: string;
  description?: string;
  enum?: string[];
  $ref?: string;
  nullable?: boolean;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  additionalProperties?: boolean | JsonSchemaProperty;
}

// ---------------------------------------------------------------------------
// Resource descriptor — output of SchemaReader
// ---------------------------------------------------------------------------

/**
 * A fully-loaded, cross-reference-resolved resource schema.
 * One `ResourceSchema` is produced per schema file that has a `typeName`.
 * The `definitions` map includes all definitions from all loaded files,
 * keyed by `<filename>#<definitionName>` for cross-file refs and plain
 * `<definitionName>` for same-file refs.
 */
export interface ResourceSchema {
  /** The resource type name, e.g. `"Hetzner::Networking::Network"`. */
  typeName: string;

  /** The domain group, e.g. `"Networking"`. */
  domain: string;

  /** Short resource name derived from the last segment of `typeName`. */
  resourceName: string;

  /** Human-readable description of the resource. */
  description: string;

  /** All top-level properties (write + read-only) for this resource. */
  properties: Record<string, JsonSchemaProperty>;

  /** Names of properties populated by the API (read-only). */
  readOnlyProperties: string[];

  /**
   * Names of user-settable properties that also expose an `attrXxx` getter.
   * Unlike `readOnlyProperties`, these remain in `writableProps` and appear
   * in `renderProperties()` — they are not API-computed.
   */
  attrProperties: string[];

  /**
   * Names of properties that are required (must be supplied by the caller).
   * Derived from the top-level `required` array in the JSON Schema.
   * When non-empty, the generated L1 constructor omits the `= {}` default.
   */
  required: string[];

  /** Definitions map merged from all schema files for `$ref` resolution. */
  definitions: Record<string, JsonSchema>;

  /**
   * Names of definitions that are explicitly declared in THIS resource's own
   * schema file (i.e. the keys of its `definitions` block).
   * Used by the code generator to avoid emitting definitions that were
   * merged in from other schema files.
   */
  localDefinitionNames: string[];

  /**
   * Names of cross-file shared definitions (e.g. from `common.schema.json`)
   * that are actually referenced by this resource's properties via `$ref`.
   * These are enum or interface definitions that should be emitted once in
   * a shared "Common" section, not inlined as literal types.
   *
   * Only definitions with named types (enums, objects with properties) are
   * tracked here. Structural definitions like `Labels` (with
   * `additionalProperties`) that map cleanly to inline TypeScript types
   * (e.g. `Record<string, string>`) are still inlined as before.
   */
  sharedDefinitionNames: string[];

  /** Source file path (absolute). */
  filePath: string;

  /**
   * Names of properties that can only be set at creation time.
   * Derived from `createOnlyProperties` JSON pointers in the schema.
   */
  createOnlyProperties: string[];

  /**
   * Names of properties that form the primary identifier (physical ID).
   * Derived from `primaryIdentifier` JSON pointers in the schema.
   * - Single element: simple ID (e.g., ["networkId"])
   * - Multiple elements: composite ID (e.g., ["networkId", "ipRange"])
   */
  primaryIdentifier: string[];
}

// ---------------------------------------------------------------------------
// SchemaReader
// ---------------------------------------------------------------------------

/**
 * Reads a directory of JSON Schema files and resolves cross-file `$ref`s.
 *
 * - Loads all `*.schema.json` files in the given directory.
 * - Builds a global definitions map keyed by `<basename>#<defName>`.
 * - Resolves any `$ref` pointing to another file by inlining the definition.
 * - Produces one {@link ResourceSchema} per file that has a `typeName`.
 *
 * `common.schema.json` (and any other definition-only files without
 * `typeName`) contribute to the global definitions map but do not produce
 * a `ResourceSchema`.
 */
export class SchemaReader {
  /**
   * Load all schema files from `schemasDir` and return resolved
   * {@link ResourceSchema} descriptors (one per file with a `typeName`).
   *
   * @param schemasDir - Absolute path to the directory containing `*.schema.json` files.
   */
  public static read(schemasDir: string): ResourceSchema[] {
    const files = fs
      .readdirSync(schemasDir)
      .filter((f) => f.endsWith('.schema.json'))
      .map((f) => path.join(schemasDir, f));

    // Parse all files first so we can build the global definitions map.
    const parsed: Array<{
      file: string;
      basename: string;
      schema: JsonSchema;
    }> = files.map((file) => ({
      file,
      basename: path.basename(file),
      schema: JSON.parse(fs.readFileSync(file, 'utf-8')) as JsonSchema,
    }));

    // Build a global definitions map: "<basename>#<defName>" → JsonSchema
    const globalDefs: Record<string, JsonSchema> = {};
    for (const { basename, schema } of parsed) {
      if (schema.definitions) {
        for (const [name, def] of Object.entries(schema.definitions)) {
          globalDefs[`${basename}#${name}`] = def;
          // Also register under just the definition name for same-file resolution
          // (will be overwritten if same name appears in multiple files — acceptable
          // since all definition names in the Hetzner schemas are unique).
          if (!globalDefs[name]) {
            globalDefs[name] = def;
          }
        }
      }
    }

    // Pre-process whole-file array $refs (e.g. items: { $ref: "./vm.schema.json" }).
    // Transforms them in-place to same-file refs (#/definitions/ResourceName) and
    // injects the referenced schema's writable properties as a definition in globalDefs.
    const injectedPerFile = SchemaReader.injectWholeFileArrayRefDefs(
      parsed,
      globalDefs,
    );

    // Build ResourceSchema for each file that has a typeName.
    const results: ResourceSchema[] = [];
    for (const { file, basename, schema } of parsed) {
      if (!schema.typeName) continue;

      const domain = schema.domain ?? 'Unknown';
      const parts = schema.typeName.split('::');
      const resourceName = parts[parts.length - 1] ?? schema.typeName;

      // Resolve all $refs in the properties map.
      const properties = SchemaReader.resolveProperties(
        schema.properties ?? {},
        basename,
        globalDefs,
      );

      // Collect shared definition names referenced by this schema's properties.
      // These are cross-file refs to named types (enums, objects) that have been
      // converted to same-file refs (e.g. #/definitions/NetworkZone) rather than inlined.
      const sharedDefinitionNames = SchemaReader.collectSharedDefinitionNames(
        schema.properties ?? {},
        basename,
        globalDefs,
      );

      // Build per-resource definitions (same-file + global) for the code generator.
      const localDefs: Record<string, JsonSchema> = {};
      if (schema.definitions) {
        for (const [name, def] of Object.entries(schema.definitions)) {
          localDefs[name] = SchemaReader.resolveSchema(
            def,
            basename,
            globalDefs,
          );
        }
      }
      // Capture the names of definitions that belong to THIS file before merging globals.
      // Also include definitions injected from whole-file array $refs.
      const localDefinitionNames = [
        ...Object.keys(localDefs),
        ...(injectedPerFile.get(basename) ?? []),
      ];
      // Merge global defs that are referenced by this schema's properties.
      for (const [k, v] of Object.entries(globalDefs)) {
        if (!localDefs[k]) {
          localDefs[k] = v;
        }
      }

      results.push({
        typeName: schema.typeName,
        domain,
        resourceName,
        description: schema.description ?? '',
        properties,
        readOnlyProperties: SchemaReader.extractPropNames(
          schema.readOnlyProperties ?? [],
        ),
        attrProperties: SchemaReader.extractPropNames(
          schema.attrProperties ?? [],
        ),
        createOnlyProperties: SchemaReader.extractPropNames(
          schema.createOnlyProperties ?? [],
        ),
        primaryIdentifier: SchemaReader.extractPropNames(
          schema.primaryIdentifier ?? [],
        ),
        required: schema.required ?? [],
        definitions: localDefs,
        localDefinitionNames,
        sharedDefinitionNames,
        filePath: file,
      });
    }

    return results;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Extracts property names from JSON pointer strings like `/properties/networkId`.
   * Returns only the final path segment.
   */
  private static extractPropNames(pointers: string[]): string[] {
    return pointers.map((p) => {
      const parts = p.split('/');
      return parts[parts.length - 1] ?? p;
    });
  }

  /**
   * Pre-processes array properties whose `items.$ref` points to a whole schema
   * file (e.g. `"./vm.schema.json"`, no `#` fragment).
   *
   * For each such ref:
   * 1. Locates the referenced schema in `parsed`.
   * 2. Builds a definition object from its writable properties (i.e. excluding
   *    any listed in `readOnlyProperties`) and injects it into `globalDefs`
   *    under the referenced schema's resource name (last segment of `typeName`).
   * 3. Transforms the `items.$ref` in-place to a same-file ref
   *    (`#/definitions/<ResourceName>`) so the existing resolution pipeline
   *    picks it up correctly.
   *
   * Returns a map from schema basename → list of injected definition names,
   * so callers can include those names in `localDefinitionNames`.
   */
  private static injectWholeFileArrayRefDefs(
    parsed: Array<{ file: string; basename: string; schema: JsonSchema }>,
    globalDefs: Record<string, JsonSchema>,
  ): Map<string, string[]> {
    const injectedPerFile = new Map<string, string[]>();
    const byBasename = new Map(parsed.map((p) => [p.basename, p]));

    for (const { basename, schema } of parsed) {
      if (!schema.properties) continue;
      const injectedForThis: string[] = [];

      for (const prop of Object.values(schema.properties)) {
        if (prop.type !== 'array') continue;
        const items = prop.items;
        if (!items?.$ref) continue;
        const ref = items.$ref;

        // Only handle whole-file refs — skip same-file (#/) and cross-file
        // definition refs (containing #/).
        if (ref.startsWith('#/') || ref.includes('#/')) continue;

        const refBasename = path.basename(ref);
        const refEntry = byBasename.get(refBasename);
        if (!refEntry?.schema.typeName) continue;

        const parts = refEntry.schema.typeName.split('::');
        const resourceName = parts[parts.length - 1];
        if (!resourceName) continue;

        // Inject as a definition only once per resource name.
        if (!globalDefs[resourceName]) {
          const readOnlyNames = SchemaReader.extractPropNames(
            refEntry.schema.readOnlyProperties ?? [],
          );
          const writableProps: Record<string, JsonSchemaProperty> = {};
          for (const [k, v] of Object.entries(
            refEntry.schema.properties ?? {},
          )) {
            if (!readOnlyNames.includes(k)) {
              writableProps[k] = v as JsonSchemaProperty;
            }
          }
          globalDefs[resourceName] = {
            type: 'object',
            description: refEntry.schema.description,
            properties: writableProps,
            required: (refEntry.schema.required ?? []).filter(
              (r) => !readOnlyNames.includes(r),
            ),
          };
        }

        // Transform the items.$ref in-place to a same-file ref.
        items.$ref = `#/definitions/${resourceName}`;

        if (!injectedForThis.includes(resourceName)) {
          injectedForThis.push(resourceName);
        }
      }

      if (injectedForThis.length > 0) {
        injectedPerFile.set(basename, injectedForThis);
      }
    }

    return injectedPerFile;
  }

  /**
   * Resolves all `$ref`s in a properties map.
   * Cross-file refs (`./other.schema.json#/definitions/Foo`) are resolved by
   * looking up the definition in `globalDefs` and inlining it.
   * Same-file refs (`#/definitions/Foo`) are left as-is (the code generator
   * looks up the definition name from the local defs map).
   */
  private static resolveProperties(
    props: Record<string, JsonSchemaProperty>,
    currentFile: string,
    globalDefs: Record<string, JsonSchema>,
  ): Record<string, JsonSchemaProperty> {
    const resolved: Record<string, JsonSchemaProperty> = {};
    for (const [name, prop] of Object.entries(props)) {
      resolved[name] = SchemaReader.resolveProperty(
        prop,
        currentFile,
        globalDefs,
      );
    }
    return resolved;
  }

  /**
   * Resolves a single property, handling cross-file `$ref`.
   *
   * - For cross-file refs to **enum** or **named interface** definitions,
   *   the `$ref` is converted to a same-file ref (`#/definitions/Name`) so
   *   that the code generator emits a named type reference rather than an
   *   inline literal union. The definition is already in `globalDefs` and
   *   will be available in `localDefs` after the global merge.
   *
   * - For cross-file refs to **structural** definitions (e.g. `Labels` with
   *   `additionalProperties`), the body is inlined as before so `TypeMapper`
   *   maps it directly to a TypeScript type (e.g. `Record<string, string>`).
   */
  private static resolveProperty(
    prop: JsonSchemaProperty,
    currentFile: string,
    globalDefs: Record<string, JsonSchema>,
  ): JsonSchemaProperty {
    if (!prop.$ref) return prop;

    const ref = prop.$ref;

    // Same-file ref (#/definitions/Foo) — leave as-is; code generator handles it.
    if (ref.startsWith('#/')) return prop;

    // Cross-file ref (./other.schema.json#/definitions/Foo)
    const defName = SchemaReader.extractDefName(ref);
    if (!defName) return prop;

    const resolved = SchemaReader.resolveCrossFileRef(
      ref,
      currentFile,
      globalDefs,
    );
    if (!resolved) return prop;

    // If the referenced definition is a named type (enum or object with
    // properties), convert the ref to a same-file ref so the code generator
    // emits a named type reference rather than inlining the definition body.
    if (SchemaReader.isNamedType(resolved)) {
      return {
        $ref: `#/definitions/${defName}`,
        description: prop.description ?? resolved.description,
      };
    }

    // Structural definition (e.g. Labels with additionalProperties) — inline as before.
    return {
      ...resolved,
      description: prop.description ?? resolved.description,
    };
  }

  /**
   * Returns `true` if a definition should be emitted as a named TypeScript
   * type (enum or interface), rather than being inlined structurally.
   */
  private static isNamedType(def: JsonSchema): boolean {
    // Enum definitions → named enum
    if (def.enum) return true;
    // Object with explicit properties → named interface
    if (def.type === 'object' && def.properties) return true;
    return false;
  }

  /**
   * Extracts the definition name from a cross-file `$ref` string.
   * e.g. `"./common.schema.json#/definitions/NetworkZone"` → `"NetworkZone"`
   */
  private static extractDefName(ref: string): string | undefined {
    const hashIdx = ref.indexOf('#');
    if (hashIdx === -1) return undefined;
    const defPart = ref.slice(hashIdx + 1);
    const parts = defPart.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }

  /**
   * Collects the names of shared definitions (from other schema files) that
   * are actually referenced by named-type `$ref`s in `props`.
   * These need to be emitted once in a common section by the code generator.
   */
  private static collectSharedDefinitionNames(
    props: Record<string, JsonSchemaProperty>,
    currentFile: string,
    globalDefs: Record<string, JsonSchema>,
  ): string[] {
    const names = new Set<string>();
    for (const prop of Object.values(props)) {
      if (!prop.$ref) continue;
      const ref = prop.$ref;
      if (ref.startsWith('#/')) continue; // same-file ref

      const defName = SchemaReader.extractDefName(ref);
      if (!defName) continue;

      const resolved = SchemaReader.resolveCrossFileRef(
        ref,
        currentFile,
        globalDefs,
      );
      if (resolved && SchemaReader.isNamedType(resolved)) {
        names.add(defName);
      }
    }
    return Array.from(names);
  }

  /**
   * Looks up a cross-file `$ref` like `./other.schema.json#/definitions/Foo`
   * in the global definitions map. Returns the resolved `JsonSchema` or `undefined`.
   */
  private static resolveCrossFileRef(
    ref: string,
    _currentFile: string,
    globalDefs: Record<string, JsonSchema>,
  ): JsonSchema | undefined {
    // Extract the basename and definition name from the ref.
    // e.g. "./common.schema.json#/definitions/Labels"
    //   → basename = "common.schema.json", defName = "Labels"
    const hashIdx = ref.indexOf('#');
    if (hashIdx === -1) return undefined;

    const filePart = ref.slice(0, hashIdx);
    const defPart = ref.slice(hashIdx + 1); // "/definitions/Labels"
    const defParts = defPart.split('/').filter(Boolean);
    const defName = defParts[defParts.length - 1];
    if (!defName) return undefined;

    const basename = path.basename(filePart);
    const key = `${basename}#${defName}`;
    return globalDefs[key] ?? globalDefs[defName];
  }

  /**
   * Resolves all `$ref`s in a `JsonSchema` (used when building localDefs).
   */
  private static resolveSchema(
    schema: JsonSchema,
    currentFile: string,
    globalDefs: Record<string, JsonSchema>,
  ): JsonSchema {
    if (!schema.properties) return schema;
    return {
      ...schema,
      properties: SchemaReader.resolveProperties(
        schema.properties as Record<string, JsonSchemaProperty>,
        currentFile,
        globalDefs,
      ),
    };
  }
}
