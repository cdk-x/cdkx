# Your First Stack

This guide walks through the core concepts of cdkx using the project scaffolded by `cdkx init`. By the end you will understand how a cdkx app is structured and how synth and deploy work — before adding any provider-specific resources.

## What `cdkx init` generated

```
my-project/
├── src/main.ts     # your infrastructure entrypoint
├── cdkx.json       # cdkx configuration
├── tsconfig.json
└── package.json
```

The generated `src/main.ts` is the starting point for every cdkx project:

```typescript title="src/main.ts" linenums="1"
import { App, Stack } from '@cdkx-io/core';

const app = new App(); // (1)

const stack = new Stack(app, 'MyStack'); // (2)

// Add your resources here
void stack;

app.synth(); // (3)
```

1. **`App`** is the root of the construct tree. Every cdkx program starts with one.
2. **`Stack`** is a deployment unit. Resources inside a stack are deployed together.
   The second argument (`'MyStack'`) becomes the stack ID and the name of its output file.
3. **`app.synth()`** serializes the construct tree to JSON manifests in `cdkx.out/`.
   You must call this at the end of every entrypoint.

## Synthesize

Before you add any real resources, run synth to see the pipeline in action:

```bash
cdkx synth
```

cdkx runs your app and writes the cloud assembly:

```
✔ Synthesis complete — output written to cdkx.out
```

```
cdkx.out/
├── manifest.json   # index of all stacks and their artifact IDs
└── MyStack.json    # resource definitions for the MyStack stack
```

Since you have no resources yet, `MyStack.json` contains only metadata:

```json title="cdkx.out/MyStack.json"
{}
```

## Add your first resource

Pick the provider you are deploying to and follow its guide to add resources to the stack.
Each provider page shows the exact imports, props, and a complete working example:

<div class="grid cards" markdown>

- :simple-hetzner: **[Hetzner Cloud](../providers/hetzner/index.md)**

    Network, Subnet, Route, Server, Certificate

</div>

Once you have added resources, run synth again to see them serialized:

```json title="cdkx.out/MyStack.json (example with a network resource)"
{
  "NetworkA1B2C3D4": {
    "type": "Hetzner::Networking::Network",
    "properties": {
      "name": "my-network",
      "ipRange": "10.0.0.0/16"
    }
  }
}
```

## Deploy

After synth succeeds, deploy with:

```bash
cdkx deploy
```

The engine reads the cloud assembly, resolves cross-resource references, and calls the
provider API in dependency order, printing a live event table:

```
MyStack  Hetzner::Networking::Network  NetworkA1B2C3D4  CREATE_IN_PROGRESS
MyStack  Hetzner::Networking::Network  NetworkA1B2C3D4  CREATED
```

## Destroy

To tear down everything:

```bash
cdkx destroy
```

You will be prompted to confirm before anything is deleted. Pass `--force` to skip in CI.

## Next steps

- Understand the mental model: [App](../concepts/app.md), [Stack](../concepts/stack.md), [Constructs](../concepts/construct.md)
- Learn how [tokens and cross-stack references](../concepts/tokens.md) work
- Read the full [CLI reference](cli-reference.md)
