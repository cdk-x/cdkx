# ListDatacenters200Response

## Properties

| Name               | Type                                                                                                         | Description                                                              | Notes                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ---------------------- |
| **datacenters**    | [**Array&lt;ListDatacenters200ResponseDatacentersInner&gt;**](ListDatacenters200ResponseDatacentersInner.md) | List of [Data Centers](#tag/data-centers).                               | [default to undefined] |
| **recommendation** | **number**                                                                                                   | Recommended [Data Center](#tag/data-centers) for creating new resources. | [default to undefined] |
| **meta**           | [**ListMeta**](ListMeta.md)                                                                                  |                                                                          | [default to undefined] |

## Example

```typescript
import { ListDatacenters200Response } from '@cdkx-io/hetzner-sdk';

const instance: ListDatacenters200Response = {
  datacenters,
  recommendation,
  meta,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
