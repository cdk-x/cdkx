# ActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                        | HTTP request          | Description          |
| ----------------------------- | --------------------- | -------------------- |
| [**getAction**](#getaction)   | **GET** /actions/{id} | Get an Action        |
| [**getActions**](#getactions) | **GET** /actions      | Get multiple Actions |

# **getAction**

> ActionResponse getAction()

Returns a specific Action object.

### Example

```typescript
import { ActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getAction(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Action. | defaults to undefined |

### Return type

**ActionResponse**

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

# **getActions**

> ActionListResponse getActions()

Returns multiple Action objects specified by the `id` parameter. **Note**: This endpoint previously allowed listing all actions in the project. This functionality was deprecated in July 2023 and removed on 30 January 2025. - Announcement: https://docs.hetzner.cloud/changelog#2023-07-20-actions-list-endpoint-is-deprecated - Removal: https://docs.hetzner.cloud/changelog#2025-01-30-listing-arbitrary-actions-in-the-actions-list-endpoint-is-removed

### Example

```typescript
import { ActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ActionsApi(configuration);

let id: Array<number>; //Filter the actions by ID. Can be used multiple times. The response will only contain actions matching the specified IDs.  (default to undefined)

const { status, data } = await apiInstance.getActions(id);
```

### Parameters

| Name   | Type                    | Description                                                                                                              | Notes                 |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| **id** | **Array&lt;number&gt;** | Filter the actions by ID. Can be used multiple times. The response will only contain actions matching the specified IDs. | defaults to undefined |

### Return type

**ActionListResponse**

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
