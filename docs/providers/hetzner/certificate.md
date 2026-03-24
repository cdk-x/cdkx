# Certificate

`HtzCertificate` manages a [Hetzner Cloud TLS certificate](https://docs.hetzner.com/cloud/load-balancers/faq/#can-i-use-my-own-certificate). Two types are supported: **uploaded** (you supply the PEM-encoded certificate and key) and **managed** (Hetzner requests and renews a Let's Encrypt certificate automatically).

**Type:** `Hetzner::Security::Certificate`
**Import:** `@cdkx-io/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Certificate name. Must be unique within the project. |
| `type` | `CertificateType` | — | `uploaded` or `managed`. Defaults to `uploaded` when omitted. |
| `certificate` | `string` | Uploaded only | PEM-encoded certificate chain. Required when `type` is `uploaded`. |
| `privateKey` | `string` | Uploaded only | PEM-encoded private key. Required when `type` is `uploaded`. |
| `domainNames` | `string[]` | Managed only | Domains for the Let's Encrypt certificate. Required when `type` is `managed`. |
| `labels` | `Record<string, string>` | — | Key/value labels. |

## Attribute getters

| Getter | Resolves to |
|--------|------------|
| `attrCertificateId` | The Hetzner-assigned certificate ID (integer). Used by `HtzLoadBalancer`. |

## Create example — managed certificate

```typescript title="src/main.ts" linenums="1" hl_lines="7 8 9 10"
import { App, Stack } from '@cdkx-io/core';
import { HtzCertificate, CertificateType } from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'SecurityStack');

const cert = new HtzCertificate(stack, 'Certificate', {
  name: 'my-app-cert',
  type: CertificateType.MANAGED, // (1)!
  domainNames: ['example.com', 'www.example.com'], // (2)!
});

app.synth();
```

1. Hetzner requests and automatically renews the Let's Encrypt certificate. DNS must already resolve to your load balancer.
2. All domains are included in a single certificate (SAN). Wildcard domains are supported by Let's Encrypt.

## Create example — uploaded certificate

```typescript linenums="1" hl_lines="6 7 8"
import { readFileSync } from 'node:fs';

new HtzCertificate(stack, 'Certificate', {
  name: 'my-custom-cert',
  type: CertificateType.UPLOADED,
  certificate: readFileSync('certs/fullchain.pem', 'utf-8'), // (1)!
  privateKey: readFileSync('certs/privkey.pem', 'utf-8'),   // (2)!
});
```

1. Full certificate chain (certificate + intermediates) in PEM format.
2. The private key must correspond to the leaf certificate. Never commit private keys — read them from a secrets manager or environment variable.

## Cross-resource reference example

Certificates are referenced by a Load Balancer HTTPS service:

```typescript linenums="1" hl_lines="8"
import { HtzCertificate, HtzLoadBalancer, CertificateType } from '@cdkx-io/hetzner';

const cert = new HtzCertificate(stack, 'Cert', {
  name: 'my-cert',
  type: CertificateType.MANAGED,
  domainNames: ['example.com'],
});

new HtzLoadBalancer(stack, 'LB', {
  name: 'my-lb',
  loadBalancerType: 'lb11',
  services: [{
    protocol: 'https',
    listenPort: 443,
    destinationPort: 80,
    proxyprotocol: false,
    healthCheck: { protocol: 'tcp', port: 80, interval: 15, timeout: 10, retries: 3 },
    http: {
      certificates: [cert.attrCertificateId], // (1)!
    },
  }],
});
```

1. `attrCertificateId` resolves to the integer certificate ID after the certificate is created.

## Destroy behavior

The engine calls `DELETE /certificates/{id}`. The certificate is immediately removed from the Hetzner project. Any load balancer service referencing it will stop working — make sure no active resources depend on it before destroying.

!!! tip "Managed certificate renewal"
    Managed certificates are renewed automatically by Hetzner before expiry. You do not need to redeploy or update the construct.

---

!!! info "See also"
    - [Server](server.md) — servers that host the services the certificate secures
    - [Tokens](../../concepts/tokens.md) — how `attrCertificateId` resolves at deploy time
