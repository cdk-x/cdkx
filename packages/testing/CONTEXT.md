# @cdkx-io/testing — Development Context

This file captures the full design, architecture, and implementation details of
`@cdkx-io/testing` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/testing` is modified —
> classes, interfaces, file structure, conventions, or design decisions — this
> file must be updated in the same change to stay accurate.

---

## What is @cdkx-io/testing?

**@cdkx-io/testing** is the shared testing-utilities package for the cdkx
monorepo. It provides reusable helpers — app/stack factories, provider stubs,
resource object mothers, and synthesis utilities — that can be consumed by any
provider package test suite without duplicating boilerplate.

It is published as a peer of `@cdkx-io/core`, declared as a `peerDependency`
(and `devDependency`) by packages that use it. It ships no production code —
it is a pure test support library.

Consumer packages declare it as:

```json
{
  "peerDependencies": { "@cdkx-io/testing": "*" },
  "devDependencies": { "@cdkx-io/testing": "*" }
}
```

---

## Typical usage patterns

### Unit test (ephemeral output, cleaned up after)

Use `SynthHelpers.synthSnapshot()` — it synthesizes, reads the stack JSON, and
removes the output directory automatically.

```ts
import { TestApp, TestStack, TestProvider, SynthHelpers } from '@cdkx-io/testing';
import { ProviderResource } from '@cdkx-io/core';

describe('MyResource', () => {
  it('synthesizes correctly', () => {
    const app = TestApp.default();
    const stack = TestStack.default(app, { provider: new TestProvider() });

    new ProviderResource(stack, 'MyResource', {
      type: 'test::Resource',
      properties: { name: 'hello' },
    });

    const json = SynthHelpers.synthSnapshot(app, 'DefaultTestStack');
    const resources = SynthHelpers.resourceValues(json);

    expect(resources[0].type).toBe('test::Resource');
    expect(resources[0].properties).toMatchObject({ name: 'hello' });
  });
});
```

### Integration test (permanent output for visual inspection)

Write to a fixed path and pass `cleanup = false` to `synthSnapshot`, or call
`app.synth()` directly and read the files with `SynthHelpers.readJson()`. This
is the pattern used by `@cdkx-io/hetzner`'s network topology test.

```ts
import * as path from 'node:path';
import { App, Stack } from '@cdkx-io/core';
import { HetznerProvider } from '@cdkx-io/hetzner';
import { SynthHelpers } from '@cdkx-io/testing';

const OUTDIR = path.resolve(__dirname, '../../cdkx.out');

describe('network topology', () => {
  let stackJson: unknown;

  beforeAll(() => {
    const app = new App({ outdir: OUTDIR });
    const stack = new Stack(app, 'HetznerNetworkStack', {
      provider: new HetznerProvider(),
    });

    // ... add resources to stack ...

    app.synth(); // writes OUTDIR — not cleaned up
    stackJson = SynthHelpers.readJson(
      path.join(OUTDIR, 'HetznerNetworkStack.json'),
    );
  });

  it('has correct resource count', () => {
    const resources = SynthHelpers.resourceValues(stackJson);
    expect(resources).toHaveLength(6);
  });
});
```

### Unit test for a single resource (without a full stack synthesis)

Use `SynthHelpers.resourceEntry()` to assert on a single `ProviderResource`
directly, bypassing the file system entirely.

```ts
import {
  TestApp,
  TestStack,
  TestProvider,
  TestResources,
  SynthHelpers,
} from '@cdkx-io/testing';

const app = TestApp.default();
const stack = TestStack.default(app, { provider: new TestProvider() });
const resource = TestResources.resource(stack, 'MyRes');

const entry = SynthHelpers.resourceEntry(resource);
expect(entry.type).toBe('test::Resource');
expect(entry.properties).toMatchObject({ name: 'MyRes' });
```

### App with custom global resolvers

Extend `TestApp` when the test needs custom resolvers registered at the `App`
level (e.g. to test a provider's custom resolver logic):

```ts
import { TestApp } from '@cdkx-io/testing';
import { App } from '@cdkx-io/core';

