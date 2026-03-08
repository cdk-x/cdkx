# GetPricing200ResponsePricingFloatingIpsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** | Type of [Floating IP](#tag/floating-ips) the price is for. | [default to undefined]
**prices** | [**Array&lt;GetPricing200ResponsePricingFloatingIpsInnerPricesInner&gt;**](GetPricing200ResponsePricingFloatingIpsInnerPricesInner.md) | Price of the [Floating IP](#tag/floating-ips) type per [Location](#tag/locations). | [default to undefined]

## Example

```typescript
import { GetPricing200ResponsePricingFloatingIpsInner } from '@cdkx-io/hetzner-sdk';

const instance: GetPricing200ResponsePricingFloatingIpsInner = {
    type,
    prices,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
