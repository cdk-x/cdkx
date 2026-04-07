# Floating IP

`HtzFloatingIp` manages a [Hetzner Cloud Floating IP](https://docs.hetzner.com/cloud/floating-ips/overview). Floating IPs are static public IPs that exist independently of servers and can be reassigned between them without changing your DNS records.

**Type:** `Hetzner::Networking::FloatingIp`
**Import:** `@cdk-x/hetzner`

## Props

| Prop | Type | Required | Create-only | Description |
|------|------|----------|-------------|-------------|
| `type` | `FloatingIpType` | ✅ | ✅ | IP version: `FloatingIpType.IPV4` or `FloatingIpType.IPV6`. |
| `homeLocation` | `Location` | ✅ | ✅ | Hetzner location where the IP is homed (e.g. `Location.FSN1`). Traffic is routed optimally when the assigned server is in this location. |
| `name` | `string` | — | — | Name of the resource. Must be unique within the project. |
| `description` | `string \| null` | — | — | Human-readable description. |
| `labels` | `Record<string, string>` | — | — | Key/value labels. |

## Attribute getters

| Getter | Resolves to |
|--------|------------|
| `attrFloatingIpId` | The Hetzner-assigned floating IP ID (integer). Use this to reference the IP from other resources. |

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="7 8 9 10 11"
import { App, Stack } from '@cdk-x/core';
import { HtzFloatingIp, FloatingIpType, Location } from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'NetworkingStack');

new HtzFloatingIp(stack, 'PublicIp', {
  type: FloatingIpType.IPV4,
  homeLocation: Location.FSN1,
  name: 'web-public-ip',
  labels: { env: 'production' },
});

app.synth();
```

## Stack output example

Export the floating IP ID so other stacks or tools can reference it:

```typescript linenums="1" hl_lines="10 11 12 13"
import { App, Stack, StackOutput } from '@cdk-x/core';
import { HtzFloatingIp, FloatingIpType, Location } from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'NetworkingStack');

const floatingIp = new HtzFloatingIp(stack, 'PublicIp', {
  type: FloatingIpType.IPV4,
  homeLocation: Location.FSN1,
  name: 'web-public-ip',
});

new StackOutput(stack, 'FloatingIpId', {
  value: floatingIp.attrFloatingIpId, // (1)!
  description: 'The Hetzner floating IP ID',
});

app.synth();
```

1. `attrFloatingIpId` produces a `{ ref, attr }` token that the engine resolves after the resource is created.

## Update behavior

| Prop | Updatable | Notes |
|------|-----------|-------|
| `name` | ✅ | Calls `PATCH /floating_ips/{id}` |
| `description` | ✅ | Calls `PATCH /floating_ips/{id}` |
| `labels` | ✅ | Calls `PATCH /floating_ips/{id}` |
| `type` | ❌ | Create-only |
| `homeLocation` | ❌ | Create-only |

## Destroy behavior

The engine calls `DELETE /floating_ips/{id}`. The IP is released back to Hetzner's pool. Any server that had this IP assigned loses the public address immediately.

!!! warning "Unassign before relying on destroy order"
    If a server still has this floating IP assigned at destroy time, Hetzner will release the IP but traffic to that address will stop routing. Ensure your stack destroy order is correct or unassign the IP before destroying.

## Available locations

```typescript
import { Location } from '@cdk-x/hetzner';

Location.FSN1  // Falkenstein, Germany
Location.NBG1  // Nuremberg, Germany
Location.HEL1  // Helsinki, Finland
Location.ASH   // Ashburn, USA
Location.HIL   // Hillsboro, USA
Location.SIN   // Singapore
```

---

!!! info "See also"
    - [Server](server.md) — assign a floating IP to a server at creation via `serverId` (follow-up feature)
    - [Tokens & Cross-resource References](../../concepts/tokens.md) — how `attrFloatingIpId` resolves at deploy time
