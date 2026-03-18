# LoadBalancerTarget1

## Properties

| Name               | Type                                                                        | Description                                                                                                                                                                                                        | Notes                             |
| ------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **type**           | **string**                                                                  | Type of the resource.                                                                                                                                                                                              | [default to undefined]            |
| **server**         | [**LoadBalancerTargetServer1**](LoadBalancerTargetServer1.md)               |                                                                                                                                                                                                                    | [optional] [default to undefined] |
| **use_private_ip** | **boolean**                                                                 | Use the private network IP instead of the public IP of the Server, requires the Server and Load Balancer to be in the same network. Only valid for target types &#x60;server&#x60; and &#x60;label_selector&#x60;. | [optional] [default to false]     |
| **label_selector** | [**LoadBalancerTargetLabelSelector1**](LoadBalancerTargetLabelSelector1.md) |                                                                                                                                                                                                                    | [optional] [default to undefined] |
| **ip**             | [**LoadBalancerTargetIP1**](LoadBalancerTargetIP1.md)                       |                                                                                                                                                                                                                    | [optional] [default to undefined] |

## Example

```typescript
import { LoadBalancerTarget1 } from '@cdkx-io/hetzner-sdk';

const instance: LoadBalancerTarget1 = {
  type,
  server,
  use_private_ip,
  label_selector,
  ip,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
