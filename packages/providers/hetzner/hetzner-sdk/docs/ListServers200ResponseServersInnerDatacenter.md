# ListServers200ResponseServersInnerDatacenter

**Deprecated**: This property is deprecated and will be removed after the 1 July 2026. Use the `location` property instead.  Data Center this Resource is located at. 

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ID of the [Data Center](#tag/data-centers). | [default to undefined]
**name** | **string** | Unique name for the [Data Center](#tag/data-centers).  Can be used as a more descriptive identifier.  | [default to undefined]
**description** | **string** | Descriptive name for the [Data Center](#tag/data-centers).  Desired to be easy to understand for humans. Might be changed for cosmetic reasons. Do not use this as an identifier.  | [default to undefined]
**location** | [**ListDatacenters200ResponseDatacentersInnerLocation**](ListDatacenters200ResponseDatacentersInnerLocation.md) |  | [default to undefined]
**server_types** | [**ListDatacenters200ResponseDatacentersInnerServerTypes**](ListDatacenters200ResponseDatacentersInnerServerTypes.md) |  | [default to undefined]

## Example

```typescript
import { ListServers200ResponseServersInnerDatacenter } from '@cdkx-io/hetzner-sdk';

const instance: ListServers200ResponseServersInnerDatacenter = {
    id,
    name,
    description,
    location,
    server_types,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
