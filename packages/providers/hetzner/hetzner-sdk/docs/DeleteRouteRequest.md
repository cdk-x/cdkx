# DeleteRouteRequest

## Properties

| Name            | Type       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Notes                  |
| --------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **destination** | **string** | Destination network or host of the route. Packages addressed for IPs matching the destination IP prefix will be send to the specified gateway. Must be one of _ private IPv4 ranges of RFC1918 _ or &#x60;0.0.0.0/0&#x60;. Must not overlap with _ an existing ip_range in any subnets _ or with any destinations in other routes \* or with &#x60;172.31.1.1&#x60;. &#x60;172.31.1.1&#x60; is being used as a gateway for the public network interface of [Servers](#tag/servers). | [default to undefined] |
| **gateway**     | **string** | Gateway of the route. Packages addressed for the specified destination will be send to this IP address. Cannot be _ the first IP of the networks ip_range, _ an IP behind a vSwitch or \* &#x60;172.31.1.1&#x60;. &#x60;172.31.1.1&#x60; is being used as a gateway for the public network interface of [Servers](#tag/servers).                                                                                                                                                    | [default to undefined] |

## Example

```typescript
import { DeleteRouteRequest } from '@cdk-x/hetzner-sdk';

const instance: DeleteRouteRequest = {
  destination,
  gateway,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
