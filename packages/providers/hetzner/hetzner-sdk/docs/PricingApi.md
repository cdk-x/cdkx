# PricingApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                        | HTTP request     | Description    |
| ----------------------------- | ---------------- | -------------- |
| [**getPricing**](#getpricing) | **GET** /pricing | Get all prices |

# **getPricing**

> GetPricing200Response getPricing()

Returns prices for all resources available on the platform. VAT and currency of the Project owner are used for calculations. Both net and gross prices are included in the response.

### Example

```typescript
import { PricingApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PricingApi(configuration);

const { status, data } = await apiInstance.getPricing();
```

### Parameters

This endpoint does not have any parameters.

### Return type

**GetPricing200Response**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                         | Response headers |
| ----------- | ----------------------------------- | ---------------- |
| **200**     | Request succeeded.                  | -                |
| **4xx**     | Request failed with a user error.   | -                |
| **5xx**     | Request failed with a server error. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
