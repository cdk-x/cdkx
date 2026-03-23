# Add a Resource Handler

This guide walks through adding support for a new Hetzner Cloud resource type end-to-end: JSON Schema → code generation → `ResourceHandler` implementation → registration. The same four-step process applies to any provider that uses the handler-based runtime.

The guide uses a fictional `Hetzner::Compute::PlacementGroup` resource as the running example. All real Hetzner resources already follow this pattern — see `packages/providers/hetzner/hetzner-runtime/` in the repository for reference.

---

## Prerequisites

- You understand the [Construct](../concepts/construct.md) and [Deployment Lifecycle](../concepts/deployment-lifecycle.md) concepts.
- The provider package already exists (see [Add a Provider](add-provider.md) if not).
- You have a working dev environment (`yarn install` done).

---

## Step 1 — Write the JSON Schema

Create a schema file in `packages/providers/hetzner/hetzner/schemas/v1/`. One file per resource type.

```json title="packages/providers/hetzner/hetzner/schemas/v1/placement-group.schema.json" linenums="1" hl_lines="4 5 6 20 21 22"
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HetznerPlacementGroup",
  "typeName": "Hetzner::Compute::PlacementGroup", // (1)!
  "domain": "Compute",
  "description": "Manages a Hetzner Cloud Placement Group.",
  "additionalProperties": false,
  "properties": {
    "name": {
      "type": "string",
      "description": "Name of the Placement Group."
    },
    "type": {
      "type": "string",
      "enum": ["spread"],
      "description": "Placement Group type."
    },
    "labels": { "$ref": "./common.schema.json#/definitions/Labels" }
  },
  "required": ["name", "type"],
  "readOnlyProperties": ["/properties/id"],    // (2)!
  "createOnlyProperties": ["/properties/type"], // (3)!
  "primaryIdentifier": ["/properties/id"]       // (4)!
}
```

1. `typeName` follows the `Provider::Domain::Resource` convention. This becomes the `type` field in the synthesized JSON.
2. `readOnlyProperties` — assigned by the API on creation. The codegen generates an `attr*` getter for each one. Users never set these.
3. `createOnlyProperties` — can only be set at creation. The engine treats changes to these as requiring resource replacement.
4. `primaryIdentifier` — the property the engine uses to track and look up the resource. Usually the API-assigned integer ID.

### Schema conventions

| Field | Description |
|-------|-------------|
| `typeName` | `Provider::Domain::Resource` — must match the key used in `ProviderRuntime.register()` |
| `domain` | Groups resources in the generated `HetznerResourceType` constant |
| `required` | Props the user must always provide |
| `readOnlyProperties` | `/properties/propName` — API-assigned. One `attr*` getter per entry. |
| `createOnlyProperties` | `/properties/propName` — immutable after creation |
| `primaryIdentifier` | Single entry → `physicalIdKey = "propName"`. Multiple → composite physical ID. |

!!! tip "Shared types"
    Use `$ref: "./common.schema.json#/definitions/Labels"` for shared types (labels, location, network zone). Never reference definitions from another resource's schema — move shared types to `common.schema.json`.

---

## Step 2 — Run codegen

```bash
npx nx run @cdkx-io/hetzner:codegen
```

This regenerates two files from all schemas in `schemas/v1/`:

- `src/lib/generated/resources.generated.ts` — L1 construct class (`HtzPlacementGroup`), props interface, enums
- `src/lib/generated/runtime-config.generated.ts` — runtime config used by the engine

The generated L1 class will look like this:

```typescript title="resources.generated.ts (excerpt)" linenums="1" hl_lines="5 6"
export class HtzPlacementGroup extends ProviderResource {
  public static readonly RESOURCE_TYPE_NAME = 'Hetzner::Compute::PlacementGroup';

  // One getter per readOnlyProperty:
  public readonly attrId: IResolvable; // (1)!

  public name: string;
  public resourceType: PlacementGroupType; // 'type' renamed — avoids clash with base class
  public labels?: Record<string, string>;

  constructor(scope: Construct, id: string, props: HetznerPlacementGroup) {
    super(scope, id, { type: HtzPlacementGroup.RESOURCE_TYPE_NAME });
    this.attrId = this.getAtt('id');
    this.name = props.name;
    this.resourceType = props.type;
    this.labels = props.labels;
  }

  protected override renderProperties(): Record<string, PropertyValue> {
    return { name: this.name, type: this.resourceType, labels: this.labels }
      as unknown as Record<string, PropertyValue>;
  }
}
```

1. Generated automatically from `readOnlyProperties: ["/properties/id"]`. Users reference this in cross-resource expressions: `placementGroup.attrId`.

Commit the generated files — they are checked into the repo.

---

## Step 3 — Implement the `ResourceHandler`

Create the handler directory inside `@cdkx-io/hetzner-runtime`:

```
packages/providers/hetzner/hetzner-runtime/src/lib/handlers/placement-group/
├── placement-group-handler.ts
├── placement-group-handler.spec.ts
└── index.ts
```

