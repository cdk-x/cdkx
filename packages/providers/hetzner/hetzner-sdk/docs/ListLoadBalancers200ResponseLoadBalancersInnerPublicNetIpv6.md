# ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv6

IP address (v6).

## Properties

| Name        | Type       | Description                                                       | Notes                             |
| ----------- | ---------- | ----------------------------------------------------------------- | --------------------------------- |
| **ip**      | **string** | IP address (v6) of this Load Balancer.                            | [optional] [default to undefined] |
| **dns_ptr** | **string** | Reverse DNS PTR entry for the IPv6 address of this Load Balancer. | [optional] [default to undefined] |

## Example

```typescript
import { ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv6 } from '@cdk-x/hetzner-sdk';

const instance: ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv6 = {
  ip,
  dns_ptr,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
