# @cdkx-io/hetzner-runtime — Development Context

This file captures the full design, architecture, and implementation details of
`@cdkx-io/hetzner-runtime` for future AI-assisted sessions. It is auto-loaded by
OpenCode.

> **Maintenance rule:** whenever code in
> `packages/providers/hetzner/hetzner-runtime` is modified — classes, interfaces,
> file structure, conventions, or design decisions — this file must be updated in
> the same change to stay accurate.

---

## What is @cdkx-io/hetzner-runtime?

**@cdkx-io/hetzner-runtime** is the deployment runtime for Hetzner Cloud
resources. It implements the handler-based `ProviderRuntime` architecture
defined in `@cdkx-io/core`, providing per-resource-type CRUD handlers that use
the auto-generated Hetzner SDK (`@cdkx-io/hetzner-sdk`).

The package bridges the engine's `ProviderAdapter` interface to the
handler-based runtime via `RuntimeAdapter` from `@cdkx-io/engine`. The CLI
imports the `HetznerRuntimeAdapterFactory` to wire everything together at
deploy/destroy time.

**Key design principle:** total decoupling. Handlers know nothing about the
engine — all dependencies (SDK, logger) are injected via `RuntimeContext`.
The engine only sees a `ProviderAdapter`; it never imports handler classes
directly.

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
| Output dir      | `packages/providers/hetzner/hetzner-runtime/dist/`                                   |

Run tasks via Nx:

```bash
yarn nx lint @cdkx-io/hetzner-runtime
yarn nx test @cdkx-io/hetzner-runtime
yarn nx build @cdkx-io/hetzner-runtime
yarn nx run @cdkx-io/hetzner-runtime:format        # format src/ with prettier
yarn nx run @cdkx-io/hetzner-runtime:format:check  # check formatting without writing
```

Dependencies:

- `@cdkx-io/core` — `RuntimeContext`, `ProviderRuntime`, `ResourceHandler`,
  `RuntimeLogger`
- `@cdkx-io/engine` — `RuntimeAdapter`, `RuntimeResourceConfig`,
  `ProviderAdapterFactory`
- `@cdkx-io/hetzner-sdk` — auto-generated Hetzner Cloud API client
- `tslib` — TypeScript runtime helpers

---

## Architecture

```
HetznerRuntimeAdapterFactory     implements ProviderAdapterFactory
 └── creates:
      ├── HetznerSdkFactory      builds HetznerSdk facade from API token
      ├── HetznerRuntimeContext   carries SDK + logger
      ├── HetznerProviderRuntime  registers all resource handlers
      └── RuntimeAdapter<HetznerSdk>  bridges runtime → ProviderAdapter
           └── dispatches to:
                └── HetznerNetworkHandler  (+ future handlers per resource type)
```

### Data flow

1. CLI calls `factory.create(env)` with `HETZNER_API_TOKEN` from environment.
2. Factory builds `HetznerSdk` via `HetznerSdkFactory.create()`.
3. Factory builds `HetznerRuntimeContext` with the SDK and a `NoopLogger`.
4. Factory builds `HetznerProviderRuntime` which registers all handlers.
5. Factory returns a `RuntimeAdapter<HetznerSdk>` wrapping the runtime +
   context + resource configs.
6. Engine calls `adapter.create()` / `update()` / `delete()` / `getOutput()`.
7. `RuntimeAdapter` looks up the handler via `runtime.getHandler(type)` and
   delegates.
8. Handler uses `ctx.sdk.networks` (or other SDK group) to make HTTP calls.

---

## Class inventory

### `HetznerSdk` interface + `HetznerSdkFactory` (`src/lib/hetzner-sdk-facade.ts`)

The SDK facade groups multiple auto-generated API classes into a single typed
object.

```ts
interface HetznerSdk {
  networks: NetworksApi;
  networkActions: NetworkActionsApi;
  // ... future: servers, volumes, etc.
}

interface HetznerSdkOptions {
  apiToken: string;
  basePath?: string;
}

interface HetznerSdkFactoryDeps {
  NetworksApi?: new (config: Configuration) => NetworksApi;
  NetworkActionsApi?: new (config: Configuration) => NetworkActionsApi;
}
```

| Member                                 | Description                                                         |
| -------------------------------------- | ------------------------------------------------------------------- |
| `HetznerSdkFactory.create(opts, deps)` | Builds a `HetznerSdk` from an API token. Deps injectable for tests. |

**Dependency injection pattern:** Instead of `jest.mock('@cdkx-io/hetzner-sdk')`,
tests pass stub constructors via the `deps` parameter. This avoids Nx
`enforce-module-boundaries` conflicts with `jest.mock()` lazy-load detection.

---

### `HetznerRuntimeContext` (`src/lib/hetzner-runtime-context.ts`)

