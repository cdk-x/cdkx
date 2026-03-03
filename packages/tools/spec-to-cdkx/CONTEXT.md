# @cdk-x/spec-to-cdkx — Development Context

This file captures the full design, architecture, and implementation details of
`@cdk-x/spec-to-cdkx` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/tools/spec-to-cdkx` is modified —
> commands, interfaces, file structure, conventions, or design decisions — this file
> must be updated in the same change to stay accurate.

---

## What is spec-to-cdkx?

**spec-to-cdkx** is a CLI code-generation tool. It reads JSON Schema files describing
provider resources and generates a single TypeScript file containing L1 constructs
(nested interfaces, enums, props interfaces, and L1 classes extending `ProviderResource`).

Provider packages (e.g. `@cdk-x/hetzner`) use it via an Nx `codegen` target to
auto-generate their `src/lib/resources.generated.ts`.

---

## Workspace setup

| Property        | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| Monorepo tool   | Nx 22                                                         |
| Package manager | Yarn (yarn.lock at root)                                      |
| Language        | TypeScript 5.9, strict mode                                   |
| Module format   | **CommonJS** — `"type"` is NOT set in `package.json`          |
| Build tool      | esbuild via `@nx/esbuild` — `bundle: true`, `format: ["cjs"]` |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                                   |
| Linter          | ESLint with `@typescript-eslint`                              |
| Formatter       | Prettier ~3.6 (`.prettierrc` at workspace root)               |
| Output dir      | `packages/tools/spec-to-cdkx/dist/` — `main.js` single bundle |

Run tasks via Nx:

```bash
yarn nx build spec-to-cdkx
yarn nx test spec-to-cdkx
yarn nx lint spec-to-cdkx
yarn nx run @cdk-x/spec-to-cdkx:format        # format src/ with prettier
yarn nx run @cdk-x/spec-to-cdkx:format:check  # check formatting without writing
```

---

## Entry point and binary

| File                  | Role                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `bin/spec-to-cdkx.js` | npm bin shim: `#!/usr/bin/env node` + `require('../dist/main.js')` |
| `src/main.ts`         | CLI entry point. Prints banner, registers subcommands.             |
| `src/index.ts`        | Public barrel — re-exports `src/lib/` and `src/commands/`          |

`main.ts` is intentionally thin: banner + `program.addCommand()` calls only.

---

## CLI interface

```
spec-to-cdkx generate [options]

Required:
  --prefix <prefix>               L1 class prefix, e.g. "Htz" → HtzNetwork
  --provider-name <name>          Human name for JSDoc, e.g. "Hetzner"
  --resource-type-const <name>    Name of the generated const, e.g. "HetznerResourceType"

Optional:
  -s, --schemas <dir>             Path to schemas dir (default: "schemas/v1")
  -o, --output <file>             Output file (default: "src/lib/resources.generated.ts")
  -h, --help                      Display help
```

All paths are resolved relative to `process.cwd()`. Provider packages call this
from their project root via the Nx `codegen` target.

---

## Architecture

### CJS + esbuild bundle

Like `@cdk-x/cli`, this tool is **CommonJS** and esbuild inlines all dependencies
(`chalk`, `commander`) into a single `dist/main.js`. Local imports do not require
`.js` extension (TypeScript resolves them), but `.js` is acceptable for consistency.

The `package.json` version is read at runtime via:

```ts
const { version } = require('../package.json') as { version: string };
```

### BaseCommand

All commands extend `BaseCommand` (`src/lib/base-command.ts`) — same pattern as
`@cdk-x/cli`. See that CONTEXT.md for the full convention (private constructor,
`static create(deps?)` factory, `run()` + `fail()` error handling).

---

## Pipeline: JSON Schema → TypeScript

```
SchemaReader.read(schemasDir)     ← load + resolve all *.schema.json files
       ↓  ResourceSchema[]
CodeGenerator.generate(resources, opts)   ← emit TypeScript source string
       ↓  string
fs.writeFileSync(outputFile, source)      ← write resources.generated.ts
```

---

## Class inventory

### `SchemaReader` (`src/lib/schema-reader.ts`)

Static class. `SchemaReader.read(schemasDir)` loads all `*.schema.json` files in
the directory and returns one `ResourceSchema` per file that has a `typeName`.

**Algorithm:**

1. Parse all files.
2. Build a global definitions map keyed `<basename>#<defName>` (+ plain `<defName>`
   for same-file use).
