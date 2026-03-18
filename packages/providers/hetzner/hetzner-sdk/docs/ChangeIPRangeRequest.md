# ChangeIPRangeRequest

## Properties

| Name         | Type       | Description                                                                                                                                                                                                                                                           | Notes                  |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **ip_range** | **string** | IP range of the [Network](#tag/networks). Uses CIDR notation. Must span all included subnets. Must be one of the private IPv4 ranges of RFC1918. Minimum network size is /24. We highly recommend that you pick a larger [Network](#tag/networks) with a /16 netmask. | [default to undefined] |

## Example

```typescript
import { ChangeIPRangeRequest } from '@cdkx-io/hetzner-sdk';

const instance: ChangeIPRangeRequest = {
  ip_range,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
