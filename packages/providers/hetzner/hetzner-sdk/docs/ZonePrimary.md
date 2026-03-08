# ZonePrimary


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ID of the [Zone](#tag/zones). | [default to undefined]
**name** | **string** | Name of the [Zone](#tag/zones).  All names with [well-known public suffixes](https://publicsuffix.org/) (e.g. &#x60;.de&#x60;, &#x60;.com&#x60;, &#x60;.co.uk&#x60;) are supported. Subdomains are not supported.  The name must be in lower case and must not end with a dot. [Internationalized domain names](https://en.wikipedia.org/wiki/Internationalized_domain_name) must be transcribed to [Punycode](https://wikipedia.org/wiki/Punycode) representation with ACE prefix, e.g. &#x60;xn--mnchen-3ya.de&#x60; (&#x60;münchen.de&#x60;).  | [default to undefined]
**created** | **string** | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). | [default to undefined]
**primary_nameservers** | [**Array&lt;PrimaryZoneAllOfPrimaryNameserversInner&gt;**](PrimaryZoneAllOfPrimaryNameserversInner.md) | Primary nameservers of the [Zone](#tag/zones).  Only set if [Zone](#tag/zones) is in [secondary mode](#tag/zones/zone-modes), otherwise empty.  | [optional] [default to undefined]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [default to undefined]
**protection** | [**ListFloatingIps200ResponseFloatingIpsInnerProtection**](ListFloatingIps200ResponseFloatingIpsInnerProtection.md) |  | [default to undefined]
**ttl** | **number** | Default Time To Live (TTL) of the [Zone](#tag/zones).  Must be in between 60s and 2147483647s.  This TTL is used for [RRSets](#tag/zone-rrsets) that do not explicitly define a TTL.  | [default to 3600]
**status** | **string** | Status of the [Zone](#tag/zones).  | [default to undefined]
**record_count** | **number** | Number of resource records (RR) within the [Zone](#tag/zones). | [default to undefined]
**authoritative_nameservers** | [**PrimaryZoneAllOfAuthoritativeNameservers**](PrimaryZoneAllOfAuthoritativeNameservers.md) |  | [default to undefined]
**registrar** | **string** | Registrar of the domain. | [default to undefined]
**mode** | **string** | Mode of the [Zone](#tag/zones).  For more information, see [Zone Modes](#tag/zones/zone-modes).  | [default to undefined]

## Example

```typescript
import { ZonePrimary } from '@cdkx-io/hetzner-sdk';

const instance: ZonePrimary = {
    id,
    name,
    created,
    primary_nameservers,
    labels,
    protection,
    ttl,
    status,
    record_count,
    authoritative_nameservers,
    registrar,
    mode,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
