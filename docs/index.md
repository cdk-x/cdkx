# cdkx <span class="experimental-badge">Experimental</span>

**cdkx** is a multi-provider CDK-like framework for TypeScript. Write your infrastructure as construct trees — cdkx synthesizes provider-specific manifests and deploys them through provider APIs.

```typescript
import { App, Stack } from '@cdk-x/core';
import { HtzNetwork } from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'MyStack');

new HtzNetwork(stack, 'Network', {
  name: 'my-network',
  ip_range: '10.0.0.0/16',
});

app.synth();
```

```bash
cdkx deploy
```

!!! warning "Active development"
    cdkx is in active development. APIs may change between releases. Pin your dependencies and check the [changelog](https://github.com/cdk-x/cdkx/releases) before upgrading.

## How it works

Two phases:

1. **Synth** — your TypeScript app runs and produces a cloud assembly: a `manifest.json` and one JSON file per stack describing every resource.
2. **Deploy** — cdkx reads the assembly, resolves cross-resource references, builds a dependency graph, and calls the provider API in topological order.

## Providers

| Provider | Status | Resources |
|----------|--------|-----------|
| [Hetzner Cloud](providers/hetzner/index.md) | Alpha | Network, Subnet, Route, Server, Certificate |

## Quick links

<div class="hero-buttons" markdown>

[Get started](getting-started/installation.md){ .md-button .md-button--primary }
[Concepts](concepts/app.md){ .md-button }
[GitHub](https://github.com/cdk-x/cdkx){ .md-button }

</div>
