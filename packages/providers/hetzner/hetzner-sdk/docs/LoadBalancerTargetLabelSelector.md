# LoadBalancerTargetLabelSelector

Label selector used to determine targets. Only present for target type \"label_selector\".

## Properties

| Name         | Type       | Description     | Notes                  |
| ------------ | ---------- | --------------- | ---------------------- |
| **selector** | **string** | Label selector. | [default to undefined] |

## Example

```typescript
import { LoadBalancerTargetLabelSelector } from '@cdk-x/hetzner-sdk';

const instance: LoadBalancerTargetLabelSelector = {
  selector,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
