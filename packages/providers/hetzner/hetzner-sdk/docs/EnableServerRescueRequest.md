# EnableServerRescueRequest

## Properties

| Name         | Type                    | Description                                                           | Notes                                    |
| ------------ | ----------------------- | --------------------------------------------------------------------- | ---------------------------------------- |
| **type**     | **string**              | Type of rescue system to boot.                                        | [optional] [default to TypeEnum_Linux64] |
| **ssh_keys** | **Array&lt;number&gt;** | Array of SSH key IDs which should be injected into the rescue system. | [optional] [default to undefined]        |

## Example

```typescript
import { EnableServerRescueRequest } from '@cdk-x/hetzner-sdk';

const instance: EnableServerRescueRequest = {
  type,
  ssh_keys,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
