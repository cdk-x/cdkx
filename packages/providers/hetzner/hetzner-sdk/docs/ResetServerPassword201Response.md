# ResetServerPassword201Response

The `root_password` key in the reply contains the new root password that will be active if the Action succeeds. 

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**root_password** | **string** | Password that will be set for this Server once the Action succeeds. | [optional] [default to undefined]
**action** | [**Action**](Action.md) |  | [optional] [default to undefined]

## Example

```typescript
import { ResetServerPassword201Response } from '@cdkx-io/hetzner-sdk';

const instance: ResetServerPassword201Response = {
    root_password,
    action,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
