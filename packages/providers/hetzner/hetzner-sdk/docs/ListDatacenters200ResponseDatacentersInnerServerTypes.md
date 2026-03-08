# ListDatacenters200ResponseDatacentersInnerServerTypes

[Server Types](#tag/server-types) supported and available in this [Data Center](#tag/data-centers). 

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**supported** | **Array&lt;number&gt;** | List of [Server Types](#tag/server-types) supported in this [Data Center](#tag/data-centers).  These [Server Types](#tag/server-types) are generally available in this Data Center, but might be temporarily out of stock.  | [default to undefined]
**available** | **Array&lt;number&gt;** | [Server Types](#tag/server-types) currently available in this [Data Center](#tag/data-centers).  These [Server Types](#tag/server-types) can currently be purchased. Types that are temporarily unavailable but are supported in this [Data Center](#tag/data-centers) are listed as &#x60;supported&#x60;.  | [default to undefined]
**available_for_migration** | **Array&lt;number&gt;** | [Server Types](#tag/server-types) available to migrate to in this [Data Center](#tag/data-centers).  Existing [Servers](#tag/servers) can be migrated to these [Server Types](#tag/server-types).  | [default to undefined]

## Example

```typescript
import { ListDatacenters200ResponseDatacentersInnerServerTypes } from '@cdkx-io/hetzner-sdk';

const instance: ListDatacenters200ResponseDatacentersInnerServerTypes = {
    supported,
    available,
    available_for_migration,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