```typescript title="placement-group-handler.ts" linenums="1" hl_lines="23 24 25 26 27"
import { ResourceHandler, RuntimeContext } from '@cdkx-io/core';
import { HetznerSdk } from '../../hetzner-sdk-facade';

// Props mirror the cdkx schema (camelCase). Never import the generated
// L1 class here — keep synth and runtime packages decoupled.
export interface PlacementGroupProps {
  readonly name: string;
  readonly type: 'spread';
  readonly labels?: Record<string, string>;
}

// State is what the engine persists after creation.
// Must include the primaryIdentifier so the engine can look up the resource.
export interface PlacementGroupState {
  readonly id: number;
  readonly name: string;
  readonly type: string;
  readonly labels: Record<string, string>;
}

export class PlacementGroupHandler extends ResourceHandler< // (1)!
  PlacementGroupProps,
  PlacementGroupState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: PlacementGroupProps,
  ): Promise<PlacementGroupState> {
    ctx.logger.info('provider.handler.placement-group.create', { // (2)!
      name: props.name,
    });

    const response = await ctx.sdk.placementGroups.createPlacementGroup({
      name: props.name,
      type: props.type,        // (3)!
      labels: props.labels,
    });

    const pg = this.assertExists(
      response.data.placement_group,
      'Hetzner API returned no placement_group in create response',
    );

    return {
      id: pg.id,
      name: pg.name,
      type: pg.type,
      labels: pg.labels ?? {},
    };
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: PlacementGroupProps,
    state: PlacementGroupState,
  ): Promise<PlacementGroupState> {
    ctx.logger.info('provider.handler.placement-group.update', {
      id: state.id,
    });

    const response = await ctx.sdk.placementGroups.updatePlacementGroup(
      state.id,
      { name: props.name, labels: props.labels },
    );

    const pg = this.assertExists(
      response.data.placement_group,
      'Hetzner API returned no placement_group in update response',
    );

    return { id: pg.id, name: pg.name, type: pg.type, labels: pg.labels ?? {} };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: PlacementGroupState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.placement-group.delete', { id: state.id });
    await ctx.sdk.placementGroups.deletePlacementGroup(state.id);
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: PlacementGroupProps,
  ): Promise<PlacementGroupState> {
    ctx.logger.debug('provider.handler.placement-group.get', {
      name: props.name,
    });

    const response = await ctx.sdk.placementGroups.listPlacementGroups(
      undefined, props.name,
    );
    const pg = this.assertExists(
      response.data.placement_groups?.[0],
      `Hetzner placement group not found: ${props.name}`,
    );

    return { id: pg.id, name: pg.name, type: pg.type, labels: pg.labels ?? {} };
  }
}
```

1. `ResourceHandler<Props, State, Sdk>` — three type parameters. `Props` = deserialized cdkx properties. `State` = what the engine persists after creation (includes the physical ID). `Sdk` = the provider SDK facade.
2. Structured logging: string event key + context object. Event key format: `provider.handler.<resource>.<action>`.
3. Map camelCase props to snake_case SDK params explicitly. Never pass the props object directly — the SDK types use snake_case.

Then export from `index.ts`:

```typescript title="index.ts"
export { PlacementGroupHandler } from './placement-group-handler';
```

And re-export from the top-level `handlers/index.ts`:

```typescript title="handlers/index.ts (add this line)"
export { PlacementGroupHandler } from './placement-group/placement-group-handler';
```

---

## Step 4 — Register the handler

Open `hetzner-provider-runtime.ts` and register the new handler:

```typescript title="hetzner-provider-runtime.ts" linenums="1" hl_lines="7 8 18"
import { ProviderRuntime } from '@cdkx-io/core';
import { HetznerSdk } from './hetzner-sdk-facade';
import {
  HetznerNetworkHandler,
  // ... existing handlers ...
  PlacementGroupHandler, // (1)!
} from './handlers';

export class HetznerProviderRuntime extends ProviderRuntime<HetznerSdk> {
  constructor() {
    super();
    this.register('Hetzner::Networking::Network', new HetznerNetworkHandler());
    // ... existing registrations ...
    this.register(                                          // (2)!
      'Hetzner::Compute::PlacementGroup',
      new PlacementGroupHandler(),
    );
  }
}
```

1. Import the new handler.
2. The type string **must exactly match** the `typeName` in the schema and the `RESOURCE_TYPE_NAME` on the generated L1 class.

---

## Verify

```bash
# Run the full test suite for the runtime package
npx nx test @cdkx-io/hetzner-runtime

# Run just your new handler's tests
npx nx test @cdkx-io/hetzner-runtime \
  --testFile=packages/providers/hetzner/hetzner-runtime/src/lib/handlers/placement-group/placement-group-handler.spec.ts
```

---

!!! info "See also"
    - `packages/providers/hetzner/hetzner/AI.md` — full schema conventions and codegen design (in the repo)
    - `packages/providers/hetzner/hetzner-runtime/AI.md` — handler architecture and SDK facade (in the repo)
    - [Add a Provider](add-provider.md) — how to create a new provider package from scratch
