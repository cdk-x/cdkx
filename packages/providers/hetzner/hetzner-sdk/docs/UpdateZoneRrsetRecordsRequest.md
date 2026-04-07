# UpdateZoneRrsetRecordsRequest

## Properties

| Name        | Type                                   | Description                                                                                                         | Notes                  |
| ----------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **records** | [**Array&lt;Record1&gt;**](Record1.md) | Records to update in the [RRSet](#tag/zone-rrsets). Must not be empty and must only contain distinct record values. | [default to undefined] |

## Example

```typescript
import { UpdateZoneRrsetRecordsRequest } from '@cdk-x/hetzner-sdk';

const instance: UpdateZoneRrsetRecordsRequest = {
  records,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
