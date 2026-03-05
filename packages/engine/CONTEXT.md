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
`ResourceStatus` can follow any other. The `DeploymentEngine` is responsible for
only applying valid transitions.

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
  outputs?: Record<string, unknown>; // provider-returned outputs (e.g. { networkId: 42 })
}
```

`stacks` is keyed by artifact ID (the key in `manifest.json`'s `artifacts` map).
`resources` is keyed by logical resource ID (the key in the stack template JSON).

`ResourceState.outputs` is populated from `CreateResult.outputs` after a successful
`CREATE_COMPLETE`. The engine uses these values to resolve `{ ref, attr }` tokens
in dependent resources.

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
- `outputs?: Record<string, unknown>` — provider-returned output values; propagated into `ResourceState.outputs`

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

## CloudAssemblyReader

Reads and parses a cdkx cloud assembly from disk.

```ts
const reader = new CloudAssemblyReader('/project/cdkx.out');
const stacks = reader.read(); // returns AssemblyStack[]
```

- **Input:** absolute path to the cloud assembly `outdir`.
- **Output:** `AssemblyStack[]` — one entry per artifact in `manifest.json`.
- All I/O is synchronous and injectable via `CloudAssemblyReaderDeps`.

### CloudAssemblyReaderDeps

```ts
interface CloudAssemblyReaderDeps {
  readFile?: (filePath: string) => string;
  fileExists?: (filePath: string) => boolean;
}
```

### AssemblyStack shape

```ts
interface AssemblyStack {
  id: string; // artifact key in manifest.json
  provider: string; // e.g. 'hetzner'
  environment: Record<string, unknown>;
  templateFile: string; // e.g. 'HetznerStack.json'
  displayName?: string;
  resources: AssemblyResource[]; // stable insertion order
  outputs: Record<string, AssemblyOutput>; // keyed by output key
  outputKeys: string[]; // from manifest.json
  dependencies: string[]; // inferred stack IDs
}
```

### AssemblyResource shape

```ts
interface AssemblyResource {
  logicalId: string;
  type: string;
  properties: Record<string, unknown>; // may contain { ref, attr } tokens
  metadata?: Record<string, unknown>;
}
```

### AssemblyOutput shape

```ts
interface AssemblyOutput {
  value: unknown;
  description?: string;
}
```

### Cross-stack dependency inference

`CloudAssemblyReader` performs a best-effort manifest-level dependency inference:
stack B depends on stack A if any string value in B's resource properties or
output values exactly matches an output key declared by stack A (via
`outputKeys` in the manifest). The authoritative intra-stack `{ ref, attr }` token
scanning is delegated to `DeploymentPlanner`.

---

## DeploymentPlanner

Builds a `DeploymentPlan` from `AssemblyStack[]` using Kahn's topological sort
algorithm.

```ts
const planner = new DeploymentPlanner();
const plan = planner.plan(stacks); // throws CycleError on cycle
```

### DeploymentPlan shape

```ts
interface DeploymentPlan {
  stackOrder: string[]; // stack IDs in deployment order
  resourceOrders: Record<string, string[]>; // per-stack resource IDs in deployment order
}
```

### Stack ordering

Uses each `AssemblyStack.dependencies` array to build a DAG and topologically sort
stacks. Stacks with no dependencies are deployed first.

### Resource ordering (per stack)

For each stack, builds an intra-stack dependency graph by scanning each resource's
`properties` for `{ ref, attr }` tokens. A resource B depends on resource A if
`B.properties` contains `{ ref: A.logicalId, attr: '...' }`. Cross-stack refs
(where `ref` is a logical ID from a different stack) are ignored — those are
resolved at runtime by the engine.

### CycleError

```ts
class CycleError extends Error {
  cycleNodes: string[]; // node IDs involved in the cycle
}
```

Thrown by `DeploymentPlanner.plan()` when a cycle is detected at either the
stack or resource level.

---

## DeploymentEngine

Orchestrates the full deployment. Accepts a `DeploymentPlan` and `AssemblyStack[]`
and drives the deployment loop.

```ts
const engine = new DeploymentEngine({
  adapters: { hetzner: myHetznerAdapter },
  outdir: '/project/cdkx.out',
  eventBus: myBus, // optional
  stateManager: myManager, // optional (for tests)
});

