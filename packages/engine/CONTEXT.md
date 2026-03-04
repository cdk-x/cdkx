# @cdk-x/engine — Development Context

This file captures the full design, architecture, and implementation details of
`@cdk-x/engine` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/engine` is modified — classes,
> interfaces, file structure, conventions, or design decisions — this file must
> be updated in the same change to stay accurate.

---

## What is @cdk-x/engine?

**@cdk-x/engine** is the deployment runtime for cdkx. It reads the cloud assembly
produced by `app.synth()` — the `manifest.json` and per-stack JSON template files —
and drives the actual infrastructure deployment against the target provider.

The engine is a library consumed by `@cdk-x/cli` (e.g. the `cdkx deploy` command
imports and calls it programmatically). It runs as async Node.js code in the same
process as the CLI.

---

## Workspace setup

| Property        | Value                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| Monorepo tool   | Nx 22                                                                                |
| Package manager | Yarn (yarn.lock at root)                                                             |
| Language        | TypeScript 5.9, strict mode, CommonJS (`module: commonjs`, `moduleResolution: node`) |
| Build tool      | `@nx/js:tsc` — emits JS + `.d.ts` + `.d.ts.map`                                      |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                                                          |
| Linter          | ESLint with `@typescript-eslint`                                                     |
| Formatter       | Prettier ~3.6 (`.prettierrc` at workspace root)                                      |
| Output dir      | `packages/engine/dist/`                                                              |

Run tasks via Nx:

```bash
yarn nx lint @cdk-x/engine
yarn nx test @cdk-x/engine
yarn nx build @cdk-x/engine
yarn nx run @cdk-x/engine:format        # format src/ with prettier
yarn nx run @cdk-x/engine:format:check  # check formatting without writing
```

---

## Responsibilities

1. **Read the cloud assembly** — parse `manifest.json` to discover stacks, their
   provider identifiers, environment metadata, and template file names.
2. **Parse stack templates** — read each `<artifactId>.json` file to enumerate the
   resources and their resolved properties.
3. **Resolve `{ ref, attr }` tokens** — scan properties for cross-resource reference
   tokens. Build a dependency graph (DAG) so resources are created in the correct
   order.
4. **Drive deployment as a state machine** — for each resource in topological order:
   create, update, or delete it by calling the provider's HTTP API. Track state
   transitions (pending → creating → created / failed).
5. **Provider dispatch** — select the correct provider adapter based on
   `manifest.artifacts[id].provider` (e.g. `'hetzner'`, `'kubernetes'`).

---

## Architecture

```
CloudAssemblyReader          reads manifest.json + stack JSON files
 └── DeploymentPlanner       builds resource DAG from { ref, attr } tokens
      └── DeploymentEngine   state machine — drives the deployment loop
           └── ProviderAdapter (abstract)
                └── HetznerAdapter   (future: @cdk-x/hetzner contributes this)
                └── KubernetesAdapter (future)
```

### State machine

Each resource moves through these states:

```
PENDING → CREATING → CREATED
                   ↘ FAILED
PENDING → UPDATING → UPDATED
                   ↘ FAILED
PENDING → DELETING → DELETED
                   ↘ FAILED
```

The engine processes resources in DAG topological order — a resource only starts
when all its dependencies are in `CREATED` state. Failed resources block their
dependents.

### `{ ref, attr }` token scanning

When the engine encounters a property value of shape `{ ref: string, attr: string }`:

- `ref` — the `logicalId` of the dependency resource (key in the stack JSON)
- `attr` — the output attribute to read after the dependency is created (e.g.
  `'networkId'`, `'serverId'`)

The engine substitutes the token with the actual value returned by the provider
API after the dependency resource is created.

---

## Relationship with @cdk-x/core

`@cdk-x/engine` is a **consumer** of the cloud assembly format defined by
`@cdk-x/core`:

- `manifest.json` shape → defined by `CloudAssemblyManifest` in `@cdk-x/core`
- Stack template shape → defined by `JsonSynthesizer` output in `@cdk-x/core`
- `{ ref, attr }` token contract → defined by `ResourceAttribute` in `@cdk-x/core`

The engine does **not** depend on `@cdk-x/core` at runtime — it only needs to
understand the JSON file formats, not the TypeScript construct classes. This keeps
the engine lightweight and provider-agnostic.

---

## Release configuration

Part of the `core` release group in `nx.json` — lock-stepped with `@cdk-x/core`,
`@cdk-x/testing`, and `@cdk-x/hetzner`. Tag pattern: `core-v{version}`.

---

## Coding conventions

See `packages/core/CONTEXT.md` for the authoritative coding conventions. This
package follows them identically:

- Everything OOP — no standalone `export function`
- No `any` — use `unknown`
- CJS imports — extensionless local imports
- Specs co-located — `foo/foo.spec.ts` next to `foo/foo.ts`
- Prettier — run `yarn nx run @cdk-x/engine:format` after any `.ts` change

---

## File map

```
packages/engine/
├── package.json          name: @cdk-x/engine (no "type" field — CommonJS)
├── project.json          Nx project configuration (build, format, format:check)
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── eslint.config.mjs
├── jest.config.cts
├── CONTEXT.md            ← this file
└── src/
    ├── index.ts          public barrel — exports everything
    └── lib/              all source code; specs co-located
```
