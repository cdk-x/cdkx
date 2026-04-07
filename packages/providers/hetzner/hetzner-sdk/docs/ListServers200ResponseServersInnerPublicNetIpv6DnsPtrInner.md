# ListServers200ResponseServersInnerPublicNetIpv6DnsPtrInner

## Properties

| Name        | Type       | Description                                                                         | Notes                  |
| ----------- | ---------- | ----------------------------------------------------------------------------------- | ---------------------- |
| **ip**      | **string** | Single IPv6 address of this Server for which the reverse DNS entry has been set up. | [default to undefined] |
| **dns_ptr** | **string** | DNS pointer for the specific IP address.                                            | [default to undefined] |

## Example

```typescript
import { ListServers200ResponseServersInnerPublicNetIpv6DnsPtrInner } from '@cdk-x/hetzner-sdk';

const instance: ListServers200ResponseServersInnerPublicNetIpv6DnsPtrInner = {
  ip,
  dns_ptr,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
