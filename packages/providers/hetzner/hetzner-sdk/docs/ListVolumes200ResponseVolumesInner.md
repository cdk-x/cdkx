# ListVolumes200ResponseVolumesInner

## Properties

| Name             | Type                                                                                                                | Description                                                                                                                                | Notes                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **id**           | **number**                                                                                                          | ID of the [Volume](#tag/volumes).                                                                                                          | [default to undefined] |
| **created**      | **string**                                                                                                          | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).              | [default to undefined] |
| **name**         | **string**                                                                                                          | Name of the Resource. Must be unique per Project.                                                                                          | [default to undefined] |
| **server**       | **number**                                                                                                          | ID of the Server the Volume is attached to, null if it is not attached at all.                                                             | [default to undefined] |
| **location**     | [**ListVolumes200ResponseVolumesInnerLocation**](ListVolumes200ResponseVolumesInnerLocation.md)                     |                                                                                                                                            | [default to undefined] |
| **size**         | **number**                                                                                                          | Size in GB of the Volume.                                                                                                                  | [default to undefined] |
| **linux_device** | **string**                                                                                                          | Device path on the file system for the Volume.                                                                                             | [default to undefined] |
| **protection**   | [**ListFloatingIps200ResponseFloatingIpsInnerProtection**](ListFloatingIps200ResponseFloatingIpsInnerProtection.md) |                                                                                                                                            | [default to undefined] |
| **labels**       | **{ [key: string]: string; }**                                                                                      | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [default to undefined] |
| **status**       | **string**                                                                                                          | Status of the Volume.                                                                                                                      | [default to undefined] |
| **format**       | **string**                                                                                                          | Filesystem of the Volume if formatted on creation, null if not formatted on creation.                                                      | [default to undefined] |

## Example

```typescript
import { ListVolumes200ResponseVolumesInner } from '@cdkx-io/hetzner-sdk';

const instance: ListVolumes200ResponseVolumesInner = {
  id,
  created,
  name,
  server,
  location,
  size,
  linux_device,
  protection,
  labels,
  status,
  format,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
