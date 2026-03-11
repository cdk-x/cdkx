# @cdkx-io/core — Development Context

This file captures the full design, architecture, and implementation details of
`@cdkx-io/core` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/core` is modified — classes,
> interfaces, file structure, conventions, or design decisions — this file must
> be updated in the same change to stay accurate.

---

## What is cdkx?

**cdkx** is a multi-provider CDK-like framework for generating JSON/YAML
deployment manifests from construct trees. It is provider-agnostic: the same
`App → Stack → ProviderResource` tree can produce a Kubernetes YAML file, a
Hetzner Cloud JSON file, a GitHub Actions workflow, etc. — depending on which
`Provider` is attached to each `Stack`.

`@cdkx-io/core` is the foundation package. All provider packages (e.g.
`@cdkx-io/kubernetes`, `@cdkx-io/hetzner`) extend its abstract classes.

---

## Workspace setup

| Property        | Value                                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Monorepo tool   | Nx 22                                                                                                                         |
| Package manager | Yarn (yarn.lock at root)                                                                                                      |
| Language        | TypeScript 5.9, strict mode, CommonJS (`module: commonjs`, `moduleResolution: node`)                                          |
| Build tool      | `@nx/js:tsc` — emits JS + `.d.ts` + `.d.ts.map`                                                                               |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                                                                                                   |
| Linter          | ESLint with `@typescript-eslint`                                                                                              |
| Formatter       | Prettier ~3.6 (`.prettierrc` at workspace root)                                                                               |
| Node            | CJS — local imports use **no extension** (extensionless)                                                                      |
| Output dir      | `cdkx.out/` (flat) — one JSON per stack + `manifest.json`. Visual test writes to `.cdkx.out/` at workspace root (gitignored). |

Run tasks via Nx:

```
yarn nx lint core
yarn nx test core
yarn nx build core
yarn nx run @cdkx-io/core:format        # format src/ with prettier
yarn nx run @cdkx-io/core:format:check  # check formatting without writing
```

---

## Core architecture

```
App (root construct)
 └── Stack (one per provider / deployment unit)
      └── ProviderResource (one per infrastructure resource)
```

- **App** — root of the construct tree. Owns the resolver pipeline cache (one
  pipeline per provider, built lazily). `app.synth()` traverses all `Stack`
  children and calls their synthesizer.
- **Stack** — a deployment unit targeting a single `Provider`. Produces one
  output file (`<artifactId>.json`). The `provider` is set on Stack, not App.
- **Provider** — abstract base class for target platforms. Contributes custom
  resolvers and a default synthesizer.
- **ProviderResource** — L1 (low-level) construct representing a single resource.
  Holds raw props; `toJson()` runs the resolver pipeline and returns a
  JSON-serializable object.
- **ResolverPipeline** — the resolution engine. Recursively walks the property
  tree, applying resolvers in priority order.

---

## Class inventory

### `App` (`src/lib/app/app.ts`)

Root construct (extends `constructs.Construct`).

| Member                          | Description                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| `static isApp(x)`               | Type guard                                                    |
| `static of(construct)`          | Walk tree upward to find root App; throws if not found        |
| `outdir: string`                | Abs path to output dir (default `'cdkx.out'`)                 |
| `getResolverPipeline(provider)` | Returns cached `ResolverPipeline` for the provider            |
| `synth()`                       | Traverses all stacks and synthesizes; returns `CloudAssembly` |

**Gotcha:** `super(undefined as any, '')` — passing `undefined` as scope is the
standard root-construct pattern for the `constructs` library. The `as any` and
ESLint disable comment are intentional (`// eslint-disable-next-line @typescript-eslint/no-explicit-any`).

Pipeline composition order (per provider):

1. Global resolvers (`AppProps.resolvers`)
2. Provider-specific resolvers (`provider.getResolvers()`)
3. Built-in `LazyResolver`
4. Built-in `ImplicitTokenResolver`

---

### `Stack` (`src/lib/stack/stack.ts`)

Deployment unit (extends `constructs.Construct`, implements `IStackRef`).

