# Network

`HtzNetwork` manages a [Hetzner Cloud private network](https://docs.hetzner.com/cloud/networks/overview). A network is the top-level container for all private networking — subnets and routes are added to it.

**Type:** `Hetzner::Networking::Network`
**Import:** `@cdk-x/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Name of the network. Must be unique within the project. |
| `ipRange` | `string` | ✅ | CIDR block for the network. Must be a private IPv4 range (RFC 1918). Minimum `/24`, recommended `/16` or larger. |
| `labels` | `Record<string, string>` | — | User-defined key/value labels for filtering and organization. |
| `exposeRoutesToVswitch` | `boolean` | — | Expose routes to a connected Hetzner Robot vSwitch. |

## Attribute getters

| Getter | Resolves to |
|--------|------------|
| `attrNetworkId` | The Hetzner-assigned network ID (integer). Used by `HtzSubnet`, `HtzRoute`, and `HtzServer`. |

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="6 7"
import { App, Stack } from '@cdk-x/core';
import { HtzNetwork } from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'NetworkStack');

const network = new HtzNetwork(stack, 'Network', {
  name: 'my-network',
  ipRange: '10.0.0.0/8', // (1)!
  labels: { env: 'production' },
});

app.synth();
```

1. RFC 1918 `/8` range. Use `/16` for production environments to have room for many subnets.

## Cross-resource reference example

Subnet and Route resources require the network ID. Use `attrNetworkId` instead of hardcoding — this guarantees the network is created first:

```typescript linenums="1" hl_lines="10 11"
import { HtzNetwork, HtzSubnet, NetworkZone } from '@cdk-x/hetzner';

const network = new HtzNetwork(stack, 'Network', {
  name: 'my-network',
  ipRange: '10.0.0.0/8',
});

new HtzSubnet(stack, 'Subnet', {
  networkId: network.attrNetworkId, // (1)!
  type: 'cloud',
  networkZone: NetworkZone.EU_CENTRAL,
  ipRange: '10.0.1.0/24',
});
```

1. `attrNetworkId` is an `IResolvable` — at synthesis it becomes `{ ref: "<logicalId>", attr: "networkId" }`. The engine resolves it to the actual integer ID after the network is created.

## Synthesized output

```json
{
  "NetworkStackNetworkA1B2C3D4": {
    "type": "Hetzner::Networking::Network",
    "provider": "hetzner",
    "properties": {
      "name": "my-network",
      "ipRange": "10.0.0.0/8",
      "labels": { "env": "production" }
    },
    "metadata": { "cdkx:path": "NetworkStack/Network" }
  }
}
```

## Destroy behavior

When `cdkx destroy` runs, the engine calls the Hetzner `DELETE /networks/{id}` API. The network cannot be deleted while it still has subnets or servers attached — the engine deletes dependent resources (subnets, servers) before the network, following reverse topological order.

---

!!! info "See also"
    - [Subnet](subnet.md) — add subnets to the network
    - [Route](route.md) — add static routes to the network
    - [Tokens](../../concepts/tokens.md) — how `attrNetworkId` resolves at deploy time
