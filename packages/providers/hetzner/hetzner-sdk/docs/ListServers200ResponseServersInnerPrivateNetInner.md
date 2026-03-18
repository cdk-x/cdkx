# ListServers200ResponseServersInnerPrivateNetInner

## Properties

| Name            | Type                    | Description                                           | Notes                             |
| --------------- | ----------------------- | ----------------------------------------------------- | --------------------------------- |
| **network**     | **number**              | The Network ID the server is attached to.             | [optional] [default to undefined] |
| **ip**          | **string**              | The server IP address on the network.                 | [optional] [default to undefined] |
| **alias_ips**   | **Array&lt;string&gt;** | Additional IP addresses of the server on the network. | [optional] [default to undefined] |
| **mac_address** | **string**              | The server MAC address on the network.                | [optional] [default to undefined] |

## Example

```typescript
import { ListServers200ResponseServersInnerPrivateNetInner } from '@cdkx-io/hetzner-sdk';

const instance: ListServers200ResponseServersInnerPrivateNetInner = {
  network,
  ip,
  alias_ips,
  mac_address,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