3. For each file with a `typeName`:
   - Resolve cross-file `$ref`s in `properties`:
     - **Named types** (enums, objects with `properties`) are converted to same-file
       refs (`#/definitions/Name`) so the code generator emits a named type reference.
       Their name is recorded in `sharedDefinitionNames`.
     - **Structural types** (e.g. `Labels` with `additionalProperties`) are still
       inlined so `TypeMapper` maps them directly (e.g. `Record<string, string>`).
   - Same-file `$ref`s (`#/definitions/Foo`) are left as-is for the code generator.
   - Build `localDefs` from the schema's own `definitions` block, recording
     `localDefinitionNames = Object.keys(localDefs)` **before** merging globals.
   - Merge global defs into `localDefs` for `$ref` resolution by the code generator.

**`ResourceSchema` interface:**

| Field                   | Description                                                                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typeName`              | e.g. `"Hetzner::Networking::Network"`                                                                                                                       |
| `domain`                | e.g. `"Networking"`                                                                                                                                         |
| `resourceName`          | Last segment of `typeName`, e.g. `"Network"`                                                                                                                |
| `description`           | Schema-level description                                                                                                                                    |
| `properties`            | Top-level properties (cross-file named-type refs kept as same-file `$ref`; structural refs inlined; same-file refs left as-is)                              |
| `readOnlyProperties`    | Plain prop names (extracted from JSON pointer strings like `/properties/networkId`)                                                                         |
| `required`              | Required prop names from the top-level `required` array. When non-empty, the generated L1 constructor omits the `= {}` default and props are non-optional.  |
| `definitions`           | Merged defs map (own + global). Used by code generator for `$ref` resolution and type names                                                                 |
| `localDefinitionNames`  | Keys of the schema's **own** `definitions` block (before global merge). Used by `CodeGenerator.isDefinedInFile` to avoid emitting defs from other files.    |
| `sharedDefinitionNames` | Names of cross-file **named type** definitions (enums, interfaces) actually referenced by this resource's properties. Used to emit a single Common section. |
| `filePath`              | Absolute path to the schema file                                                                                                                            |

**Key design decision — `localDefinitionNames`:**
`SchemaReader` merges ALL global definitions into every resource's `definitions` map
so that `$ref` resolution works. Without `localDefinitionNames`, the code generator
cannot distinguish between "this resource defined this type" vs "this type was merged
in from another file". Recording the keys before the merge solves the duplicate-emit
problem cleanly.

---

### `CodeGenerator` (`src/lib/code-generator.ts`)

Static class. `CodeGenerator.generate(resources, opts)` returns the full TypeScript
source string.

**Generated file structure (in order):**

1. Auto-generated header comment
2. Imports: `ProviderResource`, `IResolvable`, `PropertyValue` from `@cdk-x/core`
   - `Construct` from `constructs`
3. `{resourceTypeConst}` constant — all type strings grouped by domain
4. **Common section** (emitted once, only if any shared definitions exist):
   - Named enums and interfaces from cross-file refs (e.g. `NetworkZone`, `Location`)
5. For each resource (grouped by domain, with a section comment):
   - Nested interfaces with JSDoc
   - Enums with JSDoc
   - Props interface `{ProviderName}{Resource}` with JSDoc
   - L1 class `{Prefix}{Resource}` extending `ProviderResource`

**`isDefinedInFile(defName, resource)`:**
Returns `resource.localDefinitionNames.includes(defName)`. Prevents definitions from
other schema files (merged into `localDefs` for `$ref` resolution) from being emitted
as duplicate TypeScript declarations.

**`collectSharedDefs(resources)`:**
Collects the union of all `sharedDefinitionNames` across all resources, deduplicating
by name. Returns a `Map<name, JsonSchema>` (first-seen wins). Definitions in this map
are emitted once in the Common section and skipped in per-resource emission.

**`RESERVED_PROP_RENAME` map:**

A module-level constant in `code-generator.ts` that maps original schema prop
names to safe class member names when the prop name would clash with a
`ProviderResource` base class member:

```ts
const RESERVED_PROP_RENAME: Record<string, string> = {
  type: 'resourceType',
  properties: 'resourceProperties',
  resourceOptions: 'resourceOptionsValue',
  logicalId: 'resourceLogicalId',
};
```

- The **class member** uses the safe name (e.g. `resourceType`).
- The **props interface** keeps the original name (e.g. `type`).
- `renderProperties()` always emits the original key (e.g. `type: this.resourceType`).

**L1 class shape (AWS CDK–style with mutable members):**

```ts
export class HtzCertificate extends ProviderResource {
  public static readonly RESOURCE_TYPE_NAME = 'Hetzner::Security::Certificate';

