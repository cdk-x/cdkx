# RemoveZoneRrsetRecordsRequest

## Properties

| Name        | Type                                           | Description                                                                                                           | Notes                  |
| ----------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **records** | [**Array&lt;ModelRecord&gt;**](ModelRecord.md) | Records to remove from the [RRSet](#tag/zone-rrsets). Must not be empty and must only contain distinct record values. | [default to undefined] |

## Example

```typescript
import { RemoveZoneRrsetRecordsRequest } from '@cdk-x/hetzner-sdk';

const instance: RemoveZoneRrsetRecordsRequest = {
  records,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
