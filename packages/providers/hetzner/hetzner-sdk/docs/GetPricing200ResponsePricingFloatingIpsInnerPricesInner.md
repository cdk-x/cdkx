# GetPricing200ResponsePricingFloatingIpsInnerPricesInner

## Properties

| Name              | Type                                                                                                                                                                  | Description                                              | Notes                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------- |
| **location**      | **string**                                                                                                                                                            | Name of the [Location](#tag/locations) the price is for. | [default to undefined] |
| **price_monthly** | [**ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPriceMonthly**](ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPriceMonthly.md) |                                                          | [default to undefined] |

## Example

```typescript
import { GetPricing200ResponsePricingFloatingIpsInnerPricesInner } from '@cdk-x/hetzner-sdk';

const instance: GetPricing200ResponsePricingFloatingIpsInnerPricesInner = {
  location,
  price_monthly,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
