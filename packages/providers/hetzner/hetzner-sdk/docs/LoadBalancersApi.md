# LoadBalancersApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createLoadBalancer**](#createloadbalancer) | **POST** /load_balancers | Create a Load Balancer|
|[**deleteLoadBalancer**](#deleteloadbalancer) | **DELETE** /load_balancers/{id} | Delete a Load Balancer|
|[**getLoadBalancer**](#getloadbalancer) | **GET** /load_balancers/{id} | Get a Load Balancer|
|[**getLoadBalancerMetrics**](#getloadbalancermetrics) | **GET** /load_balancers/{id}/metrics | Get Metrics for a LoadBalancer|
|[**listLoadBalancers**](#listloadbalancers) | **GET** /load_balancers | List Load Balancers|
|[**updateLoadBalancer**](#updateloadbalancer) | **PUT** /load_balancers/{id} | Update a Load Balancer|

# **createLoadBalancer**
> CreateLoadBalancer201Response createLoadBalancer(createLoadBalancerRequest)

Creates a Load Balancer.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `412` | `source_port_already_used` | The source port you are trying to add is already in use | | `422` | `ip_not_owned` | The IP is not owned by the owner of the project of the Load Balancer | | `422` | `load_balancer_not_attached_to_network` | The Load Balancer is not attached to a network | | `422` | `resolve_cloud_private_targets_error` | The server you are trying to add as a target is not attached to the same network as the Load Balancer | | `422` | `resolve_cloud_public_targets_error` | The server that you are trying to add as a public target does not have a public IPv4 address | | `422` | `target_already_defined` | The Load Balancer target you are trying to define is already defined | 

### Example

```typescript
import {
    LoadBalancersApi,
    Configuration,
    CreateLoadBalancerRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancersApi(configuration);

let createLoadBalancerRequest: CreateLoadBalancerRequest; //

const { status, data } = await apiInstance.createLoadBalancer(
    createLoadBalancerRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createLoadBalancerRequest** | **CreateLoadBalancerRequest**|  | |


### Return type

**CreateLoadBalancer201Response**

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

# **deleteLoadBalancer**
> deleteLoadBalancer()

Deletes a Load Balancer. 

### Example

```typescript
import {
    LoadBalancersApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancersApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)

const { status, data } = await apiInstance.deleteLoadBalancer(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


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

# **getLoadBalancer**
> GetLoadBalancer200Response getLoadBalancer()

Gets a specific Load Balancer object. 

### Example

```typescript
import {
    LoadBalancersApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancersApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)

const { status, data } = await apiInstance.getLoadBalancer(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**GetLoadBalancer200Response**

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

# **getLoadBalancerMetrics**
> GetLoadBalancerMetrics200Response getLoadBalancerMetrics()

You must specify the type of metric to get: `open_connections`, `connections_per_second`, `requests_per_second` or `bandwidth`. You can also specify more than one type by comma separation, e.g. `requests_per_second,bandwidth`.  Depending on the type you will get different time series data:  |Type | Timeseries | Unit | Description | |---- |------------|------|-------------| | open_connections | open_connections | number | Open connections | | connections_per_second | connections_per_second | connections/s | Connections per second | | requests_per_second | requests_per_second | requests/s | Requests per second | | bandwidth | bandwidth.in | bytes/s | Ingress bandwidth | || bandwidth.out | bytes/s | Egress bandwidth |  Metrics are available for the last 30 days only.  If you do not provide the step argument we will automatically adjust it so that 200 samples are returned.  We limit the number of samples to a maximum of 500 and will adjust the step parameter accordingly. 

### Example

```typescript
import {
    LoadBalancersApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancersApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let type: Array<'open_connections' | 'connections_per_second' | 'requests_per_second' | 'bandwidth'>; //Type of metrics to get. (default to undefined)
let start: string; //Start of period to get Metrics for (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). (default to undefined)
let end: string; //End of period to get Metrics for (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). (default to undefined)
let step: string; //Resolution of results in seconds. (optional) (default to undefined)

const { status, data } = await apiInstance.getLoadBalancerMetrics(
    id,
    type,
    start,
    end,
    step
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|
| **type** | **Array<&#39;open_connections&#39; &#124; &#39;connections_per_second&#39; &#124; &#39;requests_per_second&#39; &#124; &#39;bandwidth&#39;>** | Type of metrics to get. | defaults to undefined|
| **start** | [**string**] | Start of period to get Metrics for (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). | defaults to undefined|
| **end** | [**string**] | End of period to get Metrics for (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). | defaults to undefined|
| **step** | [**string**] | Resolution of results in seconds. | (optional) defaults to undefined|


### Return type

**GetLoadBalancerMetrics200Response**

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

# **listLoadBalancers**
> ListLoadBalancers200Response listLoadBalancers()

Gets all existing Load Balancers that you have available. 

### Example

```typescript
import {
    LoadBalancersApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancersApi(configuration);

let sort: Array<'id' | 'id:asc' | 'id:desc' | 'name' | 'name:asc' | 'name:desc' | 'created' | 'created:asc' | 'created:desc'>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listLoadBalancers(
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

**ListLoadBalancers200Response**

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

# **updateLoadBalancer**
> GetLoadBalancer200Response updateLoadBalancer(updateLoadBalancerRequest)

Updates a Load Balancer. You can update a Load Balancer’s name and a Load Balancer’s labels.  Note: if the Load Balancer object changes during the request, the response will be a “conflict” error. 

### Example

```typescript
import {
    LoadBalancersApi,
    Configuration,
    UpdateLoadBalancerRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancersApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let updateLoadBalancerRequest: UpdateLoadBalancerRequest; //

const { status, data } = await apiInstance.updateLoadBalancer(
    id,
    updateLoadBalancerRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateLoadBalancerRequest** | **UpdateLoadBalancerRequest**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**GetLoadBalancer200Response**

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

