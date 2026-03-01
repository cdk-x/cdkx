# @cdk-x/hetzner — Development Context

This file captures the full design, architecture, and implementation details of
`@cdk-x/hetzner` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/providers/hetzner` is
> modified — classes, interfaces, file structure, conventions, or design
> decisions — this file must be updated in the same change to stay accurate.

---

## What is @cdk-x/hetzner?

**@cdk-x/hetzner** is the Hetzner Cloud provider package for cdkx. It extends
`@cdk-x/core` to allow synthesizing Hetzner Cloud resource manifests from a
construct tree.

Users attach a `HetznerProvider` to a `Stack` and add `NtvHetznerXxx` L1
constructs (or future L2 constructs) to that stack. Calling `app.synth()`
produces a JSON file describing the Hetzner Cloud resources.

---

## Workspace setup

| Property        | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| Monorepo tool   | Nx 22                                                       |
| Package manager | Yarn (yarn.lock at root)                                    |
| Language        | TypeScript 5.9, strict mode, ESM (`"type": "module"`)       |
| Build tool      | `@nx/js:tsc` — emits JS + `.d.ts` + `.d.ts.map`             |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                                 |
| Linter          | ESLint with `@typescript-eslint`                            |
| Formatter       | Prettier ~3.6 (`.prettierrc` at workspace root)             |
| Node            | ESM — all local imports use `.js` extension                 |
| Output dir      | `packages/providers/hetzner/dist/` — JS + type declarations |

Run tasks via Nx:

```bash
yarn nx lint @cdk-x/hetzner
yarn nx test @cdk-x/hetzner
yarn nx build @cdk-x/hetzner
yarn nx run @cdk-x/hetzner:codegen      # regenerate all L1 files + engine JSON
yarn nx run @cdk-x/hetzner:format       # format src/ with prettier
yarn nx run @cdk-x/hetzner:format:check # check formatting without writing
```

---

## Package identity

| Field         | Value                                            |
| ------------- | ------------------------------------------------ |
| `name`        | `@cdk-x/hetzner`                                 |
| `version`     | `0.0.1` (lock-stepped with `core` release group) |
| Release group | `core` (fixed versioning, tag `core-v{version}`) |

---

## Architecture

```
Stack (provider: HetznerProvider)
 └── NtvHetznerNetwork       (L1 — Networking)
 └── NtvHetznerFloatingIp    (L1 — Networking)
 └── NtvHetznerPrimaryIp     (L1 — Networking)
 └── NtvHetznerSubnet        (L1 — Networking, manually written)
 └── NtvHetznerServer        (L1 — Compute)
 └── NtvHetznerLoadBalancer  (L1 — Compute)
 └── NtvHetznerPlacementGroup (L1 — Compute)
 └── NtvHetznerVolume        (L1 — Storage)
 └── NtvHetznerCertificate   (L1 — Security)
 └── NtvHetznerFirewall      (L1 — Security)
 └── NtvHetznerSshKey        (L1 — Security)
```

`HetznerProvider` extends `Provider` from `@cdk-x/core`. It:

- Sets `identifier = 'Hetzner'`
- (Future) overrides `getResolvers()` to add Hetzner-specific resolvers
- (Future) overrides `getSynthesizer()` to use a Hetzner-specific synthesizer
- (Future) overrides `getEnvironment()` to expose `project` and `datacenter`

---

## Codegen

Most L1 files are **auto-generated** from the Hetzner Cloud OpenAPI spec
(`https://docs.hetzner.cloud/cloud.spec.json`) using the codegen subsystem in
`@cdk-x/core`. Only `NtvHetznerSubnet` is handwritten.

Run:

```bash
yarn nx run @cdk-x/hetzner:codegen
```

This:

1. Downloads (or loads from `scripts/.cache/`) the OpenAPI spec.
2. Extracts `ResourceSpec[]` via `HetznerExtractor`.
3. Writes 10 TypeScript L1 files to `src/lib/<domain>/`.
4. Writes `src/hetzner-resources.json` for the engine.

**Do not hand-edit auto-generated files** — they begin with
`// AUTO-GENERATED — do not edit manually.` and are overwritten on every
codegen run.

