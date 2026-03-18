# ActionError

Error message for the Action if an error occurred, otherwise null.

## Properties

| Name        | Type       | Description                    | Notes                  |
| ----------- | ---------- | ------------------------------ | ---------------------- |
| **code**    | **string** | Fixed error code for machines. | [default to undefined] |
| **message** | **string** | Error message for humans.      | [default to undefined] |

## Example

```typescript
import { ActionError } from '@cdkx-io/hetzner-sdk';

const instance: ActionError = {
  code,
  message,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
