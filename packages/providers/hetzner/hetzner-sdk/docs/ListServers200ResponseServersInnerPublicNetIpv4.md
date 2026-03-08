# ListServers200ResponseServersInnerPublicNetIpv4

IP address (v4) and its reverse DNS entry of this Server.

## Properties

| Name        | Type        | Description                                                  | Notes                             |
| ----------- | ----------- | ------------------------------------------------------------ | --------------------------------- |
| **id**      | **number**  | ID of the [Primary IP](#tag/primary-ips).                    | [optional] [default to undefined] |
| **ip**      | **string**  | IP address (v4) of this Server.                              | [default to undefined]            |
| **blocked** | **boolean** | If the IP is blocked by our anti abuse dept.                 | [default to undefined]            |
| **dns_ptr** | **string**  | Reverse DNS PTR entry for the IPv4 addresses of this Server. | [default to undefined]            |

## Example

```typescript
import { ListServers200ResponseServersInnerPublicNetIpv4 } from '@cdkx-io/hetzner-sdk';

const instance: ListServers200ResponseServersInnerPublicNetIpv4 = {
  id,
  ip,
  blocked,
  dns_ptr,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
