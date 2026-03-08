# CreateCertificateRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the Certificate. | [default to undefined]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [optional] [default to undefined]
**type** | **string** | Choose between uploading a Certificate in PEM format or requesting a managed *Let\&#39;s Encrypt* Certificate. | [optional] [default to TypeEnum_Uploaded]
**certificate** | **string** | Certificate and chain in PEM format, in order so that each record directly certifies the one preceding. Required for type &#x60;uploaded&#x60; Certificates. | [optional] [default to undefined]
**private_key** | **string** | Certificate key in PEM format. Required for type &#x60;uploaded&#x60; Certificates. | [optional] [default to undefined]
**domain_names** | **Array&lt;string&gt;** | Domains and subdomains that should be contained in the Certificate issued by *Let\&#39;s Encrypt*. Required for type &#x60;managed&#x60; Certificates. | [optional] [default to undefined]

## Example

```typescript
import { CreateCertificateRequest } from '@cdkx-io/hetzner-sdk';

const instance: CreateCertificateRequest = {
    name,
    labels,
    type,
    certificate,
    private_key,
    domain_names,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
