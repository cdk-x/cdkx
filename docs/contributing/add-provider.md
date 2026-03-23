# Add a Provider

This guide walks through creating a new cdkx provider from scratch — the packages, the base classes to extend, and how the pieces plug into the engine. The Hetzner provider is the reference implementation throughout.

---

## Overview

A provider in cdkx consists of two packages:

| Package | Role |
|---------|------|
| `@cdkx-io/<name>` | **Synth package** — L1 construct classes, JSON schemas, codegen. Used by the user's TypeScript app at synth time. |
| `@cdkx-io/<name>-runtime` | **Runtime package** — `ResourceHandler` implementations, SDK facade, `ProviderAdapterFactory`. Used by the engine at deploy time. |

The split is intentional: synth packages have no runtime dependencies, so a user's app only imports lightweight construct code.

---

## Step 1 — Create the synth package

Generate the package with Nx:

```bash
npx nx g @nx/js:library packages/providers/<name>/<name> \
  --name=@cdkx-io/<name> --importPath=@cdkx-io/<name> \
  --bundler=tsc --publishable --unitTestRunner=jest \
  --linter=eslint --minimal --useProjectJson --no-interactive
```

Then align the generated files — see the **New library checklist** section in `CLAUDE.md` at the repository root for the exact steps (remove `"type": "module"`, set `"exports"` to use `"require"`, add `"publishConfig"`, etc.).

### Implement `Provider`

Create `src/lib/provider/provider.ts`:

```typescript title="src/lib/provider/provider.ts" linenums="1" hl_lines="6 7"
import { Provider } from '@cdkx-io/core';

export class MyCloudProvider extends Provider {
  readonly identifier = 'mycloud'; // (1)!

  // Optional overrides:
  // getResolvers()    — provider-specific token resolvers (default: [])
  // getSynthesizer()  — output format (default: JsonSynthesizer → .json)
  // getEnvironment()  — non-sensitive deploy metadata written to manifest.json
}
```

1. Must be lowercase, URL-safe, and unique. Written into `manifest.json` as the `provider` field for each stack artifact. The runtime package reads this to look up the correct `ProviderAdapterFactory`.

The `Provider` base class has three overridable methods:

| Method | Default | Override when |
|--------|---------|---------------|
| `getResolvers()` | `[]` | You need custom token transformations at synth time |
| `getSynthesizer()` | `JsonSynthesizer` | You want YAML output or a custom format |
| `getEnvironment()` | `{}` | You want to write deploy-target metadata to `manifest.json` |

### Add JSON schemas and codegen

For providers that model their resources as JSON Schemas (recommended), set up the same codegen pipeline as Hetzner:

1. Create `schemas/v1/` in the synth package root.
2. Add a `codegen` target to `project.json` using `@cdkx-io/spec-to-cdkx`.
3. Write one schema per resource type. See [Add a Resource Handler](add-resource-handler.md) for the schema format.
4. Run `npx nx run @cdkx-io/<name>:codegen` to generate the L1 construct classes.

!!! tip "Skipping codegen"
    You can write L1 constructs by hand by extending `ProviderResource` directly. Codegen is a convenience — it is not required. See [Construct](../concepts/construct.md) for the manual approach.

---

## Step 2 — Create the runtime package

```bash
npx nx g @nx/js:library packages/providers/<name>/<name>-runtime \
  --name=@cdkx-io/<name>-runtime --importPath=@cdkx-io/<name>-runtime \
  --bundler=tsc --publishable --unitTestRunner=jest \
  --linter=eslint --minimal --useProjectJson --no-interactive
```

Apply the same alignment checklist. Add `@cdkx-io/core` and `@cdkx-io/engine` as dependencies.

!!! info "New library checklist"
    The full alignment checklist (package.json, tsconfig, project.json, jest config) is documented in `CLAUDE.md` at the repository root under the **New library checklist** section.

### SDK facade

Wrap the provider's API client in a facade class. This keeps handler code testable — tests inject a stub SDK without needing to mock HTTP:

```typescript title="src/lib/my-cloud-sdk.ts" linenums="1"
import { MyCloudApiClient } from '@my-cloud/sdk'; // (1)!

export interface MyCloudSdk {
  readonly servers: MyCloudApiClient['servers'];
  // ... other API namespaces used by handlers
}

export class MyCloudSdkFactory {
  static create(options: { apiToken: string }): MyCloudSdk {
    const client = new MyCloudApiClient({ token: options.apiToken });
    return { servers: client.servers };
  }
}
```

