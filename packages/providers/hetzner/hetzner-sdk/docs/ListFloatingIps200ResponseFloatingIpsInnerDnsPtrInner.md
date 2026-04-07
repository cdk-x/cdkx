# ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner

## Properties

| Name        | Type       | Description                                                       | Notes                  |
| ----------- | ---------- | ----------------------------------------------------------------- | ---------------------- |
| **ip**      | **string** | Single IPv4 or IPv6 address to create pointer for.                | [default to undefined] |
| **dns_ptr** | **string** | Domain Name to point to. PTR record content used for reverse DNS. | [default to undefined] |

## Example

```typescript
import { ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner } from '@cdk-x/hetzner-sdk';

const instance: ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner = {
  ip,
  dns_ptr,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
