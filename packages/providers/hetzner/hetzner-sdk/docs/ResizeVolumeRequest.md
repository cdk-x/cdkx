# ResizeVolumeRequest

## Properties

| Name     | Type       | Description                                                | Notes                  |
| -------- | ---------- | ---------------------------------------------------------- | ---------------------- |
| **size** | **number** | New Volume size in GB (must be greater than current size). | [default to undefined] |

## Example

```typescript
import { ResizeVolumeRequest } from '@cdk-x/hetzner-sdk';

const instance: ResizeVolumeRequest = {
  size,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
