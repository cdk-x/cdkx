# GetPricing200ResponsePricingServerTypesInner

## Properties

| Name       | Type                                                                                                                                                       | Description                                                                    | Notes                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------- |
| **id**     | **number**                                                                                                                                                 | ID of the [Server Types](#tag/server-types) the price is for.                  | [default to undefined] |
| **name**   | **string**                                                                                                                                                 | Name of the [Server Types](#tag/server-types) the price is for.                | [default to undefined] |
| **prices** | [**Array&lt;ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner&gt;**](ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner.md) | Price of the [Server Types](#tag/server-types) per [Location](#tag/locations). | [default to undefined] |

## Example

```typescript
import { GetPricing200ResponsePricingServerTypesInner } from '@cdk-x/hetzner-sdk';

const instance: GetPricing200ResponsePricingServerTypesInner = {
  id,
  name,
  prices,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
