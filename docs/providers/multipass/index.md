# Multipass

The Multipass provider lets you define and manage local Ubuntu VMs using [Canonical Multipass](https://multipass.run). Instead of deploying to a cloud API, it synthesizes a `multipass.yaml` configuration file and provides CLI commands to launch, start, stop, and delete VMs.

!!! note "Local-only provider"
    Multipass runs on your machine. No cloud account or API token is required. You do need [Multipass installed](https://multipass.run/install) locally.

## Installation

```bash
npm install @cdk-x/multipass
```

## How it works

The Multipass provider follows a two-step workflow:

1. **Synth** — your `.cdkxrc.ts` app runs and writes a `multipass.yaml` file with the resolved VM configuration.
2. **CLI** — `cdkx multipass <command>` reads `multipass.yaml` and calls the `multipass` binary with the correct arguments.

```
.cdkxrc.ts  →  cdkx synth  →  multipass.yaml  →  cdkx multipass launch
```

## Quick example

```typescript title=".cdkxrc.ts" linenums="1"
import { Workspace, YamlFile } from '@cdk-x/core';
import { MltInstance, MltConfig } from '@cdk-x/multipass';

const workspace = new Workspace();

const multipass = new YamlFile(workspace, 'DevVMs', {
  fileName: 'multipass.yaml',
});

const dev = new MltInstance(multipass, 'Dev', {
  name: 'dev',
  image: 'jammy',
  cpus: 4,
  memory: '4G',
  disk: '20G',
});

new MltConfig(multipass, 'Config', {
  instances: [dev.ref],
});

workspace.synth();
```

Then run:

```bash
cdkx synth                  # writes multipass.yaml
cdkx multipass launch dev   # runs: multipass launch jammy --name dev --cpus 4 --memory 4G --disk 20G
```

## Supported resources

| Construct | Type string | Description |
|-----------|-------------|-------------|
| [`MltInstance`](instance.md) | `Multipass::Compute::Instance` | Declares a Ubuntu VM |
| [`MltNetwork`](network.md) | `Multipass::VM::Network` | A host network interface to attach to a VM |
| [`MltMount`](mount.md) | `Multipass::VM::Mount` | A host-to-guest directory mount |

## Synthesized output

Running `cdkx synth` produces a `multipass.yaml` at the project root:

```yaml
instances:
  - name: dev
    image: jammy
    cpus: 4
    memory: 4G
    disk: 20G
```

This file is intended to be committed to your repository — it is the source of truth that `cdkx multipass` commands read at runtime.

---

!!! info "See also"
    - [CLI Reference](cli.md) — all `cdkx multipass` commands
    - [Workspace](../../concepts/app.md) — using `Workspace` instead of `App` for local config workflows