Concrete `RuntimeContext<HetznerSdk>`. Carries the SDK facade and a logger.

```ts
class HetznerRuntimeContext extends RuntimeContext<HetznerSdk> {
  readonly sdk: HetznerSdk;
  readonly logger: RuntimeLogger;

  constructor(sdk: HetznerSdk, logger: RuntimeLogger) {
    super();
    this.sdk = sdk;
    this.logger = logger;
  }
}
```

**`logger` is `readonly` at the TypeScript level.** `RuntimeAdapter.setLogger()`
uses a cast `(this.context as { logger: RuntimeLogger }).logger = ...` to update
it at runtime. This works because `readonly` is a compile-time-only check.

---

### `HetznerProviderRuntime` (`src/lib/hetzner-provider-runtime.ts`)

Extends `ProviderRuntime<HetznerSdk>`. Registers all resource handlers in its
constructor.

```ts
class HetznerProviderRuntime extends ProviderRuntime<HetznerSdk> {
  constructor() {
    super();
    this.register('Hetzner::Networking::Network', new HetznerNetworkHandler());
    // ... register more handlers as they are implemented
  }

  listResourceTypes(): string[] {
    return Object.keys(this.handlers);
  }
}
```

Currently registered handlers:

| Resource type                  | Handler class           |
| ------------------------------ | ----------------------- |
| `Hetzner::Networking::Network` | `HetznerNetworkHandler` |
| `Hetzner::Networking::Subnet`  | `HetznerSubnetHandler`  |

---

### `HetznerNetworkHandler` (`src/lib/handlers/network-handler.ts`)

Full CRUD handler for Hetzner Cloud networks.

### `HetznerSubnetHandler` (`src/lib/handlers/subnet-handler.ts`)

Handler for Hetzner Cloud subnets. Subnets are "action resources" — they don't have their own unique ID in the Hetzner API. Instead, they are managed via network actions (`addNetworkSubnet`, `deleteNetworkSubnet`) and identified by a composite `physicalId`: `${networkId}/${ipRange}`.

**Type parameters:**

| Param    | Type                 | Description                                                                   |
| -------- | -------------------- | ----------------------------------------------------------------------------- |
| `TProps` | `HetznerSubnetProps` | `{ networkId, type, networkZone, ipRange?, vswitchId? }`                      |
| `TState` | `HetznerSubnetState` | `{ physicalId, networkId, type, networkZone, ipRange, vswitchId?, gateway? }` |
| `TSdk`   | `HetznerSdk`         | SDK facade                                                                    |

```ts
interface HetznerSubnetProps {
  networkId: number;
  type: 'cloud' | 'server' | 'vswitch';
  networkZone: string;
  ipRange?: string;
  vswitchId?: number;
}

interface HetznerSubnetState {
  physicalId: string; // Composite: `${networkId}/${ipRange}`
  networkId: number;
  type: string;
  networkZone: string;
  ipRange: string;
  vswitchId?: number;
  gateway?: string;
}
```

| Method     | Behaviour                                                                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create()` | POST `/networks/{id}/actions/add_subnet` with snake_case body. Fetches network to get the created subnet details (since action response doesn't include them). Returns state with composite `physicalId`. |
| `update()` | Throws error — all subnet properties are create-only. To modify, delete and recreate.                                                                                                                     |
| `delete()` | POST `/networks/{id}/actions/delete_subnet` with `ip_range`.                                                                                                                                              |
| `get()`    | GET `/networks/{id}` and find subnet by `ipRange` in the response.                                                                                                                                        |

**Composite physicalId:** Since subnets don't have their own ID, we use `${networkId}/${ipRange}` as the `physicalId`. This allows the engine to uniquely identify subnets during updates and deletes. The handler splits this string to extract the components when needed.

**Type parameters:**

| Param    | Type                  | Description                          |
| -------- | --------------------- | ------------------------------------ |
| `TProps` | `HetznerNetworkProps` | `{ name, ipRange, labels? }`         |
| `TState` | `HetznerNetworkState` | `{ physicalId, name, ipRange, ... }` |
| `TSdk`   | `HetznerSdk`          | SDK facade                           |

```ts
interface HetznerNetworkProps {
  name: string;
  ipRange: string;
  labels?: Record<string, string>;
}

