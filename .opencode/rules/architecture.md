# cdkx — Architecture

Cross-cutting architecture reference for the cdkx monorepo. Loaded in every
OpenCode session.

> **Maintenance rule:** update this file whenever core architectural decisions
> change — new packages, new layers, new patterns, or changes to the synthesis
> or deployment pipeline.

---

## What is cdkx?

**cdkx** is a multi-provider CDK-like framework for generating JSON/YAML
deployment manifests from construct trees. It is provider-agnostic: the same
`App → Stack → ProviderResource` tree can produce a Kubernetes YAML file, a
Hetzner Cloud JSON file, a GitHub Actions workflow, etc. — depending on which
`Provider` is attached to each `Stack`.

The workflow has two phases:

1. **Synthesis** (`cdkx synth`) — the user's TypeScript app runs, builds a
   construct tree, and calls `app.synth()`. This produces a **cloud assembly**:
   a `manifest.json` + one JSON template file per stack.

2. **Deployment** (`cdkx deploy`) — the engine reads the cloud assembly, resolves
   cross-resource tokens, builds a dependency graph, and calls the provider's
   HTTP API to create/update/delete resources in the correct order.

---

## Package map

| Package                 | Location                              | Role                                                            |
| ----------------------- | ------------------------------------- | --------------------------------------------------------------- |
| `@cdkx-io/core`         | `packages/core/`                      | Construct primitives, synthesis pipeline, cloud assembly format |
| `@cdkx-io/engine`       | `packages/engine/`                    | Deployment runtime — reads manifests, resolves tokens, deploys  |
| `@cdkx-io/testing`      | `packages/testing/`                   | Shared test helpers (app/stack factories, synth utilities)      |
| `@cdkx-io/cli`          | `packages/cli/`                       | CLI binary (`cdkx synth`, `cdkx deploy`) — imports engine       |
| `@cdkx-io/hetzner`      | `packages/providers/hetzner/hetzner/` | Hetzner Cloud provider + generated L1 constructs                |
| `@cdkx-io/spec-to-cdkx` | `packages/tools/spec-to-cdkx/`        | Code generator: JSON Schema → TypeScript L1 constructs          |

---

## Design principles

### Everything is OOP

No standalone `export function`. Every utility, helper, or service is a
**class** with static or instance methods. This mirrors the AWS CDK design and
keeps the API surface consistent and predictable.

### Strict TypeScript, no `any`

All packages use TypeScript strict mode. `any` is forbidden everywhere except
one intentional escape hatch: `Lazy.any()` returns `any` by design (allows
assignment to any typed property without casting at the call site).

### CommonJS throughout

No package sets `"type": "module"`. All emit CJS. Local imports are
**extensionless** — `moduleResolution: node` resolves them correctly at compile
and runtime.

### Circular dependency pattern

When module A imports from module B, and B also needs A, use a **lazy
`require()` inside the function body** instead of a top-level `import`:

```ts
// provider-resource.ts — avoids circular import with app.ts and stack.ts
toJson() {
  const { App } = require('../app/app.js');
  const { Stack } = require('../stack/stack.js');
  // ...
}
```

This is the established pattern in `ProviderResource.toJson()` and must be
followed whenever a similar circular dependency arises.

---

## Construct tree

