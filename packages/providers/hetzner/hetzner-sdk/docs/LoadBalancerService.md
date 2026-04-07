# LoadBalancerService

## Properties

| Name                 | Type                                                                    | Description                             | Notes                             |
| -------------------- | ----------------------------------------------------------------------- | --------------------------------------- | --------------------------------- |
| **protocol**         | **string**                                                              | Protocol of the Load Balancer.          | [default to undefined]            |
| **listen_port**      | **number**                                                              | Port the Load Balancer listens on.      | [default to undefined]            |
| **destination_port** | **number**                                                              | Port the Load Balancer will balance to. | [default to undefined]            |
| **proxyprotocol**    | **boolean**                                                             | Is Proxyprotocol enabled or not.        | [default to undefined]            |
| **health_check**     | [**LoadBalancerServiceHealthCheck**](LoadBalancerServiceHealthCheck.md) |                                         | [default to undefined]            |
| **http**             | [**LoadBalancerServiceHTTP**](LoadBalancerServiceHTTP.md)               |                                         | [optional] [default to undefined] |

## Example

```typescript
import { LoadBalancerService } from '@cdk-x/hetzner-sdk';

const instance: LoadBalancerService = {
  protocol,
  listen_port,
  destination_port,
  proxyprotocol,
  health_check,
  http,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
