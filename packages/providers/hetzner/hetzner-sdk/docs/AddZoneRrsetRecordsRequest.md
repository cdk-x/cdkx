# AddZoneRrsetRecordsRequest

## Properties

| Name        | Type                                           | Description                                                                                                                                                                                             | Notes                             |
| ----------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **ttl**     | **number**                                     | Time To Live (TTL) of the [RRSet](#tag/zone-rrsets). If not set, the [Zone\&#39;s](#tag/zones) Default TTL is used. If set, and the RRSet being updated already has a TTL, the values must be the same. | [optional] [default to undefined] |
| **records** | [**Array&lt;ModelRecord&gt;**](ModelRecord.md) | Records to add to the [RRSet](#tag/zone-rrsets). Must not be empty and must only contain distinct record values.                                                                                        | [default to undefined]            |

## Example

```typescript
import { AddZoneRrsetRecordsRequest } from '@cdk-x/hetzner-sdk';

const instance: AddZoneRrsetRecordsRequest = {
  ttl,
  records,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
