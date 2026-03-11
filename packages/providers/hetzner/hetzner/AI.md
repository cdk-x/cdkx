# @cdkx-io/hetzner — Development Context

This file captures the full design, architecture, and implementation details of
`@cdkx-io/hetzner` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/providers/hetzner/hetzner` is
> modified — classes, interfaces, file structure, conventions, or design
> decisions — this file must be updated in the same change to stay accurate.

---

## What is @cdkx-io/hetzner?

**@cdkx-io/hetzner** is the Hetzner Cloud provider package for cdkx. It extends
`@cdkx-io/core` to allow synthesizing Hetzner Cloud resource manifests from a
construct tree.

---

> Part of the `core` release group — lock-stepped with `@cdkx-io/core`, tag `core-v{version}`.

---

## Codegen (`codegen` Nx target)

Both generated files — L1 constructs and the adapter resource registry — are produced
by a single `codegen` run using `@cdkx-io/spec-to-cdkx`. Both files are committed to the repo.

```bash
yarn nx run @cdkx-io/hetzner:codegen
```

This runs:

```
spec-to-cdkx generate \
  --prefix Htz \
  --provider-name Hetzner \
  --resource-type-const HetznerResourceType \
  --registry-output src/lib/generated/resource-registry.generated.ts
```

from the project root (`packages/providers/hetzner/hetzner/`). Reads schemas from
`schemas/v1/` and writes:

- `src/lib/generated/resources.generated.ts` — L1 constructs (interfaces, enums, classes)
- `src/lib/generated/resource-registry.generated.ts` — adapter `RESOURCE_REGISTRY`

**When to re-run codegen:** whenever any `schemas/v1/*.schema.json` file is added,
modified, or removed.

**`codegen` depends on `@cdkx-io/spec-to-cdkx:build`** — the tool is always rebuilt before
running codegen, so the dist bundle is always fresh.

---

## Generated L1 constructs

Each schema produces:

- A `{ProviderName}{Resource}` props interface (e.g. `HetznerNetwork`)
  - Required props (from `required: [...]` in the schema) are emitted without `?`
- An `{Prefix}{Resource}` L1 class extending `ProviderResource` (e.g. `HtzNetwork`)
  - Public mutable members for each writable prop (e.g. `public name: string`)
  - Required props are non-optional class members; optional props use `?`
  - Constructor calls `super(scope, id, { type: ... })` — no `properties` arg
  - Constructor omits `= {}` default when any props are required
  - Overrides `protected renderProperties()` to return props from its own members
- Nested interfaces and enums defined in the schema's `definitions` block
- An `attr*: IResolvable` member per `readOnlyProperty` (e.g. `attrNetworkId`)

Example generated L1 class shape:

```ts
export class HtzCertificate extends ProviderResource {
  public static readonly RESOURCE_TYPE_NAME = 'Hetzner::Security::Certificate';

  public readonly attrCertificateId: IResolvable;

  public name: string; // required (no ?)
  public labels?: Record<string, string>;
  public resourceType?: CertificateType; // 'type' renamed — clashes with base class

  constructor(scope: Construct, id: string, props: HetznerCertificate) {
    super(scope, id, { type: HtzCertificate.RESOURCE_TYPE_NAME });
    this.node.defaultChild = this;
    this.attrCertificateId = this.getAtt('certificateId');
    this.name = props.name;
    this.labels = props.labels;
    this.resourceType = props.type;
  }

  protected override renderProperties(): Record<string, PropertyValue> {
    return {
      name: this.name,
      labels: this.labels,
      type: this.resourceType,
    } as unknown as Record<string, PropertyValue>;
  }
}
```

The `HetznerResourceType` const groups all type strings by domain:

```ts
HetznerResourceType.Networking.Network; // 'Hetzner::Networking::Network'
HetznerResourceType.Compute.Server; // 'Hetzner::Compute::Server'
```

See `@cdkx-io/spec-to-cdkx/AI.md` for the full code generation design.

---

## Schemas (`schemas/v1/`)

JSON schemas defining Hetzner Cloud resources for use by the engine and codegen.
One schema per resource type. All schemas follow the same conventions.

### Conventions

| Field                  | Description                                                                                           |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `typeName`             | CloudFormation-style resource type: `Hetzner::{Domain}::{Resource}` (e.g. `Hetzner::Compute::Server`) |
| `domain`               | Domain group: `Networking`, `Compute`, `Storage`, `Security`                                          |
| `primaryIdentifier`    | JSON pointer(s) to the property used to uniquely identify the resource (usually the API-assigned id)  |
| `readOnlyProperties`   | Properties assigned by the API on creation — never provided by the user                               |
| `createOnlyProperties` | Properties that can only be set at creation time — require resource replacement if changed            |

**`createOnlyProperties` rule:** determined by what `PUT /{resource}/{id}` accepts in the
Hetzner API. Only `name` and `labels` are mutable on most resources — everything else is
create-only.

**Action resources (subnet, route):** these resources have no top-level collection POST.
They are managed via action endpoints on the parent network:

- Subnet: `POST /networks/{id}/actions/add_subnet` / `DELETE /networks/{id}/actions/delete_subnet`
- Route: `POST /networks/{id}/actions/add_route` / `DELETE /networks/{id}/actions/delete_route`

Both are entirely immutable — all properties are `createOnlyProperties`.

### Schema inventory

| File                          | `typeName`                         | `primaryIdentifier`                                 | Notes                                   |
| ----------------------------- | ---------------------------------- | --------------------------------------------------- | --------------------------------------- |
| `common.schema.json`          | —                                  | —                                                   | Shared definitions only                 |
| `network.schema.json`         | `Hetzner::Networking::Network`     | `/properties/networkId`                             |                                         |
| `subnet.schema.json`          | `Hetzner::Networking::Subnet`      | `/properties/networkId` + `/properties/ipRange`     | Action resource — all props create-only |
| `route.schema.json`           | `Hetzner::Networking::Route`       | `/properties/networkId` + `/properties/destination` | Action resource — all props create-only |
| `floating-ip.schema.json`     | `Hetzner::Networking::FloatingIp`  | `/properties/floatingipId`                          |                                         |
| `primary-ip.schema.json`      | `Hetzner::Networking::PrimaryIp`   | `/properties/id`                                    |                                         |
| `server.schema.json`          | `Hetzner::Compute::Server`         | `/properties/serverId`                              | Local `ServerType` enum (20 values)     |
| `load-balancer.schema.json`   | `Hetzner::Compute::LoadBalancer`   | `/properties/loadbalancerId`                        |                                         |
| `placement-group.schema.json` | `Hetzner::Compute::PlacementGroup` | `/properties/id`                                    |                                         |
| `volume.schema.json`          | `Hetzner::Storage::Volume`         | `/properties/volumeId`                              |                                         |
| `certificate.schema.json`     | `Hetzner::Security::Certificate`   | `/properties/certificateId`                         |                                         |
| `firewall.schema.json`        | `Hetzner::Security::Firewall`      | `/properties/firewallId`                            |                                         |
| `ssh-key.schema.json`         | `Hetzner::Security::SshKey`        | `/properties/name`                                  | `publicKey` is create-only              |

### `common.schema.json` definitions

Shared definitions referenced by other schemas via `$ref: "./common.schema.json#/definitions/..."`:

| Definition    | Type   | Description                                              |
| ------------- | ------ | -------------------------------------------------------- |
| `Labels`      | object | `Record<string, string>` — user-defined key/value pairs  |
| `NetworkZone` | string | Enum: `eu-central`, `us-east`, `us-west`, `ap-southeast` |
| `Location`    | string | Enum: `fsn1`, `nbg1`, `hel1`, `ash`, `hil`, `sin`        |

### Cross-file `$ref` rule

When a schema needs to reference a type from another schema, use a cross-file ref:

```json
{ "$ref": "./common.schema.json#/definitions/NetworkZone" }
```

The `spec-to-cdkx` tool handles cross-file refs differently depending on the kind
of definition they point to:

- **Named types** (enums like `NetworkZone`/`Location`, objects with `properties`)
  are emitted as named TypeScript types. The type is collected into a shared
  "Common" section in `resources.generated.ts` and emitted exactly once —
  properties reference it by name (e.g. `networkZone?: NetworkZone`).
- **Structural types** (e.g. `Labels` with `additionalProperties`) are inlined
  at the usage site — `TypeMapper` maps them directly to `Record<string, string>`
  etc., and no named type is emitted.

**Do NOT reference definitions from other resource schemas** (e.g. avoid
`"$ref": "./network.schema.json#/definitions/SomeType"`). If a type is needed only
in one resource's schema, define it locally in `definitions`. If it is shared, move
it to `common.schema.json`.

---

## `HetznerProvider` (`src/lib/provider/provider.ts`)

The provider class wires `@cdkx-io/hetzner` into the cdkx construct tree.

```ts
export interface HetznerProviderConfig {
  apiToken: string;
  baseUrl?: string;
  pollerOptions?: ActionPollerOptions;
}

export class HetznerProvider extends Provider {
  readonly identifier = 'hetzner';

  constructor(private readonly config?: HetznerProviderConfig) {
    super();
  }

  createAdapter(): HetznerAdapter {
    if (this.config?.apiToken === undefined) {
      throw new Error(
        'HetznerProvider: apiToken is required to create an adapter.',
      );
    }
    return new HetznerAdapter({
      apiToken: this.config.apiToken,
      baseUrl: this.config.baseUrl,
      pollerOptions: this.config.pollerOptions,
    });
  }
}
```

- Extends `Provider` from `@cdkx-io/core`.
- `identifier = 'hetzner'` — written to `manifest.json` as the `provider` field
  for each stack artifact.
- `getResolvers()`, `getSynthesizer()`, and `getEnvironment()` all inherit the
  base defaults (no custom resolvers, `JsonSynthesizer`, empty environment).
- `createAdapter()` — factory method returning a `HetznerAdapter` configured
  with the provider's API token and optional overrides. Throws if no `apiToken`
  is provided.
- Exported from `src/lib/provider/index.ts` and re-exported from `src/index.ts`.

---

## Adapter (`src/lib/adapter/`)

The adapter layer connects the `@cdkx-io/engine` deployment runtime to the
Hetzner Cloud REST API. It translates engine calls into HTTP requests and
handles async Hetzner actions transparently.

### Architecture

```
HetznerAdapter          ← implements ProviderAdapter from @cdkx-io/engine
 ├── HetznerClient      ← low-level HTTP client (node:https)
 ├── ActionPoller       ← polls GET /actions/{id} until complete
 └── RESOURCE_REGISTRY  ← static table: type → endpoints + extractors
```

### `HetznerClient` (`src/lib/adapter/hetzner-client.ts`)

Low-level HTTP client using `node:https` (no external dependencies).

```ts
const client = new HetznerClient({ apiToken, baseUrl?, logger? });
await client.get<T>(path);
await client.post<T>(path, body);
await client.put<T>(path, body);
await client.delete(path); // resolves void on 204
client.setLogger(logger); // set logger after construction
```

- All methods set `Authorization: Bearer <apiToken>` and `Content-Type: application/json`.
- Non-2xx responses throw with the Hetzner API error message (parsed from JSON or raw body).
- Default `baseUrl`: `https://api.hetzner.cloud/v1`.
- **Logger integration**: When a logger is provided, HTTP requests and responses are logged with event types:
  - `provider.http.request` — outgoing requests (debug level)
  - `provider.http.response` — successful responses (info level)
  - `provider.http.error` — failed requests (error level)
- **Automatic sanitization**: Sensitive headers and fields are automatically redacted using `Sanitizers` from `@cdkx-io/logger`.

### `ActionPoller` (`src/lib/adapter/action-poller.ts`)

Polls `GET /actions/{id}` until the action reaches a terminal state.

```ts
const poller = new ActionPoller(client, { pollInterval?: number, pollTimeout?: number });
await poller.poll(actionId); // resolves on success, throws on error or timeout
```

- Defaults: `pollInterval = 2000ms`, `pollTimeout = 300_000ms` (5 minutes).
- Uses `Promise.race` between the polling loop and a timeout promise. The
  timeout handle is always cancelled in a `finally` block to prevent unhandled
  rejections. The `assert` is registered before advancing timers in tests
  (see test for the correct fake-timer pattern).

### `RESOURCE_REGISTRY` (`src/lib/generated/resource-registry.generated.ts`)

**AUTO-GENERATED** — do not edit manually. Regenerate with:
`yarn nx run @cdkx-io/hetzner:codegen`

Static lookup table mapping each Hetzner resource type to its `ResourceConfig`.
Generated by `RegistryGenerator` from `schemas/v1/*.schema.json` `api` blocks.

```ts
interface ResourceConfig {
  createPath: string; // e.g. '/networks', '/networks/{networkId}/actions/add_subnet'
  getPath?: (id: string) => string;
  updatePath?: (id: string) => string;
  deletePath?: string | ((id: string) => string);
  extractPhysicalId: (response, properties) => string;
  extractOutputs: (response) => Record<string, unknown>;
  createOnlyProps: ReadonlySet<string>;
  isActionResource?: true; // true for Subnet + Route
  parentIdProp?: string; // prop to omit from action resource request body
  updateExcludeProps?: ReadonlySet<string>; // extra props to exclude from PUT body
}
```

Covers all 12 Hetzner resource types. Action resources (Subnet, Route) use
`isActionResource: true` and have `createPath` set to the parent-network action
endpoint (e.g. `/networks/{networkId}/actions/add_subnet`).

### `HetznerAdapter` (`src/lib/adapter/hetzner-adapter.ts`)

Implements `ProviderAdapter` from `@cdkx-io/engine`.

| Method                 | Behaviour                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `setLogger(logger)`    | Sets the logger for HTTP request/response logging. Propagates to `HetznerClient`.                                                                                        |
| `create()`             | POSTs to `createPath`; polls action if response contains `action.id`; returns `physicalId` + `outputs`.                                                                  |
| `update()`             | PUTs to `updatePath(physicalId)`; throws on create-only props in patch; throws for action resources.                                                                     |
| `delete()`             | DELETEs via `deletePath(physicalId)` for regular resources; POSTs to the parent-network action for action resources.                                                     |
| `validate()`           | Checks that `resource.type` is in `RESOURCE_REGISTRY`; throws with a helpful message if not.                                                                             |
| `getOutput()`          | GETs via `getPath(physicalId)` and extracts `attr` from `extractOutputs(response)`. Returns `undefined` for action resources.                                            |
| `getCreateOnlyProps()` | Returns `RESOURCE_REGISTRY[type]?.createOnlyProps ?? new Set()` — used by the engine to strip create-only props from the update patch before calling `adapter.update()`. |

**Action resource physicalId:** for Subnet/Route a composite key is stored —
`{networkId}:{discriminator}` (e.g. `42:10.0.1.0/24` for a Subnet). The adapter
reads `resource.properties` (fully resolved by the engine) to build request bodies
rather than parsing the composite ID.

**`physicalId` on `ManifestResource`:** `ManifestResource` in `@cdkx-io/engine` has
`readonly physicalId?: string` — added in the same session as the adapter. The engine
sets this from `ResourceState.physicalId` when calling `update()`, `delete()`, and
`getOutput()`.

### Tests

| File                      | Tests | Coverage                                                                                                      |
| ------------------------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| `hetzner-client.spec.ts`  | 12    | GET/POST/PUT/DELETE, non-2xx errors, custom baseUrl, socket errors                                            |
| `action-poller.spec.ts`   | 7     | immediate success, poll-until-success, error states, timeout, path, default interval                          |
| `hetzner-adapter.spec.ts` | 28    | create/update/delete/validate/getOutput/getCreateOnlyProps, action resources, polling, createOnly enforcement |

---

## Tests

### Unit tests: adapter (`src/lib/adapter/`)

Each adapter file has a co-located spec. See the adapter section above for the
test counts and coverage summary. Total adapter tests: **47** (12 + 7 + 28).

### Integration test: network topology (`test/integration/network-topology.spec.ts`)

Exercises a realistic Hetzner network topology: 1 `HtzNetwork` + 2 `HtzSubnet`s +
2 `HtzRoute`s + 1 `HtzLoadBalancer` = **6 resources** in a single stack.

**Permanent output:** `packages/providers/hetzner/hetzner/cdkx.out/` — files are written
by the test and **not cleaned up**, so they can be inspected after the test run.

**Run:** `yarn nx test @cdkx-io/hetzner`

**Dependencies:** `@cdkx-io/testing` (added as `devDependency` in `package.json`).

**Describe groups (36 tests total):**

| Group              | Tests |
| ------------------ | ----- |
| file system        | 2     |
| manifest           | 5     |
| snapshot           | 1     |
| resource count     | 1     |
| HtzNetwork         | 5     |
| HtzSubnet (web)    | 5     |
| HtzSubnet (app)    | 2     |
| HtzRoute (default) | 4     |
| HtzRoute (mgmt)    | 3     |
| HtzLoadBalancer    | 8     |

**Snapshot:** `test/integration/__snapshots__/network-topology.spec.ts.snap` —
written on first run; update with `--updateSnapshot` if resources change.

**Key assertions per resource:**

- Correct `type` string (e.g. `Hetzner::Networking::Network`)
- Cross-reference tokens `{ ref: logicalId, attr: 'networkId' }` for all
  `networkId` props that reference the parent `HtzNetwork`
- Optional props that are `undefined` are stripped from the output (not present)
- `metadata['cdkx:path']` reflects the construct node path

---

## Coding conventions

See `packages/core/AI.md` for the authoritative coding conventions. One
addition specific to this package:

| Rule             | Detail                                        |
| ---------------- | --------------------------------------------- |
| Specs co-located | `foo/foo.spec.ts` lives next to `foo/foo.ts`. |

---

## File map

```
packages/providers/hetzner/hetzner/
├── package.json                        name: @cdkx-io/hetzner (no "type" field — CommonJS)
│                                       dependencies: @cdkx-io/core, constructs, tslib
│                                       peerDependencies: @cdkx-io/engine
│                                       devDependencies: @cdkx-io/spec-to-cdkx, @cdkx-io/testing, @cdkx-io/engine
├── project.json                        Nx project config (includes codegen target)
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── tsconfig.scripts.json               tsconfig for future scripts/ (IDE support)
├── eslint.config.mjs
├── jest.config.cts
├── AI.md                          ← this file
├── README.md
├── schemas/
│   └── v1/
│       ├── common.schema.json          shared definitions (Labels, NetworkZone, Location)
│       ├── network.schema.json         Hetzner::Networking::Network
│       ├── subnet.schema.json          Hetzner::Networking::Subnet (action resource)
│       ├── route.schema.json           Hetzner::Networking::Route (action resource)
│       ├── floating-ip.schema.json     Hetzner::Networking::FloatingIp
│       ├── primary-ip.schema.json      Hetzner::Networking::PrimaryIp
│       ├── server.schema.json          Hetzner::Compute::Server
│       ├── load-balancer.schema.json   Hetzner::Compute::LoadBalancer
│       ├── placement-group.schema.json Hetzner::Compute::PlacementGroup
│       ├── volume.schema.json          Hetzner::Storage::Volume
│       ├── certificate.schema.json     Hetzner::Security::Certificate
│       ├── firewall.schema.json        Hetzner::Security::Firewall
│       └── ssh-key.schema.json         Hetzner::Security::SshKey
├── src/
│   ├── index.ts                        public barrel — exports provider + adapter + generated/
│   └── lib/
│       ├── generated/
│       │   ├── index.ts                barrel — re-exports both generated files
│       │   ├── resources.generated.ts  AUTO-GENERATED — L1 constructs, enums, HetznerResourceType
│       │   │                           regenerate with: yarn nx run @cdkx-io/hetzner:codegen
│       │   └── resource-registry.generated.ts  AUTO-GENERATED — RESOURCE_REGISTRY (12 types)
│       │                                       regenerate with: yarn nx run @cdkx-io/hetzner:codegen
│       ├── provider/
│       │   ├── provider.ts             HetznerProvider + HetznerProviderConfig
│       │   └── index.ts                barrel
│       └── adapter/
│           ├── hetzner-client.ts       HetznerClient — low-level HTTP client (node:https)
│           ├── hetzner-client.spec.ts  12 unit tests
│           ├── action-poller.ts        ActionPoller — polls GET /actions/{id}
│           ├── action-poller.spec.ts   7 unit tests
│           ├── hetzner-adapter.ts      HetznerAdapter implements ProviderAdapter
│           ├── hetzner-adapter.spec.ts 28 unit tests
│           └── index.ts                barrel
└── test/
    └── integration/
        ├── network-topology.spec.ts    36-test integration test (network topology)
        └── __snapshots__/
            └── network-topology.spec.ts.snap  Jest snapshot (written on first run)
```

Also written by tests (gitignored):

```
packages/providers/hetzner/hetzner/cdkx.out/
├── manifest.json                       cloud assembly manifest
└── HetznerNetworkStack.json            synthesized stack template
```
