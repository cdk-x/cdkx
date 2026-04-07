# ListLoadBalancers200ResponseLoadBalancersInnerPublicNet

Public network information.

## Properties

| Name        | Type                                                                                                                              | Description                      | Notes                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------- |
| **enabled** | **boolean**                                                                                                                       | Public Interface enabled or not. | [default to undefined] |
| **ipv4**    | [**ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv4**](ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv4.md) |                                  | [default to undefined] |
| **ipv6**    | [**ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv6**](ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv6.md) |                                  | [default to undefined] |

## Example

```typescript
import { ListLoadBalancers200ResponseLoadBalancersInnerPublicNet } from '@cdk-x/hetzner-sdk';

const instance: ListLoadBalancers200ResponseLoadBalancersInnerPublicNet = {
  enabled,
  ipv4,
  ipv6,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
