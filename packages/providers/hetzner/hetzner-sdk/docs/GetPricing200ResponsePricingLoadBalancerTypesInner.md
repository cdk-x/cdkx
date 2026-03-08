# GetPricing200ResponsePricingLoadBalancerTypesInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ID of the [Load Balancer Types](#tag/load-balancer-types) the price is for. | [default to undefined]
**name** | **string** | Name of the [Load Balancer Types](#tag/load-balancer-types) the price is for. | [default to undefined]
**prices** | [**Array&lt;ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner&gt;**](ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner.md) | Price of the [Load Balancer Types](#tag/load-balancer-types) per [Location](#tag/locations). | [default to undefined]

## Example

```typescript
import { GetPricing200ResponsePricingLoadBalancerTypesInner } from '@cdkx-io/hetzner-sdk';

const instance: GetPricing200ResponsePricingLoadBalancerTypesInner = {
    id,
    name,
    prices,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
