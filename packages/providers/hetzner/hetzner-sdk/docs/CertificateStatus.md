# CertificateStatus

Current status of a type `managed` Certificate, always _null_ for type `uploaded` Certificates.

## Properties

| Name         | Type                                                    | Description                                        | Notes                             |
| ------------ | ------------------------------------------------------- | -------------------------------------------------- | --------------------------------- |
| **issuance** | **string**                                              | Status of the issuance process of the Certificate. | [optional] [default to undefined] |
| **renewal**  | **string**                                              | Status of the renewal process of the Certificate.  | [optional] [default to undefined] |
| **error**    | [**CertificateStatusError**](CertificateStatusError.md) |                                                    | [optional] [default to undefined] |

## Example

```typescript
import { CertificateStatus } from '@cdkx-io/hetzner-sdk';

const instance: CertificateStatus = {
  issuance,
  renewal,
  error,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
