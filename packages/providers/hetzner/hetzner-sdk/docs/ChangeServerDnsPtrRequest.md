# ChangeServerDnsPtrRequest

## Properties

| Name        | Type       | Description                                                                              | Notes                  |
| ----------- | ---------- | ---------------------------------------------------------------------------------------- | ---------------------- |
| **ip**      | **string** | Primary IP address for which the reverse DNS entry should be set.                        | [default to undefined] |
| **dns_ptr** | **string** | Hostname to set as a reverse DNS PTR entry, reset to original value if &#x60;null&#x60;. | [default to undefined] |

## Example

```typescript
import { ChangeServerDnsPtrRequest } from '@cdkx-io/hetzner-sdk';

const instance: ChangeServerDnsPtrRequest = {
  ip,
  dns_ptr,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
