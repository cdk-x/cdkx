# GetZoneZonefile200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**zonefile** | **string** | Generated zone file.  Example:  &#x60;&#x60;&#x60;dns $ORIGIN example.com. $TTL 3600  @ IN SOA hydrogen.ns.hetzner.com. dns.hetzner.com. 2024010100 86400 10800 3600000 3600  @ IN 10800 NS hydrogen.ns.hetzner.com. ; Some comment. @ IN 10800 NS oxygen.ns.hetzner.com. @ IN 10800 NS helium.ns.hetzner.de. &#x60;&#x60;&#x60;  | [default to undefined]

## Example

```typescript
import { GetZoneZonefile200Response } from '@cdkx-io/hetzner-sdk';

const instance: GetZoneZonefile200Response = {
    zonefile,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
