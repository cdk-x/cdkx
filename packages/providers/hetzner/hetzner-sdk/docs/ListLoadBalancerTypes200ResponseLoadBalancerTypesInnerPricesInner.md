# ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner

## Properties

| Name                     | Type                                                                                                                                                                            | Description                                                         | Notes                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------- |
| **location**             | **string**                                                                                                                                                                      | Name of the [Location](#tag/locations) the price is for.            | [default to undefined] |
| **price_hourly**         | [**ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPriceHourly**](ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPriceHourly.md)             |                                                                     | [default to undefined] |
| **price_monthly**        | [**ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPriceMonthly**](ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPriceMonthly.md)           |                                                                     | [default to undefined] |
| **included_traffic**     | **number**                                                                                                                                                                      | Free traffic per month in bytes in this [Location](#tag/locations). | [default to undefined] |
| **price_per_tb_traffic** | [**ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPricePerTbTraffic**](ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPricePerTbTraffic.md) |                                                                     | [default to undefined] |

## Example

```typescript
import { ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner } from '@cdk-x/hetzner-sdk';

const instance: ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner =
  {
    location,
    price_hourly,
    price_monthly,
    included_traffic,
    price_per_tb_traffic,
  };
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
