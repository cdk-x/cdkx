# ListServers200ResponseServersInnerIso

ISO Image that is attached to this Server. Null if no ISO is attached.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ID of the [ISO](#tag/isos). | [default to undefined]
**name** | **string** | Unique identifier of the ISO. Only set for public ISOs. | [default to undefined]
**description** | **string** | Description of the ISO. | [default to undefined]
**type** | **string** | Type of the ISO. | [default to undefined]
**deprecation** | [**DeprecationInfo**](DeprecationInfo.md) |  | [default to undefined]
**architecture** | **string** | CPU architecture compatible with the ISO.  Null indicates no restriction on the architecture (wildcard).  | [default to undefined]

## Example

```typescript
import { ListServers200ResponseServersInnerIso } from '@cdkx-io/hetzner-sdk';

const instance: ListServers200ResponseServersInnerIso = {
    id,
    name,
    description,
    type,
    deprecation,
    architecture,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