| Member                                 | Description                                                                               |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `static isStack(x)`                    | Type guard                                                                                |
| `static of(construct)`                 | Walk tree upward to find nearest Stack; throws if not found                               |
| `provider: Provider`                   | The provider this stack targets                                                           |
| `artifactId: string`                   | Derived from node path (`/` → `-`, strip leading `-`)                                     |
| `stackName: string`                    | Human-readable name; defaults to the construct `id` if not set via `StackProps.stackName` |
| `synthesizer: IStackSynthesizer`       | The synthesizer bound to this stack                                                       |
| `providerIdentifier: string`           | Delegates to `provider.identifier` (for `IStackRef`)                                      |
| `environment: Record<string, unknown>` | Delegates to `provider.getEnvironment()` (for `IStackRef`)                                |
| `displayName: string`                  | Returns `stackName` — used as `displayName` in `manifest.json`                            |
| `getProviderResources()`               | Returns all `ProviderResource` descendants                                                |
| `getOutputs()`                         | Returns all `StackOutput` descendants (used by synthesizer to write `"outputs"` section)  |
| `resolveOutputValue(value)`            | Resolves a value through this stack's pipeline — used by synthesizer for output tokens    |

**`StackProps.provider`** is required. The synthesizer defaults to
`provider.getSynthesizer()` but can be overridden via `StackProps.synthesizer`.

**`StackProps.stackName`** is optional. When set it overrides the human-readable
`displayName` in the manifest. It does **not** affect `artifactId` — the output
file name and manifest key are always derived from the construct node path.

---

### `Provider` (`src/lib/provider/provider.ts`)

Abstract base class. Provider packages extend this.

| Member                                      | Description                                                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `abstract identifier: string`               | Unique ID (e.g. `'kubernetes'`, `'hetzner'`) used in manifests                                                  |
| `getResolvers(): IResolver[]`               | Provider-specific resolvers. Default: `[]`                                                                      |
| `getSynthesizer(): IStackSynthesizer`       | Default synthesizer. Default: `new JsonSynthesizer()`                                                           |
| `getEnvironment(): Record<string, unknown>` | Deployment target metadata written to `manifest.json`. Default: `{}`. Override to expose cluster, project, etc. |

Provider config (credentials, cluster name, datacenter, etc.) is stored in the
provider constructor. Non-sensitive parts (project, cluster name, API server URL)
should be returned by `getEnvironment()` so the runtime engine knows where to deploy.
Credentials must **never** appear in `getEnvironment()` output.

---

### `ProviderResource` (`src/lib/provider-resource/provider-resource.ts`)

L1 construct (extends `constructs.Construct`).

| Member                                      | Description                                                                                                                         |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `static isProviderResource(x)`              | Type guard — checks for `RESOURCE_SYMBOL` on object                                                                                 |
| `resourceOptions: IProviderResourceOptions` | Condition, policies, metadata                                                                                                       |
| `logicalId: string`                         | Stable logical ID derived from node path (human prefix + 8-char SHA-256 hash)                                                       |
| `type: string`                              | Resource type identifier (e.g. `'Deployment'`, `'server'`)                                                                          |
| `protected readonly properties?`            | Raw pre-resolution properties (used by base `renderProperties()` impl)                                                              |
| `getAtt(attr)`                              | Returns `IResolvable` resolving to `{ ref: logicalId, attr }` for cross-resource references                                         |
| `protected renderProperties()`              | **Virtual.** Returns the properties object used during synthesis. Base impl: `this.properties ?? {}`. Generated L1s override this.  |
| `addDependency(resource)`                   | Explicit dependency edge                                                                                                            |
| `applyRemovalPolicy(policy, options?)`      | Maps `RemovalPolicy` → `ProviderDeletionPolicy`                                                                                     |
| `toJson()`                                  | Calls `this.renderProperties()`, resolves + sanitizes; builds `dependsOn`; returns `{ type, properties: {...}, dependsOn?: [...] }` |

**`renderProperties()` virtual method:**

The base implementation returns `this.properties ?? {}`. L1 subclasses generated
by `spec-to-cdkx` **override** this method to build the properties object from
their own public mutable members (following the AWS CDK `CfnResource.cfnProperties`
pattern). This means mutations to public L1 members after construction are correctly
reflected at synthesis time — `toJson()` calls `this.renderProperties()` via virtual
dispatch, so no re-construction is needed.

Custom L1 classes that want mutable props should override `renderProperties()` rather
than passing `properties` to the constructor.

**`toJson()` output shape:**

```json
{
  "MyStackWebServer3A1B2C3D": {
    "type": "hetzner::Server",
    "properties": { "name": "web", "serverType": "cx21" },
    "metadata": { "cdkx:path": "MyStack/WebServer/Resource" },
    "dependsOn": ["MyStackNetworkA1B2C3D4"]
  }
}
```

`dependsOn` is the **deduplicated union** of:

