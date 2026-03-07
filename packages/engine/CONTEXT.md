# @cdkx-io/engine — Development Context

This file captures the full design, architecture, and implementation details of
`@cdkx-io/engine` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/engine` is modified — classes,
> interfaces, file structure, conventions, or design decisions — this file must
> be updated in the same change to stay accurate.

---

## What is @cdkx-io/engine?

**@cdkx-io/engine** is the deployment runtime for cdkx. It reads the cloud assembly
produced by `app.synth()` — the `manifest.json` and per-stack JSON template files —
and drives the actual infrastructure deployment against the target provider.

The engine is a library consumed by `@cdkx-io/cli` (e.g. the `cdkx deploy` command
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
yarn nx lint @cdkx-io/engine
yarn nx test @cdkx-io/engine
yarn nx build @cdkx-io/engine
yarn nx run @cdkx-io/engine:format        # format src/ with prettier
yarn nx run @cdkx-io/engine:format:check  # check formatting without writing
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
                └── HetznerAdapter   (in @cdkx-io/hetzner — implemented)
                └── KubernetesAdapter (future)
```

---

## State machine

### StackStatus (16 values)

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

No-op:
  NO_CHANGES  (emitted instead of UPDATE_COMPLETE / CREATE_COMPLETE when there is nothing to do)
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
  type?: string; // resource type (e.g. 'Hetzner::Compute::Server') — optional for backward compat with older state files
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

`ResourceState.type` is stored by `EngineStateManager.initResource()` so that
reconcile deletes can emit correctly-typed `EngineEvent`s for resources that are
absent from the new assembly (and therefore have no `AssemblyResource.type` to
read). It is declared `readonly` and `optional` for backward compatibility with
state files written before this field was introduced.

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
  initResource(stackId, logicalId, resourceType, properties, options?): void; // → CREATE_IN_PROGRESS; stores type
  transitionResource(stackId, logicalId, resourceType, status, options?): void;
  removeResource(stackId, logicalId): void; // removes resource from state + persists; throws if not registered

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
`removeResource()` throws if the stack or resource is not registered.

---

## StatePersistence

Writes and reads `engine-state.json` into the **state directory** (separate from
the cloud assembly output directory).

```ts
class StatePersistence {
  constructor(stateDir: string, deps?: StatePersistenceDeps);

  save(state: EngineState): void; // writes <stateDir>/engine-state.json
  load(): EngineState | null; // reads file; returns null if not found
  get stateFilePath(): string; // absolute path to the state file
}
```

All I/O is synchronous (`fs.writeFileSync`, `fs.readFileSync`). The `deps`
parameter accepts injectable I/O functions for testing without hitting disk.

The state directory is created with `{ recursive: true }` on every `save()` —
safe to call even if the directory already exists.

**Design note:** `stateDir` is intentionally separate from the cloud assembly
`outdir`. The CLI passes `.cdkx/` next to `cdkx.json` as `stateDir`, keeping
engine state in a gitignored local directory, while the assembly output (`cdkx.out/`)
may be regenerated or cleaned up independently.

---

## ProviderAdapter

Interface implemented by each provider package. The engine only holds references
to this interface — no compile-time dependency on any concrete adapter.

