# CreateSshKeyRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the SSH key. | [default to undefined]
**public_key** | **string** | Public key. | [default to undefined]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [optional] [default to undefined]

## Example

```typescript
import { CreateSshKeyRequest } from '@cdkx-io/hetzner-sdk';

const instance: CreateSshKeyRequest = {
    name,
    public_key,
    labels,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
