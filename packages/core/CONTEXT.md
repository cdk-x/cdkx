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

| Property        | Value                                                     |
| --------------- | --------------------------------------------------------- |
| Monorepo tool   | Nx 22                                                     |
| Package manager | Yarn (yarn.lock at root)                                  |
| Language        | TypeScript 5.9, strict mode, ESM (`"type": "module"`)     |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                               |
| Linter          | ESLint with `@typescript-eslint`                          |
| Node            | ESM — all local imports use `.js` extension               |
| Output dir      | `cdkx.out/` (flat) — one JSON per stack + `manifest.json` |

Run tasks via Nx:

```
yarn nx lint core
yarn nx test core
yarn nx build core
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

| Member                           | Description                                                 |
| -------------------------------- | ----------------------------------------------------------- |
| `static isStack(x)`              | Type guard                                                  |
| `static of(construct)`           | Walk tree upward to find nearest Stack; throws if not found |
| `provider: Provider`             | The provider this stack targets                             |
| `artifactId: string`             | Derived from node path (`/` → `-`, strip leading `-`)       |
| `synthesizer: IStackSynthesizer` | The synthesizer bound to this stack                         |
| `providerIdentifier: string`     | Delegates to `provider.identifier` (for `IStackRef`)        |
| `displayName: string`            | The full construct node path                                |
| `getProviderResources()`         | Returns all `ProviderResource` descendants                  |

**`StackProps.provider`** is required. The synthesizer defaults to
`provider.getSynthesizer()` but can be overridden via `StackProps.synthesizer`.

---

### `Provider` (`src/lib/provider/provider.ts`)

Abstract base class. Provider packages extend this.

| Member                                | Description                                                    |
| ------------------------------------- | -------------------------------------------------------------- |
| `abstract identifier: string`         | Unique ID (e.g. `'kubernetes'`, `'hetzner'`) used in manifests |
| `getResolvers(): IResolver[]`         | Provider-specific resolvers. Default: `[]`                     |
| `getSynthesizer(): IStackSynthesizer` | Default synthesizer. Default: `new JsonSynthesizer()`          |

Provider config (credentials, cluster name, etc.) is runtime-only — it is NOT
written to synthesis output. Providers accept config in their constructor.

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

Default synthesizer. Produces a JSON array file:

```json
[
  { "type": "server", "properties": { ... } },
  { "type": "firewall", "properties": { ... } }
]
```

Output file name: `<stack.artifactId>.json`

`IStackRef` interface (not the concrete `Stack` class) is used as the
synthesizer's stack reference to avoid a circular dependency between
`synthesizer.ts` and `stack.ts`.

Custom synthesizers (e.g. `YamlSynthesizer` for Kubernetes) override
`Provider.getSynthesizer()` and can extend `JsonSynthesizer` or implement
`IStackSynthesizer` directly.

---

### `CloudAssembly` / `CloudAssemblyBuilder` (`src/lib/assembly/cloud-assembly.ts`)

`CloudAssemblyBuilder` is the mutable builder. Synthesizers call
`builder.addArtifact(artifact)` after writing their output file.

`App.synth()` calls `builder.buildAssembly()` at the end, which writes
`manifest.json` and returns the immutable `CloudAssembly`.

**`manifest.json` shape:**

```json
{
  "version": "1.0.0",
  "stacks": [
    {
      "id": "MyStack",
      "file": "MyStack.json",
      "provider": "hetzner",
      "displayName": "MyStack"
    }
  ]
}
```

`MANIFEST_VERSION = '1.0.0'` — increment on breaking schema changes.

---

### `Resource` (`src/lib/resource/resource.ts`) — L2 base

Abstract base for higher-level (L2) resource constructs. Extends `Construct`,
implements `IResource`.

`applyRemovalPolicy()` delegates to `node.defaultChild` (must be a
`ProviderResource`). Provider packages extend `Resource` to add typed props
and convenience methods on top of the underlying `ProviderResource`.

---

### `ResourceAttribute` (`src/lib/resource/resource-attribute.ts`)

Implements `IResolvable`. Resolves to `{ ref: logicalId, attr: attributeName }`.
Used by L2 resources to express cross-resource references.

---

### Supporting types

| File                          | Exports                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `constants.ts`                | `RESOURCE_SYMBOL` (used by `isProviderResource`), `PropertyValue` type                           |
| `removal-policy.ts`           | `RemovalPolicy` enum (`DESTROY`, `RETAIN`, `RETAIN_ON_UPDATE_OR_DELETE`), `RemovalPolicyOptions` |
| `provider-resource-policy.ts` | `ProviderDeletionPolicy` enum, `ProviderCreatePolicy`, `ProviderUpdatePolicy`                    |
| `provider-condition.ts`       | `ProviderResourceCondition` interface                                                            |
| `resolvables.ts`              | `IResolvable`, `ResolveContext`, `ResolutionContext`, `IResolver`, `Resolvables` (static utils)  |

---

## Coding conventions

| Rule                            | Detail                                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Everything OOP                  | No standalone `export function`. All utilities are static methods on classes.                                                                                                                                                                                                                                      |
| No `any`                        | Use `unknown` everywhere. The one exception is `Lazy.any()` return type — intentional escape hatch, gets `eslint-disable` comment.                                                                                                                                                                                 |
| ESM imports                     | All local imports use `.js` extension even though source is `.ts`.                                                                                                                                                                                                                                                 |
| Unused params in class methods  | ESLint's `argsIgnorePattern: "^_"` does NOT suppress warnings for class method params. Fix: **omit the parameter entirely** from the method signature. TypeScript allows implementing an interface method with fewer params than declared. When a param is dropped, also remove its import if it's no longer used. |
| Specs co-located                | `foo/foo.spec.ts` lives next to `foo/foo.ts`.                                                                                                                                                                                                                                                                      |
| Test helpers                    | `src/test/helpers/` — not exported from the public barrel (`src/index.ts`).                                                                                                                                                                                                                                        |
| Integration tests               | `src/test/integration/synth.spec.ts`.                                                                                                                                                                                                                                                                              |
| `_`-prefixed params (non-class) | `argsIgnorePattern: "^_"` works for standalone functions and interface implementations. Prefer omitting when possible.                                                                                                                                                                                             |

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

---

## File map

```
packages/core/
├── package.json                         name: @cdk-x/core, type: module
├── CONTEXT.md                           ← this file
└── src/
    ├── index.ts                         public barrel — exports everything
    └── lib/
        ├── constants.ts                 RESOURCE_SYMBOL, PropertyValue
        ├── removal-policy.ts            RemovalPolicy enum + RemovalPolicyOptions
        ├── app/
        │   ├── app.ts                   App class
        │   ├── app.spec.ts              unit tests
        │   └── index.ts                 re-export barrel
        ├── stack/
        │   ├── stack.ts                 Stack class
        │   ├── stack.spec.ts            unit tests
        │   └── index.ts
        ├── provider/
        │   ├── provider.ts              Provider abstract class
        │   ├── provider.spec.ts         unit tests
        │   └── index.ts
        ├── provider-resource/
        │   ├── provider-resource.ts     ProviderResource class
        │   ├── provider-resource-policy.ts  ProviderDeletionPolicy, ProviderCreatePolicy, ProviderUpdatePolicy
        │   ├── provider-condition.ts    ProviderResourceCondition
        │   ├── provider-resource.spec.ts    unit tests
        │   └── index.ts
        ├── resource/
        │   ├── resource.ts              Resource L2 abstract base
        │   ├── resource-attribute.ts    ResourceAttribute IResolvable
        │   ├── resource.spec.ts         unit tests
        │   └── index.ts
        ├── resolvables/
        │   ├── resolvables.ts           IResolvable, ResolveContext, ResolutionContext, IResolver, Resolvables
        │   ├── lazy.ts                  Lazy, IAnyProducer
        │   ├── resolvers.ts             LazyResolver, ImplicitTokenResolver
        │   ├── resolver-pipeline.ts     ResolverPipeline, SanitizeOptions
        │   ├── lazy.spec.ts
        │   ├── resolvables.spec.ts
        │   ├── resolvers.spec.ts
        │   ├── resolver-pipeline.spec.ts
        │   └── index.ts
        ├── assembly/
        │   ├── cloud-assembly.ts        CloudAssembly, CloudAssemblyBuilder, StackArtifact, CloudAssemblyManifest
        │   ├── cloud-assembly.spec.ts
        │   └── index.ts
        └── synthesizer/
            ├── synthesizer.ts           IStackSynthesizer, IStackRef, ISynthesisSession, JsonSynthesizer
            ├── synthesizer.spec.ts
            └── index.ts
    └── test/
        ├── helpers/
        │   ├── index.ts                 barrel (NOT re-exported from src/index.ts)
        │   ├── test-provider.ts         TestProvider, SpyProvider, CustomSynthesizerProvider
        │   └── make-app.ts              makeApp(), makeStack()
        └── integration/
            └── synth.spec.ts            full end-to-end synthesis test (7 suites)
```
