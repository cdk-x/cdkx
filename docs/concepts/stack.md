# Stack

A **Stack** is a deployment unit. Resources added to a stack are synthesized together into a single output file and deployed as a group.

Every cdkx program has at least one stack. Multiple stacks can coexist under the same `App` — each produces its own output file and is deployed independently.

## Basic usage

```typescript title="src/main.ts" linenums="1"
import { App, Stack } from '@cdk-x/core';
import { HtzNetwork, HtzSubnet } from '@cdk-x/hetzner';

const app = new App();

const networkStack = new Stack(app, 'NetworkStack'); // (1)!
new HtzNetwork(networkStack, 'Network', { name: 'my-net', ipRange: '10.0.0.0/8' });
new HtzSubnet(networkStack, 'Subnet', { /* ... */ });

const computeStack = new Stack(app, 'ComputeStack'); // (2)!
// ... server resources ...

app.synth();
// Produces: cdkx.out/NetworkStack.json
//           cdkx.out/ComputeStack.json
```

1. Resources in `NetworkStack` are deployed together and produce `NetworkStack.json`.
2. A second independent deployment unit — produced as `ComputeStack.json`.

## Artifact ID

The `artifactId` is derived from the construct node path by replacing `/` with `-` and stripping any leading `-`. It is used as:

- The output file name stem (`<artifactId>.json`)
- The key in `manifest.json`

```typescript
const stack = new Stack(app, 'MyStack');
console.log(stack.artifactId); // "MyStack"
```

## Stack props

All props are optional:

```typescript
new Stack(app, 'MyStack', {
  stackName: 'human-readable-name', // shown in the CLI output (default: construct id)
  description: 'Manages core networking',
  synthesizer: new YamlSynthesizer(), // override the output format (default: JSON)
});
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stackName` | `string` | construct `id` | Human-readable display name in CLI output |
| `description` | `string` | — | Optional description (informational) |
| `synthesizer` | `IStackSynthesizer` | `JsonSynthesizer` | Controls output format (JSON, YAML, etc.) |

## Static helpers

```typescript
// Find the nearest enclosing Stack. Useful inside L2 constructs.
const stack = Stack.of(someResource);

// Type guard
Stack.isStack(x); // true | false
```

## Multi-provider stacks

Resources from different providers can coexist in the same stack. Each resource carries its provider identifier in its type string (e.g. `Hetzner::Networking::Network`). The engine groups them by provider at deploy time:

```typescript
const stack = new Stack(app, 'MyStack');
new HtzServer(stack, 'Server', { /* hetzner resource */ });
// future: new K8sDeployment(stack, 'App', { /* kubernetes resource */ });
```

---

!!! info "See also"
    - [App](app.md) — the root that owns all stacks
    - [Construct](construct.md) — the building block that stacks and resources are built from
    - [Cloud Assembly](cloud-assembly.md) — the output that `app.synth()` writes to disk
    - [Deployment Lifecycle](deployment-lifecycle.md) — how the engine processes a stack
