# SetRulesRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**rules** | [**Array&lt;Rule&gt;**](Rule.md) | Array of rules.  Rules are limited to 50 entries per [Firewall](#tag/firewalls) and [500 effective rules](https://docs.hetzner.com/cloud/firewalls/overview#limits).  Existing rules will be replaced.  | [default to undefined]

## Example

```typescript
import { SetRulesRequest } from '@cdkx-io/hetzner-sdk';

const instance: SetRulesRequest = {
    rules,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
