# @cdk-x/engine — Development Context

This file captures the full design, architecture, and implementation details of
`@cdk-x/engine` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/engine` is modified — classes,
> interfaces, file structure, conventions, or design decisions — this file must
> be updated in the same change to stay accurate.

---

## What is @cdk-x/engine?

**@cdk-x/engine** is the deployment runtime for cdkx. It reads the cloud assembly
produced by `app.synth()` — the `manifest.json` and per-stack JSON template files —
and drives the actual infrastructure deployment against the target provider.

The engine is a library consumed by `@cdk-x/cli` (e.g. the `cdkx deploy` command
imports and calls it programmatically). It runs as async Node.js code in the same
process as the CLI.

---

## Workspace setup

| Property        | Value                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| Monorepo tool   | Nx 22                                                                                |
| Package manager | Yarn (yarn.lock at root)                                                             |
| Language        | TypeScript 5.9, strict mode, CommonJS (`module: commonjs`, `moduleResolution: node`) |
| Build tool      | `@nx/js:tsc` — emits JS + `.d.ts` + `.d.ts.map`                                      |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                                                          |
| Linter          | ESLint with `@typescript-eslint`                                                     |
| Formatter       | Prettier ~3.6 (`.prettierrc` at workspace root)                                      |
| Output dir      | `packages/engine/dist/`                                                              |

Run tasks via Nx:

```bash
yarn nx lint @cdk-x/engine
yarn nx test @cdk-x/engine
yarn nx build @cdk-x/engine
yarn nx run @cdk-x/engine:format        # format src/ with prettier
yarn nx run @cdk-x/engine:format:check  # check formatting without writing
```

---

## Responsibilities

1. **Read the cloud assembly** — parse `manifest.json` to discover stacks, their
   provider identifiers, environment metadata, and template file names.
2. **Parse stack templates** — read each `<artifactId>.json` file to enumerate the
   resources and their resolved properties.
3. **Resolve `{ ref, attr }` tokens** — scan properties for cross-resource reference
   tokens. Build a dependency graph (DAG) so resources are created in the correct
   order.
4. **Drive deployment as a state machine** — for each resource in topological order:
   create, update, or delete it by calling the provider's HTTP API. Track state
   transitions and emit events on every change.
5. **Provider dispatch** — select the correct provider adapter based on
   `manifest.artifacts[id].provider` (e.g. `'hetzner'`, `'kubernetes'`).
6. **Persist state** — write `engine-state.json` after every transition to allow
   resuming interrupted deployments.

---

## Architecture

```
CloudAssemblyReader          reads manifest.json + stack JSON files
 └── DeploymentPlanner       builds resource DAG from { ref, attr } tokens
      └── DeploymentEngine   state machine — drives the deployment loop
           ├── EngineStateManager  tracks + persists all state transitions
           ├── EventBus            emits EngineEvent on every transition
           └── ProviderAdapter (interface)
                └── HetznerAdapter   (in @cdk-x/hetzner — not yet implemented)
                └── KubernetesAdapter (future)
```

> `CloudAssemblyReader`, `DeploymentPlanner`, and `DeploymentEngine` are **not yet
> implemented**. The current implementation covers the state machine foundation:
> enums, events, state management, persistence, and the provider adapter interface.

---

## State machine

### StackStatus (15 values)

Each stack moves through these states. Mirrors CloudFormation's `StackStatus`.

```
Creation:
  CREATE_IN_PROGRESS → CREATE_COMPLETE
                     ↘ CREATE_FAILED → ROLLBACK_IN_PROGRESS → ROLLBACK_COMPLETE
                                                             ↘ ROLLBACK_FAILED

Update:
  UPDATE_IN_PROGRESS → UPDATE_COMPLETE
                     ↘ UPDATE_FAILED → UPDATE_ROLLBACK_IN_PROGRESS → UPDATE_ROLLBACK_COMPLETE
                                                                    ↘ UPDATE_ROLLBACK_FAILED

Deletion:
  DELETE_IN_PROGRESS → DELETE_COMPLETE
                     ↘ DELETE_FAILED
```

### ResourceStatus (13 values)

Each resource moves through these states. Mirrors CloudFormation's resource status.

```
Creation:
  CREATE_IN_PROGRESS → CREATE_COMPLETE
                     ↘ CREATE_FAILED

Update:
  UPDATE_IN_PROGRESS → UPDATE_COMPLETE → UPDATE_COMPLETE_CLEANUP_IN_PROGRESS
                     ↘ UPDATE_FAILED → UPDATE_ROLLBACK_IN_PROGRESS → UPDATE_ROLLBACK_COMPLETE
                                                                    ↘ UPDATE_ROLLBACK_FAILED

