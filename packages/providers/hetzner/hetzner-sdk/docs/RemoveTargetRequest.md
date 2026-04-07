# RemoveTargetRequest

## Properties

| Name               | Type                                                                        | Description           | Notes                             |
| ------------------ | --------------------------------------------------------------------------- | --------------------- | --------------------------------- |
| **type**           | **string**                                                                  | Type of the resource. | [default to undefined]            |
| **server**         | [**RemoveTargetRequestServer**](RemoveTargetRequestServer.md)               |                       | [optional] [default to undefined] |
| **label_selector** | [**RemoveTargetRequestLabelSelector**](RemoveTargetRequestLabelSelector.md) |                       | [optional] [default to undefined] |
| **ip**             | [**LoadBalancerTargetIP**](LoadBalancerTargetIP.md)                         |                       | [optional] [default to undefined] |

## Example

```typescript
import { RemoveTargetRequest } from '@cdk-x/hetzner-sdk';

const instance: RemoveTargetRequest = {
  type,
  server,
  label_selector,
  ip,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
