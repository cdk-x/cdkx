# PlacementGroup

## Properties

| Name        | Type                           | Description                                                                                                                                | Notes                  |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **id**      | **number**                     | ID of the [Placement Group](#tag/placement-groups).                                                                                        | [default to undefined] |
| **name**    | **string**                     | Name of the Resource. Must be unique per Project.                                                                                          | [default to undefined] |
| **labels**  | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [default to undefined] |
| **type**    | **string**                     | Type of Placement Group.                                                                                                                   | [default to undefined] |
| **created** | **string**                     | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).              | [default to undefined] |
| **servers** | **Array&lt;number&gt;**        | Array of IDs of Servers that are part of this Placement Group.                                                                             | [default to undefined] |

## Example

```typescript
import { PlacementGroup } from '@cdk-x/hetzner-sdk';

const instance: PlacementGroup = {
  id,
  name,
  labels,
  type,
  created,
  servers,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
