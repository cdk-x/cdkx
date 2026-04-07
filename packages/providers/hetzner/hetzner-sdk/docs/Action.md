# Action

## Properties

| Name          | Type                                                             | Description                                                                                                                                                                     | Notes                  |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **id**        | **number**                                                       | ID of the [Action](#description/actions).                                                                                                                                       | [default to undefined] |
| **command**   | **string**                                                       | Command executed in the Action.                                                                                                                                                 | [default to undefined] |
| **status**    | **string**                                                       | Status of the Action.                                                                                                                                                           | [default to undefined] |
| **started**   | **string**                                                       | Point in time when the Action was started (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).                                                     | [default to undefined] |
| **finished**  | **string**                                                       | Point in time when the Action was finished (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). Only set if the Action is finished otherwise null. | [default to undefined] |
| **progress**  | **number**                                                       | Progress of the Action in percent.                                                                                                                                              | [default to undefined] |
| **resources** | [**Array&lt;ActionResourcesInner&gt;**](ActionResourcesInner.md) | Resources the Action relates to.                                                                                                                                                | [default to undefined] |
| **error**     | [**ActionError**](ActionError.md)                                |                                                                                                                                                                                 | [default to undefined] |

## Example

```typescript
import { Action } from '@cdk-x/hetzner-sdk';

const instance: Action = {
  id,
  command,
  status,
  started,
  finished,
  progress,
  resources,
  error,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
