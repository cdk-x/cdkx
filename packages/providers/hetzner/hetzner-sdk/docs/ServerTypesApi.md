# ServerTypesApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                  | HTTP request               | Description       |
| --------------------------------------- | -------------------------- | ----------------- |
| [**getServerType**](#getservertype)     | **GET** /server_types/{id} | Get a Server Type |
| [**listServerTypes**](#listservertypes) | **GET** /server_types      | List Server Types |

# **getServerType**

> GetServerType200Response getServerType()

Gets a specific Server type object.

### Example

```typescript
import { ServerTypesApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerTypesApi(configuration);

let id: number; //ID of the Server Type. (default to undefined)

const { status, data } = await apiInstance.getServerType(id);
```

### Parameters

| Name   | Type         | Description            | Notes                 |
| ------ | ------------ | ---------------------- | --------------------- |
| **id** | [**number**] | ID of the Server Type. | defaults to undefined |

### Return type

**GetServerType200Response**

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

# **listServerTypes**

> ListServerTypes200Response listServerTypes()

Gets all Server type objects.

### Example

```typescript
import { ServerTypesApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerTypesApi(configuration);

let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listServerTypes(name, page, perPage);
```

### Parameters

| Name        | Type         | Description                                                                                                                 | Notes                            |
| ----------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **name**    | [**string**] | Filter resources by their name. The response will only contain the resources matching exactly the specified name.           | (optional) defaults to undefined |
| **page**    | [**number**] | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                       | (optional) defaults to 1         |
| **perPage** | [**number**] | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 25        |

### Return type

**ListServerTypes200Response**

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
