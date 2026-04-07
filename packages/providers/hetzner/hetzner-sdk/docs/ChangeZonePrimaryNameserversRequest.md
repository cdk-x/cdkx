# ChangeZonePrimaryNameserversRequest

## Properties

| Name                    | Type                                                                                                   | Description                                    | Notes                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ---------------------- |
| **primary_nameservers** | [**Array&lt;PrimaryZoneAllOfPrimaryNameserversInner&gt;**](PrimaryZoneAllOfPrimaryNameserversInner.md) | Primary nameservers of the [Zone](#tag/zones). | [default to undefined] |

## Example

```typescript
import { ChangeZonePrimaryNameserversRequest } from '@cdk-x/hetzner-sdk';

const instance: ChangeZonePrimaryNameserversRequest = {
  primary_nameservers,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
