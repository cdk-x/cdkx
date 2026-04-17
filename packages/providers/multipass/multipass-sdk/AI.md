# @cdk-x/multipass-sdk

## Role

Thin wrapper around the `multipass` CLI binary. Exposes a typed TypeScript API for the operations cdkx needs: checking that Multipass is installed, launching VMs, querying their state, and deleting them.

## Architecture

Single class: `MultipassCli`. All methods are `async` and reject with descriptive errors on failure.

```
MultipassCli
  assertInstalled()   — runs `multipass version`, throws if not found
  launch(opts)        — runs `multipass launch …` with all supported flags
  info(name)          — runs `multipass info <name> --format json`, parses and returns MultipassVmInfo
  delete(name)        — runs `multipass delete --purge <name>`
```

No dependency on any other `@cdk-x/*` package — intentional so it can be used standalone or replaced.

## Key types

- `MultipassLaunchOpts` — 1:1 mapping of `MltInstance` props (name, image, cpus, memory, disk, bridged, timeout, cloudInit)
- `MultipassVmInfo` — parsed from `multipass info --format json`: `{ name, ipAddress, sshUser, state }`

## Relationships

- Used by `@cdk-x/multipass-runtime` — the runtime imports `MultipassCli` and calls it from `MultipassInstanceHandler`.
- No dependency on `@cdk-x/multipass` (the construct library) — that direction is intentional to keep the SDK layer clean.