```ts
interface ProviderAdapter {
  setLogger?(logger: Logger): void; // called by engine when logger is provided
  create(resource: ManifestResource): Promise<CreateResult>;
  update(resource: ManifestResource, patch: unknown): Promise<UpdateResult>;
  delete(resource: ManifestResource): Promise<void>;
  validate?(resource: ManifestResource): Promise<void>;
  getOutput(resource: ManifestResource, attr: string): Promise<unknown>;
  getCreateOnlyProps?(type: string): ReadonlySet<string>;
}

interface ManifestResource {
  logicalId: string;
  type: string;
  properties: Record<string, unknown>; // all { ref, attr } tokens already resolved
  stackId: string;
  provider: string;
  physicalId?: string; // set by engine from ResourceState.physicalId for update/delete/getOutput
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
  dependsOn?: string[]; // explicit deps from addDependency(); omitted when empty
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

Builds a `DeploymentPlan` from `AssemblyStack[]` using a wave-based topological sort
algorithm. Resources/stacks in the same wave have no dependencies on each other and
can be deployed in parallel; waves execute sequentially to respect dependencies.

```ts
const planner = new DeploymentPlanner();
const plan = planner.plan(stacks); // throws CycleError on cycle
```

### DeploymentPlan shape

```ts
interface DeploymentPlan {
  stackWaves: string[][]; // stack IDs grouped by wave
  resourceWaves: Record<string, string[][]>; // per-stack resource IDs grouped by wave
}
```

Each wave is an array of IDs that can be deployed in parallel. Waves are ordered
from earliest (no dependencies) to latest (depend on earlier waves).

### Wave-based execution model

The planner uses a **level assignment algorithm** on top of topological sort:

1. Build a dependency graph (DAG) from the inputs.
2. Perform a topological sort using Kahn's algorithm.
3. Assign each node a **level** based on `max(levels of all dependencies) + 1`.
   Nodes with no dependencies get level 0.
4. Group nodes by level — each level becomes a wave.

**Key benefit:** resources at the same topological level (e.g., a subnet, route,
load balancer, and server that all depend only on a network but not on each other)
are grouped into the same wave and can deploy concurrently, significantly reducing
deployment time for complex stacks.

### Stack ordering

Uses each `AssemblyStack.dependencies` array to build a DAG and assign levels.
Independent stacks (level 0) are in the first wave; stacks that depend only on
level-0 stacks are in wave 1, and so on.

### Resource ordering (per stack)

For each stack, builds an intra-stack dependency graph by combining two sources:

1. **`{ ref, attr }` tokens** in resource `properties` — a resource B depends on A if
   `B.properties` contains `{ ref: A.logicalId, attr: '...' }`.
2. **`dependsOn` array** on each `AssemblyResource` — explicit deps serialized by the
   synthesizer from `addDependency()` calls (which produce no token in properties).

Both sources are deduplicated into a single `Set<string>`. Cross-stack refs (where
`ref` or `dependsOn` entry is a logical ID from a different stack) are ignored — those
are resolved at runtime by the engine.

The planner then applies the same wave-based level assignment to resources within
each stack.

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
  assemblyDir: '/project/cdkx.out',
  stateDir: '/project/.cdkx',
  eventBus: myBus, // optional
  stateManager: myManager, // optional (for tests)
});

const result = await engine.deploy(stacks, plan);
```

### Deployment loop

The engine constructor calls `persistence.load()` to check for a prior
`engine-state.json`. If one exists, it is passed as `initialState` to
`EngineStateManager` — making prior `CREATE_COMPLETE` resources visible to the
reconcile and create loops. If `stateManager` is injected (tests), the load is
skipped.

For each stack the engine distinguishes two modes:

- **First deploy** (`isUpdate = false`): no prior state for this stack — use
  `CREATE_*` lifecycle (`initStack()`, `CREATE_IN_PROGRESS → CREATE_COMPLETE`,
  `ROLLBACK_*` on failure).
- **Re-deploy / update** (`isUpdate = true`): prior state exists for this stack —
  use `UPDATE_*` lifecycle (`transitionStack(UPDATE_IN_PROGRESS)` instead of
  `initStack()`, `UPDATE_COMPLETE` on success, `UPDATE_ROLLBACK_*` on failure).

Full loop:

1. Iterate stack waves in `plan.stackWaves` (waves run in parallel, waves execute sequentially).
2. For each stack in a wave:
   a. Look up the provider adapter by `stack.provider`; fail immediately if not registered.
   b. Determine `isUpdate` by checking whether the stack already has state in `EngineStateManager`.
   c. If `isUpdate`: call `reconcileStack()` — delete resources that were `CREATE_COMPLETE`
   in prior state but are absent from the new assembly (see Reconcile below).
   d. Call `stateManager.initStack()` (first deploy) or
   `stateManager.transitionStack(UPDATE_IN_PROGRESS)` (re-deploy).
   e. Iterate resource waves in `plan.resourceWaves[stackId]`. For each wave: - Deploy all resources in the wave **in parallel** using `Promise.allSettled`. - If any resource fails, wait for all others in the wave to settle, then roll back.
   f. For each resource: resolve its tokens first. Then:
   - If already `CREATE_COMPLETE` in prior state with **identical** resolved properties → skip.
   - If already `CREATE_COMPLETE` in prior state with **changed** properties → call
     `adapter.update(resource + physicalId, patch)` → emit `UPDATE_IN_PROGRESS /
UPDATE_COMPLETE`, set `anyUpdated = true`.
   - Otherwise (no prior state) → call `adapter.create()` → record outputs, set
     `anyCreated = true`.
     g. On resource failure (create or update): rollback newly-created resources in reverse
     order (pre-existing resources are never rolled back) → mark stack `ROLLBACK_COMPLETE`
     or `UPDATE_ROLLBACK_COMPLETE` → abort.
3. On stack success: evaluate the no-op condition:

   ```ts
   const isNoOp =
     !anyCreated &&
     !anyUpdated &&
     reconciledCount === 0 &&
     (isUpdate || resourceWaves.flat().length === 0);
   ```

   - If `isNoOp`: transition stack → `NO_CHANGES`.
   - Else if `isUpdate`: transition stack → `UPDATE_COMPLETE`.
   - Else: transition stack → `CREATE_COMPLETE`.

4. If any stack fails: abort remaining stacks and return `success: false`.

`reconciledCount` is returned by `reconcileStack()`. `anyCreated` is set to `true`
after each successful `adapter.create()` call; `anyUpdated` is set to `true` after
each successful `adapter.update()` call.

**Wave execution details:**

- Resources in the same wave deploy concurrently via `Promise.allSettled`.
- After a wave completes, successful creates are appended to `createdInOrder` in
  **wave order** (not completion order) to maintain deterministic rollback behavior.
- Token resolution works correctly because waves execute sequentially — by the time
  wave N+1 starts, all wave N resources are `CREATE_COMPLETE` with outputs available.

### Reconcile

`reconcileStack(stackId, priorResources, assemblyResources, adapter)` — called
during re-deploy before the create loop. Returns `Promise<number>` (count of
deleted resources).

1. Collect all `CREATE_COMPLETE` resources from prior state whose `logicalId` is
   **not** in the new assembly (`toDelete` list).
2. **Validate** via `validateReconcile(toDelete, assemblyResources)` — before
   making any API call, check that no resource remaining in the new assembly still
   references a resource in `toDelete` via a `{ ref, attr }` token. Throws
   `ReconcileValidationError` if a conflict is found. See below.
3. Delete them in **reverse** prior-creation order:
   a. `transitionResource(DELETE_IN_PROGRESS)`
   b. `adapter.delete({ logicalId, type, physicalId, ... })`
   c. `transitionResource(DELETE_COMPLETE)`
   d. `stateManager.removeResource(stackId, logicalId)` — removes from in-memory
   state and persists.
4. On any delete failure: re-throw immediately (aborts the stack), unlike rollback
   which swallows errors.

The resource type for the delete event is read from `ResourceState.type` (stored
at creation time), because the resource is absent from the new assembly and has no
`AssemblyResource.type` to fall back on.

### ReconcileValidationError

```ts
interface BlockedDelete {
  toDeleteLogicalId: string; // resource scheduled for deletion
  toDeleteType: string; // its resource type
  dependentLogicalId: string; // staying resource that references it
  dependentType: string;
  attr: string; // the attribute name in the { ref, attr } token
}

class ReconcileValidationError extends Error {
  readonly blockedDeletes: BlockedDelete[];
}
```

Thrown by `validateReconcile()` when one or more resources scheduled for deletion
are still referenced by resources remaining in the new assembly. The deployment
is aborted **before any API call is made** — no partial state is created.

**Algorithm:**

1. Build a `toDeleteIds` set from all `toDelete` logical IDs.
2. For each resource in the new assembly: if it is also in `toDeleteIds` — **skip
   it** (silent case: both the referencing and referenced resource are being
   removed; reverse creation order guarantees correct delete ordering).