### `HetznerExtractor` (`scripts/codegen/hetzner-extractor.ts`)

Extends `OpenAPIExtractor` from `@cdk-x/core`. Implements `extractResources()`
using `HETZNER_RESOURCE_PATHS` and `HETZNER_DOMAIN_MAP`.

Key behaviours:

- Only generates resources listed in `HETZNER_RESOURCE_PATHS` (those with a
  POST endpoint at the collection level).
- `isAsync` detection: POST 201 response contains an `"action"` or `"actions"`
  key → `isAsync: true`.
- Uses `PUT` (not `PATCH`) for update operations.
- Deep nested interfaces (e.g. `FirewallApplyToServer` inside `FirewallApplyTo`)
  are flattened to the top level of the generated file.
- `providerType` format: `Hetzner::{Domain}::{ResourceName}` (e.g.
  `Hetzner::Networking::Network`).

### `scripts/codegen/hetzner-domain-map.ts`

| Export                   | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| `HETZNER_DOMAIN_MAP`     | Maps PascalCase resource name → domain string (`Networking`, etc.)           |
| `HETZNER_RESOURCE_PATHS` | Maps snake_case path segment → PascalCase resource name for all 10 resources |

---

## Class inventory

### `HetznerProvider` (`src/lib/provider/hetzner.ts`)

Extends `Provider`.

| Member               | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `identifier: string` | `'Hetzner'` — used in `manifest.json` `provider` field |

Constructor accepts `HetznerProviderProps` (future — credentials, project, datacenter).

---

### Common types (`src/lib/common/common.ts`)

Shared enums and constants used across all Hetzner resource constructs.

#### `NetworkZone`

Hetzner Cloud network zones. Resources within a stack (subnets, floating IPs,
load balancers) must belong to the same network zone.

| Member         | Value          |
| -------------- | -------------- |
| `EU_CENTRAL`   | `eu-central`   |
| `US_EAST`      | `us-east`      |
| `US_WEST`      | `us-west`      |
| `AP_SOUTHEAST` | `ap-southeast` |

#### `Location`

Hetzner Cloud physical locations.

| Member | Value  | City              | Network zone |
| ------ | ------ | ----------------- | ------------ |
| `FSN1` | `fsn1` | Falkenstein, DE   | eu-central   |
| `NBG1` | `nbg1` | Nuremberg, DE     | eu-central   |
| `HEL1` | `hel1` | Helsinki, FI      | eu-central   |
| `ASH`  | `ash`  | Ashburn, VA, US   | us-east      |
| `HIL`  | `hil`  | Hillsboro, OR, US | us-west      |
| `SIN`  | `sin`  | Singapore         | ap-southeast |

#### `HetznerResourceType`

`as const` object grouping all Hetzner resource type identifier strings by
domain. Use instead of raw strings when setting `type` on a `ProviderResource`
— eliminates typos and provides autocompletion.

```ts
type: HetznerResourceType.Networking.NETWORK;
type: HetznerResourceType.Compute.SERVER;
```

| Domain       | Key              | Value                              |
| ------------ | ---------------- | ---------------------------------- |
| `Networking` | `NETWORK`        | `Hetzner::Networking::Network`     |
| `Networking` | `SUBNET`         | `Hetzner::Networking::Subnet`      |
| `Networking` | `FLOATINGIP`     | `Hetzner::Networking::FloatingIp`  |
| `Networking` | `PRIMARYIP`      | `Hetzner::Networking::PrimaryIp`   |
| `Compute`    | `SERVER`         | `Hetzner::Compute::Server`         |
| `Compute`    | `LOADBALANCER`   | `Hetzner::Compute::LoadBalancer`   |
| `Compute`    | `PLACEMENTGROUP` | `Hetzner::Compute::PlacementGroup` |
| `Storage`    | `VOLUME`         | `Hetzner::Storage::Volume`         |
| `Security`   | `CERTIFICATE`    | `Hetzner::Security::Certificate`   |
| `Security`   | `FIREWALL`       | `Hetzner::Security::Firewall`      |
| `Security`   | `SSHKEY`         | `Hetzner::Security::SshKey`        |

---

### Networking L1s