- Explicit dependencies added via `addDependency(resource)` — stored in `this._dependencies`.
- Implicit dependencies inferred by scanning the resolved properties for `{ ref, attr }` tokens
  via the private `collectRefLogicalIds()` helper.

`dependsOn` is **omitted** from the output entry when there are no dependencies (empty → key absent).
This uniform representation means the engine never needs to re-scan tokens to determine creation order —
all dependency information is available directly in `dependsOn`.

**Private helper `collectRefLogicalIds(obj, refs)`:** recursively walks the sanitized properties
tree and adds the `ref` value of every `{ ref, attr }` token object to the `refs` set.

**Gotcha — circular dependency:** `toJson()` uses `require('../app/app.js')` and
`require('../stack/stack.js')` (lazy CJS-style `require()`) instead of ESM
`import` to avoid a circular dependency at module load time. `App` and `Stack`
import from `ProviderResource`, so static ESM imports in the other direction
would create a cycle.

---

### `ResolverPipeline` (`src/lib/resolvables/resolver-pipeline.ts`)

The core resolution engine.

**Resolution algorithm:**

1. Run each resolver in order against the current value (first-wins — stops
   when a resolver calls `context.replaceValue()`).
2. If replaced, recursively re-resolve the new value (supports `Lazy → IResolvable` chains).
3. If no resolver fired, recurse structurally into arrays and plain objects.
4. Return primitives (`string`, `number`, `boolean`, `null`) as-is.

| Member                                            | Description                                                                       |
| ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `static withBuiltins()`                           | Factory: pipeline with only built-in resolvers (no custom)                        |
| `resolve(key, value, providerResource, provider)` | Recursive resolution entry point                                                  |
| `sanitize(obj, options?)`                         | Strip nulls/undefineds; throw on unresolved class instances; optionally sort keys |

`ImplicitTokenResolver` is always appended last and receives a callback to
`this.resolve` to support nested `IResolvable.resolve(ctx)` calls that need to
recursively resolve sub-values.

---

### `LazyResolver` (`src/lib/resolvables/resolvers.ts`)

Handles `Lazy` instances. Calls `lazy.produce()` and replaces the value.

---

### `ImplicitTokenResolver` (`src/lib/resolvables/resolvers.ts`)

Handles any object with a `resolve()` method (duck typing — no base class
required). Builds a `ResolveContext` and calls `value.resolve(ctx)`.

Skips `Lazy` instances (they are handled by `LazyResolver`).

---

### `Lazy` (`src/lib/resolvables/lazy.ts`)

A deferred value resolved at synthesis time.

```ts
const replicas = Lazy.any({ produce: () => this.replicaCount });
```

`Lazy.any()` returns `any` by design — this allows it to be assigned to any
typed property without casting at the call site. The `// eslint-disable-next-line
@typescript-eslint/no-explicit-any` comment is intentional.

---

### `JsonSynthesizer` (`src/lib/synthesizer/synthesizer.ts`)

Default synthesizer. Produces a JSON file with a `resources` key (and optional
`outputs` key) keyed by logical ID.

Output file name: `<stack.artifactId>.json`

**Output shape:**

```json
{
  "resources": {
    "MyStackWebServer3A1B2C3D": {
      "type": "hetzner::Server",
      "properties": { "name": "web", "serverType": "cx21" },
      "metadata": { "cdkx:path": "MyStack/WebServer/Resource" }
    }
  },
  "outputs": {
    "ServerId": {
      "value": "resolved-value-or-token",
      "description": "The server ID"
    }
  }
}
```

The `"outputs"` key is **omitted** when the stack declares no `StackOutput` constructs.
Output values are resolved through the stack's resolver pipeline at synthesis time.

**`IStackRef`** interface (not the concrete `Stack` class) is used as the
synthesizer's stack reference to avoid a circular dependency between
`synthesizer.ts` and `stack.ts`. It exposes:

| Member                      | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| `artifactId`                | Used as the output file name (without extension)                |
| `providerIdentifier`        | Written to the manifest                                         |
| `environment`               | From `Provider.getEnvironment()` — passed to `addArtifact()`    |
| `displayName`               | Human-readable name for the manifest                            |
| `getProviderResources()`    | Returns all `ProviderResource` descendants                      |
| `getOutputs()`              | Returns all `StackOutput` descendants                           |
| `resolveOutputValue(value)` | Resolves an output token through this stack's resolver pipeline |

Custom synthesizers (e.g. `YamlSynthesizer` for Kubernetes) override
`Provider.getSynthesizer()` and can extend `JsonSynthesizer` or implement
`IStackSynthesizer` directly.

---