1. The underlying API SDK. Can be any HTTP client — auto-generated OpenAPI clients, Axios wrappers, etc.

### `ProviderRuntime`

```typescript title="src/lib/my-cloud-provider-runtime.ts" linenums="1" hl_lines="9 10 11"
import { ProviderRuntime } from '@cdkx-io/core';
import { MyCloudSdk } from './my-cloud-sdk';
import { MyServerHandler } from './handlers/server';

export class MyCloudProviderRuntime extends ProviderRuntime<MyCloudSdk> {
  constructor() {
    super();
    // Register one handler per resource type:
    this.register('MyCloud::Compute::Server', new MyServerHandler()); // (1)!
  }

  listResourceTypes(): string[] {
    return Object.keys(this.handlers);
  }
}
```

1. The type string must exactly match `typeName` in the schema and `RESOURCE_TYPE_NAME` on the L1 class.

### `ProviderAdapterFactory`

This is the glue between the runtime package and the engine. It reads credentials from the environment and builds a `RuntimeAdapter`:

```typescript title="src/lib/my-cloud-runtime-adapter-factory.ts" linenums="1" hl_lines="9 10 11 12 13"
import { RuntimeAdapter, ProviderAdapterFactory, ProviderAdapter } from '@cdkx-io/engine';
import { RUNTIME_CONFIGS } from '@cdkx-io/<name>'; // (1)!
import { MyCloudSdkFactory } from './my-cloud-sdk';
import { MyCloudRuntimeContext } from './my-cloud-runtime-context';
import { MyCloudProviderRuntime } from './my-cloud-provider-runtime';

export class MyCloudRuntimeAdapterFactory implements ProviderAdapterFactory {
  readonly providerId = 'mycloud'; // (2)!

  create(env: NodeJS.ProcessEnv): ProviderAdapter {
    const apiToken = env['MYCLOUD_TOKEN']; // (3)!
    if (!apiToken) {
      throw new Error('MYCLOUD_TOKEN environment variable is not set.');
    }

    const sdk = MyCloudSdkFactory.create({ apiToken });
    const context = new MyCloudRuntimeContext(sdk);
    const runtime = new MyCloudProviderRuntime();

    return new RuntimeAdapter({ runtime, context, resourceConfigs: RUNTIME_CONFIGS });
  }
}
```

1. `RUNTIME_CONFIGS` is auto-generated by codegen from `primaryIdentifier` and `createOnlyProperties` in each schema.
2. Must match `Provider.identifier` in the synth package.
3. Read credentials from environment variables — never hardcode them.

---

## Step 3 — Register the factory with the engine

The CLI discovers provider adapters through an `AdapterRegistry`. Open the registry configuration (in `@cdkx-io/cli`) and add your factory:

```typescript linenums="1" hl_lines="4 8"
import { AdapterRegistry } from '@cdkx-io/engine';
import { HetznerRuntimeAdapterFactory } from '@cdkx-io/hetzner-runtime';
import { MyCloudRuntimeAdapterFactory } from '@cdkx-io/<name>-runtime'; // add this

const registry = new AdapterRegistry()
  .register(new HetznerRuntimeAdapterFactory())
  .register(new MyCloudRuntimeAdapterFactory()); // add this
```

---

## Step 4 — Write resource handlers

With the package scaffolding in place, add handlers for each resource type. See [Add a Resource Handler](add-resource-handler.md) for the step-by-step process.

---

## Package dependencies

| Package | Depends on |
|---------|-----------|
| `@cdkx-io/<name>` (synth) | `@cdkx-io/core`, `constructs`, `tslib` |
| `@cdkx-io/<name>-runtime` | `@cdkx-io/core`, `@cdkx-io/engine`, `@cdkx-io/<name>` (for `RUNTIME_CONFIGS`) |

---

!!! info "See also"
    - [Add a Resource Handler](add-resource-handler.md) — add individual resource support within the provider
    - `packages/providers/hetzner/hetzner/AI.md` — full Hetzner synth package design (in the repo)
    - `packages/providers/hetzner/hetzner-runtime/AI.md` — full Hetzner runtime design (in the repo)
    - [Construct](../concepts/construct.md) — the `ProviderResource` base all L1s extend
