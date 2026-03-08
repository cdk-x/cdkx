# ListLoadBalancerTypes200ResponseLoadBalancerTypesInner

## Properties

| Name                          | Type                                                                                                                                                       | Description                                                                                                                               | Notes                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **id**                        | **number**                                                                                                                                                 | ID of the Load Balancer type.                                                                                                             | [default to undefined] |
| **name**                      | **string**                                                                                                                                                 | Unique identifier of the Load Balancer type.                                                                                              | [default to undefined] |
| **description**               | **string**                                                                                                                                                 | Description of the Load Balancer type.                                                                                                    | [default to undefined] |
| **max_connections**           | **number**                                                                                                                                                 | Number of maximum simultaneous open connections.                                                                                          | [default to undefined] |
| **max_services**              | **number**                                                                                                                                                 | Number of services a Load Balancer of this type can have.                                                                                 | [default to undefined] |
| **max_targets**               | **number**                                                                                                                                                 | Number of targets a single Load Balancer can have.                                                                                        | [default to undefined] |
| **max_assigned_certificates** | **number**                                                                                                                                                 | Number of SSL Certificates that can be assigned to a single Load Balancer.                                                                | [default to undefined] |
| **deprecated**                | **string**                                                                                                                                                 | Point in time when the Load Balancer type is deprecated (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). | [default to undefined] |
| **prices**                    | [**Array&lt;ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner&gt;**](ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner.md) | Price per [Location](#tag/locations).                                                                                                     | [default to undefined] |

## Example

```typescript
import { ListLoadBalancerTypes200ResponseLoadBalancerTypesInner } from '@cdkx-io/hetzner-sdk';

const instance: ListLoadBalancerTypes200ResponseLoadBalancerTypesInner = {
  id,
  name,
  description,
  max_connections,
  max_services,
  max_targets,
  max_assigned_certificates,
  deprecated,
  prices,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
