# ISOsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                    | HTTP request       | Description |
| ------------------------- | ------------------ | ----------- |
| [**getIso**](#getiso)     | **GET** /isos/{id} | Get an ISO  |
| [**listIsos**](#listisos) | **GET** /isos      | List ISOs   |

# **getIso**

> GetIso200Response getIso()

Returns a specific ISO object.

### Example

```typescript
import { ISOsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ISOsApi(configuration);

let id: number; //ID of the ISO. (default to undefined)

const { status, data } = await apiInstance.getIso(id);
```

### Parameters

| Name   | Type         | Description    | Notes                 |
| ------ | ------------ | -------------- | --------------------- |
| **id** | [**number**] | ID of the ISO. | defaults to undefined |

### Return type

**GetIso200Response**

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

# **listIsos**

> ListIsos200Response listIsos()

Returns all available ISO objects.

### Example

```typescript
import { ISOsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ISOsApi(configuration);

let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let architecture: 'x86' | 'arm'; //Filter resources by cpu architecture. The response will only contain the resources with the specified cpu architecture.  (optional) (default to undefined)
let includeArchitectureWildcard: boolean; //Include Images with wildcard architecture (architecture is null). Works only if architecture filter is specified. (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listIsos(
  name,
  architecture,
  includeArchitectureWildcard,
  page,
  perPage,
);
```

### Parameters

| Name                            | Type               | Description                                                                                                                 | Notes                                                                                                                   |
| ------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **name**                        | [**string**]       | Filter resources by their name. The response will only contain the resources matching exactly the specified name.           | (optional) defaults to undefined                                                                                        |
| **architecture**                | [\*\*&#39;x86&#39; | &#39;arm&#39;**]**Array<&#39;x86&#39; &#124; &#39;arm&#39;>\*\*                                                             | Filter resources by cpu architecture. The response will only contain the resources with the specified cpu architecture. | (optional) defaults to undefined |
| **includeArchitectureWildcard** | [**boolean**]      | Include Images with wildcard architecture (architecture is null). Works only if architecture filter is specified.           | (optional) defaults to undefined                                                                                        |
| **page**                        | [**number**]       | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                       | (optional) defaults to 1                                                                                                |
| **perPage**                     | [**number**]       | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 25                                                                                               |

### Return type

**ListIsos200Response**

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
