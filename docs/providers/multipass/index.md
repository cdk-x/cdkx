# Multipass

The Multipass provider lets you define and manage local Ubuntu VMs using [Canonical Multipass](https://multipass.run). It follows the standard cdkx two-phase workflow — synth and deploy — and wraps the `multipass` CLI under the hood.

!!! note "Local-only provider"
    Multipass runs on your machine. No cloud account or API token is required. You do need [Multipass installed](https://multipass.run/install) locally and available in `PATH`.

## Installation

```bash
yarn add @cdk-x/multipass
```

## How it works

1. **Synth** — your app runs and writes a cloud assembly (`cdkx.out/`).
2. **Deploy** — `cdkx deploy` reads the assembly and calls `multipass launch` for each instance. `cdkx destroy` calls `multipass delete --purge`.

```
.cdkxrc.ts  →  cdkx synth  →  cdkx.out/  →  cdkx deploy  →  multipass launch …
```

## Quick example

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

Then run:

```bash
cdkx synth    # produces cdkx.out/
cdkx deploy   # runs: multipass launch jammy --name dev --cpus 4 --memory 4G --disk 20G
cdkx destroy  # runs: multipass delete dev --purge
```

## Example with network and cloud-init

Networks and mounts are declared inline on `MltInstance` — no separate constructs needed:

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
  networks: [{ name: 'bridge', mode: 'auto' }],
  mounts: [{ source: '/Users/me/code', target: '/home/ubuntu/code' }],
  cloudInit: '#cloud-config\npackages:\n  - git\n  - curl\n',
});

app.synth();
```

## Supported resources

| Construct | Type string | Description |
|-----------|-------------|-------------|
| [`MltInstance`](instance.md) | `Multipass::Compute::Instance` | A Ubuntu VM managed by Multipass |

!!! info "Networks and mounts are inline"
    There are no separate `MltNetwork` or `MltMount` constructs. Network interfaces and directory mounts are declared as plain objects directly on `MltInstance.networks` and `MltInstance.mounts`. See [Instance](instance.md) for details.

## Resource lifecycle

All `MltInstance` props are **create-only**. Once a VM is launched its configuration cannot be updated — the engine will never call update. To change a VM, destroy it and redeploy.

| Operation | What happens |
|-----------|-------------|
| `cdkx deploy` | Calls `multipass launch` for each new instance |
| `cdkx destroy` | Calls `multipass delete --purge` for each instance |

---

!!! info "See also"
    - [MltInstance](instance.md) — all props, attributes, and examples
    - [CLI Reference](../../getting-started/cli-reference.md) — standard `cdkx synth`, `deploy`, and `destroy` commands