### `CloudAssembly` / `CloudAssemblyBuilder` (`src/lib/assembly/cloud-assembly.ts`)

`CloudAssemblyBuilder` is the mutable builder. Synthesizers call
`builder.addArtifact(options)` after writing their output file.

`App.synth()` calls `builder.buildAssembly()` at the end, which writes
`manifest.json` and returns the immutable `CloudAssembly`.

**`manifest.json` shape:**

```json
{
  "version": "1.0.0",
  "artifacts": {
    "HetznerStack": {
      "type": "cdkx:stack",
      "provider": "hetzner",
      "environment": { "project": "my-project", "datacenter": "nbg1" },
      "properties": { "templateFile": "HetznerStack.json" },
      "displayName": "HetznerStack",
      "outputKeys": ["ServerId", "NetworkId"]
    },
    "KubernetesStack": {
      "type": "cdkx:stack",
      "provider": "kubernetes",
      "environment": {
        "cluster": "my-cluster",
        "apiServer": "https://k8s.example.com"
      },
      "properties": { "templateFile": "KubernetesStack.json" },
      "displayName": "KubernetesStack"
    }
  }
}
```

- `artifacts` is a **keyed object** (not an array) — key is the stack `artifactId`.
- `environment` comes from `Provider.getEnvironment()` — non-sensitive deployment target metadata.
- `properties.templateFile` is the output file name for the stack template.
- `type: 'cdkx:stack'` is the artifact type discriminator. Future types: `'cdkx:asset-manifest'`, `'cdkx:tree'`.
- `outputKeys` — optional array of output key names declared in this stack. Listed
  in the manifest so the engine can discover cross-stack dependencies without reading
  each stack template file. **Omitted** when the stack declares no outputs.

**`AddArtifactOptions`** — input to `addArtifact()`:

```ts
interface AddArtifactOptions {
  id: string; // artifact key in manifest
  provider: string;
  environment: Record<string, unknown>; // from Provider.getEnvironment()
  templateFile: string; // output file name
  displayName?: string;
  outputKeys?: string[]; // output key names (omit when empty)
}
```

`MANIFEST_VERSION = '1.0.0'` — increment on breaking schema changes.

`CloudAssembly.stacks` is a convenience getter that returns `Object.values(manifest.artifacts)`.
`CloudAssembly.getStack(id)` looks up `manifest.artifacts[id]`.

---

### `Resource` (`src/lib/resource/resource.ts`) — L2 base

Abstract base for higher-level constructs. Extends `Construct`, implements `IResource`.

`applyRemovalPolicy()` delegates to `node.defaultChild` (must be a `ProviderResource`).

**Construct layers:**

- **L1 (Native / `NtvXxx`)** — thin typed wrapper over `ProviderResource`. Equivalent to
  `CfnXxx` in AWS CDK. The `Ntv` prefix signals "native" — the raw provider resource level.
  Always sets `this.node.defaultChild = this.l1`. Exposes cross-reference attributes via
  `ResourceAttribute`. Example: `NtvHetznerServer`, `NtvKubernetesDeployment` (future provider packages).
- **L2** — future layer. Adds higher-level abstractions on top of L1: typed props,
  convenience methods, grants, metrics, events, connections, etc. Not yet implemented.

Provider packages will implement their own `NtvXxx` L1 classes. Test helpers use plain
`ProviderResource` directly — no `NtvXxx` wrappers needed in tests.

---

### `ResourceAttribute` (`src/lib/resource/resource-attribute.ts`)

Implements `IResolvable`. Resolves to `{ ref: logicalId, attr: attributeName }`.
Used by L2 resources to express cross-resource references.

---

### `StackOutput` (`src/lib/stack-output/stack-output.ts`)

A construct that declares a named output for a `Stack`. Extends `Construct`.
The construct `id` becomes the `outputKey`.

```ts
new StackOutput(stack, 'ServerId', {
  value: server.attrServerId, // IResolvable token
  description: 'The Hetzner server ID',
});
```

| Member                                   | Description                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `static isStackOutput(x)`                | Type guard — `instanceof` check (safe: no cross-module concerns here)      |
| `outputKey: string`                      | Equal to the construct `id` — key in the `"outputs"` section of stack JSON |
| `value: IResolvable \| string \| number` | The value to export. Resolved at synthesis time by the synthesizer.        |
| `description?: string`                   | Optional human-readable description written alongside the value            |

**`StackOutputProps`:**

```ts
interface StackOutputProps {
  value: IResolvable | string | number;
  description?: string;
}
```

Stack outputs serve two purposes:

1. Written into the synthesized stack JSON under `"outputs"` so the engine can
   surface them after the stack is deployed.
2. Listed in `manifest.json` as `outputKeys` so the engine can discover
   cross-stack dependencies without reading each stack template.

`Stack.getOutputs()` returns all `StackOutput` descendants. The synthesizer
calls `stack.resolveOutputValue(output.value)` to resolve any tokens before
writing the output entry.

---

### Supporting types

| File                          | Exports                                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constants.ts`                | `RESOURCE_SYMBOL` (used by `isProviderResource`), `PropertyValue` type (includes `IResolvable` — tokens are valid property values pre-resolution) |
| `removal-policy.ts`           | `RemovalPolicy` enum (`DESTROY`, `RETAIN`, `RETAIN_ON_UPDATE_OR_DELETE`), `RemovalPolicyOptions`                                                  |
| `provider-resource-policy.ts` | `ProviderDeletionPolicy` enum, `ProviderCreatePolicy`, `ProviderUpdatePolicy`                                                                     |
| `provider-condition.ts`       | `ProviderResourceCondition` interface                                                                                                             |
| `resolvables.ts`              | `IResolvable`, `ResolveContext`, `ResolutionContext`, `IResolver`, `Resolvables` (static utils)                                                   |

---

## Coding conventions

| Rule                            | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Everything OOP                  | No standalone `export function`. All utilities are static methods on classes.                                                                                                                                                                                                                                                                                                                                                                          |
| No `any`                        | Use `unknown` everywhere. The one exception is `Lazy.any()` return type — intentional escape hatch, gets `eslint-disable` comment.                                                                                                                                                                                                                                                                                                                     |
| CJS imports                     | All local imports use **no file extension** (extensionless). `moduleResolution: node` resolves them correctly at both compile time and runtime.                                                                                                                                                                                                                                                                                                        |
| Unused params in class methods  | ESLint's `argsIgnorePattern: "^_"` does NOT suppress warnings for class method params. Fix: **omit the parameter entirely** from the method signature. TypeScript allows implementing an interface method with fewer params than declared. When a param is dropped, also remove its import if it's no longer used.                                                                                                                                     |
| Prettier                        | Run `yarn nx run @cdkx-io/core:format` after writing or modifying any `.ts` file. Config: `singleQuote`, `trailingComma: all`, `printWidth: 80`, `tabWidth: 2`, `semi: true`.                                                                                                                                                                                                                                                                          |
| Specs co-located                | `foo/foo.spec.ts` lives next to `foo/foo.ts`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| Test helpers                    | `test/helpers/` — not exported from the public barrel (`src/index.ts`).                                                                                                                                                                                                                                                                                                                                                                                |
| Integration tests               | `test/integration/synth.spec.ts`. Suite 8 ("Visual synth output") writes permanent files to `.cdkx.out/` at the workspace root for manual inspection (not cleaned up after the test). Uses `TestProvider` and `TestResources` with generic `test::Resource` L1s to exercise cross-resource references (built directly with `{ ref: source.logicalId, attr }` ), `Lazy` tokens, a custom `IResolver`, and null stripping — all in a two-stack scenario. |
| `_`-prefixed params (non-class) | `argsIgnorePattern: "^_"` works for standalone functions and interface implementations. Prefer omitting when possible.                                                                                                                                                                                                                                                                                                                                 |

---

## Key gotchas and design decisions

### 1. `toJson()` uses `require()` (not `import`)

`ProviderResource` is imported by both `App` and `Stack`. If `provider-resource.ts`
also imported from `app.ts` or `stack.ts` at the top of the file, there would be
a circular ESM module dependency. The fix is to call `require()` lazily inside
`toJson()` at call time:

```ts
const { App } = require('../app/app.js');
const { Stack } = require('../stack/stack.js');
```

### 2. `super(undefined as any, '')` in `App`

The `constructs` library requires a scope for non-root nodes. `App` is the tree
root, so it passes `undefined` as scope. This is the standard pattern for root
constructs. The `as any` cast is necessary and intentional.

### 3. `Lazy.any()` returns `any`

Intentional. It allows `Lazy.any(...)` to be assigned to any typed property
(e.g. `replicas: Lazy.any(...)` where `replicas` is `number`) without an explicit
cast at every call site. Has `eslint-disable-next-line @typescript-eslint/no-explicit-any`.

### 4. `IStackRef` decouples synthesizer from Stack

`JsonSynthesizer` holds a reference to `IStackRef`, not the concrete `Stack`
class, to avoid a circular dependency (`stack.ts` imports `synthesizer.ts`).

### 5. `ImplicitTokenResolver` receives a callback

`ImplicitTokenResolver` needs to recursively resolve sub-values when an
`IResolvable.resolve(ctx)` call returns another token. It receives
`this.resolve` as a constructor callback to avoid circular imports with
`resolver-pipeline.ts`.

### 6. `RESOURCE_SYMBOL` for type detection

`ProviderResource.isProviderResource(x)` checks for a private symbol
(`Symbol.for('@cdkx-io/core.Resource')`) set via `Object.defineProperty`.
This avoids `instanceof` checks which break across module boundaries (dual
package hazard) and makes the check safe even if the class is loaded from a
different copy of the package.

### 7. `constructs` must be in `dependencies`, not `devDependencies`

The `@nx/dependency-checks` ESLint rule enforces this. If `constructs` is
only in `devDependencies`, lint fails.

### 8. Implicit dependency resolution via `{ ref, attr }` tokens

Cross-resource dependencies are **implicit** — they are inferred by the engine
at deploy time by scanning the synthesized JSON for `{ ref, attr }` tokens.

L1 constructs expose attribute getters (e.g. `network.networkId`) that return
an `IResolvable` resolving to `{ ref: logicalId, attr: attrName }`. When a
resource's props contain such a token, the engine knows:

- Which resource is being referenced (`ref` = logical ID of the dependency)
- Which output attribute to read after creating it (`attr`)
- That this resource must be created **before** the one that references it

**Contract:**

- If you use attribute getters (`network.networkId`), the engine guarantees
  correct creation order automatically.
- If you hardcode a concrete ID (e.g. `networkId: 12345`), no dependency is
  recorded and creation order is not guaranteed. This is intentional — the
  framework does not prevent it, but it is the user's responsibility.

This design keeps L1 constructs simple (no `addDependency()` calls needed) and
makes dependency management a concern of the engine, not the constructs layer.
The engine AI.md must document how it scans tokens and builds the
dependency graph.

---

## Codegen subsystem (`src/lib/codegen/`)

`@cdkx-io/core` ships a **provider-agnostic code-generation subsystem** used by
provider packages (e.g. `@cdkx-io/hetzner`) to auto-generate TypeScript L1
constructs and engine JSON from OpenAPI specifications.

### Architecture

```
OpenAPIExtractor (abstract)        ← download, cache, parse spec
 └── HetznerExtractor              ← provider-specific extraction logic

