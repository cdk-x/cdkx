# NetworksApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createNetwork**](#createnetwork) | **POST** /networks | Create a Network|
|[**deleteNetwork**](#deletenetwork) | **DELETE** /networks/{id} | Delete a Network|
|[**getNetwork**](#getnetwork) | **GET** /networks/{id} | Get a Network|
|[**listNetworks**](#listnetworks) | **GET** /networks | List Networks|
|[**updateNetwork**](#updatenetwork) | **PUT** /networks/{id} | Update a Network|

# **createNetwork**
> CreateNetwork201Response createNetwork(networkCreateRequest)

Creates a [Network](#tag/networks).  The provided `ip_range` can only be extended later on, but not reduced.  Subnets can be added now or later on using the [add subnet action](#tag/network-actions/add_network_subnet). If you do not specify an `ip_range` for the subnet the first available /24 range will be used.  Routes can be added now or later by using the [add route action](#tag/network-actions/add_network_route). 

### Example

```typescript
import {
    NetworksApi,
    Configuration,
    NetworkCreateRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworksApi(configuration);

let networkCreateRequest: NetworkCreateRequest; //

const { status, data } = await apiInstance.createNetwork(
    networkCreateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **networkCreateRequest** | **NetworkCreateRequest**|  | |


### Return type

**CreateNetwork201Response**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Request succeeded. |  -  |
|**4xx** | Request failed with a user error. |  -  |
|**5xx** | Request failed with a server error. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteNetwork**
> deleteNetwork()

Deletes a [Network](#tag/networks).  Attached resources will be detached automatically. 

### Example

```typescript
import {
    NetworksApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworksApi(configuration);

let id: number; //ID of the Network. (default to undefined)

const { status, data } = await apiInstance.deleteNetwork(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Network. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Request succeeded. |  -  |
|**4xx** | Request failed with a user error. |  -  |
|**5xx** | Request failed with a server error. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getNetwork**
> CreateNetwork201Response getNetwork()

Get a specific [Network](#tag/networks). 

### Example

```typescript
import {
    NetworksApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworksApi(configuration);

let id: number; //ID of the Network. (default to undefined)

const { status, data } = await apiInstance.getNetwork(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Network. | defaults to undefined|


### Return type

**CreateNetwork201Response**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Request succeeded. |  -  |
|**4xx** | Request failed with a user error. |  -  |
|**5xx** | Request failed with a server error. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listNetworks**
> ListNetworks200Response listNetworks()

List multiple [Networks](#tag/networks).  Use the provided URI parameters to modify the result. 

### Example

```typescript
import {
    NetworksApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworksApi(configuration);

let sort: Array<'id' | 'id:asc' | 'id:desc' | 'name' | 'name:asc' | 'name:desc' | 'created' | 'created:asc' | 'created:desc'>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listNetworks(
    sort,
    name,
    labelSelector,
    page,
    perPage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **sort** | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;name&#39; &#124; &#39;name:asc&#39; &#124; &#39;name:desc&#39; &#124; &#39;created&#39; &#124; &#39;created:asc&#39; &#124; &#39;created:desc&#39;>** | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.  | (optional) defaults to undefined|
| **name** | [**string**] | Filter resources by their name. The response will only contain the resources matching exactly the specified name.  | (optional) defaults to undefined|
| **labelSelector** | [**string**] | Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \&quot;[Label Selector](#description/label-selector)\&quot;.  | (optional) defaults to undefined|
| **page** | [**number**] | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 1|
| **perPage** | [**number**] | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 25|


### Return type

**ListNetworks200Response**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Request succeeded. |  -  |
|**4xx** | Request failed with a user error. |  -  |
|**5xx** | Request failed with a server error. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateNetwork**
> CreateNetwork201Response updateNetwork(networkUpdateRequest)

Update a [Network](#tag/networks).  If a change is currently being performed on this [Network](#tag/networks), a error response with code `conflict` will be returned. 

### Example

```typescript
import {
    NetworksApi,
    Configuration,
    NetworkUpdateRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworksApi(configuration);

let id: number; //ID of the Network. (default to undefined)
let networkUpdateRequest: NetworkUpdateRequest; //

const { status, data } = await apiInstance.updateNetwork(
    id,
    networkUpdateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **networkUpdateRequest** | **NetworkUpdateRequest**|  | |
| **id** | [**number**] | ID of the Network. | defaults to undefined|


### Return type

**CreateNetwork201Response**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Request succeeded. |  -  |
|**4xx** | Request failed with a user error. |  -  |
|**5xx** | Request failed with a server error. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

