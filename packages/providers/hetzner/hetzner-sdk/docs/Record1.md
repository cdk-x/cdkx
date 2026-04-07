# Record1

Record of a [RRSet](#tag/zone-rrsets). The `value` is used to identify the record in an [RRSet](#tag/zone-rrsets).

## Properties

| Name        | Type       | Description                    | Notes                  |
| ----------- | ---------- | ------------------------------ | ---------------------- |
| **value**   | **string** | Value of the record to update. | [default to undefined] |
| **comment** | **string** | New comment for the record.    | [default to undefined] |

## Example

```typescript
import { Record1 } from '@cdk-x/hetzner-sdk';

const instance: Record1 = {
  value,
  comment,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
