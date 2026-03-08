# LoadBalancerServiceHealthCheck

Service health check.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**protocol** | **string** | Type of the health check. | [default to undefined]
**port** | **number** | Port the health check will be performed on. | [default to undefined]
**interval** | **number** | Time interval in seconds health checks are performed. | [default to undefined]
**timeout** | **number** | Time in seconds after an attempt is considered a timeout. | [default to undefined]
**retries** | **number** | Unsuccessful retries needed until a target is considered unhealthy; an unhealthy target needs the same number of successful retries to become healthy again. | [default to undefined]
**http** | [**LoadBalancerServiceHealthCheckHttp**](LoadBalancerServiceHealthCheckHttp.md) |  | [optional] [default to undefined]

## Example

```typescript
import { LoadBalancerServiceHealthCheck } from '@cdkx-io/hetzner-sdk';

const instance: LoadBalancerServiceHealthCheck = {
    protocol,
    port,
    interval,
    timeout,
    retries,
    http,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
