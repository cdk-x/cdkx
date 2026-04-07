# UpdateLoadBalancerService

## Properties

| Name                 | Type                                                                                | Description                             | Notes                             |
| -------------------- | ----------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------- |
| **protocol**         | **string**                                                                          | Protocol of the Load Balancer.          | [optional] [default to undefined] |
| **listen_port**      | **number**                                                                          | Port the Load Balancer listens on.      | [default to undefined]            |
| **destination_port** | **number**                                                                          | Port the Load Balancer will balance to. | [optional] [default to undefined] |
| **proxyprotocol**    | **boolean**                                                                         | Is Proxyprotocol enabled or not.        | [optional] [default to undefined] |
| **health_check**     | [**UpdateLoadBalancerServiceHealthCheck**](UpdateLoadBalancerServiceHealthCheck.md) |                                         | [optional] [default to undefined] |
| **http**             | [**LoadBalancerServiceHTTP1**](LoadBalancerServiceHTTP1.md)                         |                                         | [optional] [default to undefined] |

## Example

```typescript
import { UpdateLoadBalancerService } from '@cdk-x/hetzner-sdk';

const instance: UpdateLoadBalancerService = {
  protocol,
  listen_port,
  destination_port,
  proxyprotocol,
  health_check,
  http,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
