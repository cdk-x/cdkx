# cdkx

[![Status: Experimental](https://img.shields.io/badge/status-experimental-orange?style=flat-square)](https://github.com/cdk-x/cdkx)
[![CI](https://github.com/cdk-x/cdkx/actions/workflows/ci.yml/badge.svg)](https://github.com/cdk-x/cdkx/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@cdkx-io/core?label=%40cdkx-io%2Fcore&style=flat-square)](https://www.npmjs.com/package/@cdkx-io/core)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square)](LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow?style=flat-square)](https://conventionalcommits.org)

> **cdkx is in active development. APIs may change between releases.**

A multi-provider CDK-like framework for TypeScript. Write your infrastructure as construct trees — cdkx synthesizes provider-specific manifests and deploys them through provider APIs.

## How it works

```typescript
import { App, Stack } from '@cdkx-io/core';
import { HtzNetwork, HtzSubnet } from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'MyStack');

const network = new HtzNetwork(stack, 'Network', {
  name: 'my-network',
  ip_range: '10.0.0.0/16',
});

new HtzSubnet(stack, 'Subnet', {
  network_id: network.getAtt('id'), // (1)
  type: 'cloud',
  ip_range: '10.0.1.0/24',
  network_zone: 'eu-central',
});

app.synth();
```

```bash
cdkx deploy
```

1. Cross-resource reference — resolved automatically at deploy time.

Two phases:

1. **Synth** (`cdkx synth`) — runs your app and produces a cloud assembly: `cdkx.out/manifest.json` and one JSON file per stack.
2. **Deploy** (`cdkx deploy`) — reads the assembly, resolves references, builds a dependency graph, and calls the provider API in topological order.

## Packages

| Package | Description |
|---------|-------------|
| `@cdkx-io/core` | Construct primitives (`App`, `Stack`, `ProviderResource`), synthesis pipeline |
| `@cdkx-io/cli` | CLI binary (`cdkx synth`, `cdkx deploy`, `cdkx destroy`) |
| `@cdkx-io/hetzner` | Hetzner Cloud provider — Network, Subnet, Route, Server, Certificate |

## Documentation

Full documentation at **[docs.cdkx.com](https://docs.cdkx.com)**.

- [Getting Started](https://docs.cdkx.com/latest/getting-started/installation/)
- [Concepts](https://docs.cdkx.com/latest/concepts/app/)
- [Hetzner Provider](https://docs.cdkx.com/latest/providers/hetzner/)

## Install

```bash
npm install @cdkx-io/core @cdkx-io/hetzner
npm install -g @cdkx-io/cli
```

## License

Apache 2.0 — see [LICENSE](LICENSE).