TypeMapper                         ← maps OpenAPI schemas → TS type strings

ResourceCodeGenerator              ← ResourceSpec[] → .ts source files

ResourceSpecWriter                 ← ResourceSpec[] → engine JSON
```

The central data contract is `ResourceSpec` (see `types.ts`), which carries:

- `resourceName`, `domain`, `providerType` — identity
- `createProps: PropertySpec[]` — typed props for the L1 interface
- `attributes: AttributeSpec[]` — cross-reference getters (e.g. `networkId`)
- `enums: EnumSpec[]` — generated enums (e.g. `CertificateType`)
- `nestedInterfaces: NestedInterfaceSpec[]` — inline nested objects (e.g. `FirewallRule`)
- `api: ApiSpec` — engine metadata (CRUD paths, HTTP methods, async detection)

### Class inventory

#### `TypeMapper` (`src/lib/codegen/type-mapper.ts`)

Static utility class. All methods are static.

| Method                                      | Description                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| `mapType(schema, context)`                  | Maps an `OpenAPISchema` to a TypeScript type string                       |
| `isCrossRef(propName)`                      | Returns `true` if prop is a cross-resource ID reference                   |
| `toCamelCase(snake)`                        | `snake_case` → `camelCase`                                                |
| `toEnumName(propName, resourceName)`        | Derives enum name: `direction` + `FirewallRule` → `FirewallRuleDirection` |
| `toNestedInterfaceName(propName, resource)` | Derives interface name: `rules` + `Firewall` → `FirewallRule`             |
| `toScreamingSnake(str)`                     | `label_selector` → `LABEL_SELECTOR`                                       |

**Type mapping rules:**

- Props ending in `_id`/`Id` (not bare `id`) → `string | number | IResolvable`
- Known ID array props (`ssh_keys`, `networks`, `volumes`, `firewalls`) → `Array<number | IResolvable>`
- `additionalProperties: { type: string }` → `Record<string, string>`
- Inline object with `properties` → named nested interface reference
- `nullable: true` → `T | null`
- `enum` → enum type reference (e.g. `CertificateType`)

#### `OpenAPIExtractor` (`src/lib/codegen/open-api-extractor.ts`)

Abstract base class. Provider packages subclass and implement `extractResources()`.

| Member                 | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `loadSpec()`           | Downloads (or loads from SHA-256 cache) the OpenAPI spec   |
| `checkForUpdates()`    | Returns `true` if remote spec has changed since last fetch |
| `extractResources()`   | Abstract — subclass populates `ResourceSpec[]`             |
| `mapType(schema, ctx)` | Delegates to `TypeMapper.mapType()`                        |
| `spec`                 | Protected — parsed `OpenAPISpec` after `loadSpec()`        |

Cache files are written to `<cacheDir>/hetzner.json` (or `<providerKey>.json`).
`cacheDir` absolute-path bug: when the caller passes an absolute path,
`isAbsolute()` is checked before `resolve()` to avoid double-joining.

#### `ResourceCodeGenerator` (`src/lib/codegen/resource-code-generator.ts`)

Generates TypeScript `.ts` source files from `ResourceSpec` objects.

Each generated file contains (in order):

1. Auto-generated header comment
2. Imports: `ProviderResource`, `PropertyValue`, optionally `IResolvable`, plus `Construct` and the resource type const
3. Nested interfaces (flat list — includes deep nesting, all at top level)
4. Enums
5. Resource props interface (`HetznerNetwork`)
6. L1 props interface (`NtvHetznerNetworkProps extends HetznerNetwork {}`)
7. L1 class (`NtvHetznerNetwork extends ProviderResource`)

**Key detail:** the L1 class constructor casts `props` as
`props as unknown as Record<string, PropertyValue>` — this is necessary because
TypeScript cannot prove that nested interface arrays (e.g. `NetworkSubnet[]`)
are assignable to `Record<string, PropertyValue>` without the cast.

**`PropertyValue` is always imported** regardless of whether nested interfaces
are present, because the cast is always emitted.

#### `ResourceSpecWriter` (`src/lib/codegen/resource-spec-writer.ts`)

Serialises `ResourceSpec[]` to engine JSON. Output keyed by `providerType`.

```json
{
  "Hetzner::Networking::Network": {
    "resourceName": "Network",
    "domain": "Networking",
    "providerType": "Hetzner::Networking::Network",
    "api": { "createPath": "/networks", ... }
  }
}
```

Only `api` metadata is written (not `createProps`, `enums`, etc. — those are
compile-time only). Future engine AI.md must document how it reads this file.

### `tsconfig.scripts.json` (provider packages only)

Provider packages that run codegen scripts need a `tsconfig.scripts.json`:

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./out-tsc/scripts", "types": ["node"], ... },
  "ts-node": { "esm": true, "experimentalSpecifierResolution": "node" },
  "include": ["scripts/**/*.ts"]
}
```

