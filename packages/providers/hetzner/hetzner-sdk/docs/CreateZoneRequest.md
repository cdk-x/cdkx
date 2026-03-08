# CreateZoneRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the [Zone](#tag/zones).  All names with [well-known public suffixes](https://publicsuffix.org/) (e.g. &#x60;.de&#x60;, &#x60;.com&#x60;, &#x60;.co.uk&#x60;) are supported. Subdomains are not supported.  The name must be in lower case and must not end with a dot. [Internationalized domain names](https://en.wikipedia.org/wiki/Internationalized_domain_name) must be transcribed to [Punycode](https://wikipedia.org/wiki/Punycode) representation with ACE prefix, e.g. &#x60;xn--mnchen-3ya.de&#x60; (&#x60;münchen.de&#x60;).  | [default to undefined]
**mode** | **string** | Mode of the [Zone](#tag/zones).  For more information, see [Zone Modes](#tag/zones/zone-modes).  | [default to undefined]
**ttl** | **number** | Default Time To Live (TTL) of the [Zone](#tag/zones).  Must be in between 60s and 2147483647s.  This TTL is used for [RRSets](#tag/zone-rrsets) that do not explicitly define a TTL.  | [optional] [default to 3600]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [optional] [default to undefined]
**primary_nameservers** | [**Array&lt;PrimaryZoneAllOfPrimaryNameserversInner&gt;**](PrimaryZoneAllOfPrimaryNameserversInner.md) | Primary nameservers of the [Zone](#tag/zones).  Only applicable for [Zones](#tag/zones) in secondary mode. Ignored for [Zones](#tag/zones) in primary mode.  | [optional] [default to undefined]
**rrsets** | [**Array&lt;CreateZoneRequestRrsetsInner&gt;**](CreateZoneRequestRrsetsInner.md) | [RRSets](#tag/zone-rrsets) to be added to the [Zone](#tag/zones).  Only applicable for [Zones](#tag/zones) in primary mode. Ignored for [Zones](#tag/zones) in secondary mode.  | [optional] [default to undefined]
**zonefile** | **string** | Zone file to import.  Only applicable for [Zones](#tag/zones) in primary mode. Ignored for [Zones](#tag/zones) in secondary mode.  If provided, &#x60;rrsets&#x60; must be empty.  See [Zone file import](#tag/zones/zone-file-import) for more details.  | [optional] [default to undefined]

## Example

```typescript
import { CreateZoneRequest } from '@cdkx-io/hetzner-sdk';

const instance: CreateZoneRequest = {
    name,
    mode,
    ttl,
    labels,
    primary_nameservers,
    rrsets,
    zonefile,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
