# ListLoadBalancers200ResponseLoadBalancersInner

## Properties

| Name                   | Type                                                                                                                                               | Description                                                                                                                                | Notes                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **id**                 | **number**                                                                                                                                         | ID of the [Load Balancer](#tag/load-balancers).                                                                                            | [default to undefined] |
| **name**               | **string**                                                                                                                                         | Name of the Resource. Must be unique per Project.                                                                                          | [default to undefined] |
| **public_net**         | [**ListLoadBalancers200ResponseLoadBalancersInnerPublicNet**](ListLoadBalancers200ResponseLoadBalancersInnerPublicNet.md)                          |                                                                                                                                            | [default to undefined] |
| **private_net**        | [**Array&lt;ListLoadBalancers200ResponseLoadBalancersInnerPrivateNetInner&gt;**](ListLoadBalancers200ResponseLoadBalancersInnerPrivateNetInner.md) | Private networks information.                                                                                                              | [default to undefined] |
| **location**           | [**ListFloatingIps200ResponseFloatingIpsInnerHomeLocation**](ListFloatingIps200ResponseFloatingIpsInnerHomeLocation.md)                            |                                                                                                                                            | [default to undefined] |
| **load_balancer_type** | [**ListLoadBalancerTypes200ResponseLoadBalancerTypesInner**](ListLoadBalancerTypes200ResponseLoadBalancerTypesInner.md)                            |                                                                                                                                            | [default to undefined] |
| **protection**         | [**ListFloatingIps200ResponseFloatingIpsInnerProtection**](ListFloatingIps200ResponseFloatingIpsInnerProtection.md)                                |                                                                                                                                            | [default to undefined] |
| **labels**             | **{ [key: string]: string; }**                                                                                                                     | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [default to undefined] |
| **created**            | **string**                                                                                                                                         | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).              | [default to undefined] |
| **services**           | [**Array&lt;LoadBalancerService&gt;**](LoadBalancerService.md)                                                                                     | List of services that belong to this Load Balancer.                                                                                        | [default to undefined] |
| **targets**            | [**Array&lt;LoadBalancerTarget&gt;**](LoadBalancerTarget.md)                                                                                       | List of targets that belong to this Load Balancer.                                                                                         | [default to undefined] |
| **algorithm**          | [**ListLoadBalancers200ResponseLoadBalancersInnerAlgorithm**](ListLoadBalancers200ResponseLoadBalancersInnerAlgorithm.md)                          |                                                                                                                                            | [default to undefined] |
| **outgoing_traffic**   | **number**                                                                                                                                         | Outbound Traffic for the current billing period in bytes.                                                                                  | [default to undefined] |
| **ingoing_traffic**    | **number**                                                                                                                                         | Inbound Traffic for the current billing period in bytes.                                                                                   | [default to undefined] |
| **included_traffic**   | **number**                                                                                                                                         | Free Traffic for the current billing period in bytes.                                                                                      | [default to undefined] |

## Example

```typescript
import { ListLoadBalancers200ResponseLoadBalancersInner } from '@cdk-x/hetzner-sdk';

const instance: ListLoadBalancers200ResponseLoadBalancersInner = {
  id,
  name,
  public_net,
  private_net,
  location,
  load_balancer_type,
  protection,
  labels,
  created,
  services,
  targets,
  algorithm,
  outgoing_traffic,
  ingoing_traffic,
  included_traffic,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
