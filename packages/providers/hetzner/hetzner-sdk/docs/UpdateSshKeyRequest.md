# UpdateSshKeyRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | New name Name to set. | [optional] [default to undefined]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource.  Note that the set of [Labels](#description/labels) provided in the request will overwrite the existing one.  For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [optional] [default to undefined]

## Example

```typescript
import { UpdateSshKeyRequest } from '@cdkx-io/hetzner-sdk';

const instance: UpdateSshKeyRequest = {
    name,
    labels,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
