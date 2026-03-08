# ChangeServerProtectionRequest

## Properties

| Name         | Type        | Description                                                                                                            | Notes                             |
| ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **\_delete** | **boolean** | If true, prevents the Server from being deleted (currently delete and rebuild attribute needs to have the same value). | [optional] [default to undefined] |
| **rebuild**  | **boolean** | If true, prevents the Server from being rebuilt (currently delete and rebuild attribute needs to have the same value). | [optional] [default to undefined] |

## Example

```typescript
import { ChangeServerProtectionRequest } from '@cdkx-io/hetzner-sdk';

const instance: ChangeServerProtectionRequest = {
  _delete,
  rebuild,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
