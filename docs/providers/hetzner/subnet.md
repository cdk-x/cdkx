# Subnet

`HtzSubnet` adds a subnet to an existing Hetzner Cloud network. Subnets carve out a CIDR block within the parent network and are bound to a network zone (region).

**Type:** `Hetzner::Networking::Subnet`
**Import:** `@cdk-x/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `networkId` | `number \| IResolvable` | ✅ | ID of the parent network. Use `network.attrNetworkId` for cross-resource wiring. |
| `type` | `NetworkSubnetType` | ✅ | Subnet type: `cloud`, `server`, or `vswitch`. Use `cloud` for standard servers. |
| `networkZone` | `NetworkZone` | ✅ | Network zone (region) where the subnet lives. See `NetworkZone` enum below. |
| `ipRange` | `string` | — | CIDR block for the subnet. If omitted, Hetzner auto-allocates a `/24` within the network range. |
| `vswitchId` | `number \| IResolvable` | — | Required when `type` is `vswitch` — ID of the Hetzner Robot vSwitch. |

### `NetworkZone` enum

| Value | Region |
|-------|--------|
| `NetworkZone.EU_CENTRAL` | Falkenstein, Nuremberg, Helsinki |
| `NetworkZone.US_EAST` | Ashburn (Virginia) |
| `NetworkZone.US_WEST` | Hillsboro (Oregon) |
| `NetworkZone.AP_SOUTHEAST` | Singapore |

### `NetworkSubnetType` enum

| Value | Description |
|-------|-------------|
| `cloud` | Standard subnet for cloud servers. Most common. |
| `server` | Subnet for dedicated/root servers (Hetzner Robot). |
| `vswitch` | vSwitch integration — requires `vswitchId`. |

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="11 12 13"
import { App, Stack } from '@cdk-x/core';
import { HtzNetwork, HtzSubnet, NetworkZone } from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'NetworkStack');

const network = new HtzNetwork(stack, 'Network', {
  name: 'my-network',
  ipRange: '10.0.0.0/8',
});

const subnet = new HtzSubnet(stack, 'Subnet', {
  networkId: network.attrNetworkId, // (1)!
  type: 'cloud',
  networkZone: NetworkZone.EU_CENTRAL, // (2)!
  ipRange: '10.0.1.0/24',
});

app.synth();
```

1. Cross-resource reference — the subnet is automatically deployed after the network.
2. `eu-central` covers all European Hetzner locations: Falkenstein (`fsn1`), Nuremberg (`nbg1`), Helsinki (`hel1`).

## Cross-resource reference example

Servers that need to be on the private network reference the subnet's network ID:

```typescript linenums="1" hl_lines="7"
import { HtzSubnet, HtzServer, ServerType, NetworkZone } from '@cdk-x/hetzner';

// subnet defined above ...

new HtzServer(stack, 'Server', {
  name: 'web-1',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  networks: [network.attrNetworkId], // (1)!
});
```

1. Attach the server to the network at creation time. The server will receive a private IP from the subnet range.

## Destroy behavior

The engine calls `DELETE /networks/{networkId}/actions/delete_subnet` to remove the subnet. Subnets must be empty (no servers attached) before deletion — the engine removes server attachments and dependent resources in reverse order before the subnet.

---

!!! info "See also"
    - [Network](network.md) — the parent network
    - [Route](route.md) — add static routes within the network
    - [Server](server.md) — attach servers to a subnet via `networks`
