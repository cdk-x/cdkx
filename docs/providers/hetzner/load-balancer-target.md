# Load Balancer Target

`HtzLoadBalancerTarget` registers a backend target with a [Hetzner Cloud Load Balancer](https://docs.hetzner.com/cloud/load-balancers/overview). Three target types are supported: a specific server, a label selector (dynamic group of servers), or a raw IP address.

**Type:** `Hetzner::Compute::LoadBalancerTarget`
**Import:** `@cdk-x/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `loadBalancerId` | `string \| IResolvable` | ✅ | ID of the load balancer to register the target with. Create-only. |
| `type` | `LoadBalancerTargetType` | ✅ | Target type: `server`, `label_selector`, or `ip`. Create-only. |
| `serverId` | `string \| IResolvable` | Server only | ID of the server to add as a target. Required when `type` is `server`. |
| `labelSelector` | `string` | Label selector only | Label query string (e.g. `role=web`). All matching servers are added as targets. Required when `type` is `label_selector`. |
| `ip` | `string` | IP only | IP address of the target. Required when `type` is `ip`. |
| `usePrivateIp` | `boolean` | — | Route traffic to the target's private network IP instead of its public IP. Requires the load balancer to be attached to the same network. |

### `LoadBalancerTargetType` enum

| Value | Description |
|-------|-------------|
| `LoadBalancerTargetType.SERVER` | A single specific Hetzner server. |
| `LoadBalancerTargetType.LABEL_SELECTOR` | All servers matching a label selector — membership is dynamic. |
| `LoadBalancerTargetType.IP` | An arbitrary IP address (for external or non-Hetzner backends). |

## Create example — server target

```typescript title="src/main.ts" linenums="1" hl_lines="13 14 15 16 17 18"
import { App, Stack } from '@cdk-x/core';
import { HtzLoadBalancer, HtzServer, HtzLoadBalancerTarget, LoadBalancerType, LoadBalancerTargetType, NetworkZone, ServerType } from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'LbStack');

const lb = new HtzLoadBalancer(stack, 'LoadBalancer', {
  name: 'my-lb',
  loadBalancerType: LoadBalancerType.LB11,
  networkZone: NetworkZone.EU_CENTRAL,
});

const server = new HtzServer(stack, 'AppServer', {
  name: 'app-1',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
});

new HtzLoadBalancerTarget(stack, 'AppTarget', {
  loadBalancerId: lb.attrLoadBalancerId, // (1)!
  type: LoadBalancerTargetType.SERVER,
  serverId: server.attrServerId,         // (2)!
  usePrivateIp: false,
});

app.synth();
```

1. `attrLoadBalancerId` resolves to the integer load balancer ID. The target is created after the load balancer.
2. `attrServerId` resolves to the integer server ID. The target is also created after the server.

## Create example — private network target

When the load balancer is on a private network, route traffic to the server's private IP for better security and lower latency:

```typescript linenums="1" hl_lines="17 18 19 20 21 22 23"
import { HtzNetwork, HtzLoadBalancer, HtzServer, HtzLoadBalancerTarget, LoadBalancerType, LoadBalancerTargetType, NetworkZone, ServerType } from '@cdk-x/hetzner';

const network = new HtzNetwork(stack, 'Network', {
  name: 'my-network',
  ipRange: '10.0.0.0/16',
});

const lb = new HtzLoadBalancer(stack, 'LoadBalancer', {
  name: 'my-lb',
  loadBalancerType: LoadBalancerType.LB11,
  networkZone: NetworkZone.EU_CENTRAL,
  networkId: network.attrNetworkId,
});

const server = new HtzServer(stack, 'AppServer', {
  name: 'app-1',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  networks: [network.attrNetworkId],
});

new HtzLoadBalancerTarget(stack, 'AppTarget', {
  loadBalancerId: lb.attrLoadBalancerId,
  type: LoadBalancerTargetType.SERVER,
  serverId: server.attrServerId,
  usePrivateIp: true, // (1)!
});
```

1. Traffic flows over the private network. The server's public interface can be disabled for additional security.

## Create example — label selector target

```typescript linenums="1" hl_lines="8 9 10 11 12"
import { HtzLoadBalancerTarget, LoadBalancerTargetType } from '@cdk-x/hetzner';

new HtzLoadBalancerTarget(stack, 'WebTarget', {
  loadBalancerId: lb.attrLoadBalancerId,
  type: LoadBalancerTargetType.LABEL_SELECTOR,
  labelSelector: 'role=web', // (1)!
  usePrivateIp: true,
});
```

1. All servers with the label `role=web` are automatically included. Hetzner updates the target group dynamically as servers are added or removed.

## Synthesized output

```json
{
  "LbStackAppTargetA1B2C3D4": {
    "type": "Hetzner::Compute::LoadBalancerTarget",
    "provider": "hetzner",
    "properties": {
      "loadBalancerId": { "ref": "LbStackLoadBalancerA1B2C3D4", "attr": "loadBalancerId" },
      "type": "server",
      "serverId": { "ref": "LbStackAppServerA1B2C3D4", "attr": "serverId" },
      "usePrivateIp": true
    },
    "metadata": { "cdkx:path": "LbStack/AppTarget" }
  }
}
```

## Destroy behavior

The engine calls `POST /load_balancers/{id}/actions/remove_target`. All target properties are create-only — any change to `type`, `serverId`, `labelSelector`, `ip`, or `usePrivateIp` requires destroying and recreating the target.

!!! warning "No in-place updates"
    `HtzLoadBalancerTarget` cannot be updated in-place. The handler throws an error if an update is attempted. To change a target, remove the old `HtzLoadBalancerTarget` construct and add a new one.

---

!!! info "See also"
    - [Load Balancer](load-balancer.md) — the parent resource
    - [Load Balancer Service](load-balancer-service.md) — configure listeners and health checks
    - [Server](server.md) — servers registered as targets
    - [Tokens](../../concepts/tokens.md) — how `attrLoadBalancerId` and `attrServerId` resolve at deploy time
