# CreateFirewallRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the [Firewall](#tag/firewalls).  Limited to a maximum of 128 characters.  Must be unique per Project.  | [default to undefined]
**labels** | **{ [key: string]: string; }** | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;.  | [optional] [default to undefined]
**rules** | [**Array&lt;Rule&gt;**](Rule.md) | Array of rules.  Rules are limited to 50 entries per [Firewall](#tag/firewalls) and [500 effective rules](https://docs.hetzner.com/cloud/firewalls/overview#limits).  | [optional] [default to undefined]
**apply_to** | [**Array&lt;FirewallResource&gt;**](FirewallResource.md) | Resources to apply the [Firewall](#tag/firewalls) to.  Resources added directly are taking precedence over those added via a [Label Selector](#description/label-selector).  | [optional] [default to undefined]

## Example

```typescript
import { CreateFirewallRequest } from '@cdkx-io/hetzner-sdk';

const instance: CreateFirewallRequest = {
    name,
    labels,
    rules,
    apply_to,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
