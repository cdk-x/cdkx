# NetworkCreateRequest

## Properties

| Name                         | Type                                                                                                                   | Description                                                                                                                                                                                                                                                                                                                               | Notes                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **name**                     | **string**                                                                                                             | Name of the [Network](#tag/networks).                                                                                                                                                                                                                                                                                                     | [default to undefined]            |
| **ip_range**                 | **string**                                                                                                             | IP range of the [Network](#tag/networks). Uses CIDR notation. Must span all included subnets. Must be one of the private IPv4 ranges of RFC1918. Minimum network size is /24. We highly recommend that you pick a larger [Network](#tag/networks) with a /16 netmask.                                                                     | [default to undefined]            |
| **labels**                   | **{ [key: string]: string; }**                                                                                         | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.                                                                                                                                                                                                | [optional] [default to undefined] |
| **subnets**                  | [**Array&lt;NetworkCreateRequestSubnetsInner&gt;**](NetworkCreateRequestSubnetsInner.md)                               | Array of subnets to allocate.                                                                                                                                                                                                                                                                                                             | [optional] [default to undefined] |
| **routes**                   | [**Array&lt;ListNetworks200ResponseNetworksInnerRoutesInner&gt;**](ListNetworks200ResponseNetworksInnerRoutesInner.md) | Array of routes set in this [Network](#tag/networks).                                                                                                                                                                                                                                                                                     | [optional] [default to undefined] |
| **expose_routes_to_vswitch** | **boolean**                                                                                                            | Toggle to expose routes to the [Networks](#tag/networks) vSwitch. Indicates if the routes from this [Network](#tag/networks) should be exposed to the vSwitch in this [Network](#tag/networks). Only takes effect if a [vSwitch is setup](https://docs.hetzner.com/cloud/networks/connect-dedi-vswitch) in this [Network](#tag/networks). | [optional] [default to undefined] |

## Example

```typescript
import { NetworkCreateRequest } from '@cdk-x/hetzner-sdk';

const instance: NetworkCreateRequest = {
  name,
  ip_range,
  labels,
  subnets,
  routes,
  expose_routes_to_vswitch,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
