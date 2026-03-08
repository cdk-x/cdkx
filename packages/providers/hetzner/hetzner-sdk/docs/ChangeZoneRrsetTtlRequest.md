# ChangeZoneRrsetTtlRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**ttl** | **number** | Time To Live (TTL) of the [RRSet](#tag/zone-rrsets).  Must be in between 60s and 2147483647s.  If not set, the [Zone\&#39;s](#tag/zones) Default TTL is used.  | [default to undefined]

## Example

```typescript
import { ChangeZoneRrsetTtlRequest } from '@cdkx-io/hetzner-sdk';

const instance: ChangeZoneRrsetTtlRequest = {
    ttl,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
