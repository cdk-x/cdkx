# ListNetworks200ResponseNetworksInner

## Properties

| Name                         | Type                                                                                                                     | Description                                                                                                                                | Notes                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **id**                       | **number**                                                                                                               | ID of the [Network](#tag/networks).                                                                                                        | [default to undefined]            |
| **name**                     | **string**                                                                                                               | Name of the [Network](#tag/networks).                                                                                                      | [default to undefined]            |
| **ip_range**                 | **string**                                                                                                               | IP range of the [Network](#tag/networks). Uses CIDR notation.                                                                              | [default to undefined]            |
| **subnets**                  | [**Array&lt;ListNetworks200ResponseNetworksInnerSubnetsInner&gt;**](ListNetworks200ResponseNetworksInnerSubnetsInner.md) | List of subnets allocated in this [Network](#tag/networks).                                                                                | [default to undefined]            |
| **routes**                   | [**Array&lt;ListNetworks200ResponseNetworksInnerRoutesInner&gt;**](ListNetworks200ResponseNetworksInnerRoutesInner.md)   | Array of routes set in this [Network](#tag/networks).                                                                                      | [default to undefined]            |
| **servers**                  | **Array&lt;number&gt;**                                                                                                  | Array of IDs of [Servers](#tag/servers) attached to this [Network](#tag/networks).                                                         | [default to undefined]            |
| **load_balancers**           | **Array&lt;number&gt;**                                                                                                  | Array of IDs of [Load Balancers](#tag/load-balancers) attached to this [Network](#tag/networks).                                           | [optional] [default to undefined] |
| **protection**               | [**ListFloatingIps200ResponseFloatingIpsInnerProtection**](ListFloatingIps200ResponseFloatingIpsInnerProtection.md)      |                                                                                                                                            | [default to undefined]            |
| **labels**                   | **{ [key: string]: string; }**                                                                                           | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [default to undefined]            |
| **created**                  | **string**                                                                                                               | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).              | [default to undefined]            |
| **expose_routes_to_vswitch** | **boolean**                                                                                                              | Indicates if the routes from this [Network](#tag/networks) should be exposed to the vSwitch connection.                                    | [default to undefined]            |

## Example

```typescript
import { ListNetworks200ResponseNetworksInner } from '@cdk-x/hetzner-sdk';

const instance: ListNetworks200ResponseNetworksInner = {
  id,
  name,
  ip_range,
  subnets,
  routes,
  servers,
  load_balancers,
  protection,
  labels,
  created,
  expose_routes_to_vswitch,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
