# LoadBalancerTargetServer

Server where the traffic should be routed to. Only present for target type \"server\".

## Properties

| Name   | Type       | Description       | Notes                  |
| ------ | ---------- | ----------------- | ---------------------- |
| **id** | **number** | ID of the Server. | [default to undefined] |

## Example

```typescript
import { LoadBalancerTargetServer } from '@cdkx-io/hetzner-sdk';

const instance: LoadBalancerTargetServer = {
  id,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
