# AttachVolumeRequest

## Properties

| Name          | Type        | Description                                      | Notes                             |
| ------------- | ----------- | ------------------------------------------------ | --------------------------------- |
| **server**    | **number**  | ID of the Server the Volume will be attached to. | [default to undefined]            |
| **automount** | **boolean** | Auto-mount the Volume after attaching it.        | [optional] [default to undefined] |

## Example

```typescript
import { AttachVolumeRequest } from '@cdkx-io/hetzner-sdk';

const instance: AttachVolumeRequest = {
  server,
  automount,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
