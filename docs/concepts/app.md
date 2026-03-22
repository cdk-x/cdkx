# App

An **App** is the root of every cdkx program. It owns the construct tree, drives the synthesis pipeline, and writes the [cloud assembly](cloud-assembly.md) to disk.

## What it does

- Acts as the parent scope for all `Stack` instances
- Caches one resolver pipeline per provider (built lazily on first use)
- When `app.synth()` is called, it traverses all stacks, synthesizes each one, and writes `manifest.json`

## Basic usage

```typescript title="src/main.ts" linenums="1"
import { App, Stack } from '@cdkx-io/core';

const app = new App(); // (1)!

const stack = new Stack(app, 'MyStack'); // (2)!
// ... add resources to stack ...

app.synth(); // (3)!
```

1. Creates the root of the construct tree. `outdir` defaults to `cdkx.out/` relative to the working directory.
2. Stacks are added as direct children of the App.
3. Triggers synthesis — writes all stack files and `manifest.json`. **Must be the last call in every entrypoint.**

## Custom output directory

```typescript
const app = new App({ outdir: 'dist/assembly' });
```

## Global resolvers

Resolvers transform token values during synthesis (e.g. turning a `SecretRef` into a provider-specific string). Global resolvers run before any provider-specific resolver — useful for cross-provider tokens:

```typescript
const app = new App({
  resolvers: [mySecretResolver],
});
```

## Constructor props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `outdir` | `string` | `'cdkx.out'` | Output directory for the cloud assembly |
| `resolvers` | `IResolver[]` | `[]` | Global resolvers prepended to every stack's pipeline |

## Static helpers

```typescript
// Walk up the construct tree to find the root App. Throws if the construct
// is not rooted in an App.
const app = App.of(someNestedConstruct);

// Type guard
App.isApp(x); // true | false
```

## What `app.synth()` produces

```
cdkx.out/
├── manifest.json       # index of all stacks and their artifact IDs
├── MyStack.json        # synthesized resources for MyStack
└── OtherStack.json     # synthesized resources for OtherStack
```

See [Cloud Assembly](cloud-assembly.md) for the full output format.

---

!!! info "See also"
    - [Stack](stack.md) — a deployment unit that lives inside an App
    - [Cloud Assembly](cloud-assembly.md) — what `app.synth()` writes to disk
    - [Tokens](tokens.md) — how cross-resource references are resolved during synthesis
