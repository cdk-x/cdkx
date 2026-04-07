# GetPricing200ResponsePricingPrimaryIpsInner

## Properties

| Name       | Type                                                                                                                                 | Description                                                                      | Notes                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------- |
| **type**   | **string**                                                                                                                           | Type of [Primary IP](#tag/primary-ips) the price is for.                         | [default to undefined] |
| **prices** | [**Array&lt;GetPricing200ResponsePricingPrimaryIpsInnerPricesInner&gt;**](GetPricing200ResponsePricingPrimaryIpsInnerPricesInner.md) | Price of the [Primary IP](#tag/primary-ips) type per [Location](#tag/locations). | [default to undefined] |

## Example

```typescript
import { GetPricing200ResponsePricingPrimaryIpsInner } from '@cdk-x/hetzner-sdk';

const instance: GetPricing200ResponsePricingPrimaryIpsInner = {
  type,
  prices,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
