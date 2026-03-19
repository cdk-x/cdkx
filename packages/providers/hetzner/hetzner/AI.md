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

The L1 constructs file is produced by the `codegen` run using `@cdkx-io/spec-to-cdkx`.
The generated file is committed to the repo.

```bash
yarn nx run @cdkx-io/hetzner:codegen
```

This runs:

```
spec-to-cdkx generate \
  --prefix Htz \
  --provider-name Hetzner \
  --resource-type-const HetznerResourceType
```

from the project root (`packages/providers/hetzner/hetzner/`). Reads schemas from
`schemas/v1/` and writes:

- `src/lib/generated/resources.generated.ts` — L1 constructs (interfaces, enums, classes)

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

| File                             | `typeName`                            | `primaryIdentifier`                                 | Notes                                   |
| -------------------------------- | ------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| `common.schema.json`             | —                                     | —                                                   | Shared definitions only                 |
| `network.schema.json`            | `Hetzner::Networking::Network`        | `/properties/networkId`                             |                                         |
| `subnet.schema.json`             | `Hetzner::Networking::Subnet`         | `/properties/networkId` + `/properties/ipRange`     | Action resource — all props create-only |
| `route.schema.json`              | `Hetzner::Networking::Route`          | `/properties/networkId` + `/properties/destination` | Action resource — all props create-only |
| `floating-ip.schema.json`        | `Hetzner::Networking::FloatingIp`     | `/properties/floatingipId`                          |                                         |
| `primary-ip.schema.json`         | `Hetzner::Networking::PrimaryIp`      | `/properties/id`                                    |                                         |
| `server.schema.json`             | `Hetzner::Compute::Server`            | `/properties/serverId`                              | Local `ServerType` enum (20 values)     |
| `load-balancer.schema.json`      | `Hetzner::Compute::LoadBalancer`      | `/properties/loadbalancerId`                        |                                         |
| `placement-group.schema.json`    | `Hetzner::Compute::PlacementGroup`    | `/properties/id`                                    |                                         |
| `volume.schema.json`             | `Hetzner::Storage::Volume`            | `/properties/volumeId`                              |                                         |
| `certificate.schema.json`        | `Hetzner::Security::Certificate`      | `/properties/certificateId`                         |                                         |
| `firewall.schema.json`           | `Hetzner::Security::Firewall`         | `/properties/firewallId`                            |                                         |
| `ssh-key.schema.json`            | `Hetzner::Security::SshKey`           | `/properties/name`                                  | `publicKey` is create-only              |
| `network-attachment.schema.json` | `Hetzner::Compute::NetworkAttachment` | `/properties/serverId` + `/properties/networkId`    | Action resource — all props create-only |

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
- Exported from `src/lib/provider/index.ts` and re-exported from `src/index.ts`.

---

## Deployment Runtime

The deployment runtime for Hetzner Cloud resources has been moved to the
separate package `@cdkx-io/hetzner-runtime`. This package (`@cdkx-io/hetzner`)
is responsible only for synthesizing resource manifests (construct tree → JSON).

The runtime package implements the handler-based architecture using:

- `HetznerNetworkHandler` and future handlers per resource type
- `HetznerProviderRuntime` — registers all handlers
- `HetznerRuntimeAdapterFactory` — creates a `RuntimeAdapter` for the engine

See `packages/providers/hetzner/hetzner-runtime/AI.md` for full details.

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
│   ├── index.ts                        public barrel — exports provider + generated/
│   └── lib/
│       ├── generated/
│       │   ├── index.ts                barrel — re-exports resources.generated.ts
│       │   └── resources.generated.ts  AUTO-GENERATED — L1 constructs, enums, HetznerResourceType
│       │                               regenerate with: yarn nx run @cdkx-io/hetzner:codegen
│       └── provider/
│           ├── provider.ts             HetznerProvider + HetznerProviderConfig
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