The `codegen` Nx target uses `tsx` (not `ts-node-esm`) to run ESM scripts — `tsx`
handles `.js`→`.ts` import remapping correctly. Add `tsx` to workspace root devDependencies.

---

## File map

```
packages/core/
├── package.json                         name: @cdkx-io/core (no "type" field — CommonJS)
├── AI.md                           ← this file
├── src/
│   ├── index.ts                         public barrel — exports everything
│   └── lib/
│       ├── constants.ts                 RESOURCE_SYMBOL, PropertyValue (includes IResolvable)
│       ├── removal-policy.ts            RemovalPolicy enum + RemovalPolicyOptions
│       ├── app/
│       │   ├── app.ts                   App class
│       │   ├── app.spec.ts              unit tests
│       │   └── index.ts                 re-export barrel
│       ├── stack/
│       │   ├── stack.ts                 Stack class
│       │   ├── stack.spec.ts            unit tests
│       │   └── index.ts
│       ├── provider/
│       │   ├── provider.ts              Provider abstract class
│       │   ├── provider.spec.ts         unit tests
│       │   └── index.ts
│       ├── provider-resource/
│       │   ├── provider-resource.ts     ProviderResource class
│       │   ├── provider-resource-policy.ts  ProviderDeletionPolicy, ProviderCreatePolicy, ProviderUpdatePolicy
│       │   ├── provider-condition.ts    ProviderResourceCondition
│       │   ├── provider-resource.spec.ts    unit tests
│       │   └── index.ts
│       ├── resource/
│       │   ├── resource.ts              Resource abstract base (L2 base class)
│       │   ├── resource-attribute.ts    ResourceAttribute IResolvable — cross-resource refs
│       │   ├── resource.spec.ts         unit tests
│       │   └── index.ts
│       ├── resolvables/
│       │   ├── resolvables.ts           IResolvable, ResolveContext, ResolutionContext, IResolver, Resolvables
│       │   ├── lazy.ts                  Lazy, IAnyProducer
│       │   ├── resolvers.ts             LazyResolver, ImplicitTokenResolver
│       │   ├── resolver-pipeline.ts     ResolverPipeline, SanitizeOptions
│       │   ├── lazy.spec.ts
│       │   ├── resolvables.spec.ts
│       │   ├── resolvers.spec.ts
│       │   ├── resolver-pipeline.spec.ts
│       │   └── index.ts
│       ├── assembly/
│       │   ├── cloud-assembly.ts        CloudAssembly, CloudAssemblyBuilder, StackArtifact, CloudAssemblyManifest, AddArtifactOptions
│       │   ├── cloud-assembly.spec.ts
│       │   └── index.ts
│       ├── synthesizer/
│       │   ├── synthesizer.ts           IStackSynthesizer, IStackRef, ISynthesisSession, JsonSynthesizer
│       │   ├── synthesizer.spec.ts
│       │   └── index.ts
│       └── stack-output/
│           ├── stack-output.ts          StackOutput construct, StackOutputProps
│           ├── stack-output.spec.ts     unit tests
│           └── index.ts
└── test/                                outside src/ — not compiled into dist/
    ├── helpers/
    │   ├── index.ts                     barrel (NOT re-exported from src/index.ts)
    │   ├── test-provider.ts             TestProvider, SpyProvider, CustomSynthesizerProvider
    │   ├── make-app.ts                  makeApp(), makeStack()
    │   ├── synth-helpers.ts             SynthHelpers — tmpDir(), readJson(), resourceValues()
    │   └── test-resources.ts            TestResources — resource(), resourceWithNull(), resourceWithLazy(), resourceWithEnvPlaceholder()
    └── integration/
        └── synth.spec.ts                full end-to-end synthesis test (8 suites; suite 8 writes to .cdkx.out/)
```

