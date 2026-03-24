# Cloud Assembly

The **cloud assembly** is the output of `cdkx synth`. It is a directory of files — one JSON template per stack plus a `manifest.json` index — that fully describes what should be deployed and where.

The engine reads the cloud assembly during `cdkx deploy` and `cdkx destroy`. The app is never re-executed at deploy time.

## Producing a cloud assembly

```bash
cdkx synth
# ✔ Synthesis complete — output written to cdkx.out
```

```
cdkx.out/
├── manifest.json       # index of all stacks
├── NetworkStack.json   # resources for the NetworkStack
└── ComputeStack.json   # resources for the ComputeStack
```

You can change the output directory:

```bash
cdkx synth --output dist/assembly
```

Or in `cdkx.json`:

```json
{
  "app": "npx tsx src/main.ts",
  "output": "dist/assembly"
}
```

## `manifest.json`

The manifest is an index of all stacks in the assembly. It contains only non-sensitive metadata — no credentials, no secrets.

```json title="cdkx.out/manifest.json"
{
  "version": "1.0.0",
  "artifacts": {
    "NetworkStack": {
      "type": "cdkx:stack",
      "properties": {
        "templateFile": "NetworkStack.json"
      },
      "displayName": "NetworkStack"
    },
    "ComputeStack": {
      "type": "cdkx:stack",
      "properties": {
        "templateFile": "ComputeStack.json"
      },
      "displayName": "ComputeStack"
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `version` | Schema version. Used by the CLI to detect incompatible assemblies. |
| `artifacts` | Map of artifact ID → stack metadata. The key is the stack's `artifactId`. |
| `type` | Always `"cdkx:stack"` for stack artifacts. |
| `properties.templateFile` | The stack template file name inside `cdkx.out/`. |
| `displayName` | Human-readable name shown in CLI output. |

## Stack template (`<artifactId>.json`)

Each stack produces one JSON file. Resources are keyed by their `logicalId`:

```json title="cdkx.out/NetworkStack.json"
{
  "NetworkStackNetworkA1B2C3D4": {
    "type": "Hetzner::Networking::Network",
    "provider": "hetzner",
    "properties": {
      "name": "my-net",
      "ipRange": "10.0.0.0/8"
    },
    "metadata": {
      "cdkx:path": "NetworkStack/Network"
    }
  },
  "NetworkStackSubnetE5F6G7H8": {
    "type": "Hetzner::Networking::Subnet",
    "provider": "hetzner",
    "properties": {
      "networkId": { "ref": "NetworkStackNetworkA1B2C3D4", "attr": "networkId" }, // (1)!
      "ipRange": "10.0.1.0/24",
      "networkZone": "eu-central",
      "type": "cloud"
    },
    "metadata": {
      "cdkx:path": "NetworkStack/Subnet"
    },
    "dependsOn": ["NetworkStackNetworkA1B2C3D4"] // (2)!
  }
}
```

1. A `{ ref, attr }` token — tells the engine: _"read the `networkId` output from the resource with logical ID `NetworkStackNetworkA1B2C3D4`"_. See [Tokens](tokens.md).
2. Explicit dependency — the engine will not start this resource until the network is `CREATE_COMPLETE`.

| Field | Description |
|-------|-------------|
| `type` | Provider resource type, e.g. `Hetzner::Networking::Network` |
| `provider` | Provider identifier, e.g. `hetzner` |
| `properties` | Resolved resource properties. May contain `{ ref, attr }` tokens. |
| `metadata."cdkx:path"` | Construct node path — maps the logical ID back to the construct tree |
| `dependsOn` | Logical IDs this resource must wait for before being created (omitted when empty) |

## State file

The engine writes deployment state to `.cdkx/` next to `cdkx.json`. This directory tracks which resources have been created, their remote IDs, and their current status.

!!! tip "Add to `.gitignore`"
    The `.cdkx/` directory contains deployment state specific to one environment. Add it to `.gitignore` unless you explicitly want to commit it.

---

!!! info "See also"
    - [App](app.md) — produces the cloud assembly via `app.synth()`
    - [Tokens](tokens.md) — the `{ ref, attr }` objects found in properties
    - [Deployment Lifecycle](deployment-lifecycle.md) — how the engine consumes the cloud assembly
