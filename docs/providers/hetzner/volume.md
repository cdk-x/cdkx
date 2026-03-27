# Volume

`HtzVolume` manages a [Hetzner Cloud Volume](https://docs.hetzner.com/cloud/volumes/overview). Volumes are persistent block storage devices that exist independently of servers and can be formatted on creation.

**Type:** `Hetzner::Storage::Volume`
**Import:** `@cdkx-io/hetzner`

## Props

| Prop | Type | Required | Create-only | Description |
|------|------|----------|-------------|-------------|
| `name` | `string` | ✅ | — | Volume name. Must be unique within the project. |
| `size` | `number` | ✅ | — | Size in GB. Minimum: 10. Maximum: 10240. Can only be increased after creation. |
| `location` | `string` | — | ✅ | Location where the volume is created (e.g. `nbg1`, `fsn1`, `hel1`). Must match the server's location for attachment. |
| `format` | `string` | — | ✅ | Filesystem format applied at creation. One of: `xfs`, `ext4`. |
| `labels` | `Record<string, string>` | — | — | Key/value labels. |

## Attribute getters

| Getter | Resolves to |
|--------|------------|
| `attrVolumeId` | The Hetzner-assigned volume ID (integer). |

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="7 8 9 10 11"
import { App, Stack } from '@cdkx-io/core';
import { HtzVolume } from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'StorageStack');

new HtzVolume(stack, 'AppVolume', {
  name: 'app-volume',
  size: 50,
  location: 'nbg1',
  format: 'ext4', // (1)!
});

app.synth();
```

1. Formatting happens at creation time — it is a `createOnlyProperty`. To change the filesystem, destroy the volume and recreate it.

## Update behavior

| Prop | Updatable | Notes |
|------|-----------|-------|
| `name` | ✅ | Calls `PATCH /volumes/{id}` |
| `labels` | ✅ | Calls `PATCH /volumes/{id}` |
| `size` | Increase only | Calls `POST /volumes/{id}/actions/resize`. Resize-down is not supported by the Hetzner API — attempting it throws an error. |
| `location` | ❌ | Create-only |
| `format` | ❌ | Create-only |

## Destroy behavior

The engine calls `DELETE /volumes/{id}`. All volume data is irreversibly destroyed.

!!! warning "Volume must be detached before deletion"
    Hetzner requires the volume to be detached from any server before it can be deleted. Make sure no server has the volume attached at destroy time.

## Server attachment

Volume attachment is not modelled in `HtzVolume` itself — it is a separate lifecycle concern. `serverId` and `automount` are intentionally absent from this construct. A dedicated `HtzVolumeAttachment` resource will handle attachment in a future release.

For now, ensure the volume and the target server share the same `location` — this is a Hetzner requirement for attachment.

```typescript linenums="1" hl_lines="6 12"
const volume = new HtzVolume(stack, 'AppVolume', {
  name: 'app-volume',
  size: 50,
  location: 'nbg1', // (1)!
  format: 'ext4',
});

new HtzServer(stack, 'AppServer', {
  name: 'app-server',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  location: Location.NBG1, // (2)!
});
```

1. Volume location must match the server's location.
2. Both resources are in `nbg1` — the volume can be attached to this server once `HtzVolumeAttachment` is available.

---

!!! info "See also"
    - [Server](server.md) — compute resource to which a volume can be attached
    - [Tokens & Cross-resource References](../../concepts/tokens.md) — how `attrVolumeId` resolves at deploy time
