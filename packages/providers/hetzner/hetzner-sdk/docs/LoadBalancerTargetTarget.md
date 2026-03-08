# LoadBalancerTargetTarget


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** | Type of the resource. Here always \&quot;server\&quot;. | [optional] [default to undefined]
**server** | [**LoadBalancerTargetServer**](LoadBalancerTargetServer.md) |  | [optional] [default to undefined]
**health_status** | [**Array&lt;LoadBalancerTargetHealthStatusInner&gt;**](LoadBalancerTargetHealthStatusInner.md) | List of health statuses of the services on this target. Only present for target types \&quot;server\&quot; and \&quot;ip\&quot;. | [optional] [default to undefined]
**use_private_ip** | **boolean** | Use the private network IP instead of the public IP. Only present for target types \&quot;server\&quot; and \&quot;label_selector\&quot;. | [optional] [default to false]

## Example

```typescript
import { LoadBalancerTargetTarget } from '@cdkx-io/hetzner-sdk';

const instance: LoadBalancerTargetTarget = {
    type,
    server,
    health_status,
    use_private_ip,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
