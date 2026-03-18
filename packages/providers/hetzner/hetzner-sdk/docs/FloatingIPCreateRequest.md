# FloatingIPCreateRequest

## Properties

| Name              | Type                           | Description                                                                                                                                                                                                                                               | Notes                             |
| ----------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **type**          | **string**                     | The Floating IP type.                                                                                                                                                                                                                                     | [default to undefined]            |
| **server**        | **number**                     | [Server](#tag/servers) the [Floating IP](#tag/floating-ips) is assigned to. &#x60;null&#x60; if not assigned.                                                                                                                                             | [optional] [default to undefined] |
| **home_location** | **string**                     | Home [Location](#tag/locations) for the [Floating IP](#tag/floating-ips). Either the ID or the name of the [Location](#tag/locations). Only optional if no [Server](#tag/servers) is provided. Routing is optimized for this [Locations](#tag/locations). | [optional] [default to undefined] |
| **description**   | **string**                     | Description of the Resource.                                                                                                                                                                                                                              | [optional] [default to undefined] |
| **name**          | **string**                     | Name of the Resource. Must be unique per Project.                                                                                                                                                                                                         | [optional] [default to undefined] |
| **labels**        | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.                                                                                                                | [optional] [default to undefined] |

## Example

```typescript
import { FloatingIPCreateRequest } from '@cdkx-io/hetzner-sdk';

const instance: FloatingIPCreateRequest = {
  type,
  server,
  home_location,
  description,
  name,
  labels,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