#### `NtvHetznerNetwork` (`src/lib/networking/ntv-hetzner-network.ts`) — AUTO-GENERATED

L1 construct for `Hetzner::Networking::Network`.

| Prop                    | Type                     | Required | Description                     |
| ----------------------- | ------------------------ | -------- | ------------------------------- |
| `name`                  | `string`                 | yes      | Network name                    |
| `ipRange`               | `string`                 | yes      | CIDR block for the network      |
| `labels`                | `Record<string, string>` | no       | Resource labels                 |
| `subnets`               | `NetworkSubnet[]`        | no       | Subnets to allocate at creation |
| `routes`                | `NetworkRoute[]`         | no       | Routes to set                   |
| `exposeRoutesToVswitch` | `boolean`                | no       | Expose routes to vSwitch        |

Nested interfaces: `NetworkSubnet` (includes `NetworkSubnetType` enum), `NetworkRoute`.

| Getter      | Type          | Resolves to                                  |
| ----------- | ------------- | -------------------------------------------- |
| `networkId` | `IResolvable` | `{ ref: this.logicalId, attr: 'networkId' }` |

#### `NtvHetznerFloatingIp` (`src/lib/networking/ntv-hetzner-floating-ip.ts`) — AUTO-GENERATED

L1 construct for `Hetzner::Networking::FloatingIp`.

| Prop           | Type                     | Required | Description                  |
| -------------- | ------------------------ | -------- | ---------------------------- |
| `type`         | `FloatingIpType`         | yes      | `ipv4` or `ipv6`             |
| `server`       | `number \| null`         | no       | Server the IP is assigned to |
| `homeLocation` | `string`                 | no       | Home location                |
| `description`  | `string \| null`         | no       | Description                  |
| `name`         | `string`                 | no       | Resource name                |
| `labels`       | `Record<string, string>` | no       | Resource labels              |

Enum: `FloatingIpType` (`IPV4`, `IPV6`).

| Getter         | Type          | Resolves to                                     |
| -------------- | ------------- | ----------------------------------------------- |
| `floatingipId` | `IResolvable` | `{ ref: this.logicalId, attr: 'floatingipId' }` |

#### `NtvHetznerPrimaryIp` (`src/lib/networking/ntv-hetzner-primary-ip.ts`) — AUTO-GENERATED

L1 construct for `Hetzner::Networking::PrimaryIp`.

| Prop           | Type                                      | Required | Description                         |
| -------------- | ----------------------------------------- | -------- | ----------------------------------- |
| `name`         | `string`                                  | yes      | Resource name                       |
| `type`         | `PrimaryIpType`                           | yes      | `ipv4` or `ipv6`                    |
| `assigneeType` | `PrimaryIpAssigneeType`                   | yes      | Always `server`                     |
| `assigneeId`   | `string \| number \| IResolvable \| null` | no       | Server to assign to                 |
| `labels`       | `Record<string, string>`                  | no       | Resource labels                     |
| `datacenter`   | `string`                                  | no       | **Deprecated** — removed after 2026 |
| `location`     | `string`                                  | no       | Location ID or name                 |
| `autoDelete`   | `boolean`                                 | no       | Auto-delete when unassigned         |

Enums: `PrimaryIpType` (`IPV4`, `IPV6`), `PrimaryIpAssigneeType` (`SERVER`).

| Getter        | Type          | Resolves to                                    |
| ------------- | ------------- | ---------------------------------------------- |
| `primaryipId` | `IResolvable` | `{ ref: this.logicalId, attr: 'primaryipId' }` |

#### `NtvHetznerSubnet` (`src/lib/networking/ntv-hetzner-subnet.ts`) — HANDWRITTEN

L1 construct for `Hetzner::Networking::Subnet`.

| Prop          | Type                              | Required | Description                          |
| ------------- | --------------------------------- | -------- | ------------------------------------ |
| `networkId`   | `string \| number \| IResolvable` | yes      | ID of the parent network             |
| `type`        | `SubnetType`                      | yes      | Subnet type (cloud, server, vswitch) |
| `networkZone` | `NetworkZone`                     | yes      | Network zone for the subnet          |
| `ipRange`     | `string`                          | yes      | CIDR block for the subnet            |
| `vswitchId`   | `number`                          | no       | vSwitch ID (only for `VSWITCH` type) |

