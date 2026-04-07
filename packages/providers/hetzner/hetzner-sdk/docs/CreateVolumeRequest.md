# CreateVolumeRequest

## Properties

| Name          | Type                           | Description                                                                                                                                | Notes                             |
| ------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **size**      | **number**                     | Size of the Volume in GB.                                                                                                                  | [default to undefined]            |
| **name**      | **string**                     | Name of the volume.                                                                                                                        | [default to undefined]            |
| **labels**    | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [optional] [default to undefined] |
| **automount** | **boolean**                    | Auto-mount Volume after attach. &#x60;server&#x60; must be provided.                                                                       | [optional] [default to undefined] |
| **format**    | **string**                     | Format Volume after creation. One of: &#x60;xfs&#x60;, &#x60;ext4&#x60;.                                                                   | [optional] [default to undefined] |
| **location**  | **string**                     | Location to create the Volume in (can be omitted if Server is specified).                                                                  | [optional] [default to undefined] |
| **server**    | **number**                     | Server to which to attach the Volume once it\&#39;s created (Volume will be created in the same Location as the server).                   | [optional] [default to undefined] |

## Example

```typescript
import { CreateVolumeRequest } from '@cdk-x/hetzner-sdk';

const instance: CreateVolumeRequest = {
  size,
  name,
  labels,
  automount,
  format,
  location,
  server,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
