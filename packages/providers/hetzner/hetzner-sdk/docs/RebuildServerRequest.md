# RebuildServerRequest

## Properties

| Name          | Type       | Description                                                                                                                                                                       | Notes                             |
| ------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **image**     | **string** | ID or name of Image to rebuilt from.                                                                                                                                              | [default to undefined]            |
| **user_data** | **string** | Cloud-Init user data to use during Server rebuild. This field is limited to 32KiB. If not specified, the Server\&#39;s previous user_data value will be re-used (if any was set). | [optional] [default to undefined] |

## Example

```typescript
import { RebuildServerRequest } from '@cdk-x/hetzner-sdk';

const instance: RebuildServerRequest = {
  image,
  user_data,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
