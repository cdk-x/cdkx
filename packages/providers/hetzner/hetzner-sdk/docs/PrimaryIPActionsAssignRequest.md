# PrimaryIPActionsAssignRequest

## Properties

| Name              | Type       | Description                                         | Notes                  |
| ----------------- | ---------- | --------------------------------------------------- | ---------------------- |
| **assignee_type** | **string** | Type of resource assigning the Primary IP to.       | [default to undefined] |
| **assignee_id**   | **number** | ID of a resource of type &#x60;assignee_type&#x60;. | [default to undefined] |

## Example

```typescript
import { PrimaryIPActionsAssignRequest } from '@cdk-x/hetzner-sdk';

const instance: PrimaryIPActionsAssignRequest = {
  assignee_type,
  assignee_id,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
