# Primary IP Assignment

`HtzPrimaryIpAssignment` assigns a [Hetzner Cloud Primary IP](https://docs.hetzner.com/cloud/primary-ips/overview) to a server. It models the assignment as a first-class resource with its own lifecycle — create assigns, update reassigns to a different server, and destroy unassigns.

**Type:** `Hetzner::Networking::PrimaryIpAssignment`
**Import:** `@cdkx-io/hetzner`

!!! warning "Server must be powered off"
    The Hetzner Cloud API requires the target server to be **powered off** before a Primary IP can be assigned or unassigned. Attempting to assign a Primary IP to a running server will fail with a `server_not_stopped` error. Use `HtzFloatingIpAssignment` if you need to assign a public IP to a running server.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `primaryIpId` | `number \| IResolvable` | ✅ | ID of the Primary IP to assign. Typically supplied via `attrPrimaryIpId` from an `HtzPrimaryIp`. |
| `assigneeId` | `number \| IResolvable` | ✅ | ID of the server to assign the Primary IP to. Typically supplied via `attrServerId` from an `HtzServer`. |
| `assigneeType` | `PrimaryIpAssigneeType` | ✅ | Type of the assignee. Currently must be `PrimaryIpAssigneeType.SERVER`. |

!!! note "No attribute getters"
    `HtzPrimaryIpAssignment` has no `attr*` getters — its primary identifier is the `primaryIpId`, which you already hold from `HtzPrimaryIp.attrPrimaryIpId`.

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="16 17 18 19 20 21"
import { App, Stack } from '@cdkx-io/core';
import {
  HtzPrimaryIp,
  HtzPrimaryIpAssignment,
  HtzServer,
  PrimaryIpType,
  PrimaryIpAssigneeType,
  Location,
  ServerType,
} from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'NetworkingStack');

const primaryIp = new HtzPrimaryIp(stack, 'WebIp', {
  name: 'web-primary-ip',
  type: PrimaryIpType.IPV4,
  assigneeType: PrimaryIpAssigneeType.SERVER,
  location: Location.FSN1,
});

const server = new HtzServer(stack, 'WebServer', {
  name: 'web-server',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  location: Location.FSN1,
  startAfterCreate: false, // (1)!
});

new HtzPrimaryIpAssignment(stack, 'WebIpAssignment', {
  primaryIpId: primaryIp.attrPrimaryIpId, // (2)!
  assigneeId: server.attrServerId,         // (3)!
  assigneeType: PrimaryIpAssigneeType.SERVER,
});

app.synth();
```

1. The server must be powered off for the assignment to succeed. Set `startAfterCreate: false` to keep it off after creation.
2. `attrPrimaryIpId` produces a `{ ref, attr }` token — the engine resolves it after `HtzPrimaryIp` is created and injects the numeric ID. The assignment automatically depends on the Primary IP.
3. Same for `attrServerId` — the assignment waits for the server to be ready before assigning.

## Cross-stack example

When the Primary IP lives in a different stack (e.g. a shared networking stack), export it via `StackOutput` and import the value:

```typescript title="src/networking-stack.ts" linenums="1" hl_lines="15 16 17 18"
import { App, Stack, StackOutput } from '@cdkx-io/core';
import {
  HtzPrimaryIp,
  PrimaryIpType,
  PrimaryIpAssigneeType,
  Location,
} from '@cdkx-io/hetzner';

export class NetworkingStack extends Stack {
  public readonly primaryIpIdOutput: StackOutput;

  constructor(app: App) {
    super(app, 'Networking');

    const primaryIp = new HtzPrimaryIp(this, 'WebIp', {
      name: 'web-primary-ip',
      type: PrimaryIpType.IPV4,
      assigneeType: PrimaryIpAssigneeType.SERVER,
      location: Location.FSN1,
    });

    this.primaryIpIdOutput = new StackOutput(this, 'PrimaryIpId', {
      value: primaryIp.attrPrimaryIpId,
      description: 'The Hetzner primary IP ID',
    });
  }
}
```

```typescript title="src/compute-stack.ts" linenums="1" hl_lines="20 21 22 23 24 25"
import { App, Stack, IResolvable } from '@cdkx-io/core';
import {
  HtzPrimaryIpAssignment,
  HtzServer,
  PrimaryIpAssigneeType,
  ServerType,
  Location,
} from '@cdkx-io/hetzner';

export class ComputeStack extends Stack {
  constructor(app: App, props: { primaryIpId: IResolvable }) {
    super(app, 'Compute');

    const server = new HtzServer(this, 'WebServer', {
      name: 'web-server',
      serverType: ServerType.CX22,
      image: 'ubuntu-24.04',
      location: Location.FSN1,
      startAfterCreate: false,
    });

    new HtzPrimaryIpAssignment(this, 'WebIpAssignment', {
      primaryIpId: props.primaryIpId, // (1)!
      assigneeId: server.attrServerId,
      assigneeType: PrimaryIpAssigneeType.SERVER,
    });
  }
}
```

```typescript title="src/main.ts" linenums="1"
import { App } from '@cdkx-io/core';
import { NetworkingStack } from './networking-stack';
import { ComputeStack } from './compute-stack';

const app = new App();
const networking = new NetworkingStack(app);

new ComputeStack(app, {
  primaryIpId: networking.primaryIpIdOutput.importValue(), // (2)!
});

app.synth();
```

1. The token is a cross-stack reference. The engine resolves it at deploy time once `Networking` has been deployed.
2. `importValue()` creates a cross-stack token that encodes the dependency — the engine deploys `Networking` before `Compute`.

## Dependency graph

The engine infers dependencies from the `{ ref, attr }` tokens — no manual `addDependency()` call is needed:

```
HtzPrimaryIp ──┐
               ├──► HtzPrimaryIpAssignment
HtzServer ─────┘
```

## Update behavior

Changing `assigneeId` triggers an **unassign-then-reassign** sequence:

1. Engine calls `POST /primary_ips/{id}/actions/unassign` — waits for the action to complete.
2. Engine calls `POST /primary_ips/{id}/actions/assign` with the new `assigneeId` — waits for the action to complete.

Both the source and target servers must be powered off during the operation.

## Destroy behavior

The engine calls `POST /primary_ips/{id}/actions/unassign` and waits for the Hetzner action to reach `success`. The underlying Primary IP is **not deleted** — only the assignment is removed.

!!! info "Destroy order"
    When `HtzPrimaryIp` and `HtzPrimaryIpAssignment` are in the same stack, the engine destroys `HtzPrimaryIpAssignment` first (because `HtzPrimaryIp` depends on it indirectly via the token). If they are in separate stacks, destroy the compute stack before the networking stack.

## Primary IP Assignment vs Floating IP Assignment

| | `HtzPrimaryIpAssignment` | `HtzFloatingIpAssignment` |
|---|---|---|
| Server state required | Powered **off** | Any (running or stopped) |
| IP type | Bound to location | Routable, not bound |
| Typical use | Static IP for a server provisioned offline | Failover / live reassignment |

---

!!! info "See also"
    - [Primary IP](primary-ip.md) — the IP resource being assigned
    - [Server](server.md) — the compute resource receiving the IP
    - [Floating IP Assignment](floating-ip-assignment.md) — same pattern for Floating IPs (no server power-off required)
    - [Tokens & Cross-resource References](../../concepts/tokens.md) — how `attrPrimaryIpId` and `attrServerId` resolve at deploy time
