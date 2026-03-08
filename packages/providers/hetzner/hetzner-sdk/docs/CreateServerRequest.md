# CreateServerRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the Server to create (must be unique per Project and a valid hostname as per RFC 1123). | [default to undefined]
**location** | **string** | ID or name of the Location to create the Server in (must not be used together with &#x60;datacenter&#x60;). | [optional] [default to undefined]
**datacenter** | **string** | **Deprecated**: This property is deprecated and will be removed after the 1 July 2026. Use the &#x60;location&#x60; property instead.  ID or name of the Data Center to create Server in (must not be used together with &#x60;location&#x60;).  | [optional] [default to undefined]
**server_type** | **string** | ID or name of the Server type this Server should be created with. | [default to undefined]
**start_after_create** | **boolean** | This automatically triggers a [Power on a Server-Server Action](#tag/server-actions/poweron_server) after the creation is finished and is returned in the &#x60;next_actions&#x60; response object. | [optional] [default to true]
**image** | **string** | ID or name of the Image the Server is created from. | [default to undefined]
**placement_group** | **number** | ID of the Placement Group the Server should be in. | [optional] [default to undefined]
**ssh_keys** | **Array&lt;string&gt;** | SSH key IDs (&#x60;integer&#x60;) or names (&#x60;string&#x60;) which should be injected into the Server at creation time. | [optional] [default to undefined]
**volumes** | **Array&lt;number&gt;** | Volume IDs which should be attached to the Server at the creation time. Volumes must be in the same Location. | [optional] [default to undefined]
**networks** | **Array&lt;number&gt;** | Network IDs which should be attached to the Server private network interface at the creation time. | [optional] [default to undefined]
**firewalls** | [**Array&lt;CreateServerRequestFirewallsInner&gt;**](CreateServerRequestFirewallsInner.md) | Firewalls which should be applied on the Server\&#39;s public network interface at creation time. | [optional] [default to undefined]
**user_data** | **string** | Cloud-Init user data to use during Server creation. This field is limited to 32KiB. | [optional] [default to undefined]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [optional] [default to undefined]
**automount** | **boolean** | Auto-mount Volumes after attach. | [optional] [default to undefined]
**public_net** | [**CreateServerRequestPublicNet**](CreateServerRequestPublicNet.md) |  | [optional] [default to undefined]

## Example

```typescript
import { CreateServerRequest } from '@cdkx-io/hetzner-sdk';

const instance: CreateServerRequest = {
    name,
    location,
    datacenter,
    server_type,
    start_after_create,
    image,
    placement_group,
    ssh_keys,
    volumes,
    networks,
    firewalls,
    user_data,
    labels,
    automount,
    public_net,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
