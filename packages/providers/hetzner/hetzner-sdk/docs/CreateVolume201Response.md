# CreateVolume201Response

## Properties

| Name             | Type                                                                            | Description | Notes                  |
| ---------------- | ------------------------------------------------------------------------------- | ----------- | ---------------------- |
| **volume**       | [**ListVolumes200ResponseVolumesInner**](ListVolumes200ResponseVolumesInner.md) |             | [default to undefined] |
| **action**       | [**Action**](Action.md)                                                         |             | [default to undefined] |
| **next_actions** | [**Array&lt;Action&gt;**](Action.md)                                            |             | [default to undefined] |

## Example

```typescript
import { CreateVolume201Response } from '@cdk-x/hetzner-sdk';

const instance: CreateVolume201Response = {
  volume,
  action,
  next_actions,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
