# EnableServerRescue201Response

The `root_password` key in the reply contains the root password that can be used to access the booted rescue system. 

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**root_password** | **string** | Password that will be set for this Server once the Action succeeds. | [optional] [default to undefined]
**action** | [**Action**](Action.md) |  | [optional] [default to undefined]

## Example

```typescript
import { EnableServerRescue201Response } from '@cdkx-io/hetzner-sdk';

const instance: EnableServerRescue201Response = {
    root_password,
    action,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
