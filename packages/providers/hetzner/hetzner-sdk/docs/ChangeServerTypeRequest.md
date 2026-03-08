# ChangeServerTypeRequest

## Properties

| Name             | Type        | Description                                                                        | Notes                  |
| ---------------- | ----------- | ---------------------------------------------------------------------------------- | ---------------------- |
| **upgrade_disk** | **boolean** | If false, do not upgrade the disk (this allows downgrading the Server type later). | [default to undefined] |
| **server_type**  | **string**  | ID or name of Server type the Server should migrate to.                            | [default to undefined] |

## Example

```typescript
import { ChangeServerTypeRequest } from '@cdkx-io/hetzner-sdk';

const instance: ChangeServerTypeRequest = {
  upgrade_disk,
  server_type,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
