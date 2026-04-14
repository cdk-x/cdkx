# CLI Reference

The `cdkx multipass` command group wraps the `multipass` binary and reads `multipass.yaml` to auto-complete all arguments. This means you never have to type `--cpus`, `--memory`, or `--disk` manually — everything is read from the config file.

## Prerequisites

- `multipass.yaml` must exist in the current directory (run `cdkx synth` first).
- The `multipass` binary must be [installed](https://multipass.run/install) and available in `PATH`.

## Common flags

All `cdkx multipass` subcommands accept these flags:

| Flag | Default | Description |
|------|---------|-------------|
| `--all` | — | Target all instances defined in `multipass.yaml`. |
| `--config <file>` | `multipass.yaml` | Path to a custom config file. |

## Commands

### `cdkx multipass launch`

Creates and starts one or more VMs. Translates each instance's config into `multipass launch <image> --name <name> --cpus <n> --memory <m> --disk <d>`.

```bash
# Launch a specific VM
cdkx multipass launch dev

# Launch multiple VMs
cdkx multipass launch dev worker

# Launch all VMs defined in multipass.yaml
cdkx multipass launch --all
```

!!! tip
    If the VM already exists, Multipass will return an error. Use `cdkx multipass delete dev` first to recreate it.

### `cdkx multipass start`

Starts stopped VMs.

```bash
cdkx multipass start dev
cdkx multipass start dev worker
cdkx multipass start --all
```

### `cdkx multipass stop`

Gracefully stops running VMs.

```bash
cdkx multipass stop dev
cdkx multipass stop --all
```

### `cdkx multipass delete`

Deletes VMs and immediately purges them (frees disk). Equivalent to `multipass delete <name> --purge`.

```bash
cdkx multipass delete dev
cdkx multipass delete --all
```

!!! warning "Permanent"
    Delete + purge is irreversible. The VM's disk image is permanently removed. Re-run `cdkx multipass launch` to recreate it.

## Custom config path

If your `multipass.yaml` is not in the current working directory:

```bash
cdkx multipass launch dev --config ./infra/multipass.yaml
cdkx multipass start --all --config /absolute/path/multipass.yaml
```

## `--all` error handling

When using `--all`, if one VM fails the command continues with the remaining VMs. All failures are reported at the end with a non-zero exit code.

```
Launching dev...
✔ Launched dev
Launching worker...
✖ Failed to launch worker
Error: Launch failed for: worker
```

## Output streaming

All commands stream `multipass` output in real time. Progress messages like `Downloading Ubuntu 22.04 LTS...` appear as they happen.

---

!!! info "See also"
    - [MltInstance](instance.md) — define VMs in TypeScript
    - [Overview](index.md) — how synth + CLI work together
