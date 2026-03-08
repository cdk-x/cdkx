# PrimaryIPCreateRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the Resource. Must be unique per Project. | [default to undefined]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [optional] [default to undefined]
**type** | **string** | [Primary IP](#tag/primary-ips) type. | [default to undefined]
**datacenter** | **string** | **Deprecated**: This property is deprecated and will be removed after 1 July 2026. Use the &#x60;location&#x60; key instead.  [Data Center](#tag/data-centers) ID or name.  The [Primary IP](#tag/primary-ips) will be bound to this [Data Center](#tag/data-centers). Omit if &#x60;assignee_id&#x60;/&#x60;assignee_type&#x60; or &#x60;location&#x60; are provided.  | [optional] [default to undefined]
**location** | **string** | [Location](#tag/locations) ID or name the [Primary IP](#tag/primary-ips) will be bound to.  Omit if &#x60;assignee_id&#x60;/&#x60;assignee_type&#x60; or &#x60;datacenter&#x60; are provided.  | [optional] [default to undefined]
**assignee_type** | **string** | Type of resource the [Primary IP](#tag/primary-ips) can get assigned to.  Currently [Primary IPs](#tag/primary-ips) can only be assigned to [Servers](#tag/servers), therefore this field must be set to &#x60;server&#x60;.  | [default to undefined]
**assignee_id** | **number** | ID of resource to assign the [Primary IP](#tag/primary-ips) to.  Omitted if the [Primary IP](#tag/primary-ips) should not get assigned.  | [optional] [default to undefined]
**auto_delete** | **boolean** | Auto deletion state.  If enabled the [Primary IP](#tag/primary-ips) will be deleted once the assigned resource gets deleted.  | [optional] [default to false]

## Example

```typescript
import { PrimaryIPCreateRequest } from '@cdkx-io/hetzner-sdk';

const instance: PrimaryIPCreateRequest = {
    name,
    labels,
    type,
    datacenter,
    location,
    assignee_type,
    assignee_id,
    auto_delete,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