const result = await engine.deploy(stacks, plan);
```

### Deployment loop

1. Iterate stacks in `plan.stackOrder` (series, not parallel).
2. For each stack:
   a. Look up the provider adapter by `stack.provider`; fail immediately if not registered.
   b. Call `stateManager.initStack()`.
   c. Iterate resources in `plan.resourceOrders[stackId]` (series, not parallel).
   d. For each resource: resolve tokens → call `adapter.create()` → record outputs.
   e. On resource failure: rollback all created resources in reverse order → mark stack `ROLLBACK_COMPLETE` → abort.
3. On stack success: transition stack → `CREATE_COMPLETE`.
4. If any stack fails: abort remaining stacks and return `success: false`.

### Token resolution

`DeploymentEngine.resolveToken(ref, attr, stackId)`:

1. First checks intra-stack `EngineState` — looks up `ResourceState.outputs[attr]`
   for `logicalId === ref` within the current stack.
2. Falls back to searching all stacks' resources in `EngineState` (for cross-stack references).
3. If unresolvable, leaves the token as `{ ref, attr }` (indicating a misconfigured construct).

### Rollback

On resource `CREATE_FAILED`:

1. Transition stack → `ROLLBACK_IN_PROGRESS`.
2. Delete already-created resources in **reverse** creation order by calling `adapter.delete()`.
3. Failures during delete are caught and recorded (DELETE_FAILED) but do not abort rollback.
4. Transition stack → `ROLLBACK_COMPLETE`.

### Result types

```ts
interface DeploymentResult {
  success: boolean;
  stacks: StackDeploymentResult[];
}

interface StackDeploymentResult {
  stackId: string;
  success: boolean;
  resources: ResourceDeploymentResult[];
  error?: string;
}

interface ResourceDeploymentResult {
  logicalId: string;
  success: boolean;
  physicalId?: string;
  error?: string;
}
```

### DeploymentEngineOptions

```ts
interface DeploymentEngineOptions {
  adapters: Record<string, ProviderAdapter>; // provider id → adapter
  outdir: string;
  stateManager?: EngineStateManager; // injectable for tests
  eventBus?: EventBus<EngineEvent>; // injectable for tests
}
```

---

## Relationship with @cdk-x/core

`@cdk-x/engine` is a **consumer** of the cloud assembly format defined by
`@cdk-x/core`:

- `manifest.json` shape → defined by `CloudAssemblyManifest` in `@cdk-x/core`
- Stack template shape (`{ resources, outputs? }`) → defined by `JsonSynthesizer` in `@cdk-x/core`
- `{ ref, attr }` token contract → defined by `ResourceAttribute` in `@cdk-x/core`
- `outputKeys` in manifest → populated by `Stack.getOutputs()` + `JsonSynthesizer`

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
- No non-null assertions (`!`) — use guards or `?? []` patterns instead
- CJS imports — extensionless local imports
- Specs co-located — `foo/foo.spec.ts` next to `foo/foo.ts`
- Prettier — run `yarn nx run @cdk-x/engine:format` after any `.ts` change

### Dependency injection in tests

Node built-ins (`fs`) are injected via a `deps` parameter on classes that do I/O.
Tests pass plain objects with stub implementations — no `jest.mock('fs', ...)`.
See `StatePersistence` / `StatePersistenceDeps` and `CloudAssemblyReader` /
`CloudAssemblyReaderDeps` for the pattern.

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
        ├── index.ts      lib barrel — re-exports all sub-modules
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
        │   ├── engine-state.ts       interfaces EngineState, StackState, ResourceState
        │   │                         (ResourceState.outputs added), TransitionStackOptions,
        │   │                         TransitionResourceOptions (outputs added)
        │   ├── engine-state-manager.ts  class EngineStateManager — propagates outputs
        │   │                            in transitionResource()
        │   ├── engine-state-manager.spec.ts  tests
        │   ├── state-persistence.ts  class StatePersistence + StatePersistenceDeps
        │   ├── state-persistence.spec.ts  tests
        │   └── index.ts
        ├── adapter/
        │   ├── provider-adapter.ts   interfaces ProviderAdapter, ManifestResource,
        │   │                         CreateResult, UpdateResult
        │   └── index.ts
        ├── assembly/
        │   ├── assembly-types.ts     interfaces AssemblyOutput, AssemblyResource, AssemblyStack
        │   ├── cloud-assembly-reader.ts  class CloudAssemblyReader + CloudAssemblyReaderDeps
        │   ├── cloud-assembly-reader.spec.ts  tests
        │   └── index.ts
        ├── planner/
        │   ├── deployment-plan.ts    interface DeploymentPlan
        │   ├── deployment-planner.ts class DeploymentPlanner + CycleError
        │   │                         + topologicalSort (Kahn's algorithm)
        │   ├── deployment-planner.spec.ts  tests
        │   └── index.ts
        └── engine/
            ├── deployment-engine.ts  class DeploymentEngine + DeploymentEngineOptions
            │                         + DeploymentResult, StackDeploymentResult,
            │                         ResourceDeploymentResult
            ├── deployment-engine.spec.ts  tests (153 total across all specs)
            └── index.ts
```

Also written at runtime (gitignored):

```
<outdir>/engine-state.json    persisted EngineState — written after every transition
```

---

## Not yet implemented (next iterations)

| Component        | Description                                                     |
| ---------------- | --------------------------------------------------------------- |
| `HetznerAdapter` | Concrete `ProviderAdapter` in `@cdk-x/hetzner`                  |
| Update logic     | `adapter.update()` called for existing resources (diff-based)   |
| Delete command   | `cdkx destroy` driving `adapter.delete()` for all resources     |
| Resume support   | Loading `engine-state.json` to skip already-completed resources |
