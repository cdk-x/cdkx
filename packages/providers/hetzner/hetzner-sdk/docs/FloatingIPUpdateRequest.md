# FloatingIPUpdateRequest

## Properties

| Name            | Type                           | Description                                                                                                                                                                                                                                            | Notes                             |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **description** | **string**                     | Description of the Resource.                                                                                                                                                                                                                           | [optional] [default to undefined] |
| **name**        | **string**                     | Name of the Resource. Must be unique per Project.                                                                                                                                                                                                      | [optional] [default to undefined] |
| **labels**      | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. Note that the set of [Labels](#description/labels) provided in the request will overwrite the existing one. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [optional] [default to undefined] |

## Example

```typescript
import { FloatingIPUpdateRequest } from '@cdkx-io/hetzner-sdk';

const instance: FloatingIPUpdateRequest = {
  description,
  name,
  labels,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