The construct tree is built using the [`constructs`](https://github.com/aws/constructs)
library — the same base used by AWS CDK and CDK for Terraform.

```
App (root — scope: undefined)
 └── Stack (one per provider / deployment unit)
      └── ProviderResource (one per infrastructure resource)
```

### App

- Root of the tree. Created with `new App({ outdir })`.
- Owns the **resolver pipeline cache** — one `ResolverPipeline` per provider,
  built lazily on first access.
- `app.synth()` traverses all `Stack` children, calls their synthesizer, and
  returns an immutable `CloudAssembly`.
- `App.of(construct)` — static helper to walk up the tree to the root App.

### Stack

- A deployment unit targeting a single `Provider`.
- `provider` prop is **required** — set once at construction, never changed.
- Produces one output file: `<artifactId>.json`.
- `artifactId` is derived from the node path (`/` → `-`, strip leading `-`).
- `Stack.of(construct)` — static helper to find the nearest enclosing Stack.

### ProviderResource

- L1 (low-level) construct. Holds raw provider-specific props.
- `logicalId` — stable identifier derived from node path (human prefix +
  8-char SHA-256 hash). Used as the key in the stack JSON.
- `toJson()` — runs the resolver pipeline and returns the serialized resource.
- `getAtt(attr)` — returns an `IResolvable` resolving to `{ ref, attr }` for
  cross-resource references.
- `renderProperties()` — virtual method. Base returns `this.properties ?? {}`.
  Generated L1 subclasses override this to expose public mutable members.

### Construct layers

| Layer       | Naming   | Description                                                                        |
| ----------- | -------- | ---------------------------------------------------------------------------------- |
| L1 (Native) | `NtvXxx` | Thin typed wrapper over `ProviderResource`. Auto-generated by `spec-to-cdkx`.      |
| L2          | `Xxx`    | Higher-level abstractions (typed props, convenience methods). Not yet implemented. |

Provider packages implement their own `NtvXxx` L1 classes. The `Ntv` prefix
signals "native" — the raw provider resource level.

---

## Synthesis pipeline

```
app.synth()
  ├── for each Stack:
  │     ├── stack.synthesizer.synthesize(session)
  │     │     ├── for each ProviderResource:
  │     │     │     └── resource.toJson()
  │     │     │           └── ResolverPipeline.resolve(key, value, resource, provider)
  │     │     │                 ├── LazyResolver          — resolves Lazy tokens
  │     │     │                 ├── ImplicitTokenResolver  — resolves IResolvable (duck typing)
  │     │     │                 └── custom resolvers       — provider-supplied
  │     │     └── write <artifactId>.json
  │     └── builder.addArtifact(...)
  └── builder.buildAssembly() → writes manifest.json → returns CloudAssembly
```

### ResolverPipeline

The resolution engine. Applied recursively to the full property tree of every
resource.

**Resolution algorithm:**

1. Run each resolver in priority order — first resolver to call
   `context.replaceValue()` wins.
2. If replaced, recursively re-resolve the new value (supports
   `Lazy → IResolvable` chains).
3. If no resolver fired, recurse structurally into arrays and plain objects.
4. Return primitives (`string`, `number`, `boolean`, `null`) as-is.

**Pipeline composition order (per provider):**

1. Global resolvers (`AppProps.resolvers`)
2. Provider-specific resolvers (`provider.getResolvers()`)
3. Built-in `LazyResolver`
4. Built-in `ImplicitTokenResolver`

### Resolvables

| Class / Interface       | Description                                                                       |
| ----------------------- | --------------------------------------------------------------------------------- |
| `IResolvable`           | Interface with `resolve(ctx: ResolveContext): unknown`                            |
| `Lazy`                  | Deferred value. `Lazy.any({ produce: () => value })` — resolved at synthesis time |
| `ResourceAttribute`     | Resolves to `{ ref: logicalId, attr: attrName }` — used for cross-resource refs   |
| `LazyResolver`          | Handles `Lazy` instances — calls `lazy.produce()`                                 |
| `ImplicitTokenResolver` | Handles any object with a `resolve()` method (duck typing)                        |

`Lazy.any()` returns `any` by design — allows assigning `Lazy.any(...)` to any
typed property without casting. Has `eslint-disable` comment.

### Sanitization

After resolution, `ResolverPipeline.sanitize()` strips `null` and `undefined`
values and throws on any remaining unresolved class instances.

---

## Cross-resource references (`{ ref, attr }` tokens)

L1 constructs expose attribute getters that return an `IResolvable`:

```ts
// HtzNetwork exposes:
get attrNetworkId(): IResolvable {
  return this.getAtt('networkId');
}
```

When used as a prop on another resource:

```ts
new HtzSubnet(stack, 'Subnet', {
  networkId: network.attrNetworkId, // IResolvable → { ref: 'NetworkXXXX', attr: 'networkId' }
});
```

The synthesized JSON contains:

```json
{
  "SubnetAAAA": {
    "type": "Hetzner::Networking::Subnet",
    "properties": {
      "networkId": { "ref": "NetworkXXXX", "attr": "networkId" }
    }
  }
}
```

**Contract:**

- The engine scans all properties for `{ ref, attr }` tokens to build the
  dependency graph.
- `ref` = `logicalId` of the dependency; `attr` = output attribute to read
  after the dependency is created.
- If you hardcode a concrete ID, no dependency is recorded — the engine will
  not guarantee creation order.

---

## Cloud assembly format

Output of `app.synth()`. Written to `outdir` (default: `cdkx.out/`).

### `manifest.json`

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
    }
  }
}
```

- `artifacts` is a keyed object (key = stack `artifactId`).
- `environment` — non-sensitive deployment target metadata from
  `Provider.getEnvironment()`.
- `templateFile` — the stack's output JSON file name.

### Stack template (`<artifactId>.json`)

```json
{
  "NetworkXXXX": {
    "type": "Hetzner::Networking::Network",
    "properties": { "name": "my-net", "ipRange": "10.0.0.0/8" },
    "metadata": { "cdkx:path": "HetznerStack/Network/Resource" }
  },
  "SubnetAAAA": {
    "type": "Hetzner::Networking::Subnet",
    "properties": {
      "networkId": { "ref": "NetworkXXXX", "attr": "networkId" },
      "ipRange": "10.0.1.0/24"
    },
    "metadata": { "cdkx:path": "HetznerStack/Subnet/Resource" }
  }
}
```

---

## Provider model

```ts
abstract class Provider {
  abstract identifier: string; // e.g. 'hetzner', 'kubernetes'
  getResolvers(): IResolver[]; // provider-specific resolvers (default: [])
  getSynthesizer(): IStackSynthesizer; // default: JsonSynthesizer
  getEnvironment(): Record<string, unknown>; // non-sensitive deploy target metadata
}
```

Provider packages (e.g. `@cdkx-io/hetzner`) extend `Provider` and optionally:

- Supply custom resolvers via `getResolvers()`
- Supply a custom synthesizer via `getSynthesizer()` (e.g. `YamlSynthesizer`)
- Expose deployment environment via `getEnvironment()` (cluster name, project
  ID, API server URL — never credentials)

---

## Engine model (`@cdkx-io/engine`)

The engine is the deployment runtime. It reads the cloud assembly produced by
`app.synth()` and drives the actual infrastructure deployment.

```
CloudAssemblyReader       reads manifest.json + stack JSON files
 └── DeploymentPlanner    builds resource DAG from { ref, attr } tokens
      └── DeploymentEngine  state machine — drives the deployment loop
           └── ProviderAdapter (abstract)
                └── HetznerAdapter   (future: @cdkx-io/hetzner contributes this)
