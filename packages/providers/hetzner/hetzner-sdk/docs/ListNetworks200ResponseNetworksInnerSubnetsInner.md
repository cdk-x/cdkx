# ListNetworks200ResponseNetworksInnerSubnetsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** | Type of subnet.  | [default to undefined]
**ip_range** | **string** | IP range of the subnet.  Uses CIDR notation.  | [optional] [default to undefined]
**network_zone** | **string** | Name of the [Network Zone](#tag/network-zones).  The [Location](#tag/locations) contains the &#x60;network_zone&#x60; property it belongs to.  | [default to undefined]
**gateway** | **string** | Gateway for [Servers](#tag/servers) attached to this subnet.  For subnets of type &#x60;server&#x60; this is always the first IP of the subnets IP range.  | [default to undefined]
**vswitch_id** | **number** | ID of the robot vSwitch if the subnet is of type &#x60;vswitch&#x60;. | [optional] [default to undefined]

## Example

```typescript
import { ListNetworks200ResponseNetworksInnerSubnetsInner } from '@cdkx-io/hetzner-sdk';

const instance: ListNetworks200ResponseNetworksInnerSubnetsInner = {
    type,
    ip_range,
    network_zone,
    gateway,
    vswitch_id,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
