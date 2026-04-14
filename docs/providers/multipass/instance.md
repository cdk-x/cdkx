# Instance

`MltInstance` declares a Multipass Ubuntu VM. At synthesis it contributes an entry to the `instances` array in `multipass.yaml`.

**Type:** `Multipass::Compute::Instance`  
**Import:** `@cdk-x/multipass`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Name of the VM. Must be unique. Used as the `--name` argument to `multipass launch`. |
| `image` | `string` | — | Ubuntu image alias or release (e.g. `jammy`, `22.04`, `lts`). Defaults to the latest LTS if omitted. |
| `cpus` | `number` | — | Number of virtual CPUs. Maps to `--cpus`. |
| `memory` | `string` | — | Memory allocation (e.g. `2G`, `512M`). Maps to `--memory`. |
| `disk` | `string` | — | Disk size (e.g. `20G`). Maps to `--disk`. |
| `bridged` | `boolean` | — | Add a bridged network interface. |
| `timeout` | `number` | — | Launch timeout in seconds. |
| `networks` | `IResolvable[]` | — | Network interfaces to attach. Each entry is `mltNetwork.ref`. |
| `mounts` | `IResolvable[]` | — | Host-to-guest directory mounts. Each entry is `mltMount.ref`. |

## Attribute getters

| Getter | Resolves to |
|--------|------------|
| `attrVmId` | Internal VM identifier token. |
| `ref` | Reference used to register the instance in `MltConfig`. |

## Basic example

```typescript title=".cdkxrc.ts" linenums="1"
import { Workspace, YamlFile } from '@cdk-x/core';
import { MltInstance, MltConfig } from '@cdk-x/multipass';

const workspace = new Workspace();
const multipass = new YamlFile(workspace, 'DevVMs', { fileName: 'multipass.yaml' });

const dev = new MltInstance(multipass, 'Dev', {
  name: 'dev',
  image: 'jammy',
  cpus: 4,
  memory: '4G',
  disk: '20G',
});

new MltConfig(multipass, 'Config', { instances: [dev.ref] });

workspace.synth();
```

Produces:

```yaml
instances:
  - name: dev
    image: jammy
    cpus: 4
    memory: 4G
    disk: 20G
```

## Example with network and mount

```typescript linenums="1" hl_lines="7 8 9 10 11 12 13 14 15 16 17 18"
import { Workspace, YamlFile } from '@cdk-x/core';
import { MltInstance, MltNetwork, MltMount, MltConfig } from '@cdk-x/multipass';

const workspace = new Workspace();
const multipass = new YamlFile(workspace, 'DevVMs', { fileName: 'multipass.yaml' });

const bridge = new MltNetwork(multipass, 'Bridge', { // (1)!
  name: 'bridge',
  mode: 'auto',
});

const codeMount = new MltMount(multipass, 'Code', { // (2)!
  source: '/Users/me/code',
  target: '/home/ubuntu/code',
});

const dev = new MltInstance(multipass, 'Dev', {
  name: 'dev',
  image: 'jammy',
  cpus: 4,
  memory: '4G',
  disk: '20G',
  networks: [bridge.ref],   // (3)!
  mounts: [codeMount.ref],  // (4)!
});

new MltConfig(multipass, 'Config', { instances: [dev.ref] });

workspace.synth();
```

1. Defines a host bridge interface — `multipass launch` attaches it via `--network bridge`.
2. Declares a host-to-guest mount — your local code folder becomes available inside the VM.
3. References the network by `ref`, ensuring it is resolved before synthesis.
4. References the mount by `ref`.

## CLI launch mapping

When you run `cdkx multipass launch dev`, it translates the YAML config to:

```bash
multipass launch jammy --name dev --cpus 4 --memory 4G --disk 20G
```

Only props that are defined are passed — undefined optional props are omitted.

---

!!! info "See also"
    - [MltNetwork](network.md) — attach a host network interface
    - [MltMount](mount.md) — mount a host directory into the VM
    - [CLI Reference](cli.md) — `cdkx multipass launch`, `start`, `stop`, `delete`
