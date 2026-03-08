# Certificate

## Properties

| Name                 | Type                                                                 | Description                                                                                                                                | Notes                             |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **id**               | **number**                                                           | ID of the [Certificate](#tag/certificates).                                                                                                | [default to undefined]            |
| **name**             | **string**                                                           | Name of the Resource. Must be unique per Project.                                                                                          | [default to undefined]            |
| **labels**           | **{ [key: string]: string; }**                                       | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [default to undefined]            |
| **type**             | **string**                                                           | Type of the Certificate.                                                                                                                   | [optional] [default to undefined] |
| **certificate**      | **string**                                                           | Certificate and chain in PEM format, in order so that each record directly certifies the one preceding.                                    | [default to undefined]            |
| **created**          | **string**                                                           | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).              | [default to undefined]            |
| **not_valid_before** | **string**                                                           | Point in time when the Certificate becomes valid (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).         | [default to undefined]            |
| **not_valid_after**  | **string**                                                           | Point in time when the Certificate stops being valid (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).     | [default to undefined]            |
| **domain_names**     | **Array&lt;string&gt;**                                              | Domains and subdomains covered by the Certificate.                                                                                         | [default to undefined]            |
| **fingerprint**      | **string**                                                           | SHA256 fingerprint of the Certificate.                                                                                                     | [default to undefined]            |
| **status**           | [**CertificateStatus**](CertificateStatus.md)                        |                                                                                                                                            | [optional] [default to undefined] |
| **used_by**          | [**Array&lt;CertificateUsedByInner&gt;**](CertificateUsedByInner.md) | Resources currently using the Certificate.                                                                                                 | [default to undefined]            |

## Example

```typescript
import { Certificate } from '@cdkx-io/hetzner-sdk';

const instance: Certificate = {
  id,
  name,
  labels,
  type,
  certificate,
  created,
  not_valid_before,
  not_valid_after,
  domain_names,
  fingerprint,
  status,
  used_by,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
