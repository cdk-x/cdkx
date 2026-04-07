# FirewallResponse

## Properties

| Name           | Type                                                                                 | Description                                                                                                                                | Notes                             |
| -------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **id**         | **number**                                                                           | ID of the [Firewall](#tag/firewalls).                                                                                                      | [default to undefined]            |
| **name**       | **string**                                                                           | Name of the [Firewall](#tag/firewalls). Limited to a maximum of 128 characters. Must be unique per Project.                                | [default to undefined]            |
| **labels**     | **{ [key: string]: string; }**                                                       | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [optional] [default to undefined] |
| **created**    | **string**                                                                           | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).              | [default to undefined]            |
| **rules**      | [**Array&lt;RuleResponse&gt;**](RuleResponse.md)                                     |                                                                                                                                            | [default to undefined]            |
| **applied_to** | [**Array&lt;FirewallResponseAppliedToInner&gt;**](FirewallResponseAppliedToInner.md) |                                                                                                                                            | [default to undefined]            |

## Example

```typescript
import { FirewallResponse } from '@cdk-x/hetzner-sdk';

const instance: FirewallResponse = {
  id,
  name,
  labels,
  created,
  rules,
  applied_to,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
