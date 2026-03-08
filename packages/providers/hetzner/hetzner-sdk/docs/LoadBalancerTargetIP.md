# LoadBalancerTargetIP

IP target where the traffic should be routed to. It is only possible to use the (Public or vSwitch) IPs of Hetzner Online Root Servers belonging to the project owner. IPs belonging to other users are blocked. Additionally IPs belonging to services provided by Hetzner Cloud (Servers, Load Balancers, ...) are blocked as well. Only present for target type `ip`.

## Properties

| Name   | Type       | Description                                                                                                 | Notes                  |
| ------ | ---------- | ----------------------------------------------------------------------------------------------------------- | ---------------------- |
| **ip** | **string** | IP of a server that belongs to the same customer (public IPv4/IPv6) or private IP in a subnet type vswitch. | [default to undefined] |

## Example

```typescript
import { LoadBalancerTargetIP } from '@cdkx-io/hetzner-sdk';

const instance: LoadBalancerTargetIP = {
  ip,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