---

## Release configuration

Releases are managed via `nx release` (configured in `nx.json`).

### Groups

| Group  | Projects                                  | Tag pattern       | Versioning                    |
| ------ | ----------------------------------------- | ----------------- | ----------------------------- |
| `core` | `@cdkx-io/core` (+ `engine` when created) | `core-v{version}` | Fixed (lock-step)             |
| `cli`  | `cli` (`@cdkx-io/cli`)                    | `cli-v{version}`  | Fixed (independent from core) |

### Key decisions

- `projectsRelationship: "independent"` at the top level — groups version independently of each other.
- Within the `core` group: `projectsRelationship: "fixed"` — `core` and `engine` always share the same version.
- `updateDependents: "never"` on both groups — releasing `core` does NOT auto-bump `cli`, because CLI bundles core via esbuild (`bundle: true`) with no runtime dependency.
- `workspaceChangelog: false` — no monorepo-level CHANGELOG. Each group gets its own `CHANGELOG.md` via `projectChangelogs`.
- GitHub Releases are created automatically per group (`createRelease: "github"`).
- Version bumps are driven by conventional commits (`conventionalCommits: true`).
- `adjustSemverBumpsForZeroMajorVersion: true` — while on `0.x`, a `feat:` commit bumps minor (not major), and `fix:` bumps patch.
- `preVersionCommand` builds only the affected group's projects before versioning.

### Running releases

```bash
# Release only the core group (dry run by default in CI)
yarn nx release --groups=core

# Release only the CLI group
yarn nx release --groups=cli

# Release all groups
yarn nx release

# First real release (no git tags exist yet)
yarn nx release --first-release

# Preview without making changes
yarn nx release --dry-run
```

### GitHub Actions workflow

`.github/workflows/release.yml` — triggered via `workflow_dispatch` with:

- `group` input (optional): `core`, `cli`, or empty for all groups
- `dryRun` input (boolean, default `true`): set to `false` to publish

Required secrets:

- `PAT_TOKEN` — GitHub personal access token with `repo` scope (for creating GitHub Releases and pushing tags)
- `NPM_TOKEN` — npm publish token (passed as `NODE_AUTH_TOKEN`)

### Adding `engine` to the `core` group

When the `engine` package is created, add it to `nx.json`:

```jsonc
"core": {
  "projects": ["@cdkx-io/core", "@cdkx-io/engine"],
  ...
}
```

Both packages will then share the same version and be released together.
