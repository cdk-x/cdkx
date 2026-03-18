# DataCentersApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                  | HTTP request              | Description       |
| --------------------------------------- | ------------------------- | ----------------- |
| [**getDatacenter**](#getdatacenter)     | **GET** /datacenters/{id} | Get a Data Center |
| [**listDatacenters**](#listdatacenters) | **GET** /datacenters      | List Data Centers |

# **getDatacenter**

> GetDatacenter200Response getDatacenter()

Returns a single [Data Center](#tag/data-centers).

### Example

```typescript
import { DataCentersApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new DataCentersApi(configuration);

let id: number; //ID of the Data Center. (default to undefined)

const { status, data } = await apiInstance.getDatacenter(id);
```

### Parameters

| Name   | Type         | Description            | Notes                 |
| ------ | ------------ | ---------------------- | --------------------- |
| **id** | [**number**] | ID of the Data Center. | defaults to undefined |

### Return type

**GetDatacenter200Response**

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

# **listDatacenters**

> ListDatacenters200Response listDatacenters()

Returns all [Data Centers](#tag/data-centers).

### Example

```typescript
import { DataCentersApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new DataCentersApi(configuration);

let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let sort: Array<
  'id' | 'id:asc' | 'id:desc' | 'name' | 'name:asc' | 'name:desc'
>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listDatacenters(
  name,
  sort,
  page,
  perPage,
);
```

### Parameters

| Name        | Type                                                                                                                                                | Description                                                                                                                                 | Notes                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **name**    | [**string**]                                                                                                                                        | Filter resources by their name. The response will only contain the resources matching exactly the specified name.                           | (optional) defaults to undefined |
| **sort**    | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;name&#39; &#124; &#39;name:asc&#39; &#124; &#39;name:desc&#39;>** | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;. | (optional) defaults to undefined |
| **page**    | [**number**]                                                                                                                                        | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                       | (optional) defaults to 1         |
| **perPage** | [**number**]                                                                                                                                        | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                 | (optional) defaults to 25        |

### Return type

**ListDatacenters200Response**

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
