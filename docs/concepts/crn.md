# Cloud Resource Name (CRN)

A **Cloud Resource Name (CRN)** is a unique identifier assigned to every resource managed by cdkx. Similar to AWS ARN (Amazon Resource Name), the CRN provides a standardized way to identify and reference resources across different providers.

## Format

```
crn:cdkx:<provider>:<domain>[:<region>][:<account>]:<resource-type>/<resource-id>
```

| Segment           | Required | Description                                                |
| ----------------- | -------- | ---------------------------------------------------------- |
| `crn`             | ✅       | Fixed prefix                                               |
| `cdkx`            | ✅       | Framework identifier                                       |
| `<provider>`      | ✅       | Provider name (e.g., `hetzner`, `multipass`)               |
| `<domain>`        | ✅       | Resource domain (e.g., `networking`, `compute`, `storage`) |
| `<region>`        | ❌       | Optional region/zone (e.g., `fsn1`, `nbg1`)                |
| `<account>`       | ❌       | Optional account/project identifier                        |
| `<resource-type>` | ✅       | Type of resource (e.g., `network`, `server`, `volume`)     |
| `<resource-id>`   | ✅       | Provider-assigned unique identifier                        |

## Examples

### Hetzner Resources

```typescript
// Simple resource without region/account
crn:cdkx:hetzner:networking:network/12345

// Resource with region
crn:cdkx:hetzner:networking:fsn1:primary-ip/67890

// Composite ID (action resources)
crn:cdkx:hetzner:networking:subnet/network/12345/10.0.1.0_24
crn:cdkx:hetzner:networking:route/network/12345/10.100.0.0_24
```

### Multipass Resources

```typescript
// Local instance (no region/account)
crn: cdkx: multipass: compute: instance / my - local - vm;
```

## Using CRNs

### Accessing CRN After Deployment

Every L1 construct exposes `attrCrn`, an `IResolvable` that resolves to the CRN string after deployment:

```typescript title="src/main.ts" linenums="1"
import { App, Stack } from '@cdk-x/core';
import { HtzNetwork } from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'NetworkStack');

const network = new HtzNetwork(stack, 'Net', {
  name: 'my-network',
  ipRange: '10.0.0.0/16',
});

// attrCrn is a token that resolves at deploy time
console.log(network.attrCrn); // { ref: 'NetXXXX', attr: 'crn' }
```

### CRN in Engine State

After deployment, the CRN is persisted in the engine state file (`.cdkx/engine-state.json`):

```json
{
  "stacks": {
    "NetworkStack": {
      "resources": {
        "NetA1B2C3D4": {
          "status": "CREATE_COMPLETE",
          "physicalId": "12345",
          "crn": "crn:cdkx:hetzner:networking:network/12345",
          "outputs": {
            "networkId": 12345,
            "name": "my-network",
            "ipRange": "10.0.0.0/16"
          }
        }
      }
    }
  }
}
```

## CRN API

The `Crn` class provides methods for parsing and formatting CRN strings:

### Parsing

```typescript
import { Crn } from '@cdk-x/core';

const crn = Crn.parse('crn:cdkx:hetzner:networking:network/12345');

console.log(crn.provider); // 'hetzner'
console.log(crn.domain); // 'networking'
console.log(crn.resourceType); // 'network'
console.log(crn.resourceId); // '12345'
console.log(crn.region); // undefined
console.log(crn.account); // undefined
```

### Formatting

```typescript
import { Crn } from '@cdk-x/core';

const crnString = Crn.format({
  provider: 'hetzner',
  domain: 'networking',
  region: 'fsn1', // optional
  account: 'proj-123', // optional
  resourceType: 'server',
  resourceId: '98765',
});

console.log(crnString);
// 'crn:cdkx:hetzner:networking:fsn1:proj-123:server/98765'
```

### Validation

```typescript
import { Crn } from '@cdk-x/core';

// Check if string is valid CRN format
Crn.isCrn('crn:cdkx:hetzner:networking:network/12345'); // true
Crn.isCrn('not-a-crn'); // false
Crn.isCrn('arn:aws:ec2:us-east-1:123:instance/i-123'); // false
```

## Implementing buildCrn in Handlers

Each resource handler must implement the `buildCrn()` method to construct the CRN string:

```typescript title="handlers/my-resource-handler.ts" linenums="1"
import { ResourceHandler, RuntimeContext, Crn } from '@cdk-x/core';

export class MyResourceHandler extends ResourceHandler<
  MyResourceProps,
  MyResourceState,
  MySdk
> {
  async create(
    ctx: RuntimeContext<MySdk>,
    props: MyResourceProps,
  ): Promise<MyResourceState> {
    // ... create resource
    return {
      resourceId: 12345,
      name: props.name,
    };
  }

  buildCrn(props: MyResourceProps, state: MyResourceState): string {
    return Crn.format({
      provider: 'my-provider',
      domain: 'my-domain',
      resourceType: 'my-resource',
      resourceId: String(state.resourceId),
    });
  }
}
```

## Benefits

- **Uniqueness**: Each CRN is unique within its provider scope
- **Portability**: Standard format works across all providers (Hetzner, Multipass, etc.)
- **Auditability**: CRNs appear in engine state for resource tracking
- **Future-proof**: Foundation for cross-stack references and resource imports

---

!!! info "See also"

    - [Tokens & Cross-stack References](tokens.md) — how tokens resolve CRNs at deploy time
    - [Deployment Lifecycle](deployment-lifecycle.md) — how the engine persists CRNs
    - [Stack](stack.md) — deployment units that contain resources with CRNs