  // one per readOnlyProperty:
  public readonly attrCertificateId: IResolvable;

  // public mutable member per writable prop:
  public name: string; // required (no ?)
  public labels?: Record<string, string>;
  public resourceType?: CertificateType; // renamed — 'type' clashes with base class

  constructor(scope: Construct, id: string, props: HetznerCertificate) {
    // No `= {}` default when required props exist
    super(scope, id, { type: HtzCertificate.RESOURCE_TYPE_NAME });
    this.node.defaultChild = this;
    this.attrCertificateId = this.getAtt('certificateId');
    // Assign props → members:
    this.name = props.name;
    this.labels = props.labels;
    this.resourceType = props.type;
  }

  protected override renderProperties(): Record<string, PropertyValue> {
    return {
      name: this.name,
      labels: this.labels,
      type: this.resourceType, // always original key
    } as unknown as Record<string, PropertyValue>;
  }
}
```

Key points:

- `super` is called with **only `{ type: ... }`** — no `properties`. Properties are
  supplied via `renderProperties()` override, not via the constructor.
- When `required.length > 0`, the constructor omits the `= {}` default on `props`.
- `renderProperties()` is called by `ProviderResource.toJson()` via virtual dispatch —
  mutations to public members after construction are automatically reflected at synthesis.
- The `as unknown as Record<string, PropertyValue>` cast is necessary because TypeScript
  cannot prove nested interface arrays (e.g. `NetworkSubnet[]`) are assignable to
  `Record<string, PropertyValue>`.

---

### `TypeMapper` (`src/lib/type-mapper.ts`)

Static utility class. Maps JSON Schema property definitions to TypeScript type strings.

**Type mapping rules:**

| Input                                                     | Output                              |
| --------------------------------------------------------- | ----------------------------------- |
| `{ type: "string" }`                                      | `string`                            |
| `{ type: "integer" }` (non-cross-ref)                     | `number`                            |
| `{ type: "integer" }` + `isCrossRefId(propName) = true`   | `number \| IResolvable`             |
| `{ type: "boolean" }`                                     | `boolean`                           |
| `{ type: "array", items: { type: "string" } }`            | `string[]`                          |
| `{ type: "array", items: { $ref: "#/definitions/Foo" } }` | `Foo[]`                             |
| `{ additionalProperties: { type: "string" } }`            | `Record<string, string>`            |
| `{ $ref: "#/definitions/FooEnum" }`                       | `FooEnum` (same-file ref)           |
| `{ enum: [...] }` (inline)                                | `'a' \| 'b' \| 'c'` (literal union) |
| `{ type: "object", properties: {...} }`                   | Named nested interface              |
| `nullable: true`                                          | `T \| null`                         |

**Key methods:**

| Method                                      | Description                                                       |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `mapType(prop, ctx, propName, localDefs?)`  | Main entry point                                                  |
| `isCrossRefId(propName)`                    | Returns `true` for names ending in `Id`/`_id` (but NOT bare `id`) |
| `toCamelCase(str)`                          | `snake_case`/`kebab-case` → `camelCase`                           |
| `toPascalCase(str)`                         | `camelCase`/`PascalCase` → `PascalCase`                           |
| `toEnumName(propName, resourceName)`        | e.g. `"direction"` + `"FirewallRule"` → `"FirewallRuleDirection"` |
| `toNestedInterfaceName(propName, resource)` | e.g. `"rules"` + `"Firewall"` → `"FirewallRule"`                  |
| `toAttrMemberName(attrName)`                | e.g. `"networkId"` → `"NetworkId"` (used as `attrNetworkId`)      |

**`isCrossRefId` rule:** only integer properties whose camelCase name ends in `Id`
or `_id` (e.g. `networkId`, `serverId`, `network_id`) get typed as
`number | IResolvable`. The bare `id` property is explicitly excluded and stays
as plain `number`. Simple integers like `port`, `interval`, `retries` also stay
as plain `number`.

---

## JSON Schema conventions

Each provider schema file should follow these conventions:

| Field                  | Description                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `$schema`              | `"http://json-schema.org/draft-07/schema#"`                                                                                 |
| `typeName`             | `"{Provider}::{Domain}::{Resource}"` — used as `RESOURCE_TYPE_NAME` in the L1 class                                         |
| `domain`               | Domain group name (e.g. `"Networking"`) — used to group resources in the generated file                                     |
| `required`             | Array of required top-level prop names. Generates non-optional props interface members and omits `= {}` default on L1 ctor. |
| `readOnlyProperties`   | JSON pointers like `"/properties/networkId"` — generate `attr*` members on the L1 class                                     |
| `createOnlyProperties` | Informational only — not used by the code generator                                                                         |
| `primaryIdentifier`    | Informational only — not used by the code generator                                                                         |
| `definitions`          | Local type definitions (enums, nested interfaces). Cross-file refs use `"$ref": "./<file>.schema.json#/definitions/<Name>"` |

**`common.schema.json`:** A file without `typeName` contributes its `definitions`
to all other schemas (for `$ref` resolution) but does not produce any L1 output.

**Cross-file `$ref` resolution:** `SchemaReader` handles cross-file refs based on
the kind of definition they point to:

- **Named types** (enums, objects with `properties`) are converted to a same-file
  ref (`#/definitions/Name`). The name is recorded in `sharedDefinitionNames`.
  `CodeGenerator` emits these once in a Common section before all domain sections.
  `TypeMapper` maps the same-file ref to a named type (e.g. `NetworkZone`).
