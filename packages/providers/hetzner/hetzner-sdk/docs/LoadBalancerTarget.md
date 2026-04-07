# LoadBalancerTarget

## Properties

| Name               | Type                                                                                           | Description                                                                                                                               | Notes                             |
| ------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **type**           | **string**                                                                                     | Type of the resource.                                                                                                                     | [default to undefined]            |
| **server**         | [**LoadBalancerTargetServer**](LoadBalancerTargetServer.md)                                    |                                                                                                                                           | [optional] [default to undefined] |
| **label_selector** | [**LoadBalancerTargetLabelSelector**](LoadBalancerTargetLabelSelector.md)                      |                                                                                                                                           | [optional] [default to undefined] |
| **ip**             | [**LoadBalancerTargetIP**](LoadBalancerTargetIP.md)                                            |                                                                                                                                           | [optional] [default to undefined] |
| **health_status**  | [**Array&lt;LoadBalancerTargetHealthStatusInner&gt;**](LoadBalancerTargetHealthStatusInner.md) | List of health statuses of the services on this target. Only present for target types \&quot;server\&quot; and \&quot;ip\&quot;.          | [optional] [default to undefined] |
| **use_private_ip** | **boolean**                                                                                    | Use the private network IP instead of the public IP. Only present for target types \&quot;server\&quot; and \&quot;label_selector\&quot;. | [optional] [default to false]     |
| **targets**        | [**Array&lt;LoadBalancerTargetTarget&gt;**](LoadBalancerTargetTarget.md)                       | List of resolved label selector target Servers. Only present for type \&quot;label_selector\&quot;.                                       | [optional] [default to undefined] |

## Example

```typescript
import { LoadBalancerTarget } from '@cdk-x/hetzner-sdk';

const instance: LoadBalancerTarget = {
  type,
  server,
  label_selector,
  ip,
  health_status,
  use_private_ip,
  targets,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
