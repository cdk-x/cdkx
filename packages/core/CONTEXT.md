# @cdk-x/core — Development Context

This file captures the full design, architecture, and implementation details of
`@cdk-x/core` for future AI-assisted sessions. It is auto-loaded by OpenCode.

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

`@cdk-x/core` is the foundation package. All provider packages (e.g.
`@cdkx/kubernetes`, `@cdkx/hetzner`) extend its abstract classes.

---

## Workspace setup

| Property        | Value                                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Monorepo tool   | Nx 22                                                                                                                         |
| Package manager | Yarn (yarn.lock at root)                                                                                                      |
| Language        | TypeScript 5.9, strict mode, ESM (`"type": "module"`)                                                                         |
| Build tool      | `@nx/js:tsc` — emits JS + `.d.ts` + `.d.ts.map`                                                                               |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                                                                                                   |
| Linter          | ESLint with `@typescript-eslint`                                                                                              |
| Formatter       | Prettier ~3.6 (`.prettierrc` at workspace root)                                                                               |
| Node            | ESM — all local imports use `.js` extension                                                                                   |
| Output dir      | `cdkx.out/` (flat) — one JSON per stack + `manifest.json`. Visual test writes to `.cdkx.out/` at workspace root (gitignored). |

Run tasks via Nx:

```
yarn nx lint core
yarn nx test core
yarn nx build core
yarn nx run @cdk-x/core:format        # format src/ with prettier
yarn nx run @cdk-x/core:format:check  # check formatting without writing
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

| Member                                       | Description                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| `static isProviderResource(x)`               | Type guard — checks for `RESOURCE_SYMBOL` on object                    |
| `resourceOptions: IProviderResourceOptions`  | Condition, policies, metadata                                          |
| `type: string`                               | Resource type identifier (e.g. `'Deployment'`, `'server'`)             |
| `properties?: Record<string, PropertyValue>` | Raw pre-resolution properties                                          |
| `addDependency(resource)`                    | Explicit dependency edge                                               |
| `applyRemovalPolicy(policy, options?)`       | Maps `RemovalPolicy` → `ProviderDeletionPolicy`                        |
| `toJson()`                                   | Resolves + sanitizes properties; returns `{ type, properties: {...} }` |

**`toJson()` output shape:**

```json
{
  "type": "Deployment",
  "properties": { "replicas": 3, "name": "web" }
}
```

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

Default synthesizer. Produces a JSON file keyed by logical ID (one key per resource).

Output file name: `<stack.artifactId>.json`

`IStackRef` interface (not the concrete `Stack` class) is used as the
synthesizer's stack reference to avoid a circular dependency between
`synthesizer.ts` and `stack.ts`. `IStackRef` exposes `environment` (from
`provider.getEnvironment()`) which the synthesizer passes to `addArtifact()`.

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
      "displayName": "HetznerStack"
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

**`AddArtifactOptions`** — input to `addArtifact()`:

```ts
interface AddArtifactOptions {
  id: string; // artifact key in manifest
  provider: string;
  environment: Record<string, unknown>; // from Provider.getEnvironment()
  templateFile: string; // output file name
  displayName?: string;
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
| ESM imports                     | All local imports use `.js` extension even though source is `.ts`.                                                                                                                                                                                                                                                                                                                                                                                     |
| Unused params in class methods  | ESLint's `argsIgnorePattern: "^_"` does NOT suppress warnings for class method params. Fix: **omit the parameter entirely** from the method signature. TypeScript allows implementing an interface method with fewer params than declared. When a param is dropped, also remove its import if it's no longer used.                                                                                                                                     |
| Prettier                        | Run `yarn nx run @cdk-x/core:format` after writing or modifying any `.ts` file. Config: `singleQuote`, `trailingComma: all`, `printWidth: 80`, `tabWidth: 2`, `semi: true`.                                                                                                                                                                                                                                                                            |
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
(`Symbol.for('@cdk-x/core.Resource')`) set via `Object.defineProperty`.
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
The engine CONTEXT.md must document how it scans tokens and builds the
dependency graph.

---

## File map

```
packages/core/
├── package.json                         name: @cdk-x/core, type: module
├── CONTEXT.md                           ← this file
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
│       │   ├── cloud-assembly.ts        CloudAssembly, CloudAssemblyBuilder, StackArtifact, CloudAssemblyManifest
│       │   ├── cloud-assembly.spec.ts
│       │   └── index.ts
│       └── synthesizer/
│           ├── synthesizer.ts           IStackSynthesizer, IStackRef, ISynthesisSession, JsonSynthesizer
│           ├── synthesizer.spec.ts
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

| Group  | Projects                                | Tag pattern       | Versioning                    |
| ------ | --------------------------------------- | ----------------- | ----------------------------- |
| `core` | `@cdk-x/core` (+ `engine` when created) | `core-v{version}` | Fixed (lock-step)             |
| `cli`  | `cli` (`@cdk-x/cli`)                    | `cli-v{version}`  | Fixed (independent from core) |

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
  "projects": ["@cdk-x/core", "@cdk-x/engine"],
  ...
}
```

Both packages will then share the same version and be released together.
