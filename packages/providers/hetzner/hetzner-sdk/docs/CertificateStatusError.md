# CertificateStatusError

If issuance or renewal reports `failed`, this property contains information about what happened.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**code** | **string** |  | [optional] [default to undefined]
**message** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { CertificateStatusError } from '@cdkx-io/hetzner-sdk';

const instance: CertificateStatusError = {
    code,
    message,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
