# Floating IP Assignment

`HtzFloatingIpAssignment` assigns a [Hetzner Cloud Floating IP](https://docs.hetzner.com/cloud/floating-ips/overview) to a Server. It models the assignment as a first-class resource with its own lifecycle — create assigns, update reassigns to a different server, and destroy unassigns.

**Type:** `Hetzner::Networking::FloatingIpAssignment`
**Import:** `@cdk-x/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `floatingIpId` | `number \| IResolvable` | ✅ | ID of the floating IP to assign. Typically supplied via `attrFloatingIpId` from an `HtzFloatingIp`. |
| `serverId` | `number \| IResolvable` | ✅ | ID of the server to assign the floating IP to. Typically supplied via `attrServerId` from an `HtzServer`. |

!!! note "No attribute getters"
    `HtzFloatingIpAssignment` has no `attr*` getters — its primary identifier is the `floatingIpId`, which you already hold from `HtzFloatingIp.attrFloatingIpId`.

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="14 15 16 17 18"
import { App, Stack } from '@cdk-x/core';
import {
  HtzFloatingIp,
  HtzFloatingIpAssignment,
  HtzServer,
  FloatingIpType,
  Location,
  ServerType,
} from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'NetworkingStack');

const floatingIp = new HtzFloatingIp(stack, 'PublicIp', {
  type: FloatingIpType.IPV4,
  homeLocation: Location.NBG1,
  name: 'web-public-ip',
});

const server = new HtzServer(stack, 'WebServer', {
  name: 'web-server',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  location: Location.NBG1,
});

new HtzFloatingIpAssignment(stack, 'PublicIpAssignment', {
  floatingIpId: floatingIp.attrFloatingIpId, // (1)!
  serverId: server.attrServerId,             // (2)!
});

app.synth();
```

1. `attrFloatingIpId` produces a `{ ref, attr }` token — the engine resolves it after `HtzFloatingIp` is created and injects the numeric ID. The assignment automatically depends on the floating IP.
2. Same for `attrServerId` — the assignment waits for the server to be ready before assigning.

## Cross-stack example

When the floating IP lives in a different stack (e.g. a shared networking stack), export it via `StackOutput` and import the value:

```typescript title="src/networking-stack.ts" linenums="1" hl_lines="12 13 14 15"
import { App, Stack, StackOutput } from '@cdk-x/core';
import { HtzFloatingIp, FloatingIpType, Location } from '@cdk-x/hetzner';

export class NetworkingStack extends Stack {
  public readonly floatingIpIdOutput: StackOutput;

  constructor(app: App) {
    super(app, 'Networking');

    const floatingIp = new HtzFloatingIp(this, 'PublicIp', {
      type: FloatingIpType.IPV4,
      homeLocation: Location.NBG1,
      name: 'web-public-ip',
    });

    this.floatingIpIdOutput = new StackOutput(this, 'FloatingIpId', {
      value: floatingIp.attrFloatingIpId,
      description: 'The Hetzner floating IP ID',
    });
  }
}
```

```typescript title="src/compute-stack.ts" linenums="1" hl_lines="18 19 20 21"
import { App, Stack, IResolvable } from '@cdk-x/core';
import {
  HtzFloatingIpAssignment,
  HtzServer,
  ServerType,
  Location,
} from '@cdk-x/hetzner';

export class ComputeStack extends Stack {
  constructor(app: App, props: { floatingIpId: IResolvable }) {
    super(app, 'Compute');

    const server = new HtzServer(this, 'WebServer', {
      name: 'web-server',
      serverType: ServerType.CX22,
      image: 'ubuntu-24.04',
      location: Location.NBG1,
    });

    new HtzFloatingIpAssignment(this, 'PublicIpAssignment', {
      floatingIpId: props.floatingIpId, // (1)!
      serverId: server.attrServerId,
    });
  }
}
```

```typescript title="src/main.ts" linenums="1"
import { App } from '@cdk-x/core';
import { NetworkingStack } from './networking-stack';
import { ComputeStack } from './compute-stack';

const app = new App();
const networking = new NetworkingStack(app);

new ComputeStack(app, {
  floatingIpId: networking.floatingIpIdOutput.importValue(), // (2)!
});

app.synth();
```

1. The token is a cross-stack reference. The engine resolves it at deploy time once `Networking` has been deployed.
2. `importValue()` creates a cross-stack token that encodes the dependency — the engine deploys `Networking` before `Compute`.

## Dependency graph

The engine infers dependencies from the `{ ref, attr }` tokens — no manual `addDependency()` call is needed:

```
HtzFloatingIp ──┐
                ├──► HtzFloatingIpAssignment
HtzServer ──────┘
```

## Update behavior

Changing `serverId` triggers an **unassign-then-reassign** sequence:

1. Engine calls `POST /floating_ips/{id}/actions/unassign` — waits for the action to complete.
2. Engine calls `POST /floating_ips/{id}/actions/assign` with the new `serverId` — waits for the action to complete.

This allows you to move a reserved public IP between servers (e.g. during a blue/green deploy) without recreating the `HtzFloatingIp` resource.

!!! warning "Brief routing gap during reassignment"
    Traffic to the floating IP address will not be routed during the window between unassign and reassign. Keep this in mind for production workloads.

## Destroy behavior

The engine calls `POST /floating_ips/{id}/actions/unassign` and waits for the Hetzner action to reach `success`. The underlying floating IP is **not deleted** — only the assignment is removed.

!!! info "Destroy order"
    When `HtzFloatingIp` and `HtzFloatingIpAssignment` are in the same stack, the engine destroys `HtzFloatingIpAssignment` first (because `HtzFloatingIp` depends on it indirectly via the token). If they are in separate stacks, destroy the compute stack before the networking stack.

---

!!! info "See also"
    - [Floating IP](floating-ip.md) — the IP resource being assigned
    - [Server](server.md) — the compute resource receiving the IP
    - [Tokens & Cross-resource References](../../concepts/tokens.md) — how `attrFloatingIpId` and `attrServerId` resolve at deploy time
    - [Volume Attachment](volume-attachment.md) — same pattern applied to block storage