```

### Deployment state machine

Each resource moves through these states:

```
PENDING → CREATING → CREATED
                   ↘ FAILED
PENDING → UPDATING → UPDATED
                   ↘ FAILED
PENDING → DELETING → DELETED
                   ↘ FAILED
```

Resources are processed in **topological order** — a resource only starts when
all its dependencies are in `CREATED` state. Failed resources block their
dependents.

The engine is **imported by `@cdkx-io/cli`** and invoked programmatically (e.g.
by `cdkx deploy`). It runs as async Node.js code in the same process as the
CLI.

---

## Release groups

Managed via `nx release` in `nx.json`. Groups version independently of each
other.

| Group   | Packages                                                                   | Tag pattern        | Notes             |
| ------- | -------------------------------------------------------------------------- | ------------------ | ----------------- |
| `core`  | `@cdkx-io/core`, `@cdkx-io/engine`, `@cdkx-io/testing`, `@cdkx-io/hetzner` | `core-v{version}`  | Lock-step (fixed) |
| `cli`   | `@cdkx-io/cli`                                                             | `cli-v{version}`   | Independent       |
| `tools` | `@cdkx-io/spec-to-cdkx`                                                    | `tools-v{version}` | Independent       |

- `updateDependents: "never"` — releasing `core` does not auto-bump `cli`
  (CLI bundles core via esbuild, no runtime dep).
- `adjustSemverBumpsForZeroMajorVersion: true` — on `0.x`, `feat` bumps
  minor, `fix` bumps patch.
- `conventionalCommits: true` — version bumps are driven by commit types.
