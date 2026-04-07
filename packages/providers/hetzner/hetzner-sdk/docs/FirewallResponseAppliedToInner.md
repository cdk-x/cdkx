# FirewallResponseAppliedToInner

## Properties

| Name                     | Type                                                                                                                               | Description                                                                  | Notes                             |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------- |
| **type**                 | **string**                                                                                                                         | The type of resource to apply.                                               | [default to undefined]            |
| **server**               | [**FirewallResponseAppliedToInnerServer**](FirewallResponseAppliedToInnerServer.md)                                                |                                                                              | [optional] [default to undefined] |
| **label_selector**       | [**FirewallResponseAppliedToInnerLabelSelector**](FirewallResponseAppliedToInnerLabelSelector.md)                                  |                                                                              | [optional] [default to undefined] |
| **applied_to_resources** | [**Array&lt;FirewallResponseAppliedToInnerAppliedToResourcesInner&gt;**](FirewallResponseAppliedToInnerAppliedToResourcesInner.md) | Resources applied to via this [Label Selector](#description/label-selector). | [optional] [default to undefined] |

## Example

```typescript
import { FirewallResponseAppliedToInner } from '@cdk-x/hetzner-sdk';

const instance: FirewallResponseAppliedToInner = {
  type,
  server,
  label_selector,
  applied_to_resources,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
