# CreatePlacementGroupRequest

## Properties

| Name       | Type                           | Description                                                                                                                                | Notes                             |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **name**   | **string**                     | Name of the Placement Group.                                                                                                               | [default to undefined]            |
| **labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [optional] [default to undefined] |
| **type**   | **string**                     | Define the Placement Group Type.                                                                                                           | [default to undefined]            |

## Example

```typescript
import { CreatePlacementGroupRequest } from '@cdkx-io/hetzner-sdk';

const instance: CreatePlacementGroupRequest = {
  name,
  labels,
  type,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
