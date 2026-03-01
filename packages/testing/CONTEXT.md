# @cdk-x/testing — Development Context

This file captures the full design, architecture, and implementation details of
`@cdk-x/testing` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/testing` is modified —
> classes, interfaces, file structure, conventions, or design decisions — this
> file must be updated in the same change to stay accurate.

---

## What is @cdk-x/testing?

**@cdk-x/testing** is the shared testing-utilities package for the cdkx
monorepo. It provides reusable helpers — app/stack factories, provider stubs,
resource object mothers, and synthesis utilities — that can be consumed by any
provider package test suite without duplicating boilerplate.

It is published as a peer of `@cdk-x/core`, declared as a `peerDependency`
(and `devDependency`) by packages that use it. It ships no production code —
it is a pure test support library.

---

## Workspace setup

| Property        | Value                                                 |
| --------------- | ----------------------------------------------------- |
| Monorepo tool   | Nx 22                                                 |
| Package manager | Yarn (yarn.lock at root)                              |
| Language        | TypeScript 5.9, strict mode, ESM (`"type": "module"`) |
| Build tool      | `@nx/js:tsc` — emits JS + `.d.ts` + `.d.ts.map`       |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                           |
| Linter          | ESLint with `@typescript-eslint`                      |
| Formatter       | Prettier ~3.6 (`.prettierrc` at workspace root)       |
| Node            | ESM — all local imports use `.js` extension           |
| Output dir      | `packages/testing/dist/`                              |

Run tasks via Nx:

```bash
yarn nx lint @cdk-x/testing
yarn nx build @cdk-x/testing
yarn nx run @cdk-x/testing:format        # format src/ with prettier
yarn nx run @cdk-x/testing:format:check  # check formatting without writing
```

---

## Package identity

| Field              | Value                              |
| ------------------ | ---------------------------------- |
| `name`             | `@cdk-x/testing`                   |
| `version`          | `0.1.0`                            |
| `peerDependencies` | `@cdk-x/core: *`, `tslib: >=2.3.0` |
| `devDependencies`  | `@cdk-x/core: *`                   |
| `dependencies`     | (none)                             |

`@cdk-x/core` is a `peerDependency` — consuming packages must bring their own
copy. It is also a `devDependency` so the build and type-checking work within
the monorepo without an extra install step.

---

## Class inventory

### `TestApp` (`src/lib/test-app.ts`)

Extends `App` from `@cdk-x/core`.

| Member             | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `static default()` | Creates a new `App` with a default auto-generated outdir. |

Use `TestApp.default()` in `beforeEach` to get a fresh isolated app per test.

---

### `TestStack` (`src/lib/test-stack.ts`)

Extends `Stack` from `@cdk-x/core`.

| Member                         | Description                                                    |
| ------------------------------ | -------------------------------------------------------------- |
| `static default(scope, props)` | Creates a `Stack` named `'DefaultTestStack'` with given props. |

`StackProps.provider` is required — pass the provider under test (e.g. `new HetznerProvider()`).

---

### `TestProvider` (`src/lib/test-provider.ts`)

Minimal concrete `Provider` for tests. Uses the default `JsonSynthesizer` and
returns no custom resolvers.

| Member               | Description                                     |
| -------------------- | ----------------------------------------------- |
| `identifier: string` | Defaults to `'test'`; override via constructor. |

---

### `SpyProvider` (`src/lib/test-provider.ts`)

Records how many times `getResolvers()` has been called. Used to test that
the resolver pipeline cache works correctly.

| Member               | Description                       |
| -------------------- | --------------------------------- |
| `identifier`         | `'spy'`                           |
| `getResolversCalled` | Counter incremented on each call. |

---

### `CustomSynthesizerProvider` (`src/lib/test-provider.ts`)

Provider that returns a caller-supplied synthesizer via `getSynthesizer()`.
Used to test custom synthesizer behaviour.

---

### `TestResources` (`src/lib/test-resources.ts`)

Object Mother for generic test L1 resources. All methods return a
`ProviderResource` pre-configured for common scenarios.

| Method                         | Description                                                   |
| ------------------------------ | ------------------------------------------------------------- |
| `resource(scope, id?)`         | Basic resource with `name` property. General-purpose.         |
| `resourceWithNull(scope, id?)` | Resource with a `null` property — tests sanitizer null-strip. |
| `resourceWithLazy(scope, id?)` | Resource with a `Lazy` token — tests deferred resolution.     |

---

### `SynthHelpers` (`src/lib/synth-helpers.ts`)

Static utilities for synthesis tests. Usable in any provider package test suite.

| Method                                  | Description                                                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tmpDir()`                              | Creates a unique OS temp dir (`mkdtempSync`). Use in integration tests to avoid parallel test collisions.                                     |
| `readJson(filePath)`                    | Reads and parses a JSON file from disk. Returns `unknown`.                                                                                    |
| `resourceEntry(resource)`               | Unwraps a single `ProviderResource`'s `toJson()` keyed output `{ [logicalId]: {...} }` to `{ type, properties }`. For unit test assertions.   |
| `resourceValues(json)`                  | Extracts all resource entries from a full keyed stack JSON object. For assertions over a whole stack's synthesized output.                    |
| `synthSnapshot(app, stackId, cleanup?)` | Synthesizes the app, reads the stack JSON file by `stackId`, and returns it. Cleans up `outdir` by default. For snapshot testing full stacks. |

**`resourceEntry` vs `resourceValues`:**

- `resourceEntry(resource)` — operates on a single `ProviderResource` instance;
  unwraps its `toJson()` output. Use in unit tests for individual constructs.
- `resourceValues(json)` — operates on a full stack JSON object (already read
  from disk or produced by `synthSnapshot`). Use in integration tests.

---

## Coding conventions

Identical to `@cdk-x/core`. Key points:

| Rule           | Detail                                                                             |
| -------------- | ---------------------------------------------------------------------------------- |
| Everything OOP | No standalone `export function`. All utilities are static methods on classes.      |
| No `any`       | Use `unknown` everywhere.                                                          |
| ESM imports    | All local imports use `.js` extension even though source is `.ts`.                 |
| Prettier       | Run `yarn nx run @cdk-x/testing:format` after writing or modifying any `.ts` file. |

---

## File map

```
packages/testing/
├── package.json                   name: @cdk-x/testing, type: module
├── project.json                   Nx project configuration
├── CONTEXT.md                     ← this file
└── src/
    ├── index.ts                   public barrel — re-exports all of src/lib/
    └── lib/
        ├── index.ts               lib barrel
        ├── synth-helpers.ts       SynthHelpers — tmpDir, readJson, resourceEntry, resourceValues, synthSnapshot
        ├── test-app.ts            TestApp
        ├── test-stack.ts          TestStack
        ├── test-provider.ts       TestProvider, SpyProvider, CustomSynthesizerProvider
        └── test-resources.ts      TestResources — resource, resourceWithNull, resourceWithLazy
```

---

## Release configuration

Part of the `core` release group in `nx.json`. Released in lock-step with
`@cdk-x/core` and `@cdk-x/hetzner`. Tag pattern: `core-v{version}`. See
`packages/core/CONTEXT.md` for full release configuration documentation.
