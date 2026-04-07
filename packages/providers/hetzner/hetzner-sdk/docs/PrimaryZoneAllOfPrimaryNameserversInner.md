# PrimaryZoneAllOfPrimaryNameserversInner

Primary nameserver that returns [Zones](#tag/zones) via `AXFR`. Must allow queries from and may send `NOTIFY` queries to [Hetzner\'s secondary nameservers](https://docs.hetzner.com/dns-console/dns/general/authoritative-name-servers#secondary-dns-servers-old-name-servers-for-robot-customers).

## Properties

| Name               | Type       | Description                                                                                                                  | Notes                             |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **address**        | **string** | Public IPv4 or IPv6 address of the primary nameserver.                                                                       | [default to undefined]            |
| **port**           | **number** | Port of the primary nameserver.                                                                                              | [optional] [default to 53]        |
| **tsig_key**       | **string** | [Transaction signature (TSIG)](https://en.wikipedia.org/wiki/TSIG) key to use for the zone transfer. Must be base64 encoded. | [optional] [default to undefined] |
| **tsig_algorithm** | **string** | [Transaction signature (TSIG)](https://en.wikipedia.org/wiki/TSIG) algorithm used to generate the TSIG key.                  | [optional] [default to undefined] |

## Example

```typescript
import { PrimaryZoneAllOfPrimaryNameserversInner } from '@cdk-x/hetzner-sdk';

const instance: PrimaryZoneAllOfPrimaryNameserversInner = {
  address,
  port,
  tsig_key,
  tsig_algorithm,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
