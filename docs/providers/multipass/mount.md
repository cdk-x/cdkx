# Mount

`MltMount` declares a host-to-guest directory mount. The host path is made available inside the VM at the specified target path. It is referenced by `MltInstance` via `mltMount.ref`.

**Type:** `Multipass::VM::Mount`  
**Import:** `@cdk-x/multipass`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `source` | `string` | ✅ | Absolute path on the host machine to mount into the VM. |
| `target` | `string` | — | Absolute path inside the guest VM where the directory will be mounted. Defaults to the same path as `source` if omitted. |

## Example

```typescript title=".cdkxrc.ts" linenums="1"
import { Workspace, YamlFile } from '@cdk-x/core';
import { MltInstance, MltMount, MltConfig } from '@cdk-x/multipass';

const workspace = new Workspace();
const multipass = new YamlFile(workspace, 'DevVMs', { fileName: 'multipass.yaml' });

const codeMount = new MltMount(multipass, 'Code', {
  source: '/Users/me/code',   // (1)!
  target: '/home/ubuntu/code', // (2)!
});

const dev = new MltInstance(multipass, 'Dev', {
  name: 'dev',
  image: 'jammy',
  mounts: [codeMount.ref],
});

new MltConfig(multipass, 'Config', { instances: [dev.ref] });

workspace.synth();
```

1. The host directory that will be shared with the VM. Must exist on the host.
2. Where it will appear inside the VM. Created automatically by Multipass if it does not exist.

Produces:

```yaml
instances:
  - name: dev
    image: jammy
    mounts:
      - source: /Users/me/code
        target: /home/ubuntu/code
```

## Sharing a mount across multiple VMs

A single `MltMount` instance can be referenced by multiple VMs:

```typescript
const sharedMount = new MltMount(multipass, 'Shared', {
  source: '/Users/me/projects',
  target: '/home/ubuntu/projects',
});

const vm1 = new MltInstance(multipass, 'VM1', {
  name: 'vm1',
  mounts: [sharedMount.ref],
});

const vm2 = new MltInstance(multipass, 'VM2', {
  name: 'vm2',
  mounts: [sharedMount.ref],
});
```

Both VMs will have the same host directory mounted at the same guest path.

---

!!! info "See also"
    - [MltInstance](instance.md) — attach the mount via `mounts: [codeMount.ref]`
    - [MltNetwork](network.md) — attach host network interfaces to a VM