class AppWithCustomResolver extends TestApp {
  constructor() {
    super(undefined, { resolvers: [myCustomResolver] });
  }
}

const app = new AppWithCustomResolver();
```

---

## When to use which helper

| Scenario                                                  | Use                                                   |
| --------------------------------------------------------- | ----------------------------------------------------- |
| Unit test — single resource, no file I/O                  | `TestApp.default()` + `SynthHelpers.resourceEntry()`  |
| Unit test — full stack synthesis, ephemeral               | `TestApp.default()` + `SynthHelpers.synthSnapshot()`  |
| Integration test — permanent output for visual inspection | `new App({ outdir: FIXEDPATH })` + `app.synth()`      |
| Testing a real provider (e.g. `HetznerProvider`)          | Pass `new HetznerProvider()` to `TestStack.default()` |
| Testing resolver pipeline cache or `getResolvers()` calls | `SpyProvider`                                         |
| Testing a custom synthesizer                              | `CustomSynthesizerProvider`                           |
| Testing provider-agnostic synthesis behaviour             | `TestProvider` (identifier `'test'`)                  |
| Testing `null` / `undefined` stripping by the sanitizer   | `TestResources.resourceWithNull()`                    |
| Testing `Lazy` token resolution                           | `TestResources.resourceWithLazy()`                    |

---

## Class inventory

### `TestApp` (`src/lib/test-app.ts`)

Extends `App` from `@cdkx-io/core`.

| Member             | Description                                                            |
| ------------------ | ---------------------------------------------------------------------- |
| `static default()` | Creates a new `App` with no explicit `outdir` (uses the default path). |

`App` (from `@cdkx-io/core`) defaults `outdir` to `'cdkx.out'` relative to
`process.cwd()`. In tests this is fine — `SynthHelpers.synthSnapshot()` cleans
it up, and `SynthHelpers.tmpDir()` + `new App({ outdir: tmpDir })` is
available when isolation is required.

Extend `TestApp` when you need a custom `AppProps` (e.g. global resolvers):

```ts
class AppWithGlobalResolver extends TestApp {
  constructor() {
    super(undefined, { resolvers: [myResolver] });
  }
}
```

---

### `TestStack` (`src/lib/test-stack.ts`)

Extends `Stack` from `@cdkx-io/core`.

| Member                         | Description                                                        |
| ------------------------------ | ------------------------------------------------------------------ |
| `static default(scope, props)` | Creates a `Stack` named `'DefaultTestStack'` with the given props. |

`StackProps.provider` is required — pass the provider under test or `new TestProvider()`.

---

### `TestProvider` (`src/lib/test-provider.ts`)

Minimal concrete `Provider` for tests. Uses the default `JsonSynthesizer` and
returns no custom resolvers.

| Member               | Description                                     |
| -------------------- | ----------------------------------------------- |
| `identifier: string` | Defaults to `'test'`; override via constructor. |

```ts
const provider = new TestProvider(); // identifier = 'test'
const provider = new TestProvider('hetzner'); // custom identifier
```

---

### `SpyProvider` (`src/lib/test-provider.ts`)

Records how many times `getResolvers()` has been called. Used to verify that
the resolver pipeline cache works — `getResolvers()` should only be called once
per provider per `App` instance.

| Member               | Description                       |
| -------------------- | --------------------------------- |
| `identifier`         | `'spy'`                           |
| `getResolversCalled` | Counter incremented on each call. |

---

### `CustomSynthesizerProvider` (`src/lib/test-provider.ts`)

Provider that returns a caller-supplied synthesizer via `getSynthesizer()`.
Used to test custom synthesizer behaviour (e.g. `YamlSynthesizer`).

| Member                     | Description                                     |
| -------------------------- | ----------------------------------------------- |
| `identifier`               | `'custom-synth'`                                |
| `constructor(synthesizer)` | Accepts any `IStackSynthesizer` implementation. |

---

### `TestResources` (`src/lib/test-resources.ts`)

Object Mother for generic test L1 resources. All methods create and return a
`ProviderResource` attached to the given `Stack`.

| Method                         | Description                                                   |
| ------------------------------ | ------------------------------------------------------------- |
| `resource(scope, id?)`         | Basic resource with `name` property. General-purpose.         |
| `resourceWithNull(scope, id?)` | Resource with a `null` property — tests sanitizer null-strip. |
| `resourceWithLazy(scope, id?)` | Resource with a `Lazy` token — tests deferred resolution.     |

Default `id` values: `'Resource'`, `'NullResource'`, `'LazyResource'`.

---

### `SynthHelpers` (`src/lib/synth-helpers.ts`)

Static utilities for synthesis tests. Usable in any provider package test suite.

| Method                                  | Description                                                                                                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tmpDir()`                              | Creates a unique OS temp dir (`mkdtempSync`, prefix `cdkx-integration-`). Use when you need a clean isolated outdir per test.                                                         |
| `readJson(filePath)`                    | Reads and parses a JSON file from disk. Returns `unknown`.                                                                                                                            |
| `resourceEntry(resource)`               | Calls `resource.toJson()` and unwraps the single keyed entry. Returns `{ type, properties, metadata }`. For unit test assertions on individual constructs (no file I/O).              |
| `resourceValues(json)`                  | Extracts all resource entries from a full keyed stack JSON object. Returns `Array<{ type, properties, metadata }>`. For assertions over a whole stack's synthesized output.           |
| `synthSnapshot(app, stackId, cleanup?)` | Synthesizes the app, reads the stack JSON file by `stackId`, and returns it as a plain object. Cleans up `outdir` by default (`cleanup = true`). Use for snapshot or assertion tests. |

