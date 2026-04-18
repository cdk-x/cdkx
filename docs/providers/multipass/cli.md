# Prerequisites

Before deploying Multipass resources with cdkx, ensure the following:

## Multipass binary

The `multipass` binary must be installed and available in `PATH`. cdkx calls it directly during `cdkx deploy` and `cdkx destroy`.

Install from [multipass.run/install](https://multipass.run/install), then verify:

```bash
multipass version
```

## Standard cdkx commands

The Multipass provider uses the standard cdkx workflow — no provider-specific CLI commands are needed:

| Command | What it does |
|---------|-------------|
| `cdkx synth` | Synthesizes your app into `cdkx.out/` |
| `cdkx deploy` | Calls `multipass launch` for each `MltInstance` |
| `cdkx destroy` | Calls `multipass delete --purge` for each `MltInstance` |

```bash
cdkx synth
cdkx deploy
cdkx destroy
```

See the [CLI Reference](../../getting-started/cli-reference.md) for all available flags.

## Useful multipass commands

While cdkx manages the lifecycle, these native commands are useful for inspecting VM state:

```bash
# List running VMs
multipass list

# Get VM details (IP, state, mounts)
multipass info <name>

# Open a shell inside a VM
multipass shell <name>

# List network interfaces available for --network
multipass networks
```

---

!!! info "See also"
    - [Overview](index.md) — how synth and deploy work together
    - [MltInstance](instance.md) — define VMs in TypeScript
