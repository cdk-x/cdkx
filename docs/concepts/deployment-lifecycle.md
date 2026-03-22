# Deployment Lifecycle

When you run `cdkx deploy`, the engine reads the [cloud assembly](cloud-assembly.md) and drives each resource through a lifecycle from `CREATE_IN_PROGRESS` to `CREATE_COMPLETE` (or `CREATE_FAILED`). Resources are processed in topological order — a resource only starts when all its dependencies are complete.

## The deployment pipeline

```
cdkx deploy
  │
  ├─ 1. CloudAssemblyReader   reads manifest.json + stack template files
  │
  ├─ 2. DeploymentPlanner     builds a dependency DAG from { ref, attr } tokens
  │
  └─ 3. DeploymentEngine      state machine — drives each resource through its lifecycle
         └─ ProviderAdapter   calls the provider HTTP API for each resource
```

## Resource lifecycle states

Each resource moves through one of three tracks depending on the operation:

=== "Create"

    | State | Description |
    |-------|-------------|
    | `CREATE_IN_PROGRESS` | The provider API call has been made. Waiting for the resource to become active. |
    | `CREATE_COMPLETE` | The resource is fully created and its output attributes are available. |
    | `CREATE_FAILED` | Creation failed. The error is logged and dependent resources are blocked. |

=== "Update"

    | State | Description |
    |-------|-------------|
    | `UPDATE_IN_PROGRESS` | A change was detected and the update API call has been made. |
    | `UPDATE_COMPLETE` | The update finished successfully. |
    | `UPDATE_FAILED` | Update failed. Rollback may be attempted. |
    | `UPDATE_COMPLETE_CLEANUP_IN_PROGRESS` | Post-update cleanup in progress (removing old properties). |
    | `UPDATE_ROLLBACK_IN_PROGRESS` | Automatic rollback of a failed update is in progress. |
    | `UPDATE_ROLLBACK_COMPLETE` | Rollback completed successfully. |
    | `UPDATE_ROLLBACK_FAILED` | Rollback also failed. Manual intervention required. |

=== "Delete"

    | State | Description |
    |-------|-------------|
    | `DELETE_IN_PROGRESS` | The delete API call has been made. Waiting for the provider to confirm. |
    | `DELETE_COMPLETE` | The resource has been removed from the provider. |
    | `DELETE_FAILED` | Deletion failed. The resource may still exist in the provider. |

## State diagram

```
               ┌────────────────────────────────────────┐
               │              CREATE                     │
               │                                         │
               │  PENDING ──► CREATE_IN_PROGRESS         │
               │                     │                   │
               │           ┌─────────┴────────┐          │
               │           ▼                  ▼          │
               │    CREATE_COMPLETE    CREATE_FAILED      │
               └────────────────────────────────────────┘

               ┌────────────────────────────────────────┐
               │              UPDATE                     │
               │                                         │
               │  PENDING ──► UPDATE_IN_PROGRESS         │
               │                     │                   │
               │           ┌─────────┴────────┐          │
               │           ▼                  ▼          │
               │    UPDATE_COMPLETE    UPDATE_FAILED      │
               └────────────────────────────────────────┘

               ┌────────────────────────────────────────┐
               │              DELETE                     │
               │                                         │
               │  PENDING ──► DELETE_IN_PROGRESS         │
               │                     │                   │
               │           ┌─────────┴────────┐          │
               │           ▼                  ▼          │
               │    DELETE_COMPLETE    DELETE_FAILED      │
               └────────────────────────────────────────┘
```

## Topological order

Resources are deployed in the order their dependencies require. If resource B has a `{ ref, attr }` token pointing to resource A, the engine guarantees:

1. A reaches `CREATE_COMPLETE` first
2. A's output attributes (e.g. `networkId`) are read from the provider API
3. B's properties are resolved — the token is substituted with the real value
4. B's API call is made

If A reaches `CREATE_FAILED`, B stays `PENDING` and is never started.

```
Example deployment order:

  HtzNetwork      CREATE_IN_PROGRESS → CREATE_COMPLETE
  HtzSubnet       (waiting)          → CREATE_IN_PROGRESS → CREATE_COMPLETE
  HtzRoute        (waiting)          → CREATE_IN_PROGRESS → CREATE_COMPLETE
  HtzServer       CREATE_IN_PROGRESS → CREATE_COMPLETE  (no dependency on network)
```

## Live event table

The engine prints a live event table during `cdkx deploy`:

```
MyStack  Hetzner::Networking::Network  NetworkA1B2C3D4  CREATE_IN_PROGRESS
MyStack  Hetzner::Networking::Network  NetworkA1B2C3D4  CREATE_COMPLETE
MyStack  Hetzner::Networking::Subnet   SubnetE5F6G7H8   CREATE_IN_PROGRESS
MyStack  Hetzner::Networking::Subnet   SubnetE5F6G7H8   CREATE_COMPLETE
```

Each row is: `<stack>  <type>  <logicalId>  <status>`

## Destroy order

`cdkx destroy` processes resources in **reverse topological order** — dependents are deleted before their dependencies:

```
Example destroy order:

  HtzSubnet   DELETE_IN_PROGRESS → DELETE_COMPLETE
  HtzNetwork  DELETE_IN_PROGRESS → DELETE_COMPLETE
```

!!! warning "Irreversible"
    `cdkx destroy` permanently deletes cloud resources. You will be prompted for confirmation unless you pass `--force`.

---

!!! info "See also"
    - [Tokens](tokens.md) — how `{ ref, attr }` tokens drive the dependency graph
    - [Cloud Assembly](cloud-assembly.md) — the input the engine reads
    - [CLI Reference](../getting-started/cli-reference.md) — `cdkx deploy` and `cdkx destroy` options
