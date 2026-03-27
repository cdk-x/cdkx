# Server

`HtzServer` manages a [Hetzner Cloud virtual machine](https://docs.hetzner.com/cloud/servers/overview). Servers are created from a base image, assigned a server type (size), and optionally attached to private networks, SSH keys, and firewalls.

**Type:** `Hetzner::Compute::Server`
**Import:** `@cdkx-io/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Server name. Must be unique per project and a valid hostname (RFC 1123). |
| `serverType` | `ServerType` | ✅ | Server size. See `ServerType` enum below. |
| `image` | `string` | ✅ | OS image to boot from. Use image name (e.g. `ubuntu-24.04`) or image ID. |
| `location` | `Location` | — | Hetzner location (datacenter). Mutually exclusive with `datacenter`. |
| `sshKeys` | `string[]` | — | SSH key names or IDs to inject at creation. |
| `networks` | `(number \| IResolvable)[]` | — | Network IDs to attach the server to at creation time. |
| `userData` | `string` | — | Cloud-Init user data script (max 32 KiB). |
| `labels` | `Record<string, string>` | — | Key/value labels. |
| `publicNet` | `ServerPublicNet` | — | Configure or disable the public IPv4/IPv6 interface. |
| `startAfterCreate` | `boolean` | — | Automatically power on the server after creation (default: `true`). |
| `volumes` | `(number \| IResolvable)[]` | — | Volume IDs to attach. Volumes must be in the same location. |

### `ServerType` enum (selected)

| Value | vCPU | RAM | Architecture |
|-------|------|-----|--------------|
| `ServerType.CX22` | 2 | 4 GB | Shared Intel |
| `ServerType.CX32` | 4 | 8 GB | Shared Intel |
| `ServerType.CPX11` | 2 | 2 GB | Shared AMD |
| `ServerType.CAX11` | 2 | 4 GB | Shared Arm64 |
| `ServerType.CCX13` | 2 | 8 GB | Dedicated vCPU |

Full list available in the `ServerType` enum exported from `@cdkx-io/hetzner`.

### `Location` enum

| Value | Datacenter |
|-------|-----------|
| `Location.FSN1` | Falkenstein, Germany |
| `Location.NBG1` | Nuremberg, Germany |
| `Location.HEL1` | Helsinki, Finland |
| `Location.ASH` | Ashburn, VA, USA |
| `Location.HIL` | Hillsboro, OR, USA |
| `Location.SIN` | Singapore |

## Attribute getters

| Getter | Resolves to |
|--------|------------|
| `attrServerId` | The Hetzner-assigned server ID (integer). |

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="18 19 20"
import { App, Stack } from '@cdkx-io/core';
import {
  HtzNetwork,
  HtzSubnet,
  HtzServer,
  ServerType,
  Location,
  NetworkZone,
} from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'ComputeStack');

const network = new HtzNetwork(stack, 'Network', {
  name: 'my-network',
  ipRange: '10.0.0.0/8',
});

const subnet = new HtzSubnet(stack, 'Subnet', { // (1)!
  networkId: network.attrNetworkId,
  type: 'cloud',
  networkZone: NetworkZone.EU_CENTRAL,
  ipRange: '10.0.1.0/24',
});

new HtzServer(stack, 'WebServer', {
  name: 'web-1',
  serverType: ServerType.CX22, // (2)!
  image: 'ubuntu-24.04',
  location: Location.NBG1,
  sshKeys: ['my-ssh-key'], // (3)!
  networks: [network.attrNetworkId], // (4)!
  userData: `#!/bin/bash
apt-get update -y
apt-get install -y nginx`, // (5)!
  labels: { role: 'web', env: 'production' },
});

app.synth();
```

1. Network and subnet are deployed first — server depends on them via the `networks` token.
2. `cx22` = 2 vCPU / 4 GB RAM shared Intel. See the table above for all types.
3. SSH key name to inject. Use `sshKey.attrName` if the key is managed by `HtzSshKey` in the same stack — the engine will deploy the key first.
4. Attaches the server to the private network at creation — it will receive an IP from `10.0.1.0/24`.
5. Cloud-Init script runs once on first boot. Limited to 32 KiB.

## Cross-resource reference example

Reference a server's ID from another resource (e.g. a floating IP or volume attachment):

```typescript linenums="1" hl_lines="8"
import { HtzServer, HtzFloatingIp, FloatingIpType, Location } from '@cdkx-io/hetzner';

const server = new HtzServer(stack, 'Server', {
  name: 'web-1',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
});

new HtzFloatingIp(stack, 'PublicIp', {
  type: FloatingIpType.IPV4,
  homeLocation: Location.NBG1,
  serverId: server.attrServerId, // (1)!
});
```

1. `attrServerId` resolves to `{ ref: "ComputeStackServerXXXX", attr: "serverId" }` — the engine assigns the floating IP after the server is created.

## Disable public network

For servers that should only be reachable via the private network:

```typescript linenums="1" hl_lines="6 7 8"
new HtzServer(stack, 'PrivateServer', {
  name: 'db-1',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  networks: [network.attrNetworkId],
  publicNet: {
    enableIpv4: false, // (1)!
    enableIpv6: false,
  },
});
```

1. Disabling the public interface is recommended for database or internal servers. The server is only reachable from the private network.

## Destroy behavior

The engine calls `DELETE /servers/{id}`. This powers off and permanently deletes the server and its root disk. Attached volumes are **not** deleted — they are detached and retained unless destroyed separately.

!!! warning "Data loss"
    Destroying a server permanently deletes the root disk. Back up any data you need before running `cdkx destroy`.

---

!!! info "See also"
    - [Network](network.md) — create a private network first
    - [Subnet](subnet.md) — subnet the server attaches to
    - [SSH Key](ssh-key.md) — manage SSH keys as constructs
    - [Certificate](certificate.md) — TLS certificates for HTTPS
    - [Deployment Lifecycle](../../concepts/deployment-lifecycle.md) — creation order
