# ListMetaPagination

See \"[Pagination](#description/pagination)\" for more information.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**page** | **number** | Current page number. | [default to undefined]
**per_page** | **number** | Maximum number of entries returned per page. | [default to undefined]
**previous_page** | **number** | Page number of the previous page. Can be null if the current page is the first one. | [default to undefined]
**next_page** | **number** | Page number of the next page. Can be null if the current page is the last one. | [default to undefined]
**last_page** | **number** | Page number of the last page available. Can be null if the current page is the last one. | [default to undefined]
**total_entries** | **number** | Total number of entries that exist for this query. Can be null if unknown. | [default to undefined]

## Example

```typescript
import { ListMetaPagination } from '@cdkx-io/hetzner-sdk';

const instance: ListMetaPagination = {
    page,
    per_page,
    previous_page,
    next_page,
    last_page,
    total_entries,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
