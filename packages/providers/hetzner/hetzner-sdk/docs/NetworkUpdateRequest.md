# NetworkUpdateRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | New [Network](#tag/networks) name. | [optional] [default to undefined]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource.  Note that the set of [Labels](#description/labels) provided in the request will overwrite the existing one.  For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [optional] [default to undefined]
**expose_routes_to_vswitch** | **boolean** | Toggle to expose routes to the [Networks](#tag/networks) vSwitch.  Indicates if the routes from this [Network](#tag/networks) should be exposed to the vSwitch in this [Network](#tag/networks). Only takes effect if a [vSwitch is setup](https://docs.hetzner.com/cloud/networks/connect-dedi-vswitch) in this [Network](#tag/networks).  | [optional] [default to undefined]

## Example

```typescript
import { NetworkUpdateRequest } from '@cdkx-io/hetzner-sdk';

const instance: NetworkUpdateRequest = {
    name,
    labels,
    expose_routes_to_vswitch,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
