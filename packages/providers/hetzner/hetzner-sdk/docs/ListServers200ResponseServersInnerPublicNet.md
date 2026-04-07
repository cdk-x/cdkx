# ListServers200ResponseServersInnerPublicNet

Public network information. The Server\'s IPv4 address can be found in `public_net->ipv4->ip`.

## Properties

| Name             | Type                                                                                                      | Description                                                       | Notes                             |
| ---------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| **ipv4**         | [**ListServers200ResponseServersInnerPublicNetIpv4**](ListServers200ResponseServersInnerPublicNetIpv4.md) |                                                                   | [default to undefined]            |
| **ipv6**         | [**ListServers200ResponseServersInnerPublicNetIpv6**](ListServers200ResponseServersInnerPublicNetIpv6.md) |                                                                   | [default to undefined]            |
| **floating_ips** | **Array&lt;number&gt;**                                                                                   | IDs of Floating IPs assigned to this Server.                      | [default to undefined]            |
| **firewalls**    | [**Array&lt;ServerPublicNetFirewall&gt;**](ServerPublicNetFirewall.md)                                    | Firewalls applied to the public network interface of this Server. | [optional] [default to undefined] |

## Example

```typescript
import { ListServers200ResponseServersInnerPublicNet } from '@cdk-x/hetzner-sdk';

const instance: ListServers200ResponseServersInnerPublicNet = {
  ipv4,
  ipv6,
  floating_ips,
  firewalls,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
