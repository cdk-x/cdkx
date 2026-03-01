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
yarn nx run @cdk-x/hetzner:format        # format src/ with prettier
yarn nx run @cdk-x/hetzner:format:check  # check formatting without writing
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
 └── NtvHetznerServer  (L1 — future)
 └── NtvHetznerVolume  (L1 — future)
 └── ...
```

`HetznerProvider` extends `Provider` from `@cdk-x/core`. It:

- Sets `identifier = 'Hetzner'`
- (Future) overrides `getResolvers()` to add Hetzner-specific resolvers
- (Future) overrides `getSynthesizer()` to use a Hetzner-specific synthesizer
- (Future) overrides `getEnvironment()` to expose `project` and `datacenter`

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
type: HetznerResourceType.Networking.SUBNET;
```

Add a new domain group (`Compute`, `Storage`, etc.) when the first resource of
that domain is implemented.

---

### `NtvHetznerNetwork` (`src/lib/networking/ntc-hetzner-network.ts`)

L1 construct for `Hetzner::Network::Network`.

| Prop                    | Type                     | Required | Description                |
| ----------------------- | ------------------------ | -------- | -------------------------- |
| `name`                  | `string`                 | yes      | Network name               |
| `ipRange`               | `string`                 | yes      | CIDR block for the network |
| `labels`                | `Record<string, string>` | no       | Resource labels            |
| `exposeRoutesToVswitch` | `boolean`                | no       | Expose routes to vSwitch   |

#### Attributes

| Getter      | Type          | Resolves to                                  |
| ----------- | ------------- | -------------------------------------------- |
| `networkId` | `IResolvable` | `{ ref: this.logicalId, attr: 'networkId' }` |

Use `network.networkId` to pass the network reference to a subnet without knowing the concrete ID at construction time (the engine resolves it at deploy time).

---

### `NtvHetznerSubnet` (`src/lib/networking/ntv-hetzner-subnet.ts`)

L1 construct for `Hetzner::Network::Subnet`.

| Prop          | Type                              | Required | Description                          |
| ------------- | --------------------------------- | -------- | ------------------------------------ |
| `networkId`   | `string \| number \| IResolvable` | yes      | ID of the parent network             |
| `type`        | `SubnetType`                      | yes      | Subnet type (cloud, server, vswitch) |
| `networkZone` | `NetworkZone`                     | yes      | Network zone for the subnet          |
| `ipRange`     | `string`                          | yes      | CIDR block for the subnet            |
| `vswitchId`   | `number`                          | no       | vSwitch ID (only for `VSWITCH` type) |

#### Attributes

| Getter     | Type          | Resolves to                                 |
| ---------- | ------------- | ------------------------------------------- |
| `subnetId` | `IResolvable` | `{ ref: this.logicalId, attr: 'subnetId' }` |

Use `subnet.subnetId` to pass the subnet reference to other constructs (e.g. servers) without knowing the concrete ID at construction time.

#### `SubnetType` enum

| Member    | Value     |
| --------- | --------- |
| `CLOUD`   | `cloud`   |
| `SERVER`  | `server`  |
| `VSWITCH` | `vswitch` |

#### Cross-resource reference pattern (L1)

`networkId` accepts `string | number | IResolvable`. Pass `network.networkId` to
reference a sibling network — the resolver pipeline unwraps the token at synthesis
time to `{ ref: logicalId, attr: 'networkId' }`, which the engine uses at deploy
time to wire the real cloud ID:

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

The synthesized `networkId` in the stack JSON will be:

```json
"networkId": { "ref": "DefaultTestStackNetwork36EFB155", "attr": "networkId" }
```

#### Implicit dependency resolution

**No `addDependency()` calls are needed.** The engine infers creation order by
scanning the synthesized JSON for `{ ref, attr }` tokens:

- If `networkId` is `network.networkId` (a token), the engine detects the
  reference, creates the network first, reads its real cloud ID, and injects
  it before creating the subnet.
- If `networkId` is a hardcoded `string | number`, no dependency is recorded
  and creation order is not guaranteed — this is the user's responsibility.

This is a framework-level contract: always use attribute getters for
cross-resource references to get guaranteed ordering for free.

> **Note:** `ResourceAttribute` (which also produces `{ ref, attr }`) is for L2
> cross-resource references between `Resource` subclasses. For direct L1-to-L1
> references, each L1 class exposes attribute getters returning an `IResolvable`
> inline object directly — no L2 layer required.
>
> **Engine note:** when the engine package is created, its CONTEXT.md must
> document how it scans `{ ref, attr }` tokens and builds the dependency graph.

---

## Coding conventions

Identical to `@cdk-x/core`. Key points:

| Rule             | Detail                                                                             |
| ---------------- | ---------------------------------------------------------------------------------- |
| Everything OOP   | No standalone `export function`. All utilities are static methods on classes.      |
| No `any`         | Use `unknown` everywhere.                                                          |
| ESM imports      | All local imports use `.js` extension even though source is `.ts`.                 |
| Prettier         | Run `yarn nx run @cdk-x/hetzner:format` after writing or modifying any `.ts` file. |
| Specs co-located | `foo/foo.spec.ts` lives next to `foo/foo.ts`.                                      |
| Test helpers     | `test/helpers/` — not exported from the public barrel (`src/index.ts`).            |

---

## File map

```
packages/providers/hetzner/
├── package.json                              name: @cdk-x/hetzner, type: module
├── project.json                              Nx project configuration
├── CONTEXT.md                                ← this file
├── src/
│   ├── index.ts                              public barrel
│   └── lib/
│       ├── common/
│       │   ├── common.ts                     NetworkZone, Location enums + HetznerResourceType const
│       │   └── index.ts                      re-export barrel
│       ├── provider/
│       │   ├── hetzner.ts                    HetznerProvider class
│       │   ├── hetzner.spec.ts               unit tests
│       │   └── index.ts                      re-export barrel
│       └── networking/
│           ├── ntc-hetzner-network.ts        NtvHetznerNetwork L1 + HetznerNetwork interface
│           ├── ntc-hetzner-network.spec.ts   unit tests (10 tests, 1 snapshot)
│           ├── ntv-hetzner-subnet.ts         NtvHetznerSubnet L1 + HetznerSubnet interface + SubnetType enum
│           ├── ntv-hetzner-subnet.spec.ts    unit tests + cross-resource reference tests (29 tests, 2 snapshots)
│           └── __snapshots__/               co-located Jest snapshots
└── test/                                     (future integration tests)
```

---

## Release configuration

Part of the `core` release group in `nx.json`. Released in lock-step with
`@cdk-x/core` and `@cdk-x/testing`. Tag pattern: `core-v{version}`. See
`packages/core/CONTEXT.md` for full release configuration documentation.
