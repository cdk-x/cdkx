# ChangeServerAliasIpsRequest

## Properties

| Name          | Type                    | Description                                               | Notes                  |
| ------------- | ----------------------- | --------------------------------------------------------- | ---------------------- |
| **network**   | **number**              | ID of an existing Network already attached to the Server. | [default to undefined] |
| **alias_ips** | **Array&lt;string&gt;** | New alias IPs to set for this Server.                     | [default to undefined] |

## Example

```typescript
import { ChangeServerAliasIpsRequest } from '@cdkx-io/hetzner-sdk';

const instance: ChangeServerAliasIpsRequest = {
  network,
  alias_ips,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
