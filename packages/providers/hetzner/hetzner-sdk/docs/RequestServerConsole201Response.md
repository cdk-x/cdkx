# RequestServerConsole201Response

## Properties

| Name         | Type                    | Description                                                                                                        | Notes                  |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **wss_url**  | **string**              | URL of websocket proxy to use; this includes a token which is valid for a limited time only.                       | [default to undefined] |
| **password** | **string**              | VNC password to use for this connection (this password only works in combination with a wss_url with valid token). | [default to undefined] |
| **action**   | [**Action**](Action.md) |                                                                                                                    | [default to undefined] |

## Example

```typescript
import { RequestServerConsole201Response } from '@cdkx-io/hetzner-sdk';

const instance: RequestServerConsole201Response = {
  wss_url,
  password,
  action,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
