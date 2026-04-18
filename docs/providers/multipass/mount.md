# InstanceMount

`InstanceMount` is an inline type used in `MltInstance.mounts`. It declares a host-to-guest directory mount. The host path is made available inside the VM at the specified target path. Each entry maps to a `--mount` argument passed to `multipass launch`.

There is no separate `MltMount` construct — mounts are declared as plain objects directly on `MltInstance`:

```typescript
new MltInstance(stack, 'Dev', {
  name: 'dev',
  mounts: [
    { source: '/Users/me/code', target: '/home/ubuntu/code' },
  ],
});
```

## Shape

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | `string` | ✅ | Absolute path on the host machine to mount into the VM. Must exist on the host. |
| `target` | `string` | — | Absolute path inside the guest VM where the directory will be mounted. Defaults to the same path as `source` if omitted. |

## Example

```typescript title=".cdkxrc.ts" linenums="1"
import { App, Stack } from '@cdk-x/core';
import { MltInstance, MltProvider } from '@cdk-x/multipass';

const app = new App();
const stack = new Stack(app, 'DevVMs', { provider: new MltProvider() });

new MltInstance(stack, 'Dev', {
  name: 'dev',
  image: 'jammy',
  mounts: [
    { source: '/Users/me/code', target: '/home/ubuntu/code' },
    { source: '/Users/me/.ssh' }, // (1)!
  ],
});

app.synth();
```

1. When `target` is omitted, Multipass uses the same path as `source` inside the VM.

## Sharing a mount across multiple VMs

Simply repeat the same mount object on each instance:

```typescript
const sharedMount = { source: '/Users/me/projects', target: '/home/ubuntu/projects' };

new MltInstance(stack, 'VM1', { name: 'vm1', mounts: [sharedMount] });
new MltInstance(stack, 'VM2', { name: 'vm2', mounts: [sharedMount] });
```

---

!!! info "See also"
    - [MltInstance](instance.md) — full props reference
    - [InstanceNetwork](network.md) — attach host network interfaces to a VM
