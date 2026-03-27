# Volume Attachment

`HtzVolumeAttachment` attaches a [Hetzner Cloud Volume](https://docs.hetzner.com/cloud/volumes/overview) to a Server. It models the attachment relationship as a first-class resource with its own lifecycle — create attaches, update re-attaches to a different server, and destroy detaches.

**Type:** `Hetzner::Storage::VolumeAttachment`
**Import:** `@cdkx-io/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `volumeId` | `number \| IResolvable` | ✅ | ID of the volume to attach. Typically supplied via `attrVolumeId` from an `HtzVolume`. |
| `serverId` | `number \| IResolvable` | ✅ | ID of the server to attach the volume to. Typically supplied via `attrServerId` from an `HtzServer`. |
| `automount` | `boolean` | — | If `true`, Hetzner automatically mounts the volume inside the server after attaching. Default: `false`. |

!!! note "No attribute getters"
    `HtzVolumeAttachment` has no `attr*` getters — its primary identifier is the `volumeId`, which you already hold from `HtzVolume.attrVolumeId`.

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="14 15 16 17 18"
import { App, Stack } from '@cdkx-io/core';
import { HtzVolume, HtzServer, HtzVolumeAttachment, ServerType, Location } from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'StorageStack');

const volume = new HtzVolume(stack, 'AppVolume', {
  name: 'app-volume',
  size: 50,
  location: 'nbg1',
  format: 'ext4',
});

const server = new HtzServer(stack, 'AppServer', {
  name: 'app-server',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  location: Location.NBG1,
});

new HtzVolumeAttachment(stack, 'Attachment', {
  volumeId: volume.attrVolumeId,   // (1)!
  serverId: server.attrServerId,   // (2)!
  automount: true,
});

app.synth();
```

1. `attrVolumeId` produces a `{ ref, attr }` token — the engine resolves it after `HtzVolume` is created and injects the numeric ID. The attachment automatically depends on the volume.
2. Same for `attrServerId` — the attachment waits for the server to be ready before attaching.

## Dependency graph

The engine infers dependencies from the `{ ref, attr }` tokens — no manual `addDependency()` call is needed:

```
HtzVolume ──┐
             ├──► HtzVolumeAttachment
HtzServer ──┘
```

## Update behavior

Changing `serverId` triggers a **detach-then-reattach** sequence:

1. Engine calls `POST /volumes/{id}/actions/detach` — waits for the action to complete.
2. Engine calls `POST /volumes/{id}/actions/attach` with the new `serverId` — waits for the action to complete.

Changing `automount` alone also triggers this re-attach cycle.

!!! warning "Downtime during re-attach"
    The volume is unmounted from the old server before it is mounted on the new one. Any running process that depends on the volume will encounter I/O errors during this window.

## Destroy behavior

The engine calls `POST /volumes/{id}/actions/detach` and waits for the Hetzner action to reach `success` before marking the resource as destroyed. The underlying volume is **not deleted** — only the attachment is removed.

!!! info "Destroy order"
    Declare `HtzVolumeAttachment` before destroying `HtzVolume` or `HtzServer`. The engine's dependency graph handles this automatically when you use `attrVolumeId` and `attrServerId` tokens.

## Location constraint

Hetzner requires the volume and the server to be in the **same location**. Attempting to attach across locations results in a `422 invalid_input` error from the API.

```typescript
// Both must share the same location
const volume = new HtzVolume(stack, 'Vol', {
  name: 'data',
  size: 20,
  location: 'fsn1', // (1)!
});

const server = new HtzServer(stack, 'Srv', {
  name: 'worker',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  location: Location.FSN1, // (2)!
});
```

1. Volume is in `fsn1`.
2. Server must also be in `fsn1`.

---

!!! info "See also"
    - [Volume](volume.md) — the block storage resource being attached
    - [Server](server.md) — the compute resource receiving the volume
    - [Tokens & Cross-resource References](../../concepts/tokens.md) — how `attrVolumeId` and `attrServerId` resolve at deploy time
