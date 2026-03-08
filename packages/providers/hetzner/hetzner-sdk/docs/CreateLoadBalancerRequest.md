# CreateLoadBalancerRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the Load Balancer. | [default to undefined]
**load_balancer_type** | **string** | ID or name of the Load Balancer type this Load Balancer should be created with. | [default to undefined]
**algorithm** | [**LoadBalancerAlgorithm**](LoadBalancerAlgorithm.md) |  | [optional] [default to undefined]
**services** | [**Array&lt;LoadBalancerService&gt;**](LoadBalancerService.md) | Array of services. | [optional] [default to undefined]
**targets** | [**Array&lt;LoadBalancerTarget1&gt;**](LoadBalancerTarget1.md) | Array of targets. | [optional] [default to undefined]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [optional] [default to undefined]
**public_interface** | **boolean** | Enable or disable the public interface of the Load Balancer. | [optional] [default to undefined]
**network** | **number** | ID of the network the Load Balancer should be attached to on creation. | [optional] [default to undefined]
**network_zone** | **string** | Name of network zone. | [optional] [default to undefined]
**location** | **string** | ID or name of Location to create Load Balancer in. | [optional] [default to undefined]

## Example

```typescript
import { CreateLoadBalancerRequest } from '@cdkx-io/hetzner-sdk';

const instance: CreateLoadBalancerRequest = {
    name,
    load_balancer_type,
    algorithm,
    services,
    targets,
    labels,
    public_interface,
    network,
    network_zone,
    location,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
