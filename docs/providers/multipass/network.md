# Network

`MltNetwork` declares a host network interface to be attached to one or more VMs. It is referenced by `MltInstance` via `mltNetwork.ref`.

**Type:** `Multipass::VM::Network`  
**Import:** `@cdk-x/multipass`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Name of the host network interface (e.g. `bridge`, `en0`, `eth0`). Run `multipass networks` to list available interfaces on your machine. |
| `mode` | `'auto' \| 'manual'` | — | Network configuration mode. `auto` lets Multipass configure the interface automatically. Defaults to `auto`. |
| `mac` | `string` | — | Optional MAC address override for the guest interface. |

## Example

```typescript title=".cdkxrc.ts" linenums="1"
import { Workspace, YamlFile } from '@cdk-x/core';
import { MltInstance, MltNetwork, MltConfig } from '@cdk-x/multipass';

const workspace = new Workspace();
const multipass = new YamlFile(workspace, 'DevVMs', { fileName: 'multipass.yaml' });

const bridge = new MltNetwork(multipass, 'Bridge', {
  name: 'bridge',
  mode: 'auto',
});

const dev = new MltInstance(multipass, 'Dev', {
  name: 'dev',
  image: 'jammy',
  networks: [bridge.ref], // (1)!
});

new MltConfig(multipass, 'Config', { instances: [dev.ref] });

workspace.synth();
```

1. Pass `bridge.ref` — not the object itself. The ref resolves at synthesis and nests the network config inside the instance YAML entry.

Produces:

```yaml
instances:
  - name: dev
    image: jammy
    networks:
      - name: bridge
        mode: auto
```

## Finding available interfaces

List the network interfaces that Multipass can use on your machine:

```bash
multipass networks
```

---

!!! info "See also"
    - [MltInstance](instance.md) — attach the network via `networks: [bridge.ref]`
    - [MltMount](mount.md) — mount host directories into the VM
