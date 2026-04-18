# Instance

`MltInstance` declares a Multipass Ubuntu VM. At deploy time the engine calls `multipass launch` with the resolved props, and at destroy time it calls `multipass delete --purge`.

**Type:** `Multipass::Compute::Instance`  
**Import:** `@cdk-x/multipass`

!!! warning "Create-only resource"
    All props are create-only. Once a VM is launched, the engine will not call update. To change any prop, destroy the VM and redeploy.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Name of the VM. Must be unique within the Multipass instance. Passed as `--name` to `multipass launch`. |
| `image` | `string` | — | Ubuntu image alias or release (e.g. `jammy`, `22.04`, `lts`). Defaults to the latest LTS if omitted. |
| `cpus` | `number` | — | Number of virtual CPUs. Passed as `--cpus`. |
| `memory` | `string` | — | Memory allocation (e.g. `2G`, `512M`). Passed as `--memory`. |
| `disk` | `string` | — | Disk size (e.g. `20G`). Passed as `--disk`. |
| `bridged` | `boolean` | — | Add a bridged network interface. Equivalent to `--bridged`. |
| `timeout` | `number` | — | Launch timeout in seconds. Passed as `--timeout`. |
| `networks` | [`InstanceNetwork[]`](network.md) | — | Host network interfaces to attach at launch time. Each entry maps to a `--network` argument. |
| `mounts` | [`InstanceMount[]`](mount.md) | — | Host-to-guest directory mounts. Each entry maps to a `--mount` argument. |
| `cloudInit` | `string` | — | Cloud-init user-data string passed to the VM at launch time. Passed as `--cloud-init`. |

## Attribute getters

These resolve to runtime values after the VM is created:

| Getter | Type | Resolves to |
|--------|------|------------|
| `attrIpAddress` | `IResolvable` | The VM's IP address, as returned by `multipass info`. |
| `attrSshUser` | `IResolvable` | The SSH user inside the VM (typically `ubuntu`). |

Use these to pass VM details to other constructs:

```typescript
const vm = new MltInstance(stack, 'Dev', { name: 'dev', image: 'jammy' });

// e.g. pass the IP to another resource
someOtherResource.hostIp = vm.attrIpAddress;
```

## Basic example

```typescript title=".cdkxrc.ts" linenums="1"
import { App, Stack } from '@cdk-x/core';
import { MltInstance, MltProvider } from '@cdk-x/multipass';

const app = new App();
const stack = new Stack(app, 'DevVMs', { provider: new MltProvider() });

new MltInstance(stack, 'Dev', {
  name: 'dev',
  image: 'jammy',
  cpus: 4,
  memory: '4G',
  disk: '20G',
});

app.synth();
```

Translates to:

```bash
multipass launch jammy --name dev --cpus 4 --memory 4G --disk 20G
```

## Example with network, mount, and cloud-init

Networks and mounts are plain inline objects — no separate constructs needed:

```typescript linenums="1" hl_lines="11 12 13 14 15 16 17"
import { App, Stack } from '@cdk-x/core';
import { MltInstance, MltProvider } from '@cdk-x/multipass';

const app = new App();
const stack = new Stack(app, 'DevVMs', { provider: new MltProvider() });

new MltInstance(stack, 'Dev', {
  name: 'dev',
  image: 'jammy',
  cpus: 4,
  memory: '4G',
  disk: '20G',
  networks: [
    { name: 'bridge', mode: 'auto' }, // (1)!
  ],
  mounts: [
    { source: '/Users/me/code', target: '/home/ubuntu/code' }, // (2)!
  ],
  cloudInit: '#cloud-config\npackages:\n  - git\n  - curl\n', // (3)!
});

app.synth();
```

1. Attaches the host interface named `bridge` in automatic configuration mode. Run `multipass networks` to list interfaces available on your machine.
2. Mounts `/Users/me/code` on the host at `/home/ubuntu/code` inside the VM.
3. Passed verbatim to `multipass launch --cloud-init`. Must be a valid cloud-init YAML string.

Translates to:

```bash
multipass launch jammy \
  --name dev \
  --cpus 4 --memory 4G --disk 20G \
  --network bridge,mode=auto \
  --mount /Users/me/code:/home/ubuntu/code \
  --cloud-init <tmpfile>
```

---

!!! info "See also"
    - [InstanceNetwork](network.md) — shape of entries in `networks`
    - [InstanceMount](mount.md) — shape of entries in `mounts`
    - [Overview](index.md) — how synth and deploy work together
