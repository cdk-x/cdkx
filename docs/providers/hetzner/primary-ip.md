# Primary IP

`HtzPrimaryIp` manages a [Hetzner Cloud Primary IP](https://docs.hetzner.com/cloud/primary-ips/overview). Primary IPs are static public IPs that are bound to a specific location and can be pre-allocated before a server exists, then assigned to a server at creation time or later.

**Type:** `Hetzner::Networking::PrimaryIp`
**Import:** `@cdkx-io/hetzner`

## Props

| Prop | Type | Required | Create-only | Description |
|------|------|----------|-------------|-------------|
| `name` | `string` | ✅ | — | Name of the resource. Must be unique within the project. |
| `type` | `PrimaryIpType` | ✅ | ✅ | IP version: `PrimaryIpType.IPV4` or `PrimaryIpType.IPV6`. |
| `assigneeType` | `PrimaryIpAssigneeType` | ✅ | ✅ | Type of resource the IP can be assigned to. Currently must be `PrimaryIpAssigneeType.SERVER`. |
| `location` | `Location` | — | ✅ | Hetzner location to bind the IP to (e.g. `Location.FSN1`). Required when not assigning to a server at creation. |
| `assigneeId` | `number \| IResolvable \| null` | — | — | ID of the resource to assign the IP to. |
| `autoDelete` | `boolean` | — | — | When `true`, the IP is deleted automatically when the assigned resource is deleted. |
| `labels` | `Record<string, string>` | — | — | Key/value labels. |

## Attribute getters

| Getter | Resolves to |
|--------|------------|
| `attrPrimaryIpId` | The Hetzner-assigned primary IP ID (integer). Use this to reference the IP from other resources. |

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="7 8 9 10 11 12"
import { App, Stack } from '@cdkx-io/core';
import {
  HtzPrimaryIp,
  PrimaryIpType,
  PrimaryIpAssigneeType,
  Location,
} from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'NetworkingStack');

new HtzPrimaryIp(stack, 'WebIp', {
  name: 'web-primary-ip',
  type: PrimaryIpType.IPV4,
  assigneeType: PrimaryIpAssigneeType.SERVER,
  location: Location.FSN1,
});

app.synth();
```

## Stack output example

Pre-allocate a Primary IP in one stack and consume its ID in another:

```typescript title="src/network-stack.ts" linenums="1" hl_lines="15 16 17 18"
import { App, Stack, StackOutput } from '@cdkx-io/core';
import {
  HtzPrimaryIp,
  PrimaryIpType,
  PrimaryIpAssigneeType,
  Location,
} from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'NetworkingStack');

const primaryIp = new HtzPrimaryIp(stack, 'WebIp', {
  name: 'web-primary-ip',
  type: PrimaryIpType.IPV4,
  assigneeType: PrimaryIpAssigneeType.SERVER,
  location: Location.FSN1,
});

new StackOutput(stack, 'PrimaryIpId', {
  value: primaryIp.attrPrimaryIpId, // (1)!
  description: 'The Hetzner primary IP ID',
});

app.synth();
```

1. `attrPrimaryIpId` produces a `{ ref, attr }` token that the engine resolves after the resource is created.

## Update behavior

| Prop | Updatable | Notes |
|------|-----------|-------|
| `name` | ✅ | Calls `PATCH /primary_ips/{id}` |
| `labels` | ✅ | Calls `PATCH /primary_ips/{id}` |
| `autoDelete` | ✅ | Calls `PATCH /primary_ips/{id}` |
| `type` | ❌ | Create-only |
| `assigneeType` | ❌ | Create-only |
| `location` | ❌ | Create-only |

## Destroy behavior

The engine calls `DELETE /primary_ips/{id}`. The IP is released back to Hetzner's pool.

!!! warning "Unassign before destroying"
    A Primary IP assigned to a running server cannot be deleted. Either power off the server first or unassign the IP before destroying the stack.

## Primary IP vs Floating IP

| | Primary IP | Floating IP |
|---|---|---|
| Bound to | Location | Home location (routed, not bound) |
| Server assignment | At creation or via action | Via action |
| Use case | Default public IP for a server | Reassignable IP for failover / DNS stability |

## Available locations

```typescript
import { Location } from '@cdkx-io/hetzner';

Location.FSN1  // Falkenstein, Germany
Location.NBG1  // Nuremberg, Germany
Location.HEL1  // Helsinki, Finland
Location.ASH   // Ashburn, USA
Location.HIL   // Hillsboro, USA
Location.SIN   // Singapore
```

---

!!! info "See also"
    - [Floating IP](floating-ip.md) — static public IP with more flexible routing
    - [Server](server.md) — assign a primary IP to a server at creation
    - [Tokens & Cross-resource References](../../concepts/tokens.md) — how `attrPrimaryIpId` resolves at deploy time
