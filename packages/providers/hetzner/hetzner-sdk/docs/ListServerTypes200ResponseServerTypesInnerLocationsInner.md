# ListServerTypes200ResponseServerTypesInnerLocationsInner

A [Location](#tag/locations) (containing only id and name) and Server Type specific metadata.

## Properties

| Name            | Type                                      | Description                             | Notes                  |
| --------------- | ----------------------------------------- | --------------------------------------- | ---------------------- |
| **id**          | **number**                                | ID of the [Location](#tag/locations).   | [default to undefined] |
| **name**        | **string**                                | Name of the [Location](#tag/locations). | [default to undefined] |
| **deprecation** | [**DeprecationInfo**](DeprecationInfo.md) |                                         | [default to undefined] |

## Example

```typescript
import { ListServerTypes200ResponseServerTypesInnerLocationsInner } from '@cdk-x/hetzner-sdk';

const instance: ListServerTypes200ResponseServerTypesInnerLocationsInner = {
  id,
  name,
  deprecation,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