Enum: `SubnetType` (`CLOUD`, `SERVER`, `VSWITCH`).

| Getter     | Type          | Resolves to                                 |
| ---------- | ------------- | ------------------------------------------- |
| `subnetId` | `IResolvable` | `{ ref: this.logicalId, attr: 'subnetId' }` |

---

### Compute L1s

#### `NtvHetznerServer` (`src/lib/compute/ntv-hetzner-server.ts`) — AUTO-GENERATED

L1 construct for `Hetzner::Compute::Server`.

| Prop               | Type                           | Required | Description                           |
| ------------------ | ------------------------------ | -------- | ------------------------------------- |
| `name`             | `string`                       | yes      | Server name (valid RFC 1123 hostname) |
| `serverType`       | `string`                       | yes      | Server type ID or name                |
| `image`            | `string`                       | yes      | Image ID or name                      |
| `location`         | `string`                       | no       | Location ID or name                   |
| `datacenter`       | `string`                       | no       | **Deprecated** — removed after 2026   |
| `startAfterCreate` | `boolean`                      | no       | Power on after creation               |
| `placementGroup`   | `number`                       | no       | Placement group ID                    |
| `sshKeys`          | `string[]`                     | no       | SSH key IDs or names                  |
| `volumes`          | `Array<number \| IResolvable>` | no       | Volume IDs to attach                  |
| `networks`         | `Array<number \| IResolvable>` | no       | Network IDs to attach                 |
| `firewalls`        | `ServerFirewall[]`             | no       | Firewalls to apply                    |
| `userData`         | `string`                       | no       | Cloud-Init user data (max 32KiB)      |
| `labels`           | `Record<string, string>`       | no       | Resource labels                       |
| `automount`        | `boolean`                      | no       | Auto-mount volumes                    |
| `publicNet`        | `ServerPublicNet`              | no       | Public network options                |

Nested interfaces: `ServerFirewall`, `ServerPublicNet`.

| Getter     | Type          | Resolves to                                 |
| ---------- | ------------- | ------------------------------------------- |
| `serverId` | `IResolvable` | `{ ref: this.logicalId, attr: 'serverId' }` |

#### `NtvHetznerLoadBalancer` (`src/lib/compute/ntv-hetzner-load-balancer.ts`) — AUTO-GENERATED

L1 construct for `Hetzner::Compute::LoadBalancer`.

| Prop               | Type                     | Required | Description                      |
| ------------------ | ------------------------ | -------- | -------------------------------- |
| `name`             | `string`                 | yes      | Load Balancer name               |
| `loadBalancerType` | `string`                 | yes      | Load Balancer type ID or name    |
| `algorithm`        | `LoadBalancerAlgorithm`  | no       | Algorithm configuration          |
| `services`         | `LoadBalancerService[]`  | no       | Services to configure            |
| `targets`          | `LoadBalancerTarget[]`   | no       | Targets to balance to            |
| `labels`           | `Record<string, string>` | no       | Resource labels                  |
| `publicInterface`  | `boolean`                | no       | Enable/disable public interface  |
| `network`          | `number`                 | no       | Network ID to attach on creation |
| `networkZone`      | `string`                 | no       | Network zone name                |
| `location`         | `string`                 | no       | Location ID or name              |

Nested interfaces: `LoadBalancerAlgorithm`, `LoadBalancerService`,
`LoadBalancerServiceHealthCheck`, `LoadBalancerServiceHealthCheckHttp`,
`LoadBalancerServiceHttp`, `LoadBalancerTarget`, `LoadBalancerTargetServer`,
`LoadBalancerTargetLabelSelector`, `LoadBalancerTargetIp`.

Enums: `LoadBalancerAlgorithmType`, `LoadBalancerServiceProtocol`,
`LoadBalancerServiceHealthCheckProtocol`, `LoadBalancerTargetType`.

| Getter           | Type          | Resolves to                                       |
| ---------------- | ------------- | ------------------------------------------------- |
| `loadbalancerId` | `IResolvable` | `{ ref: this.logicalId, attr: 'loadbalancerId' }` |