3. Recursively walk the resource's `properties` looking for `{ ref, attr }` tokens
   where `ref` is in `toDeleteIds`. Collect each match as a `BlockedDelete`.
4. If `blockedDeletes.length > 0`, throw `ReconcileValidationError`.

The error message format is:

```
Cannot delete N resource(s) — they are still referenced by resources in the new assembly:
  - 'SubnetA' (test::Subnet) is referenced by 'Net' (test::Network) via attr 'subnetId'
  - 'SubnetB' (test::Subnet) is referenced by 'Net' (test::Network) via attr 'subnetId'
```

`ReconcileValidationError` and `BlockedDelete` are exported from `src/lib/engine/index.ts`
so the CLI can import them for user-friendly error display.

### Update (diff-based)

When a resource is already `CREATE_COMPLETE` in prior state, the engine calls
`computePatch(prior.properties, resolvedProperties)` before deciding what to do:

- **`computePatch(prior, next)`** — iterates over the union of keys in `prior` and
  `next`. Includes a key in the patch object only when the values differ (via
  `deepEqual`). Keys present in `next` but absent in `prior` are included as-is.
  Keys present in `prior` but absent in `next` are included as `undefined` so the
  adapter can handle removal. Returns `undefined` (not an empty object) when there
  are zero differences — this is the signal to skip the resource without calling
  the adapter.
- **`deepEqual(a, b)`** — recursive deep equality for JSON-compatible values
  (primitives, arrays, plain objects). Class instances and functions are compared
  by reference.

When a patch is returned:

1. Emit `UPDATE_IN_PROGRESS`.
2. Call `adapter.update({ logicalId, type, properties: resolvedProperties, physicalId, ... }, patch)`.
3. On success: emit `UPDATE_COMPLETE` with `{ properties: resolvedProperties, outputs? }` — persists
   the new desired state and any refreshed outputs to `engine-state.json`.
4. On failure: emit `UPDATE_FAILED`, trigger rollback.

**Create-only prop filtering:** before calling `adapter.update()`, the engine
strips create-only properties from the patch. It calls
`adapter.getCreateOnlyProps?.(resource.type) ?? new Set<string>()` and removes
any key in the patch that is in that set. If the resulting filtered patch is
empty (all differences are create-only), the resource is treated as a no-op —
`adapter.update()` is not called, no `UPDATE_*` events are emitted, and
`anyUpdated` is not set. This prevents spurious `adapter.update()` calls (which
would throw) when the only difference between the prior and new state is a
create-only property such as `algorithm` on a load balancer.

### Token resolution

`DeploymentEngine.resolveToken(ref, attr, stackId)`:

1. First checks intra-stack `EngineState` — looks up `ResourceState.outputs[attr]`
   for `logicalId === ref` within the current stack.
2. Falls back to searching all stacks' resources in `EngineState` (for cross-stack references).
3. If unresolvable, leaves the token as `{ ref, attr }` (indicating a misconfigured construct).

### Rollback

On resource `CREATE_FAILED` (or `UPDATE_FAILED`):

1. Transition stack → `ROLLBACK_IN_PROGRESS` (first deploy) or `UPDATE_ROLLBACK_IN_PROGRESS` (re-deploy).
2. Delete **only newly-created** resources in **reverse** creation order by calling
   `adapter.delete()`. Pre-existing `CREATE_COMPLETE` resources (those already present
   in prior state and skipped during the create loop) are **never rolled back**.
3. Failures during delete are caught and recorded (DELETE_FAILED) but do not abort rollback.
4. Transition stack → `ROLLBACK_COMPLETE` or `UPDATE_ROLLBACK_COMPLETE`.

**Important implementation constraints (bugs fixed):**

- **`createdInOrder` must only contain newly-created resources.** Resources that are
  skipped (no-change) or updated (pre-existing `CREATE_COMPLETE`) must **not** be
  pushed into `createdInOrder`. Adding them would cause rollback to incorrectly attempt
  to delete them, resulting in spurious DELETE events and potential 404 errors from the
  provider API.
