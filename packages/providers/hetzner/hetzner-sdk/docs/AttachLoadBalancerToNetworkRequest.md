# AttachLoadBalancerToNetworkRequest

## Properties

| Name         | Type       | Description                                                                                                                                                                                                                | Notes                             |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **network**  | **number** | ID of an existing network to attach the Load Balancer to.                                                                                                                                                                  | [default to undefined]            |
| **ip**       | **string** | IP to request to be assigned to this Load Balancer; if you do not provide this then you will be auto assigned an IP address.                                                                                               | [optional] [default to undefined] |
| **ip_range** | **string** | IP range in CIDR block notation of the subnet to attach to. This allows for auto assigning an IP address for a specific subnet. Providing &#x60;ip&#x60; that is not part of &#x60;ip_range&#x60; will result in an error. | [optional] [default to undefined] |

## Example

```typescript
import { AttachLoadBalancerToNetworkRequest } from '@cdkx-io/hetzner-sdk';

const instance: AttachLoadBalancerToNetworkRequest = {
  network,
  ip,
  ip_range,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
