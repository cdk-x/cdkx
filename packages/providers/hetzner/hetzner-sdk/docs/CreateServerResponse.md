# CreateServerResponse

## Properties

| Name              | Type                                                                            | Description                                         | Notes                  |
| ----------------- | ------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------- |
| **server**        | [**ListServers200ResponseServersInner**](ListServers200ResponseServersInner.md) |                                                     | [default to undefined] |
| **action**        | [**Action**](Action.md)                                                         |                                                     | [default to undefined] |
| **next_actions**  | [**Array&lt;Action&gt;**](Action.md)                                            |                                                     | [default to undefined] |
| **root_password** | **string**                                                                      | Root password when no SSH keys have been specified. | [default to undefined] |

## Example

```typescript
import { CreateServerResponse } from '@cdkx-io/hetzner-sdk';

const instance: CreateServerResponse = {
  server,
  action,
  next_actions,
  root_password,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
