# FirewallResource

## Properties

| Name               | Type                                                                                              | Description           | Notes                             |
| ------------------ | ------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------- |
| **type**           | **string**                                                                                        | Type of the resource. | [default to undefined]            |
| **server**         | [**FirewallResourceServer**](FirewallResourceServer.md)                                           |                       | [optional] [default to undefined] |
| **label_selector** | [**FirewallResponseAppliedToInnerLabelSelector**](FirewallResponseAppliedToInnerLabelSelector.md) |                       | [optional] [default to undefined] |

## Example

```typescript
import { FirewallResource } from '@cdk-x/hetzner-sdk';

const instance: FirewallResource = {
  type,
  server,
  label_selector,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