Deletion:
  DELETE_IN_PROGRESS → DELETE_COMPLETE
                     ↘ DELETE_FAILED
```

The engine does **not** enforce state transition rules at the type level — any
`ResourceStatus` can follow any other. The `DeploymentEngine` (future) is
responsible for only applying valid transitions.

---

## EngineEvent

Every state transition (both stack and resource) emits an `EngineEvent` via the
`EventBus`. The CLI subscribes to the bus to display deployment progress.

```ts
interface EngineEvent {
  timestamp: Date;
  stackId: string;
  logicalResourceId: string; // = stackId for stack-level events
  physicalResourceId?: string; // set after CREATE_COMPLETE
  resourceType: string; // e.g. 'Hetzner::Compute::Server', 'cdkx::stack'
  resourceStatus: ResourceStatus | StackStatus;
  resourceStatusReason?: string;
}
```

Stack-level events use `resourceType = 'cdkx::stack'` and set both `stackId` and
`logicalResourceId` to the stack's artifact ID.

---

## EventBus

`EventBus<T>` is a lightweight synchronous Observer with no Node.js dependencies.

```ts
const bus = new EventBus<EngineEvent>();

const unsubscribe = bus.subscribe((event) => {
  console.log(event.resourceStatus);
});

bus.emit(event); // calls all handlers synchronously
unsubscribe(); // removes this handler
bus.clear(); // removes all handlers (useful in tests)
bus.size; // number of registered handlers
```

`subscribe()` returns an unsubscribe function. Calling it twice is safe (idempotent).

---

## EngineState

The top-level runtime state, held in memory and persisted to disk.

```ts
interface EngineState {
  stacks: Record<string, StackState>;
}

interface StackState {
  status: StackStatus;
  resources: Record<string, ResourceState>; // keyed by logicalId
}

interface ResourceState {
  status: ResourceStatus;
  physicalId?: string; // set after CREATE_COMPLETE
  properties: Record<string, unknown>;
}
```

`stacks` is keyed by artifact ID (the key in `manifest.json`'s `artifacts` map).
`resources` is keyed by logical resource ID (the key in the stack template JSON).

---

## EngineStateManager

The single class responsible for mutating `EngineState`. All transitions go
through this class — no direct mutation is permitted anywhere else.

### API

```ts
class EngineStateManager {
  constructor(
    eventBus: EventBus<EngineEvent>,
    persistence: StatePersistence,
    initialState?: EngineState,
  );

  // Stack operations
  initStack(stackId, options?): void; // → CREATE_IN_PROGRESS
  transitionStack(stackId, status, options?): void;

  // Resource operations
  initResource(stackId, logicalId, resourceType, properties, options?): void; // → CREATE_IN_PROGRESS
  transitionResource(stackId, logicalId, resourceType, status, options?): void;

  // Accessors
  getState(): EngineState;
  getStackState(stackId): StackState | undefined;
  getResourceState(stackId, logicalId): ResourceState | undefined;
}
```

`TransitionResourceOptions`:

- `physicalId?: string` — set when transitioning to `CREATE_COMPLETE`
- `reason?: string` — written to `resourceStatusReason` in the emitted event
- `properties?: Record<string, unknown>` — updated resolved properties (after token substitution)

`TransitionStackOptions`:

- `reason?: string` — written to `resourceStatusReason` in the emitted event

Both `initStack()` and `initResource()` throw if the entity is already registered.
Both `transitionStack()` and `transitionResource()` throw if the entity is not registered.

---

## StatePersistence

Writes and reads `engine-state.json` in the cloud assembly output directory.

```ts
class StatePersistence {
  constructor(outdir: string, deps?: StatePersistenceDeps);

  save(state: EngineState): void; // writes <outdir>/engine-state.json
  load(): EngineState | null; // reads file; returns null if not found
  get stateFilePath(): string; // absolute path to the state file
}
```

All I/O is synchronous (`fs.writeFileSync`, `fs.readFileSync`). The `deps`
parameter accepts injectable I/O functions for testing without hitting disk.

The output directory is created with `{ recursive: true }` on every `save()` —
safe to call even if the directory already exists.

---

## ProviderAdapter

Interface implemented by each provider package. The engine only holds references
to this interface — no compile-time dependency on any concrete adapter.

```ts
interface ProviderAdapter {
  create(resource: ManifestResource): Promise<CreateResult>;
  update(resource: ManifestResource, patch: unknown): Promise<UpdateResult>;
  delete(resource: ManifestResource): Promise<void>;
  validate?(resource: ManifestResource): Promise<void>;
  getOutput(resource: ManifestResource, attr: string): Promise<unknown>;
}