- **Rollback delete must use resolved properties from `ResourceState`.** The
  `adapter.delete()` call inside `rollback()` passes `resourceState.properties` (the
  fully resolved properties stored at creation time), **not** `resource.properties`
  from the `AssemblyResource` (which may still contain unresolved `{ ref, attr }`
  tokens). Using unresolved tokens as property values causes incorrect API paths
  (e.g. `[object Object]` instead of an integer ID), leading to 404s on action resources.

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
  assemblyDir: string; // absolute path to the cloud assembly outdir (passed to CloudAssemblyReader by the CLI)
  stateDir: string; // absolute path for engine-state.json — separate from assemblyDir
  stateManager?: EngineStateManager; // injectable for tests
  eventBus?: EventBus<EngineEvent>; // injectable for tests
  logger?: Logger; // optional logger from @cdkx-io/logger — subscribes to EventBus
}
```

**Logger integration:** When a `logger` is provided, the engine automatically:

1. Subscribes the logger to the `EventBus` via the private `subscribeLogger()` method
2. Propagates the logger to all adapters that implement `setLogger()`

Every `EngineEvent` (stack and resource state transitions) is converted to a structured log event with:

- **Event type**: `engine.state.stack.transition` or `engine.state.resource.transition`
- **Log level mapping**:
  - `*_IN_PROGRESS` or `NO_CHANGES` → `debug`
  - `*_COMPLETE` → `info`
  - `ROLLBACK_IN_PROGRESS` → `warn`
  - `*_FAILED` or `ROLLBACK_COMPLETE` → `error`
- **Error objects**: For failed statuses, an `Error` is created from `resourceStatusReason`
  and passed to the logger

Adapters that implement `setLogger()` can log their own events (e.g., HTTP requests/responses) using the logger.

Example usage:

```ts
import { DeploymentEngine } from '@cdkx-io/engine';
import { LoggerFactory } from '@cdkx-io/logger';

const logger = LoggerFactory.createFileLogger('/project/.cdkx');

const engine = new DeploymentEngine({
  adapters: { hetzner: myAdapter },
  assemblyDir: '/project/cdkx.out',
  stateDir: '/project/.cdkx',
  logger, // logs all state transitions to .cdkx/deploy-{timestamp}.log
});
```

---

## Relationship with @cdkx-io/core

`@cdkx-io/engine` is a **consumer** of the cloud assembly format defined by
`@cdkx-io/core`:

- `manifest.json` shape → defined by `CloudAssemblyManifest` in `@cdkx-io/core`
- Stack template shape (`{ resources, outputs? }`) → defined by `JsonSynthesizer` in `@cdkx-io/core`
- `{ ref, attr }` token contract → defined by `ResourceAttribute` in `@cdkx-io/core`
- `outputKeys` in manifest → populated by `Stack.getOutputs()` + `JsonSynthesizer`

The engine does **not** depend on `@cdkx-io/core` at runtime — it only needs to
understand the JSON file formats, not the TypeScript construct classes. This keeps
the engine lightweight and provider-agnostic.

---

## Release configuration

Part of the `core` release group in `nx.json` — lock-stepped with `@cdkx-io/core`,
`@cdkx-io/testing`, and `@cdkx-io/hetzner`. Tag pattern: `core-v{version}`.

---

## Coding conventions

See `packages/core/CONTEXT.md` for the authoritative coding conventions. This
package follows them identically:

- Everything OOP — no standalone `export function`
- No `any` — use `unknown`
- No non-null assertions (`!`) — use guards or `?? []` patterns instead
- CJS imports — extensionless local imports
- Specs co-located — `foo/foo.spec.ts` next to `foo/foo.ts`
- Prettier — run `yarn nx run @cdkx-io/engine:format` after any `.ts` change

### Dependency injection in tests

Node built-ins (`fs`) are injected via a `deps` parameter on classes that do I/O.
Tests pass plain objects with stub implementations — no `jest.mock('fs', ...)`.
See `StatePersistence` / `StatePersistenceDeps` and `CloudAssemblyReader` /
`CloudAssemblyReaderDeps` for the pattern.

---

## File map

```
packages/engine/
├── package.json          name: @cdkx-io/engine (no "type" field — CommonJS)
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
        │   │                         (ResourceState.outputs + ResourceState.type added),
        │   │                         TransitionStackOptions,
        │   │                         TransitionResourceOptions (outputs added)
        │   ├── engine-state-manager.ts  class EngineStateManager — stores type in initResource();
        │   │                            propagates outputs in transitionResource();
        │   │                            adds removeResource()
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
            │                         ResourceDeploymentResult;
            │                         loads prior state from StatePersistence on construction;
            │                         isUpdate fork (CREATE_* vs UPDATE_* lifecycle);
            │                         computePatch() + deepEqual() for diff-based updates;
            │                         reconcileStack() calls validateReconcile() before deleting;
            │                         rollback() guards against pre-existing resources
            ├── deployment-engine.spec.ts  tests (200 total across all specs)
            ├── reconcile-validation-error.ts  BlockedDelete interface + ReconcileValidationError class
            └── index.ts              re-exports all engine types incl. ReconcileValidationError + BlockedDelete