**`toJson()` output shape** (what `resourceEntry` unwraps):

```json
{
  "MyStackMyResourceA1B2C3D4": {
    "type": "test::Resource",
    "properties": { "name": "hello" },
    "metadata": { "cdkx:path": "MyStack/MyResource" }
  }
}
```

`resourceEntry(resource)` returns the inner object — i.e. `{ type, properties, metadata }`.
`metadata['cdkx:path']` is the construct node path and is useful for asserting
that the logical ID maps to the correct construct location.

**`resourceEntry` vs `resourceValues`:**

- `resourceEntry(resource)` — operates on a single `ProviderResource` **instance**;
  calls `toJson()` directly. No file I/O. Use in unit tests.
- `resourceValues(json)` — operates on a **full stack JSON object** (already
  read from disk or returned by `synthSnapshot`). Use in integration tests.

---

## Coding conventions

See `packages/core/CONTEXT.md` for the authoritative coding conventions — this
package follows them identically.

---

## File map

```
packages/testing/
├── package.json                   name: @cdkx-io/testing (no "type" field — CommonJS)
│                                  peerDependencies: @cdkx-io/core, tslib
│                                  devDependencies: @cdkx-io/core
├── project.json                   Nx project configuration
├── CONTEXT.md                     ← this file
└── src/
    ├── index.ts                   public barrel — re-exports all of src/lib/
    └── lib/
        ├── index.ts               lib barrel
        ├── synth-helpers.ts       SynthHelpers — tmpDir, readJson, resourceEntry, resourceValues, synthSnapshot
        ├── test-app.ts            TestApp — default() factory, extensible for custom AppProps
        ├── test-stack.ts          TestStack — default(scope, props) factory
        ├── test-provider.ts       TestProvider, SpyProvider, CustomSynthesizerProvider
        └── test-resources.ts      TestResources — resource, resourceWithNull, resourceWithLazy
```
