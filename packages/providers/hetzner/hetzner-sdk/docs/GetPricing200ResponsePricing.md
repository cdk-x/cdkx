# GetPricing200ResponsePricing

## Properties

| Name                    | Type                                                                                                                         | Description                                                                                                        | Notes                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **currency**            | **string**                                                                                                                   | Currency the returned prices are expressed in, coded according to [ISO 4217](https://wikipedia.org/wiki/ISO_4217). | [default to undefined] |
| **vat_rate**            | **string**                                                                                                                   | VAT rate used for calculating prices with VAT.                                                                     | [default to undefined] |
| **primary_ips**         | [**Array&lt;GetPricing200ResponsePricingPrimaryIpsInner&gt;**](GetPricing200ResponsePricingPrimaryIpsInner.md)               | Price of [Primary IPs](#tag/primary-ips) per type and per [Location](#tag/locations).                              | [default to undefined] |
| **floating_ips**        | [**Array&lt;GetPricing200ResponsePricingFloatingIpsInner&gt;**](GetPricing200ResponsePricingFloatingIpsInner.md)             | Price of [Floating IPs](#tag/floating-ips) per type and per [Location](#tag/locations).                            | [default to undefined] |
| **image**               | [**GetPricing200ResponsePricingImage**](GetPricing200ResponsePricingImage.md)                                                |                                                                                                                    | [default to undefined] |
| **volume**              | [**GetPricing200ResponsePricingVolume**](GetPricing200ResponsePricingVolume.md)                                              |                                                                                                                    | [default to undefined] |
| **server_backup**       | [**GetPricing200ResponsePricingServerBackup**](GetPricing200ResponsePricingServerBackup.md)                                  |                                                                                                                    | [default to undefined] |
| **server_types**        | [**Array&lt;GetPricing200ResponsePricingServerTypesInner&gt;**](GetPricing200ResponsePricingServerTypesInner.md)             | Price of Server per [type](#tag/server-types) and per [Location](#tag/locations).                                  | [default to undefined] |
| **load_balancer_types** | [**Array&lt;GetPricing200ResponsePricingLoadBalancerTypesInner&gt;**](GetPricing200ResponsePricingLoadBalancerTypesInner.md) | Price of Load Balancer per [type](#tag/load-balancer-types) and per [Location](#tag/locations).                    | [default to undefined] |
| **floating_ip**         | [**GetPricing200ResponsePricingFloatingIp**](GetPricing200ResponsePricingFloatingIp.md)                                      |                                                                                                                    | [default to undefined] |

## Example

```typescript
import { GetPricing200ResponsePricing } from '@cdk-x/hetzner-sdk';

const instance: GetPricing200ResponsePricing = {
  currency,
  vat_rate,
  primary_ips,
  floating_ips,
  image,
  volume,
  server_backup,
  server_types,
  load_balancer_types,
  floating_ip,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