```

Also written at runtime (gitignored):

```
<stateDir>/engine-state.json    persisted EngineState — written after every transition
                                 stateDir = .cdkx/ next to cdkx.json (set by CLI)
```

---

## Destroy (`engine.destroy()`)

The engine supports destroying all resources in reverse dependency order via the
`destroy()` method. This is used by the `cdkx destroy` CLI command.

### Method signature

```ts
async destroy(stacks: AssemblyStack[], plan: DeploymentPlan): Promise<DeploymentResult>
```

### Behaviour

The destroy flow mirrors deploy but processes resources in **reverse** order:

1. Reverse the stack waves from `plan.stackWaves`.
2. For each stack in each wave (waves still run in parallel):
   a. Reverse the resource waves from `plan.resourceWaves[stackId]`.
   b. Transition stack → `DELETE_IN_PROGRESS`.
   c. For each reversed resource wave (waves run in parallel, waves execute sequentially):
   - For each resource in the wave: - If not in `engine-state.json` → skip (nothing to delete). - Call `destroyResource(stack, resource, adapter)`: - Transition resource → `DELETE_IN_PROGRESS`. - Call `adapter.delete({ logicalId, type, properties, physicalId, ... })`. - On success: transition resource → `DELETE_COMPLETE`, then
     `stateManager.removeResource(stackId, logicalId)` — removes from state + persists. - On failure: transition resource → `DELETE_FAILED`, add to failed list, **continue**
     (do not abort — best-effort deletion).
     d. On stack success (all resources deleted or skipped): transition stack → `DELETE_COMPLETE`.
     e. On stack failure (any resource failed): transition stack → `DELETE_FAILED`.

**Key differences from deploy:**

- **No rollback** on delete failure — failures are recorded but destroy continues.
- **No create-only prop filtering** — delete doesn't need properties at all in most cases.
- **`removeResource()` is called after DELETE_COMPLETE** — cleans up state so re-running
  destroy on the same assembly is idempotent.
- **Resources already absent from state are skipped** — no DELETE_IN_PROGRESS event, no
  adapter call. This makes partial destroys and re-runs safe.

### State transitions

Stack: `DELETE_IN_PROGRESS → DELETE_COMPLETE` (or `DELETE_FAILED`)

Resource: `DELETE_IN_PROGRESS → DELETE_COMPLETE` (then removed from state) or `DELETE_FAILED`

### Error handling

- Delete failures are **not fatal** — the engine continues deleting remaining resources
  and only marks the stack as failed at the end.
- This "best-effort" approach ensures maximum cleanup even when some resources are
  already gone or return 404s.

---

## Not yet implemented (next iterations)

Currently all planned features are implemented. Future iterations may add:

| Component | Description                               |
| --------- | ----------------------------------------- |
| Diff      | `cdkx diff` comparing local vs. deployed  |
| Import    | Import existing resources into cdkx state |