#### `NtvHetznerPlacementGroup` (`src/lib/compute/ntv-hetzner-placement-group.ts`) — AUTO-GENERATED

L1 construct for `Hetzner::Compute::PlacementGroup`.

| Prop     | Type                     | Required | Description          |
| -------- | ------------------------ | -------- | -------------------- |
| `name`   | `string`                 | yes      | Placement group name |
| `type`   | `PlacementGroupType`     | yes      | Always `spread`      |
| `labels` | `Record<string, string>` | no       | Resource labels      |

Enum: `PlacementGroupType` (`SPREAD`).

| Getter             | Type          | Resolves to                                         |
| ------------------ | ------------- | --------------------------------------------------- |
| `placementgroupId` | `IResolvable` | `{ ref: this.logicalId, attr: 'placementgroupId' }` |

---

### Storage L1s

#### `NtvHetznerVolume` (`src/lib/storage/ntv-hetzner-volume.ts`) — AUTO-GENERATED

L1 construct for `Hetzner::Storage::Volume`.

| Prop        | Type                     | Required | Description                              |
| ----------- | ------------------------ | -------- | ---------------------------------------- |
| `size`      | `number`                 | yes      | Volume size in GB                        |
| `name`      | `string`                 | yes      | Volume name                              |
| `labels`    | `Record<string, string>` | no       | Resource labels                          |
| `automount` | `boolean`                | no       | Auto-mount after attach                  |
| `format`    | `string`                 | no       | Format: `xfs` or `ext4`                  |
| `location`  | `string`                 | no       | Location (can omit if `server` is given) |
| `server`    | `number`                 | no       | Server to attach to after creation       |

| Getter     | Type          | Resolves to                                 |
| ---------- | ------------- | ------------------------------------------- |
| `volumeId` | `IResolvable` | `{ ref: this.logicalId, attr: 'volumeId' }` |

---

### Security L1s

#### `NtvHetznerCertificate` (`src/lib/security/ntv-hetzner-certificate.ts`) — AUTO-GENERATED

L1 construct for `Hetzner::Security::Certificate`.

| Prop          | Type                     | Required | Description                                      |
| ------------- | ------------------------ | -------- | ------------------------------------------------ |
| `name`        | `string`                 | yes      | Certificate name                                 |
| `labels`      | `Record<string, string>` | no       | Resource labels                                  |
| `type`        | `CertificateType`        | no       | `uploaded` or `managed`                          |
| `certificate` | `string`                 | no       | PEM certificate chain (required for uploaded)    |
| `privateKey`  | `string`                 | no       | PEM private key (required for uploaded)          |
| `domainNames` | `string[]`               | no       | Domains for Let's Encrypt (required for managed) |

Enum: `CertificateType` (`UPLOADED`, `MANAGED`).

| Getter          | Type          | Resolves to                                      |
| --------------- | ------------- | ------------------------------------------------ |
| `certificateId` | `IResolvable` | `{ ref: this.logicalId, attr: 'certificateId' }` |

#### `NtvHetznerFirewall` (`src/lib/security/ntv-hetzner-firewall.ts`) — AUTO-GENERATED

L1 construct for `Hetzner::Security::Firewall`.

| Prop      | Type                     | Required | Description             |
| --------- | ------------------------ | -------- | ----------------------- |
| `name`    | `string`                 | yes      | Firewall name           |
| `labels`  | `Record<string, string>` | no       | Resource labels         |
| `rules`   | `FirewallRule[]`         | no       | Firewall rules (max 50) |
| `applyTo` | `FirewallApplyTo[]`      | no       | Resources to apply to   |

Nested interfaces (flat in generated file): `FirewallRule`, `FirewallApplyTo`,
`FirewallApplyToServer`, `FirewallApplyToLabelSelector`.

Enums: `FirewallRuleDirection` (`IN`, `OUT`), `FirewallRuleProtocol`
(`TCP`, `UDP`, `ICMP`, `ESP`, `GRE`), `FirewallApplyToType` (`SERVER`, `LABEL_SELECTOR`).

