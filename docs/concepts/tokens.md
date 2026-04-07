# Tokens & Cross-resource References

A **token** is a placeholder value that is resolved later — either at synthesis time (e.g. a `Lazy` value) or at deploy time (e.g. a cross-resource reference). Tokens let you wire resources together without hardcoding IDs that don't exist yet.

## The problem tokens solve

When you create a network and a subnet, the subnet needs the network's ID. But the ID only exists after the network has been created in the cloud. Tokens let you express this relationship at write time:

```typescript
// ❌ Wrong — hardcoding an ID that may not exist or may change
new HtzSubnet(stack, 'Subnet', {
  networkId: 12345, // fragile
  // ...
});

// ✅ Correct — use a token that the engine resolves after the network is created
new HtzSubnet(stack, 'Subnet', {
  networkId: network.attrNetworkId, // (1)!
  // ...
});
```

1. `attrNetworkId` returns an `IResolvable` — a token that serializes to `{ ref, attr }` and is resolved at deploy time.

## How `getAtt` works

Every L1 construct exposes attribute getters that call `getAtt()` internally:

```typescript
const network = new HtzNetwork(stack, 'Network', {
  name: 'my-net',
  ipRange: '10.0.0.0/8',
});

// Each attribute getter returns an IResolvable:
network.attrNetworkId   // { resolve: () => ({ ref: 'MyStackNetworkXXXX', attr: 'networkId' }) }
network.attrIpRange     // { resolve: () => ({ ref: 'MyStackNetworkXXXX', attr: 'ipRange' }) }
```

You can also call `getAtt()` directly for attributes not exposed by the L1:

```typescript
const customRef = network.getAtt('someCustomAttr');
```

## Synthesized output

During synthesis, `IResolvable` tokens are serialized to `{ ref, attr }` objects in the stack template:

```json title="cdkx.out/MyStack.json"
{
  "MyStackNetworkA1B2C3D4": {
    "type": "Hetzner::Networking::Network",
    "properties": { "name": "my-net", "ipRange": "10.0.0.0/8" }
  },
  "MyStackSubnetE5F6G7H8": {
    "type": "Hetzner::Networking::Subnet",
    "properties": {
      "networkId": { "ref": "MyStackNetworkA1B2C3D4", "attr": "networkId" }, // (1)!
      "ipRange": "10.0.1.0/24"
    },
    "dependsOn": ["MyStackNetworkA1B2C3D4"] // (2)!
  }
}
```

1. The token was resolved to a `{ ref, attr }` object. `ref` is the `logicalId` of the dependency; `attr` is the output attribute to read after it is created.
2. The engine detected the `{ ref, attr }` token and automatically added a `dependsOn` entry. The subnet will not be created until the network is `CREATE_COMPLETE`.

## Deploy-time resolution

The engine resolves `{ ref, attr }` tokens in two steps:

1. **Build the dependency graph** — scan all `{ ref, attr }` tokens to determine creation order.
2. **Resolve at creation time** — after a resource is created, read its output attributes from the provider API. When the subnet is ready to be created, the engine substitutes the actual network ID for `{ ref: "MyStackNetworkA1B2C3D4", attr: "networkId" }`.

```
Deploy order (topological):
  1. Create HtzNetwork    → provider returns { networkId: 42 }
  2. Create HtzSubnet     → engine substitutes networkId = 42
```

## Lazy tokens

`Lazy` defers a value until synthesis time. Use it when the value is not known when the construct is instantiated but will be available when `app.synth()` is called:

```typescript
import { Lazy } from '@cdk-x/core';

const resource = new ProviderResource(stack, 'MyResource', {
  type: 'Custom::Resource',
  properties: {
    // Computed lazily at synthesis time
    timestamp: Lazy.any({ produce: () => Date.now() }),
  },
});
```

`Lazy.any()` returns `any` — it can be assigned to any typed property without casting.

## Token resolution pipeline

During synthesis, each property value is passed through the resolver pipeline in this order:

| Order | Resolver | Handles |
|-------|----------|---------|
| 1 | Global resolvers | Custom tokens registered on `App` |
| 2 | Provider resolvers | Provider-specific tokens |
| 3 | `LazyResolver` | `Lazy` instances — calls `produce()` |
| 4 | `ImplicitTokenResolver` | Any object with a `resolve()` method (duck typing) |

The first resolver to call `context.replaceValue()` wins. Replaced values are recursively re-resolved (supports `Lazy → IResolvable` chains).

---

!!! info "See also"
    - [Construct](construct.md) — `getAtt()` is defined on `ProviderResource`
    - [Cloud Assembly](cloud-assembly.md) — the `{ ref, attr }` format in stack templates
    - [Deployment Lifecycle](deployment-lifecycle.md) — when tokens are resolved during `cdkx deploy`
