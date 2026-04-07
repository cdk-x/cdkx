# ApplyToResourcesRequest

## Properties

| Name         | Type                                                     | Description                                                                       | Notes                  |
| ------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------- |
| **apply_to** | [**Array&lt;FirewallResource&gt;**](FirewallResource.md) | Resources to apply the [Firewall](#tag/firewalls) to. Extends existing resources. | [default to undefined] |

## Example

```typescript
import { ApplyToResourcesRequest } from '@cdk-x/hetzner-sdk';

const instance: ApplyToResourcesRequest = {
  apply_to,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
