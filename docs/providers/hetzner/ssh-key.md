# SSH Key

`HtzSshKey` manages a [Hetzner Cloud SSH key](https://docs.hetzner.com/cloud/servers/getting-started/connecting-to-server). SSH keys are uploaded once to the project and can then be injected into any server at creation time.

**Type:** `Hetzner::Security::SshKey`
**Import:** `@cdkx-io/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | SSH key name. Must be unique within the project. |
| `publicKey` | `string` | ✅ | OpenSSH-format public key (e.g. contents of `~/.ssh/id_ed25519.pub`). Create-only — cannot be changed after creation. |
| `labels` | `Record<string, string>` | — | Key/value labels. |

## Attribute getters

| Getter | Resolves to |
|--------|------------|
| `attrName` | The SSH key name. Use this to reference the key from `HtzServer.sshKeys` so the engine deploys the key before the server. |

## Create example

```typescript title="src/main.ts" linenums="1" hl_lines="7 8 9 10"
import { App, Stack } from '@cdkx-io/core';
import { HtzSshKey } from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'SecurityStack');

new HtzSshKey(stack, 'MyKey', {
  name: 'deployer',
  publicKey: 'ssh-ed25519 AAAA... user@host', // (1)!
  labels: { env: 'production' },
});

app.synth();
```

1. Paste the contents of your public key file here. The private key never leaves your machine.

## Cross-resource reference example

Reference the SSH key from a server so cdkx deploys the key first:

```typescript linenums="1" hl_lines="7 11"
import { HtzSshKey, HtzServer, ServerType, Location } from '@cdkx-io/hetzner';

const sshKey = new HtzSshKey(stack, 'Key', {
  name: 'deployer',
  publicKey: process.env['SSH_PUBLIC_KEY'] ?? '',
});

new HtzServer(stack, 'WebServer', {
  name: 'web-1',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  location: Location.NBG1,
  sshKeys: [sshKey.attrName], // (1)!
});
```

1. `attrName` produces a `{ ref, attr }` token — the engine resolves it after the SSH key is created and injects the key name into the server request. The server automatically gains a `dependsOn` on the SSH key.

## Update behavior

Only `name` and `labels` can be updated after creation. The `publicKey` is a `createOnlyProperty` — it is excluded from update requests. To rotate a key, destroy the old construct and create a new one.

## Destroy behavior

The engine calls `DELETE /ssh_keys/{id}`. The key is removed from the Hetzner project. Existing servers that were provisioned with this key are **not affected** — the key material was already copied into the server at creation time.

---

!!! info "See also"
    - [Server](server.md) — attach SSH keys to servers at creation
    - [Tokens & Cross-resource References](../../concepts/tokens.md) — how `attrName` resolves at deploy time