| Getter       | Type          | Resolves to                                   |
| ------------ | ------------- | --------------------------------------------- |
| `firewallId` | `IResolvable` | `{ ref: this.logicalId, attr: 'firewallId' }` |

#### `NtvHetznerSshKey` (`src/lib/security/ntv-hetzner-ssh-key.ts`) — AUTO-GENERATED

L1 construct for `Hetzner::Security::SshKey`.

| Prop        | Type                     | Required | Description       |
| ----------- | ------------------------ | -------- | ----------------- |
| `name`      | `string`                 | yes      | SSH key name      |
| `publicKey` | `string`                 | yes      | Public key string |
| `labels`    | `Record<string, string>` | no       | Resource labels   |

| Getter     | Type          | Resolves to                                 |
| ---------- | ------------- | ------------------------------------------- |
| `sshkeyId` | `IResolvable` | `{ ref: this.logicalId, attr: 'sshkeyId' }` |

---

## Cross-resource reference pattern (L1)

All L1 attribute getters (`networkId`, `serverId`, etc.) return an `IResolvable`
that resolves to `{ ref: logicalId, attr: attrName }`. Pass these to other
resources' ID props instead of hardcoding concrete IDs:

```ts
const network = new NtvHetznerNetwork(stack, 'Network', {
  name: 'my-network',
  ipRange: '10.0.0.0/16',
});

const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
  networkId: network.networkId, // ← IResolvable, resolved at synthesis time
  type: SubnetType.CLOUD,
  networkZone: NetworkZone.EU_CENTRAL,
  ipRange: '10.0.1.0/24',
});
```

The synthesized JSON will contain:

```json
"networkId": { "ref": "DefaultTestStackNetwork36EFB155", "attr": "networkId" }
```

The engine scans for `{ ref, attr }` tokens to infer the dependency graph and
guarantees correct creation order. No `addDependency()` calls are needed.

> **Engine note:** when the engine package is created, its CONTEXT.md must
> document how it scans `{ ref, attr }` tokens and builds the dependency graph.

---

## Engine JSON (`src/hetzner-resources.json`)

Auto-generated by `yarn nx run @cdk-x/hetzner:codegen`. Contains API metadata
for all 10 resources, keyed by `providerType`. Used by the engine at deploy time
to know CRUD paths, HTTP methods, async behaviour, response key, etc.

Example entry:

```json
{
  "Hetzner::Networking::Network": {
    "resourceName": "Network",
    "domain": "Networking",
    "providerType": "Hetzner::Networking::Network",
    "api": {
      "createPath": "/networks",
      "idPath": "/networks/{id}",
      "createMethod": "POST",
      "updateMethod": "PUT",
      "deleteMethod": "DELETE",
      "responseResourceKey": "network",
      "idField": "id",
      "isAsync": false
    }
  }
}
```

---

## Coding conventions

Identical to `@cdk-x/core`. Key points:

| Rule             | Detail                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| Everything OOP   | No standalone `export function`. All utilities are static methods on classes.                                    |
| No `any`         | Use `unknown` everywhere.                                                                                        |
| ESM imports      | All local imports use `.js` extension even though source is `.ts`.                                               |
| Prettier         | Run `yarn nx run @cdk-x/hetzner:format` after writing or modifying any `.ts` file.                               |
| Specs co-located | `foo/foo.spec.ts` lives next to `foo/foo.ts`.                                                                    |
| Test helpers     | `test/helpers/` — not exported from the public barrel (`src/index.ts`).                                          |
| Generated files  | Do **not** hand-edit files marked `AUTO-GENERATED`. Run `codegen` to regenerate.                                 |
| `PropertyValue`  | Always imported in generated L1 files; `properties` cast as `props as unknown as Record<string, PropertyValue>`. |

---

## Key gotchas

### 1. Generated L1 files use `props as unknown as Record<string, PropertyValue>`

TypeScript cannot prove that nested interface arrays (e.g. `NetworkSubnet[]`)
are assignable to `Record<string, PropertyValue>` without the cast. This is
intentional — every generated L1 constructor has this cast.

### 2. Deep nested interfaces are flattened

