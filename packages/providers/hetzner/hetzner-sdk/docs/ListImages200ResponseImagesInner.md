# ListImages200ResponseImagesInner

## Properties

| Name             | Type                                                                                                                | Description                                                                                                                                   | Notes                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **id**           | **number**                                                                                                          | ID of the [Image](#tag/images).                                                                                                               | [default to undefined]            |
| **type**         | **string**                                                                                                          | Type of the Image.                                                                                                                            | [default to undefined]            |
| **status**       | **string**                                                                                                          | Status of the Image.                                                                                                                          | [default to undefined]            |
| **name**         | **string**                                                                                                          | Unique identifier of the Image. This value is only set for system Images.                                                                     | [default to undefined]            |
| **description**  | **string**                                                                                                          | Description of the Image.                                                                                                                     | [default to undefined]            |
| **image_size**   | **number**                                                                                                          | Size of the Image file in our storage in GB. For snapshot Images this is the value relevant for calculating costs for the Image.              | [default to undefined]            |
| **disk_size**    | **number**                                                                                                          | Size of the disk contained in the Image in GB.                                                                                                | [default to undefined]            |
| **created**      | **string**                                                                                                          | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).                 | [default to undefined]            |
| **created_from** | [**ListImages200ResponseImagesInnerCreatedFrom**](ListImages200ResponseImagesInnerCreatedFrom.md)                   |                                                                                                                                               | [default to undefined]            |
| **bound_to**     | **number**                                                                                                          | ID of Server the Image is bound to. Only set for Images of type &#x60;backup&#x60;.                                                           | [default to undefined]            |
| **os_flavor**    | **string**                                                                                                          | Flavor of operating system contained in the Image.                                                                                            | [default to undefined]            |
| **os_version**   | **string**                                                                                                          | Operating system version.                                                                                                                     | [default to undefined]            |
| **rapid_deploy** | **boolean**                                                                                                         | Indicates that rapid deploy of the Image is available.                                                                                        | [optional] [default to undefined] |
| **protection**   | [**ListFloatingIps200ResponseFloatingIpsInnerProtection**](ListFloatingIps200ResponseFloatingIpsInnerProtection.md) |                                                                                                                                               | [default to undefined]            |
| **deprecated**   | **string**                                                                                                          | Point in time when the Image is considered to be deprecated (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). | [default to undefined]            |
| **deleted**      | **string**                                                                                                          | Point in time where the Image was deleted (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).                   | [default to undefined]            |
| **labels**       | **{ [key: string]: string; }**                                                                                      | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.    | [default to undefined]            |
| **architecture** | **string**                                                                                                          | CPU architecture compatible with the Image.                                                                                                   | [default to undefined]            |

## Example

```typescript
import { ListImages200ResponseImagesInner } from '@cdkx-io/hetzner-sdk';

const instance: ListImages200ResponseImagesInner = {
  id,
  type,
  status,
  name,
  description,
  image_size,
  disk_size,
  created,
  created_from,
  bound_to,
  os_flavor,
  os_version,
  rapid_deploy,
  protection,
  deprecated,
  deleted,
  labels,
  architecture,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
