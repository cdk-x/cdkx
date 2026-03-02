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
| `server.schema.json`          | `Hetzner::Compute::Server`         | `/properties/serverId`                              |                                         |
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

---

## Coding conventions

Identical to `@cdk-x/core`. Key points:

| Rule             | Detail                                                                  |
| ---------------- | ----------------------------------------------------------------------- |
| Everything OOP   | No standalone `export function`. All utilities are static methods.      |
| No `any`         | Use `unknown` everywhere.                                               |
| ESM imports      | All local imports use `.js` extension even though source is `.ts`.      |
| Prettier         | Run `yarn nx run @cdk-x/hetzner:format` after modifying any `.ts` file. |
| Specs co-located | `foo/foo.spec.ts` lives next to `foo/foo.ts`.                           |

---

## File map

```
packages/providers/hetzner/
├── package.json                        name: @cdk-x/hetzner, type: module
├── project.json                        Nx project config
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── tsconfig.scripts.json               tsconfig for future scripts/ (IDE support)
├── eslint.config.mjs
├── jest.config.cts
├── CONTEXT.md                          ← this file
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
└── src/
    └── index.ts                        public barrel (empty — L1s not yet implemented)
```

---

## Release configuration

Part of the `core` release group in `nx.json`. Released in lock-step with
`@cdk-x/core`. Tag pattern: `core-v{version}`. See
`packages/core/CONTEXT.md` for full release configuration documentation.