All nested interfaces are emitted at the top level of the generated file, not
nested within each other. For example, `FirewallApplyToServer` and
`FirewallApplyToLabelSelector` appear as standalone interfaces alongside
`FirewallApplyTo`, which references them by name.

### 3. `NtvHetznerSubnet` is the only handwritten L1

All other L1s are auto-generated. `NtvHetznerSubnet` is hand-maintained because
the Hetzner API uses a separate `/networks/{id}/actions/add_subnet` endpoint
(not a POST at `/subnets`) — the codegen only handles resources with a POST
at the collection level.

### 4. `tsconfig.scripts.json` is for IDE support only

`tsx` does not require `tsconfig.scripts.json` at runtime. It exists solely to
give editors type-checking context for the `scripts/` directory.

### 5. `codegen` target depends on `@cdk-x/core:build`

The `codegen` Nx target in `project.json` has `"dependsOn": ["@cdk-x/core:build"]`
so the `@cdk-x/core` dist is always built before the script imports from it.

---

## File map

```
packages/providers/hetzner/
├── package.json                                   name: @cdk-x/hetzner, type: module
├── project.json                                   Nx project config (includes codegen target)
├── tsconfig.scripts.json                          tsconfig for scripts/ (IDE support only)
├── tsconfig.spec.json                             includes scripts/**/*.ts
├── CONTEXT.md                                     ← this file
├── scripts/
│   ├── generate.ts                                codegen entry point (tsx)
│   ├── .cache/                                    cached Hetzner OpenAPI spec (gitignored)
│   └── codegen/
│       ├── hetzner-domain-map.ts                  HETZNER_DOMAIN_MAP + HETZNER_RESOURCE_PATHS
│       ├── hetzner-extractor.ts                   HetznerExtractor extends OpenAPIExtractor
│       └── hetzner-extractor.spec.ts              29 tests
└── src/
    ├── index.ts                                   public barrel (all L1s + provider + common)
    ├── hetzner-resources.json                     engine JSON (auto-generated)
    └── lib/
        ├── common/
        │   ├── common.ts                          NetworkZone, Location, HetznerResourceType
        │   └── index.ts                           re-export barrel
        ├── provider/
        │   ├── hetzner.ts                         HetznerProvider class
        │   ├── hetzner.spec.ts                    unit tests
        │   └── index.ts                           re-export barrel
        ├── networking/
        │   ├── ntv-hetzner-network.ts             AUTO-GENERATED L1 + NetworkSubnet/Route/Enum
        │   ├── ntv-hetzner-floating-ip.ts         AUTO-GENERATED L1 + FloatingIpType enum
        │   ├── ntv-hetzner-primary-ip.ts          AUTO-GENERATED L1 + PrimaryIpType/AssigneeType enums
        │   ├── ntv-hetzner-subnet.ts              HANDWRITTEN L1 + SubnetType enum
        │   ├── ntc-hetzner-network.spec.ts        tests for NtvHetznerNetwork (10 tests, 1 snapshot)
        │   ├── ntv-hetzner-subnet.spec.ts         tests for NtvHetznerSubnet (29 tests, 2 snapshots)
        │   └── __snapshots__/                     co-located Jest snapshots
        ├── compute/
        │   ├── ntv-hetzner-server.ts              AUTO-GENERATED L1 + nested interfaces
        │   ├── ntv-hetzner-load-balancer.ts       AUTO-GENERATED L1 + many nested interfaces/enums
        │   └── ntv-hetzner-placement-group.ts     AUTO-GENERATED L1 + PlacementGroupType enum
        ├── storage/
        │   └── ntv-hetzner-volume.ts              AUTO-GENERATED L1
        └── security/
            ├── ntv-hetzner-certificate.ts         AUTO-GENERATED L1 + CertificateType enum
            ├── ntv-hetzner-firewall.ts            AUTO-GENERATED L1 + nested interfaces/enums
            └── ntv-hetzner-ssh-key.ts             AUTO-GENERATED L1
```

---

## Release configuration

Part of the `core` release group in `nx.json`. Released in lock-step with
`@cdk-x/core`. Tag pattern: `core-v{version}`. See
`packages/core/CONTEXT.md` for full release configuration documentation.
