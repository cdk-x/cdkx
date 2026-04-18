# InstanceNetwork

`InstanceNetwork` is an inline type used in `MltInstance.networks`. It declares a host network interface to be attached to the VM at launch time. Each entry maps to a `--network` argument passed to `multipass launch`.

There is no separate `MltNetwork` construct — networks are declared as plain objects directly on `MltInstance`:

```typescript
new MltInstance(stack, 'Dev', {
  name: 'dev',
  networks: [
    { name: 'bridge', mode: 'auto' },
  ],
});
```

## Shape

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | Name of the host network interface (e.g. `bridge`, `en0`, `eth0`). Run `multipass networks` to list available interfaces on your machine. |
| `mode` | `'auto' \| 'manual'` | — | Network configuration mode. `auto` lets Multipass configure the interface automatically. Defaults to `auto`. |
| `mac` | `string` | — | Optional MAC address override for the guest interface. |

## Finding available interfaces

List the network interfaces that Multipass can use on your machine:

```bash
multipass networks
```

## Example

```typescript title=".cdkxrc.ts" linenums="1"
import { App, Stack } from '@cdk-x/core';
import { MltInstance, MltProvider } from '@cdk-x/multipass';

const app = new App();
const stack = new Stack(app, 'DevVMs', { provider: new MltProvider() });

new MltInstance(stack, 'Dev', {
  name: 'dev',
  image: 'jammy',
  networks: [
    { name: 'bridge', mode: 'auto' },
    { name: 'en0', mode: 'manual', mac: 'aa:bb:cc:dd:ee:ff' },
  ],
});

app.synth();
```

---

!!! info "See also"
    - [MltInstance](instance.md) — full props reference
    - [InstanceMount](mount.md) — mount host directories into the VM