interface ManifestResource {
  logicalId: string;
  type: string;
  properties: Record<string, unknown>; // all { ref, attr } tokens already resolved
  stackId: string;
  provider: string;
}

interface CreateResult {
  physicalId: string;
  outputs?: Record<string, unknown>;
}

interface UpdateResult {
  outputs?: Record<string, unknown>;
}
```

`getOutput()` is called after `create()` to resolve `{ ref, attr }` tokens
for dependent resources. It receives the `attr` field from the token and
returns the actual provider-assigned value.

`validate()` is optional. If present it is called before the deployment loop
and should throw without making API calls if the resource configuration is invalid.

---

## Relationship with @cdk-x/core

`@cdk-x/engine` is a **consumer** of the cloud assembly format defined by
`@cdk-x/core`:

- `manifest.json` shape → defined by `CloudAssemblyManifest` in `@cdk-x/core`
- Stack template shape → defined by `JsonSynthesizer` output in `@cdk-x/core`
- `{ ref, attr }` token contract → defined by `ResourceAttribute` in `@cdk-x/core`

The engine does **not** depend on `@cdk-x/core` at runtime — it only needs to
understand the JSON file formats, not the TypeScript construct classes. This keeps
the engine lightweight and provider-agnostic.

---

## Release configuration

Part of the `core` release group in `nx.json` — lock-stepped with `@cdk-x/core`,
`@cdk-x/testing`, and `@cdk-x/hetzner`. Tag pattern: `core-v{version}`.

---

## Coding conventions

See `packages/core/CONTEXT.md` for the authoritative coding conventions. This
package follows them identically:

- Everything OOP — no standalone `export function`
- No `any` — use `unknown`
- CJS imports — extensionless local imports
- Specs co-located — `foo/foo.spec.ts` next to `foo/foo.ts`
- Prettier — run `yarn nx run @cdk-x/engine:format` after any `.ts` change

### Dependency injection in tests

Node built-ins (`fs`) are injected via a `deps` parameter on classes that do I/O.
Tests pass plain objects with stub implementations — no `jest.mock('fs', ...)`.
See `StatePersistence` and `StatePersistenceDeps` for the pattern.

---

## File map

```
packages/engine/
├── package.json          name: @cdk-x/engine (no "type" field — CommonJS)
├── project.json          Nx project configuration (build, format, format:check, test)
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── eslint.config.mjs
├── jest.config.cts
├── CONTEXT.md            ← this file
└── src/
    ├── index.ts          public barrel — re-exports src/lib/
    └── lib/
        ├── index.ts      lib barrel — re-exports states, events, state, adapter
        ├── states/
        │   ├── stack-status.ts       enum StackStatus (15 values)
        │   ├── resource-status.ts    enum ResourceStatus (13 values)
        │   ├── states.spec.ts        tests for both enums
        │   └── index.ts
        ├── events/
        │   ├── engine-event.ts       interface EngineEvent
        │   ├── event-bus.ts          class EventBus<T> — subscribe/emit/clear/size
        │   ├── event-bus.spec.ts     tests
        │   └── index.ts
        ├── state/
        │   ├── engine-state.ts       interfaces EngineState, StackState, ResourceState,
        │   │                         TransitionStackOptions, TransitionResourceOptions
        │   ├── engine-state-manager.ts  class EngineStateManager
        │   ├── engine-state-manager.spec.ts  tests (initStack, transitionStack,
        │   │                                  initResource, transitionResource,
        │   │                                  getState, persistence integration)
        │   ├── state-persistence.ts  class StatePersistence + StatePersistenceDeps
        │   ├── state-persistence.spec.ts  tests (save, load, stateFilePath)
        │   └── index.ts
        └── adapter/
            ├── provider-adapter.ts   interfaces ProviderAdapter, ManifestResource,
            │                         CreateResult, UpdateResult
            └── index.ts
```

Also written at runtime (gitignored):

```
<outdir>/engine-state.json    persisted EngineState — written after every transition
```

---

## Not yet implemented (next iterations)

| Component             | Description                                                         |
| --------------------- | ------------------------------------------------------------------- |
| `CloudAssemblyReader` | Reads `manifest.json` + stack template JSON files                   |
| `DeploymentPlanner`   | Builds resource DAG from `{ ref, attr }` tokens                     |
| `DeploymentEngine`    | Orchestrates the deployment loop; calls adapter methods             |
| Rollback logic        | Calls `adapter.delete()` on already-created resources after failure |
| `HetznerAdapter`      | Concrete `ProviderAdapter` in `@cdk-x/hetzner`                      |