- **Structural types** (e.g. `Labels` with `additionalProperties`) are inlined
  into the property directly, so `TypeMapper` maps them to `Record<string, string>`
  etc. — no named type is emitted.

**Same-file `$ref`:** Left as `{ $ref: "#/definitions/Foo" }`. `TypeMapper.mapRef`
strips it to `"Foo"` as the type name. The code generator emits the `Foo` enum or
interface from the resource's own `definitions`.

**Dangling cross-file refs (antipattern):** If a schema references
`"$ref": "./other.schema.json#/definitions/Missing"` and that definition does not
exist in `other.schema.json`, `resolveCrossFileRef` returns `undefined`, the
property keeps its `$ref` string, and `TypeMapper.mapRef` emits just the definition
name as a type — which will be an undefined identifier at compile time. Always ensure
cross-file refs point to existing definitions, or move the definition into the
referring schema.

---

## Test structure

```
test/
└── fixtures/
    └── schemas/
        ├── common.schema.json   shared definitions (Labels, NetworkZone)
        ├── network.schema.json  Test::Networking::Network
        └── server.schema.json   Test::Compute::Server
```

**Unit tests (co-located with source):**

| File                                             | Tests                          |
| ------------------------------------------------ | ------------------------------ |
| `src/lib/schema-reader.spec.ts`                  | ~18 tests for `SchemaReader`   |
| `src/lib/code-generator.spec.ts`                 | ~37 tests for `CodeGenerator`  |
| `src/lib/type-mapper.spec.ts`                    | ~18 tests for `TypeMapper`     |
| `src/commands/generate/generate.command.spec.ts` | ~8 tests for `GenerateCommand` |

Total: **80 tests**, 4 suites.

**`FIXTURES_DIR`** in spec files:

```ts
const FIXTURES_DIR = path.join(__dirname, '../../test/fixtures/schemas');
```

(Spec files live in `src/lib/` and `src/commands/generate/`; fixtures are at `test/fixtures/schemas/`.)

---

## Coding conventions

| Rule                       | Detail                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| Module format              | CJS — esbuild handles bundling. Local imports: `.js` extension acceptable.                      |
| No `any`                   | Use `unknown`. Exception: `require('../package.json') as { version: string }` cast is fine.     |
| Prettier                   | Run `yarn nx run @cdk-x/spec-to-cdkx:format` after modifying any `.ts` file.                    |
| Specs co-located           | `foo/foo.spec.ts` lives next to `foo/foo.ts`.                                                   |
| OOP — all logic in classes | No standalone `export function`. Commands extend `BaseCommand`. Utilities are static classes.   |
| Error handling             | Always use `this.run()` + `this.fail()`. Never call `process.exit()` directly in command logic. |
| Dependency injection       | Node built-ins and collaborators are injected via `deps` — no `jest.mock` in tests.             |

---

## Key gotchas

### 1. `localDefinitionNames` prevents duplicate type emission

`SchemaReader` merges ALL global definitions (from all schema files) into each
resource's `definitions` map. Without `localDefinitionNames`, the code generator
would emit every merged-in definition for every resource, causing `TS2300: Duplicate
identifier` errors.

Fix: `localDefinitionNames` is populated from `Object.keys(localDefs)` **before**
the global merge. `CodeGenerator.isDefinedInFile` checks this list.

### 2. Cross-file refs: named types become same-file refs; structural types are inlined

`SchemaReader.resolveProperty` handles cross-file refs (starting with `./`)
differently depending on the referenced definition:

- **Named types** (enums, objects with `properties`) are converted to a same-file
  ref (`#/definitions/Name`) instead of inlining. The definition name is added to
  `sharedDefinitionNames`. `CodeGenerator` collects all shared defs across all
  resources, emits them once in a Common section, and skips them in per-resource
  emission.
- **Structural types** (e.g. `Labels` with `additionalProperties`) are still inlined
  directly into the property so `TypeMapper` maps them to `Record<string, string>`
  etc.

Same-file refs (`#/definitions/Foo`) always pass through unchanged. `TypeMapper`
maps `#/definitions/Foo` → `"Foo"` as a named type reference.

### 3. Cross-file refs to non-existent definitions are silently kept

If `resolveCrossFileRef` cannot find the definition, the original `$ref` string is
kept on the property. `TypeMapper.mapRef` will extract the definition name and emit
it as a type reference — which will be an undefined identifier. **Always verify
cross-file refs point to existing definitions.**

### 4. `passWithNoTests: true` in `jest.config.cts`

`@cdk-x/hetzner` has no tests yet. The hetzner `jest.config.cts` sets
`passWithNoTests: true` so the Nx `test` target doesn't fail.

### 5. chalk v5 requires `transformIgnorePatterns` in Jest

chalk v5 is ESM-only. The `jest.config.cts` adds:

```js
transformIgnorePatterns: ['node_modules/(?!(chalk|#ansi-styles|ansi-styles)/)'],
```

### 6. `RESERVED_PROP_RENAME` — base class member name clashes

`ProviderResource` declares `public readonly type`, `protected readonly properties`,
`public readonly resourceOptions`, and `public readonly logicalId`. If a schema
has a prop named `type` (e.g. `CertificateType`, `FloatingIpType`), the generated
class member would shadow the base class.

Fix: `RESERVED_PROP_RENAME` maps original prop names to safe member names. The
**props interface** always keeps the original name. `renderProperties()` always
emits the original key so the synthesized JSON is correct.

### 7. `renderProperties()` override replaces constructor `properties` arg

Generated L1 classes call `super(scope, id, { type: ... })` — without `properties`.
Instead they override `protected renderProperties()` to return an object built from
their own mutable members. `ProviderResource.toJson()` calls `this.renderProperties()`
via virtual dispatch, so mutations to public members after construction are reflected
at synthesis time (same pattern as AWS CDK `CfnResource.cfnProperties`).

### 8. `required` field — non-optional members and no `= {}` default

When a schema declares `required: ["name", "ipRange"]`:

- The **props interface** emits required members without `?` (e.g. `name: string`).
- The **L1 class** public members for those props are also non-optional.
- The **constructor** signature uses `props: HetznerNetwork` (no `= {}` default).

When `required` is absent or empty, all props are optional and the constructor
defaults to `props: HetznerNetwork = {}`.

---

## File map

```
packages/tools/spec-to-cdkx/
├── bin/
│   └── spec-to-cdkx.js                    npm bin shim
├── package.json                            name: @cdk-x/spec-to-cdkx (CJS)
├── project.json                            Nx project configuration
├── eslint.config.mjs
├── jest.config.cts
├── tsconfig.json
├── tsconfig.lib.json                       esbuild build config
├── tsconfig.spec.json                      jest config (references: [])
├── CONTEXT.md                              ← this file
├── src/
│   ├── index.ts                            public barrel
│   ├── main.ts                             CLI entry point (banner + addCommand)
│   ├── lib/
│   │   ├── base-command.ts                 abstract BaseCommand (run, fail)
│   │   ├── base-command.spec.ts
│   │   ├── schema-reader.ts                SchemaReader + JsonSchema + ResourceSchema types
│   │   ├── schema-reader.spec.ts           12 tests
│   │   ├── type-mapper.ts                  TypeMapper static class
│   │   ├── type-mapper.spec.ts             ~18 tests
│   │   ├── code-generator.ts               CodeGenerator static class
│   │   ├── code-generator.spec.ts          ~20 tests
│   │   └── index.ts                        lib barrel
│   └── commands/
│       └── generate/
│           ├── generate.command.ts         GenerateCommand extends BaseCommand
│           ├── generate.command.spec.ts    ~8 tests
│           └── index.ts                    re-export barrel
└── test/
    └── fixtures/
        └── schemas/
            ├── common.schema.json          shared defs (Labels, NetworkZone)
            ├── network.schema.json         Test::Networking::Network
            └── server.schema.json          Test::Compute::Server
```
