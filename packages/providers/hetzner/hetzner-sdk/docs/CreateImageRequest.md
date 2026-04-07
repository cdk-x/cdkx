# CreateImageRequest

## Properties

| Name            | Type                           | Description                                                                                                                                | Notes                                     |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| **description** | **string**                     | Description of the Image, will be auto-generated if not set.                                                                               | [optional] [default to undefined]         |
| **type**        | **string**                     | Type of Image to create.                                                                                                                   | [optional] [default to TypeEnum_Snapshot] |
| **labels**      | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [optional] [default to undefined]         |

## Example

```typescript
import { CreateImageRequest } from '@cdk-x/hetzner-sdk';

const instance: CreateImageRequest = {
  description,
  type,
  labels,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
