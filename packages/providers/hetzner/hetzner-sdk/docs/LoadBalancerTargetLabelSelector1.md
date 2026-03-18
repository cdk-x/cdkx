# LoadBalancerTargetLabelSelector1

Configuration for label selector targets, only valid and required if type is `label_selector`.

## Properties

| Name         | Type       | Description     | Notes                  |
| ------------ | ---------- | --------------- | ---------------------- |
| **selector** | **string** | Label selector. | [default to undefined] |

## Example

```typescript
import { LoadBalancerTargetLabelSelector1 } from '@cdkx-io/hetzner-sdk';

const instance: LoadBalancerTargetLabelSelector1 = {
  selector,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
