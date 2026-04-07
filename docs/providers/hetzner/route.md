# Route

`HtzRoute` adds a static route to an existing Hetzner Cloud network. Routes direct traffic destined for a CIDR block to a specific gateway IP within the network.

**Type:** `Hetzner::Networking::Route`
**Import:** `@cdk-x/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `networkId` | `number \| IResolvable` | ✅ | ID of the network to add the route to. Use `network.attrNetworkId`. |
| `destination` | `string` | ✅ | Destination network in CIDR notation (e.g. `10.100.1.0/24`). Traffic for this range is forwarded to `gateway`. |
| `gateway` | `string` | ✅ | Gateway IP address within the network. Cannot be the first IP of the network range or `172.31.1.1`. |

!!! note "No attribute getters"
    `HtzRoute` has no `attr*` getters — routes are not referenced by other resources.

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="13 14 15 16"
import { App, Stack } from '@cdk-x/core';
import { HtzNetwork, HtzRoute } from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'NetworkStack');

const network = new HtzNetwork(stack, 'Network', {
  name: 'my-network',
  ipRange: '10.0.0.0/8',
});

new HtzRoute(stack, 'Route', {
  networkId: network.attrNetworkId, // (1)!
  destination: '10.100.1.0/24',     // (2)!
  gateway: '10.0.1.1',              // (3)!
});

app.synth();
```

1. References the network — route is created after the network reaches `CREATE_COMPLETE`.
2. Any traffic destined for `10.100.1.0/24` will be forwarded to the gateway.
3. Must be an IP that already exists within the network range (e.g. a server's private IP).

## Cross-resource reference example

Route the traffic to the gateway IP of a server on the private network. Since the gateway is specified as a string (not a token), you must know the server's private IP at synthesis time. For dynamic IPs, use a fixed private IP assigned at server creation:

```typescript linenums="1" hl_lines="8"
// Server with a known static private IP via Hetzner's private network attachment
new HtzRoute(stack, 'NatRoute', {
  networkId: network.attrNetworkId,
  destination: '0.0.0.0/0',  // (1)!
  gateway: '10.0.1.1',       // private IP of the NAT server
});
```

1. A default route — all traffic not covered by a more specific route goes to the NAT server at `10.0.1.1`.

## Destroy behavior

The engine calls `POST /networks/{networkId}/actions/delete_route` to remove the route. Routes have no dependencies so they are deleted early in the reverse topological order.

---

!!! info "See also"
    - [Network](network.md) — the parent network
    - [Subnet](subnet.md) — subnets define the network zones and IP ranges
