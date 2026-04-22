# Asset

An **Asset** is any local file or directory bundled into the [cloud assembly](cloud-assembly.md) at synth time. Resources reference the staged asset by its absolute path on disk — a plain string known at construction time, with no token resolution required.

Typical use cases:

- A `cloud-init.yaml` passed to a server's `userData` field
- A directory of provisioning scripts mounted into a VM
- A TLS certificate bundle uploaded to a load balancer

## How it works

`Asset` is a `Construct` with two phases:

1. **Construction time** — hashes the source content (SHA-256), resolves the destination path inside the assembly outdir, and exposes `assetHash` + `absolutePath`.
2. **Synthesis time** — `App.synth()` (Phase 0, before stack synthesis) copies the source into `cdkx.out/assets/asset.<hash>/` and registers a `cdkx:asset` artifact in `manifest.json`.

The hash is content-addressed: identical content always produces the same `asset.<hash>` directory, regardless of source path or file name. Re-running `synth` with unchanged sources is idempotent.

## Basic usage

```typescript title="src/main.ts" linenums="1"
import * as path from 'node:path';
import { App, Asset, Stack } from '@cdk-x/core';
import { MltInstance } from '@cdk-x/multipass';

const app = new App();
const stack = new Stack(app, 'Network');

const cloudInit = new Asset(stack, 'CloudInit', { // (1)!
  path: path.resolve(__dirname, '../cloud-init.yaml'),
});

new MltInstance(stack, 'Instance', {
  name: 'my-vm',
  image: 'jammy',
  cpus: 1,
  memory: '1G',
  cloudInit: cloudInit.absolutePath, // (2)!
});

app.synth();
```

1. The asset is a child of the stack — its lifetime follows the stack's. `path` must resolve to an existing local file.
2. `absolutePath` is a plain `string`, not a token. The L1 construct receives it directly.

## File vs directory assets

`AssetProps` accepts **exactly one** of `path` or `directoryPath`:

=== "File asset"

    ```typescript
    new Asset(stack, 'CloudInit', { path: './cloud-init.yaml' });
    ```

    Staged as `cdkx.out/assets/asset.<hash>/cloud-init.yaml`.
    `absolutePath` points to the file itself.

=== "Directory asset"

    ```typescript
    new Asset(stack, 'Provisioning', { directoryPath: './provisioning' });
    ```

    Staged as `cdkx.out/assets/asset.<hash>/` mirroring the source tree.
    `absolutePath` points to the directory root (no wrapping file name).

Passing both — or neither — throws at construction time.

## Hashing

| Source | Hash input |
|--------|------------|
| File   | SHA-256 of raw file bytes |
| Directory | SHA-256 over each file's relative POSIX path + SHA-256 of its contents, joined with `\0` and `\n`, in sort order |

Notes:

- File **permissions** and **timestamps** are not part of the hash.
- **Symlinks** are followed; their target contents contribute to the hash.
- An **empty directory** still produces a stable hash.
- Renaming a file changes the directory hash; editing the byte content of any file changes both the file and directory hash.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `assetHash` | `string` | SHA-256 hex digest of the source content. |
| `absolutePath` | `string` | Absolute path to the staged file or directory inside the cloud assembly. Use this in resource properties. |
| `sourcePath` | `string` | Absolute path to the original source on disk. |
| `fileName` | `string \| undefined` | Source file name (file packaging). `undefined` for directory packaging. |
| `packaging` | `'file' \| 'directory'` | Discriminator. |

```typescript
const asset = new Asset(stack, 'X', { path: './data.bin' });

asset.assetHash;     // 'a3f5...'  (64 hex chars)
asset.absolutePath;  // '/abs/cdkx.out/assets/asset.a3f5.../data.bin'
asset.sourcePath;    // '/abs/data.bin'
asset.fileName;      // 'data.bin'
asset.packaging;     // 'file'

Asset.isAsset(asset); // true
```

## What gets written

After `cdkx synth`:

```
cdkx.out/
├── manifest.json
├── Network.json
└── assets/
    └── asset.a3f5b1c4…/
        └── cloud-init.yaml
```

The corresponding manifest entry:

```json title="cdkx.out/manifest.json"
{
  "version": "1.0.0",
  "artifacts": {
    "asset.a3f5b1c4…": {
      "type": "cdkx:asset",
      "properties": {
        "hash": "a3f5b1c4…",
        "path": "assets/asset.a3f5b1c4…/cloud-init.yaml",
        "packaging": "file"
      }
    },
    "Network": {
      "type": "cdkx:stack",
      "properties": { "templateFile": "Network.json" }
    }
  }
}
```

The `path` field is **relative to the assembly outdir** so the assembly stays portable across machines.

## Deploy-time verification

Before any provider call, `cdkx deploy` runs a pre-deploy check that walks every `cdkx:asset` artifact and asserts the referenced file exists on disk. If any asset is missing, deployment fails fast with a clear error:

```
Cannot deploy: 1 asset file(s) missing from the cloud assembly.
Run 'cdkx synth' to regenerate the assembly. Missing:
  - /abs/cdkx.out/assets/asset.a3f5b1c4…/cloud-init.yaml
```

This catches stale or partially deleted assemblies before any remote state is mutated.

## Patterns

### Same content, multiple references

Two `Asset` constructs over the same content produce the same hash and stage to the same directory. Both `absolutePath` strings will be equal:

```typescript
const a = new Asset(stack, 'A', { path: './cloud-init.yaml' });
const b = new Asset(stack, 'B', { path: './cloud-init.yaml' });

a.absolutePath === b.absolutePath; // true
```

### Sharing across stacks

An asset can live in any stack. Other stacks may reference its `absolutePath` directly — the value is a plain string, not a token, so no cross-stack reference plumbing is needed.

```typescript
const sharedStack = new Stack(app, 'Shared');
const ssh = new Asset(sharedStack, 'SshKey', { path: './id_ed25519.pub' });

const computeStack = new Stack(app, 'Compute');
new HtzServer(computeStack, 'Server', {
  // ...
  userData: ssh.absolutePath,
});
```

## Caveats

- Source paths are resolved **at construction time**, against the current working directory. Prefer `path.resolve(__dirname, …)` for portability.
- The source file/directory must exist when the construct is created — hashing reads it eagerly.
- Hashing is synchronous and reads the full content into memory. Very large assets will block the synth process.
- Symlinks inside directory assets are followed; cycles will recurse.

---

!!! info "See also"
    - [App](app.md) — Phase 0 of `app.synth()` is what stages assets
    - [Cloud Assembly](cloud-assembly.md) — the `cdkx:asset` artifact format
    - [Deployment Lifecycle](deployment-lifecycle.md) — when the pre-deploy asset check runs
