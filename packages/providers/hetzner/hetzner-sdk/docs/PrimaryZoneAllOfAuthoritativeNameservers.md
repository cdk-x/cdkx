# PrimaryZoneAllOfAuthoritativeNameservers

## Properties

| Name                      | Type                    | Description                                                                                                                                                                                       | Notes                             |
| ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **assigned**              | **Array&lt;string&gt;** | Authoritative Hetzner nameservers assigned to this [Zone](#tag/zones).                                                                                                                            | [default to undefined]            |
| **delegated**             | **Array&lt;string&gt;** | Authoritative nameservers currently delegated to by the parent DNS zone. If these don\&#39;t match the assigned authoritative nameservers, the DNS zone is currently not being served by Hetzner. | [default to undefined]            |
| **delegation_last_check** | **string**              | Point in time (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format) when the DNS zone delegation was last checked.                                                     | [default to undefined]            |
| **delegation_status**     | **string**              | Status of the delegation.                                                                                                                                                                         | [optional] [default to undefined] |

## Example

```typescript
import { PrimaryZoneAllOfAuthoritativeNameservers } from '@cdkx-io/hetzner-sdk';

const instance: PrimaryZoneAllOfAuthoritativeNameservers = {
  assigned,
  delegated,
  delegation_last_check,
  delegation_status,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