interface HetznerNetworkState {
  physicalId: string;
  name: string;
  ipRange: string;
  labels: Record<string, string>;
  networkId: number;
}
```

| Method     | Behaviour                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------- |
| `create()` | POST `/networks` with snake_case body. Returns state with `physicalId = String(network.id)`. |
| `update()` | PUT `/networks/{id}` with `name` and `labels`. `ipRange` is create-only (not sent).          |
| `delete()` | DELETE `/networks/{id}`.                                                                     |
| `get()`    | GET `/networks/{id}`. Reconstructs state from API response.                                  |

**Property casing:** each handler explicitly maps camelCase props to snake_case
SDK calls. No magic utilities — mapping is visible and auditable in each method.

**`assertExists()`:** inherited from `ResourceHandler`. Used to unwrap nullable
API responses (e.g. `this.assertExists(response.network)`).

---

### `HetznerRuntimeAdapterFactory` (`src/lib/hetzner-runtime-adapter-factory.ts`)

Implements `ProviderAdapterFactory` from `@cdkx-io/engine`. The CLI uses this
factory to build the adapter at deploy/destroy time.

```ts
interface HetznerRuntimeAdapterFactoryDeps {
  createSdk?: (opts: HetznerSdkOptions) => HetznerSdk;
  createContext?: (sdk: HetznerSdk, logger: RuntimeLogger) => HetznerRuntimeContext;
  createRuntime?: () => HetznerProviderRuntime;
  createAdapter?: (opts: RuntimeAdapterOptions<HetznerSdk>) => ProviderAdapter;
}

class HetznerRuntimeAdapterFactory implements ProviderAdapterFactory {
  constructor(private readonly deps?: HetznerRuntimeAdapterFactoryDeps);

  create(env: Record<string, string | undefined>): ProviderAdapter;
}
```

| Member        | Behaviour                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| `create(env)` | Reads `HETZNER_API_TOKEN` from `env`. Throws if missing. Builds SDK, context, runtime, adapter. Returns adapter. |

**`RUNTIME_CONFIGS`:** auto-generated from JSON Schemas in `@cdkx-io/hetzner`.
Imported via `import { RUNTIME_CONFIGS } from '@cdkx-io/hetzner'`.

```ts
import { RUNTIME_CONFIGS } from '@cdkx-io/hetzner';

