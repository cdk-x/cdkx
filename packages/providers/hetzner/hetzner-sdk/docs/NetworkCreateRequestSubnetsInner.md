# NetworkCreateRequestSubnetsInner

## Properties

| Name             | Type       | Description                                                                                                                                                                                                                                                                                               | Notes                             |
| ---------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **type**         | **string** | Type of subnet.                                                                                                                                                                                                                                                                                           | [default to undefined]            |
| **ip_range**     | **string** | IP range of the subnet. Uses CIDR notation. Must be a subnet of the parent [Networks](#tag/networks) &#x60;ip_range&#x60;. Must not overlap with any other subnets or with any destinations in routes. Minimum network size is /30. We highly recommend that you pick a larger subnet with a /24 netmask. | [optional] [default to undefined] |
| **network_zone** | **string** | Name of the [Network Zone](#tag/network-zones). The [Location](#tag/locations) contains the &#x60;network_zone&#x60; property it belongs to.                                                                                                                                                              | [default to undefined]            |
| **vswitch_id**   | **number** | ID of the robot vSwitch. Must only be supplied for subnets of type &#x60;vswitch&#x60;.                                                                                                                                                                                                                   | [optional] [default to undefined] |

## Example

```typescript
import { NetworkCreateRequestSubnetsInner } from '@cdk-x/hetzner-sdk';

const instance: NetworkCreateRequestSubnetsInner = {
  type,
  ip_range,
  network_zone,
  vswitch_id,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
