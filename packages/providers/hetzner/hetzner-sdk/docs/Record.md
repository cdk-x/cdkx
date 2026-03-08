# ModelRecord

Record of a [RRSet](#tag/zone-rrsets).  The `value` is used to identify the record in an [RRSet](#tag/zone-rrsets). 

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**value** | **string** | Value of the record.  For details about accepted values, see the [DNS record types documentation](https://docs.hetzner.com/networking/dns/record-types/overview/).  | [default to undefined]
**comment** | **string** | Comment of the record. | [optional] [default to undefined]

## Example

```typescript
import { ModelRecord } from '@cdkx-io/hetzner-sdk';

const instance: ModelRecord = {
    value,
    comment,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
