# ListSshKeys200ResponseSshKeysInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ID of the [SSH Key](#tag/ssh-keys). | [default to undefined]
**name** | **string** | Name of the Resource. Must be unique per Project. | [default to undefined]
**fingerprint** | **string** | MD5 fingerprint of the SSH public key. | [default to undefined]
**public_key** | **string** | Public key. | [default to undefined]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [default to undefined]
**created** | **string** | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). | [default to undefined]

## Example

```typescript
import { ListSshKeys200ResponseSshKeysInner } from '@cdkx-io/hetzner-sdk';

const instance: ListSshKeys200ResponseSshKeysInner = {
    id,
    name,
    fingerprint,
    public_key,
    labels,
    created,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
