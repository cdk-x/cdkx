# Placement Group

`HtzPlacementGroup` manages a [Hetzner Cloud Placement Group](https://docs.hetzner.com/cloud/placement-groups/overview). Placement groups control the physical placement of servers to improve availability — the `spread` type ensures each server in the group runs on a different physical host.

**Type:** `Hetzner::Compute::PlacementGroup`
**Import:** `@cdk-x/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Placement group name. Must be unique within the project. |
| `type` | `PlacementGroupType` | ✅ | Placement strategy. Create-only — cannot be changed after creation. |
| `labels` | `Record<string, string>` | — | Key/value labels. |

### `PlacementGroupType` enum

| Value | Description |
|-------|-------------|
| `PlacementGroupType.SPREAD` | Each server in the group runs on a different physical host. |

## Attribute getters

| Getter | Resolves to |
|--------|------------|
| `attrPlacementGroupId` | The Hetzner-assigned placement group ID (integer). Use this to attach a server to the group via `HtzServer.placementGroupId`. |

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="7 8 9 10"
import { App, Stack } from '@cdk-x/core';
import { HtzPlacementGroup, PlacementGroupType } from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'ComputeStack');

new HtzPlacementGroup(stack, 'AppGroup', {
  name: 'app-placement-group',
  type: PlacementGroupType.SPREAD, // (1)!
  labels: { env: 'production' },
});

app.synth();
```

1. `SPREAD` is the only supported type. It guarantees servers in the group are placed on different physical hosts.

## Cross-resource reference example

Attach servers to a placement group so they run on separate physical hosts:

```typescript linenums="1" hl_lines="5 6 7 8 9 15"
import {
  HtzPlacementGroup,
  HtzServer,
  PlacementGroupType,
  ServerType,
  Location,
} from '@cdk-x/hetzner';

const placementGroup = new HtzPlacementGroup(stack, 'AppGroup', {
  name: 'app-placement-group',
  type: PlacementGroupType.SPREAD,
});

new HtzServer(stack, 'WebServer1', {
  name: 'web-1',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  location: Location.NBG1,
  placementGroupId: placementGroup.attrPlacementGroupId, // (1)!
});

new HtzServer(stack, 'WebServer2', {
  name: 'web-2',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  location: Location.NBG1,
  placementGroupId: placementGroup.attrPlacementGroupId, // (2)!
});
```

1. `attrPlacementGroupId` produces a `{ ref, attr }` token — the engine creates the placement group first, then passes its ID to the server creation request.
2. Both servers reference the same placement group. Hetzner guarantees they run on different physical hosts.

## Update behavior

Only `name` and `labels` can be updated after creation. The `type` is a `createOnlyProperty` — to change the placement strategy, destroy the construct and recreate it.

## Destroy behavior

The engine calls `DELETE /placement_groups/{id}`. The placement group is removed. Servers that were part of the group are **not affected** — they continue running on their current physical host.

!!! warning "Remove servers before destroying"
    Hetzner requires all servers to be removed from a placement group before it can be deleted. Make sure no servers reference this placement group at destroy time, or destroy those servers first.

---

!!! info "See also"
    - [Server](server.md) — attach servers to a placement group via `placementGroupId`
    - [Tokens & Cross-resource References](../../concepts/tokens.md) — how `attrPlacementGroupId` resolves at deploy time
