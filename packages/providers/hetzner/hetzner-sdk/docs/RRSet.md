# RRSet

## Properties

| Name           | Type                                           | Description                                                                                                                                                                                                                                                                                                                                                        | Notes                  |
| -------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **id**         | **string**                                     | ID of the RRSet. The ID is composed of the name and type, joined with a slash (e.g. &#x60;www/AAAA&#x60;).                                                                                                                                                                                                                                                         | [default to undefined] |
| **name**       | **string**                                     | Name of the [RRSet](#tag/zone-rrsets). The name must be in lower case, and must not end with a dot or the [Zone](#tag/zones) name. Names containing non-ASCII characters must be transcribed to [Punycode](https://wikipedia.org/wiki/Punycode) representation with ACE prefix, e.g. &#x60;xn--4bi&#x60; (✉️). For the [Zone](#tag/zones) apex, use &#x60;@&#x60;. | [default to undefined] |
| **type**       | **string**                                     | Type of the [RRSet](#tag/zone-rrsets).                                                                                                                                                                                                                                                                                                                             | [default to undefined] |
| **ttl**        | **number**                                     | Time To Live (TTL) of the [RRSet](#tag/zone-rrsets). Must be in between 60s and 2147483647s. If not set, the [Zone\&#39;s](#tag/zones) Default TTL is used.                                                                                                                                                                                                        | [default to undefined] |
| **labels**     | **{ [key: string]: string; }**                 | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.                                                                                                                                                                                                                         | [default to undefined] |
| **protection** | [**RRSetProtection**](RRSetProtection.md)      |                                                                                                                                                                                                                                                                                                                                                                    | [default to undefined] |
| **records**    | [**Array&lt;ModelRecord&gt;**](ModelRecord.md) | Records of the [RRSet](#tag/zone-rrsets). Must not be empty and must only contain distinct record values. The order of records returned in responses is not guaranteed to be consistent.                                                                                                                                                                           | [default to undefined] |
| **zone**       | **number**                                     | ID of the [Zone](#tag/zones).                                                                                                                                                                                                                                                                                                                                      | [default to undefined] |

## Example

```typescript
import { RRSet } from '@cdkx-io/hetzner-sdk';

const instance: RRSet = {
  id,
  name,
  type,
  ttl,
  labels,
  protection,
  records,
  zone,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