// Auto-generated from schemas - includes all 13 Hetzner resource types:
// {
//   'Hetzner::Networking::Network': {
//     physicalIdKey: 'networkId',
//     createOnlyProps: new Set(['ipRange'])
//   },
//   'Hetzner::Networking::Subnet': {
//     physicalIdKey: 'physicalId',
//     createOnlyProps: new Set(['networkId', 'type', 'networkZone', 'ipRange', 'vswitchId'])
//   },
//   ...
// }
```

The configuration is generated by `spec-to-cdkx` based on `primaryIdentifier` and
`createOnlyProperties` in the JSON Schema files:

- **Single-element `primaryIdentifier`**: uses that property name as `physicalIdKey`
- **Multi-element `primaryIdentifier`**: uses `'physicalId'` (composite IDs for action resources)

Each entry tells `RuntimeAdapter` which key in the handler's state object holds
the physical ID, and which props are create-only.

**`NoopLogger`:** a minimal `RuntimeLogger` implementation that does nothing.
Used as the default logger until the engine calls `adapter.setLogger()` to
inject the real one.

```ts
class NoopLogger implements RuntimeLogger {
  debug(): void {
    /* noop */
  }
  info(): void {
    /* noop */
  }
  warn(): void {
    /* noop */
  }
  error(): void {
    /* noop */
  }
  child(): RuntimeLogger {
    return this;
  }
}
```

---

## Testing

Tests are co-located with their implementation files.

| File                                      | Tests | Coverage                                                      |
| ----------------------------------------- | ----- | ------------------------------------------------------------- |
| `hetzner-sdk-facade.spec.ts`              | 4     | SDK creation, default basePath, custom basePath, deps         |
| `hetzner-runtime-context.spec.ts`         | 2     | Context exposes SDK and logger                                |
| `handlers/network-handler.spec.ts`        | 10    | Full CRUD: create, update, delete, get, error handling        |
| `handlers/subnet-handler.spec.ts`         | 12    | Subnet CRD (no update): create, delete, get, composite ID     |
| `hetzner-provider-runtime.spec.ts`        | 3     | Handler registration, listing, unknown type error             |
| `hetzner-runtime-adapter-factory.spec.ts` | 12    | Factory creation, env token, DI, resource configs, NoopLogger |

**Total: 43 tests**

**Testing pattern:** all collaborators are injected via `deps` parameters.
Tests pass stub implementations directly — no `jest.mock()`. This avoids Nx
`enforce-module-boundaries` issues with lazy-load detection.

---

## Relationship with other packages

### `@cdkx-io/core`

Provides the abstract base classes: `RuntimeContext`, `ProviderRuntime`,
`ResourceHandler`, `RuntimeLogger`. This package extends all four.

### `@cdkx-io/engine`

Provides `RuntimeAdapter`, `RuntimeResourceConfig`, and
`ProviderAdapterFactory`. This package implements `ProviderAdapterFactory` and
uses `RuntimeAdapter` as the bridge between handlers and the engine.

### `@cdkx-io/hetzner-sdk`

Auto-generated Hetzner Cloud API client. Provides typed API classes
(`NetworksApi`, `NetworkActionsApi`, etc.) and `Configuration`. This package
wraps them in the `HetznerSdk` facade.

### `@cdkx-io/hetzner`

The construct-tree provider package (L1 constructs, schemas, synthesis).
`@cdkx-io/hetzner-runtime` is the **deployment counterpart** — it handles the
runtime CRUD operations for resources that `@cdkx-io/hetzner` synthesizes.
They share no code; the connection is the cloud assembly JSON format.

### `@cdkx-io/cli`

Imports `HetznerRuntimeAdapterFactory` and registers it in the
`AdapterRegistry` for deploy/destroy commands.

---

## Adding a new resource handler

1. Create `src/lib/handlers/<resource>-handler.ts` with:
   - `Hetzner<Resource>Props` interface (camelCase properties)
   - `Hetzner<Resource>State` interface (includes `physicalId: string`)
   - `Hetzner<Resource>Handler extends ResourceHandler<Props, State, HetznerSdk>`
   - Implement `create()`, `update()`, `delete()`, `get()`

2. Create `src/lib/handlers/<resource>-handler.spec.ts` with tests.

3. Export from `src/lib/handlers/index.ts`.

4. Register in `HetznerProviderRuntime` constructor:

   ```ts
   this.register(
     'Hetzner::<Domain>::<Resource>',
     new Hetzner() < Resource > Handler(),
   );
   ```

5. Add to `RESOURCE_CONFIGS` in `hetzner-runtime-adapter-factory.ts`:

   ```ts
   'Hetzner::<Domain>::<Resource>': {
     physicalIdKey: 'physicalId',
     createOnlyProps: new Set(['immutableProp']),  // if applicable
   },
   ```

6. Update this AI.md: add to the handler table, update test counts, update
   file map.

---

## Coding conventions

See `packages/core/AI.md` for the authoritative coding conventions. This
package follows them identically:

- Everything OOP — no standalone `export function`
- No `any` — use `unknown`
- CJS imports — extensionless local imports
- Specs co-located — `foo.spec.ts` next to `foo.ts`
- Prettier — run `yarn nx run @cdkx-io/hetzner-runtime:format` after any
  `.ts` change

### Property casing convention

Handlers map between camelCase (cdkx properties) and snake_case (Hetzner API)
explicitly inside each handler method. No shared mapping utility — the
conversion is visible and auditable per handler.

---

## Release configuration

Part of the `providers` release group in `nx.json` — alongside
`@cdkx-io/hetzner` and `@cdkx-io/hetzner-sdk`. Each package versions
independently (`projectsRelationship: "independent"`).
`updateDependents: "auto"` — releasing a dependency may auto-bump dependents.

---

## File map

```
packages/providers/hetzner/hetzner-runtime/
├── package.json                        name: @cdkx-io/hetzner-runtime (no "type" field — CommonJS)
│                                       dependencies: @cdkx-io/core, @cdkx-io/engine,
│                                                     @cdkx-io/hetzner-sdk, tslib
├── project.json                        Nx project configuration (build, format, format:check, test)
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── jest.config.cts
├── eslint.config.mjs
├── .spec.swcrc                         SWC config for Jest
├── AI.md                               ← this file
└── src/
    ├── index.ts                        public barrel — exports factory, context, runtime, SDK types
    └── lib/
        ├── hetzner-sdk-facade.ts       HetznerSdk interface, HetznerSdkOptions, HetznerSdkFactoryDeps,
        │                               HetznerSdkFactory
        ├── hetzner-sdk-facade.spec.ts  4 tests
        ├── hetzner-runtime-context.ts  HetznerRuntimeContext extends RuntimeContext<HetznerSdk>
        ├── hetzner-runtime-context.spec.ts  2 tests
        ├── hetzner-provider-runtime.ts HetznerProviderRuntime extends ProviderRuntime<HetznerSdk>
        ├── hetzner-provider-runtime.spec.ts  3 tests
        ├── hetzner-runtime-adapter-factory.ts  HetznerRuntimeAdapterFactory, NoopLogger,
        │                                       RESOURCE_CONFIGS, HetznerRuntimeAdapterFactoryDeps
        ├── hetzner-runtime-adapter-factory.spec.ts  12 tests
        └── handlers/
            ├── index.ts                barrel — exports all handlers
            ├── network-handler.ts      HetznerNetworkHandler, HetznerNetworkProps, HetznerNetworkState
            ├── network-handler.spec.ts 10 tests
            ├── subnet-handler.ts       HetznerSubnetHandler, HetznerSubnetProps, HetznerSubnetState
            └── subnet-handler.spec.ts  12 tests
```
