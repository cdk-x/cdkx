# Hetzner Cloud

The Hetzner provider lets you manage [Hetzner Cloud](https://www.hetzner.com/cloud) infrastructure from cdkx. It uses the Hetzner Cloud API and is available as a separate package.

## Installation

```bash
npm install @cdkx-io/hetzner
```

## Authentication

The provider reads your API token from the `HCLOUD_TOKEN` environment variable. Generate a token in the [Hetzner Cloud Console](https://console.hetzner.cloud/) under **Project → Security → API Tokens**.

```bash
export HCLOUD_TOKEN=your-api-token
cdkx deploy
```

!!! warning "Keep your token secret"
    Never commit `HCLOUD_TOKEN` to source control. Use environment variables, a secrets manager, or a `.env` file excluded from git.

## Supported resources

| Construct | Type string | Description |
|-----------|-------------|-------------|
| [`HtzNetwork`](network.md) | `Hetzner::Networking::Network` | Private network (VPC-like) |
| [`HtzSubnet`](subnet.md) | `Hetzner::Networking::Subnet` | Subnet within a network |
| [`HtzRoute`](route.md) | `Hetzner::Networking::Route` | Static route added to a network |
| [`HtzServer`](server.md) | `Hetzner::Compute::Server` | Virtual machine |
| [`HtzCertificate`](certificate.md) | `Hetzner::Security::Certificate` | TLS certificate (uploaded or Let's Encrypt managed) |

## Quick example

```typescript title="src/main.ts" linenums="1" hl_lines="8 9 10 11 12 13"
import { App, Stack } from '@cdkx-io/core';
import {
  HtzNetwork,
  HtzSubnet,
  HtzServer,
  ServerType,
  NetworkZone,
} from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'MyStack');

const network = new HtzNetwork(stack, 'Network', { // (1)!
  name: 'my-network',
  ipRange: '10.0.0.0/8',
});

const subnet = new HtzSubnet(stack, 'Subnet', { // (2)!
  networkId: network.attrNetworkId,
  type: 'cloud',
  networkZone: NetworkZone.EU_CENTRAL,
  ipRange: '10.0.1.0/24',
});

new HtzServer(stack, 'Server', { // (3)!
  name: 'web-1',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  networks: [subnet.networkId],
});

app.synth();
```

1. Creates a private network — the foundation for all private networking.
2. Carves out a `/24` subnet. References the network's ID via a token — deployed after the network.
3. A `cx22` server booted with Ubuntu 24.04.

---

!!! info "See also"
    - [Tokens & Cross-resource References](../../concepts/tokens.md) — how `attrNetworkId` works
    - [Deployment Lifecycle](../../concepts/deployment-lifecycle.md) — how resources are deployed in order
