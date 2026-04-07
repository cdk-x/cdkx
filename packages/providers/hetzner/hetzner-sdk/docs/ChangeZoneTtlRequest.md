# ChangeZoneTtlRequest

## Properties

| Name    | Type       | Description                                                                                                                                                                        | Notes             |
| ------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **ttl** | **number** | Default Time To Live (TTL) of the [Zone](#tag/zones). Must be in between 60s and 2147483647s. This TTL is used for [RRSets](#tag/zone-rrsets) that do not explicitly define a TTL. | [default to 3600] |

## Example

```typescript
import { ChangeZoneTtlRequest } from '@cdk-x/hetzner-sdk';

const instance: ChangeZoneTtlRequest = {
  ttl,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
