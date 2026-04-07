# Load Balancer

`HtzLoadBalancer` manages a [Hetzner Cloud Load Balancer](https://docs.hetzner.com/cloud/load-balancers/overview). A Load Balancer distributes incoming traffic across multiple backend targets and supports health checks, SSL termination, and private network attachment.

**Type:** `Hetzner::Compute::LoadBalancer`
**Import:** `@cdk-x/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Name of the load balancer. Must be unique within the project. |
| `loadBalancerType` | `LoadBalancerType` | ✅ | Hardware tier: `lb11`, `lb21`, or `lb31`. |
| `algorithm` | `{ type: LoadBalancerAlgorithmType }` | — | Traffic distribution algorithm. Defaults to `round_robin`. |
| `networkId` | `string \| IResolvable` | — | Attach the load balancer to a private network. Create-only. |
| `networkZone` | `NetworkZone` | — | Network zone to deploy into (e.g. `eu-central`). Create-only. |
| `location` | `Location` | — | Specific location to deploy into (e.g. `nbg1`). Create-only. Cannot be combined with `networkZone`. |
| `publicInterface` | `boolean` | — | Whether the load balancer has a public IPv4/IPv6 interface. Defaults to `true`. |
| `labels` | `Record<string, string>` | — | User-defined key/value labels for filtering and organization. |

### `LoadBalancerType` enum

| Value | Description |
|-------|-------------|
| `LoadBalancerType.LB11` | Entry-level. Up to 25 targets, 20k concurrent connections. |
| `LoadBalancerType.LB21` | Mid-tier. Up to 100 targets, 40k concurrent connections. |
| `LoadBalancerType.LB31` | High-end. Up to 500 targets, 200k concurrent connections. |

### `LoadBalancerAlgorithmType` enum

| Value | Description |
|-------|-------------|
| `LoadBalancerAlgorithmType.ROUND_ROBIN` | Distributes requests evenly across all healthy targets. |
| `LoadBalancerAlgorithmType.LEAST_CONNECTIONS` | Routes each request to the target with the fewest active connections. |

## Attribute getters

| Getter | Resolves to |
|--------|------------|
| `attrLoadBalancerId` | The Hetzner-assigned load balancer ID (integer). Used by `HtzLoadBalancerService` and `HtzLoadBalancerTarget`. |

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="6 7 8 9 10"
import { App, Stack } from '@cdk-x/core';
import { HtzLoadBalancer, LoadBalancerType, NetworkZone } from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'LbStack');

const lb = new HtzLoadBalancer(stack, 'LoadBalancer', {
  name: 'my-load-balancer',
  loadBalancerType: LoadBalancerType.LB11, // (1)!
  networkZone: NetworkZone.EU_CENTRAL,     // (2)!
});

app.synth();
```

1. `lb11` is the entry-level tier — sufficient for most workloads.
2. Deploying to `eu-central` without pinning to a specific location. Hetzner picks the optimal datacenter within the zone.

## Cross-resource reference example

Attach the load balancer to a private network and pass its ID downstream to services and targets:

```typescript linenums="1" hl_lines="13 14 15 16 17 18 19"
import { HtzNetwork, HtzLoadBalancer, HtzLoadBalancerService, LoadBalancerType, LoadBalancerServiceProtocol, NetworkZone } from '@cdk-x/hetzner';

const network = new HtzNetwork(stack, 'Network', {
  name: 'my-network',
  ipRange: '10.0.0.0/16',
});

const lb = new HtzLoadBalancer(stack, 'LoadBalancer', {
  name: 'my-lb',
  loadBalancerType: LoadBalancerType.LB11,
  networkZone: NetworkZone.EU_CENTRAL,
  networkId: network.attrNetworkId, // (1)!
});

new HtzLoadBalancerService(stack, 'HttpService', {
  loadBalancerId: lb.attrLoadBalancerId, // (2)!
  listenPort: 80,
  protocol: LoadBalancerServiceProtocol.TCP,
});
```

1. `attrNetworkId` resolves to the integer network ID after the network is created. The engine deploys the network before the load balancer.
2. `attrLoadBalancerId` resolves to the integer load balancer ID. Services and targets depend on this value and are created after the load balancer.

## Synthesized output

```json
{
  "LbStackLoadBalancerA1B2C3D4": {
    "type": "Hetzner::Compute::LoadBalancer",
    "provider": "hetzner",
    "properties": {
      "name": "my-load-balancer",
      "loadBalancerType": "lb11",
      "networkZone": "eu-central"
    },
    "metadata": { "cdkx:path": "LbStack/LoadBalancer" }
  }
}
```

## Destroy behavior

The engine calls `DELETE /load_balancers/{id}`. The load balancer must have no active services or targets — the engine removes `HtzLoadBalancerService` and `HtzLoadBalancerTarget` resources first, following reverse topological order.

!!! warning "Network serialization"
    Hetzner only allows one concurrent action per network. If your load balancer is attached to a network that also has subnets and routes, add explicit dependencies to serialize destruction order:

    ```typescript
    lb.addDependency(route);
    lb.addDependency(subnet);
    ```

---

!!! info "See also"
    - [Load Balancer Service](load-balancer-service.md) — add listeners and health checks
    - [Load Balancer Target](load-balancer-target.md) — register backend servers
    - [Network](network.md) — private network for backend communication
    - [Tokens](../../concepts/tokens.md) — how `attrLoadBalancerId` resolves at deploy time
