# UpdateLoadBalancerServiceHealthCheck

Service health check.

## Properties

| Name         | Type                                                                                        | Description                                                                                                                                                  | Notes                             |
| ------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **protocol** | **string**                                                                                  | Type of the health check.                                                                                                                                    | [optional] [default to undefined] |
| **port**     | **number**                                                                                  | Port the health check will be performed on.                                                                                                                  | [optional] [default to undefined] |
| **interval** | **number**                                                                                  | Time interval in seconds health checks are performed.                                                                                                        | [optional] [default to undefined] |
| **timeout**  | **number**                                                                                  | Time in seconds after an attempt is considered a timeout.                                                                                                    | [optional] [default to undefined] |
| **retries**  | **number**                                                                                  | Unsuccessful retries needed until a target is considered unhealthy; an unhealthy target needs the same number of successful retries to become healthy again. | [optional] [default to undefined] |
| **http**     | [**UpdateLoadBalancerServiceHealthCheckHttp**](UpdateLoadBalancerServiceHealthCheckHttp.md) |                                                                                                                                                              | [optional] [default to undefined] |

## Example

```typescript
import { UpdateLoadBalancerServiceHealthCheck } from '@cdk-x/hetzner-sdk';

const instance: UpdateLoadBalancerServiceHealthCheck = {
  protocol,
  port,
  interval,
  timeout,
  retries,
  http,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
