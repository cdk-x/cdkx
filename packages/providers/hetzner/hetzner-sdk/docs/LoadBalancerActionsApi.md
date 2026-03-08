# LoadBalancerActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**addLoadBalancerService**](#addloadbalancerservice) | **POST** /load_balancers/{id}/actions/add_service | Add Service|
|[**addLoadBalancerTarget**](#addloadbalancertarget) | **POST** /load_balancers/{id}/actions/add_target | Add Target|
|[**attachLoadBalancerToNetwork**](#attachloadbalancertonetwork) | **POST** /load_balancers/{id}/actions/attach_to_network | Attach a Load Balancer to a Network|
|[**changeLoadBalancerAlgorithm**](#changeloadbalanceralgorithm) | **POST** /load_balancers/{id}/actions/change_algorithm | Change Algorithm|
|[**changeLoadBalancerDnsPtr**](#changeloadbalancerdnsptr) | **POST** /load_balancers/{id}/actions/change_dns_ptr | Change reverse DNS entry for this Load Balancer|
|[**changeLoadBalancerProtection**](#changeloadbalancerprotection) | **POST** /load_balancers/{id}/actions/change_protection | Change Load Balancer Protection|
|[**changeLoadBalancerType**](#changeloadbalancertype) | **POST** /load_balancers/{id}/actions/change_type | Change the Type of a Load Balancer|
|[**deleteLoadBalancerService**](#deleteloadbalancerservice) | **POST** /load_balancers/{id}/actions/delete_service | Delete Service|
|[**detachLoadBalancerFromNetwork**](#detachloadbalancerfromnetwork) | **POST** /load_balancers/{id}/actions/detach_from_network | Detach a Load Balancer from a Network|
|[**disableLoadBalancerPublicInterface**](#disableloadbalancerpublicinterface) | **POST** /load_balancers/{id}/actions/disable_public_interface | Disable the public interface of a Load Balancer|
|[**enableLoadBalancerPublicInterface**](#enableloadbalancerpublicinterface) | **POST** /load_balancers/{id}/actions/enable_public_interface | Enable the public interface of a Load Balancer|
|[**getLoadBalancerAction**](#getloadbalanceraction) | **GET** /load_balancers/{id}/actions/{action_id} | Get an Action for a Load Balancer|
|[**getLoadBalancersAction**](#getloadbalancersaction) | **GET** /load_balancers/actions/{id} | Get an Action|
|[**listLoadBalancerActions**](#listloadbalanceractions) | **GET** /load_balancers/{id}/actions | List Actions for a Load Balancer|
|[**listLoadBalancersActions**](#listloadbalancersactions) | **GET** /load_balancers/actions | List Actions|
|[**removeLoadBalancerTarget**](#removeloadbalancertarget) | **POST** /load_balancers/{id}/actions/remove_target | Remove Target|
|[**updateLoadBalancerService**](#updateloadbalancerservice) | **POST** /load_balancers/{id}/actions/update_service | Update Service|

# **addLoadBalancerService**
> ActionResponse1 addLoadBalancerService(loadBalancerService)

Adds a service to a Load Balancer.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `412` | `source_port_already_used` | The source port you are trying to add is already in use | 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    LoadBalancerService
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let loadBalancerService: LoadBalancerService; //

const { status, data } = await apiInstance.addLoadBalancerService(
    id,
    loadBalancerService
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **loadBalancerService** | **LoadBalancerService**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

# **addLoadBalancerTarget**
> ActionResponse1 addLoadBalancerTarget(loadBalancerTarget1)

Adds a target to a Load Balancer.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `ip_not_in_vswitch_subnet` | The IP you are trying to add does not belong to the vswitch subnet of the attached network | | `422` | `ip_not_owned` | The IP you are trying to add as a target is not owned by the Project owner | | `422` | `load_balancer_public_interface_disabled` | The Load Balancer\'s public network interface is disabled | | `422` | `load_balancer_not_attached_to_network` | The Load Balancer is not attached to a network | | `422` | `network_has_no_vswitch_subnet` | The given IP is private but attached network does not have a vswitch subnet | | `422` | `resolve_cloud_private_targets_error` | The server you are trying to add as a target is not attached to the same network as the Load Balancer | | `422` | `resolve_cloud_public_targets_error` | The server that you are trying to add as a public target does not have a public IPv4 address | | `422` | `target_already_defined` | The Load Balancer target you are trying to define is already defined | 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    LoadBalancerTarget1
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let loadBalancerTarget1: LoadBalancerTarget1; //

const { status, data } = await apiInstance.addLoadBalancerTarget(
    id,
    loadBalancerTarget1
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **loadBalancerTarget1** | **LoadBalancerTarget1**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

# **attachLoadBalancerToNetwork**
> ActionResponse1 attachLoadBalancerToNetwork(attachLoadBalancerToNetworkRequest)

Attach a Load Balancer to a Network.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `load_balancer_already_attached` | The Load Balancer is already attached to a network | | `422` | `ip_not_available` | The provided Network IP is not available | | `422` | `no_subnet_available` | No Subnet or IP is available for the Load Balancer within the network | 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    AttachLoadBalancerToNetworkRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let attachLoadBalancerToNetworkRequest: AttachLoadBalancerToNetworkRequest; //

const { status, data } = await apiInstance.attachLoadBalancerToNetwork(
    id,
    attachLoadBalancerToNetworkRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **attachLoadBalancerToNetworkRequest** | **AttachLoadBalancerToNetworkRequest**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

# **changeLoadBalancerAlgorithm**
> ActionResponse1 changeLoadBalancerAlgorithm(changeLoadBalancerAlgorithmRequest)

Change the algorithm that determines to which target new requests are sent. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    ChangeLoadBalancerAlgorithmRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let changeLoadBalancerAlgorithmRequest: ChangeLoadBalancerAlgorithmRequest; //

const { status, data } = await apiInstance.changeLoadBalancerAlgorithm(
    id,
    changeLoadBalancerAlgorithmRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **changeLoadBalancerAlgorithmRequest** | **ChangeLoadBalancerAlgorithmRequest**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

# **changeLoadBalancerDnsPtr**
> ActionResponse1 changeLoadBalancerDnsPtr(changeLoadbalancerDnsPtrRequest)

Changes the hostname that will appear when getting the hostname belonging to the public IPs (IPv4 and IPv6) of this Load Balancer.  Floating IPs assigned to the Server are not affected by this. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    ChangeLoadbalancerDnsPtrRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let changeLoadbalancerDnsPtrRequest: ChangeLoadbalancerDnsPtrRequest; //Select the IP address for which to change the DNS entry by passing `ip`. It can be either IPv4 or IPv6. The target hostname is set by passing `dns_ptr`, which must be a fully qualified domain name (FQDN) without trailing dot.

const { status, data } = await apiInstance.changeLoadBalancerDnsPtr(
    id,
    changeLoadbalancerDnsPtrRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **changeLoadbalancerDnsPtrRequest** | **ChangeLoadbalancerDnsPtrRequest**| Select the IP address for which to change the DNS entry by passing &#x60;ip&#x60;. It can be either IPv4 or IPv6. The target hostname is set by passing &#x60;dns_ptr&#x60;, which must be a fully qualified domain name (FQDN) without trailing dot. | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

# **changeLoadBalancerProtection**
> ActionResponse1 changeLoadBalancerProtection(changeLoadBalancerProtectionRequest)

Changes the protection configuration of a Load Balancer. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    ChangeLoadBalancerProtectionRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let changeLoadBalancerProtectionRequest: ChangeLoadBalancerProtectionRequest; //

const { status, data } = await apiInstance.changeLoadBalancerProtection(
    id,
    changeLoadBalancerProtectionRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **changeLoadBalancerProtectionRequest** | **ChangeLoadBalancerProtectionRequest**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

# **changeLoadBalancerType**
> ActionResponse1 changeLoadBalancerType(changeTypeRequest)

Changes the type (Max Services, Max Targets and Max Connections) of a Load Balancer.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `invalid_load_balancer_type` | The Load Balancer type does not fit for the given Load Balancer | 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    ChangeTypeRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let changeTypeRequest: ChangeTypeRequest; //

const { status, data } = await apiInstance.changeLoadBalancerType(
    id,
    changeTypeRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **changeTypeRequest** | **ChangeTypeRequest**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

# **deleteLoadBalancerService**
> ActionResponse1 deleteLoadBalancerService(deleteLoadBalancerServiceRequest)

Delete a service of a Load Balancer. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    DeleteLoadBalancerServiceRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let deleteLoadBalancerServiceRequest: DeleteLoadBalancerServiceRequest; //

const { status, data } = await apiInstance.deleteLoadBalancerService(
    id,
    deleteLoadBalancerServiceRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **deleteLoadBalancerServiceRequest** | **DeleteLoadBalancerServiceRequest**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

# **detachLoadBalancerFromNetwork**
> ActionResponse1 detachLoadBalancerFromNetwork(detachLoadBalancerFromNetworkRequest)

Detaches a Load Balancer from a network. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    DetachLoadBalancerFromNetworkRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let detachLoadBalancerFromNetworkRequest: DetachLoadBalancerFromNetworkRequest; //

const { status, data } = await apiInstance.detachLoadBalancerFromNetwork(
    id,
    detachLoadBalancerFromNetworkRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **detachLoadBalancerFromNetworkRequest** | **DetachLoadBalancerFromNetworkRequest**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

# **disableLoadBalancerPublicInterface**
> ActionResponse1 disableLoadBalancerPublicInterface()

Disable the public interface of a Load Balancer. The Load Balancer will be not accessible from the internet via its public IPs.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `load_balancer_not_attached_to_network` | The Load Balancer is not attached to a network | | `422` | `targets_without_use_private_ip` | The Load Balancer has targets that use the public IP instead of the private IP | 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)

const { status, data } = await apiInstance.disableLoadBalancerPublicInterface(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Request succeeded. |  -  |
|**4xx** | Request failed with a user error. |  -  |
|**5xx** | Request failed with a server error. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **enableLoadBalancerPublicInterface**
> ActionResponse1 enableLoadBalancerPublicInterface()

Enable the public interface of a Load Balancer. The Load Balancer will be accessible from the internet via its public IPs. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)

const { status, data } = await apiInstance.enableLoadBalancerPublicInterface(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Request succeeded. |  -  |
|**4xx** | Request failed with a user error. |  -  |
|**5xx** | Request failed with a server error. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getLoadBalancerAction**
> ActionResponse getLoadBalancerAction()

Returns a specific Action for a Load Balancer. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let actionId: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getLoadBalancerAction(
    id,
    actionId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|
| **actionId** | [**number**] | ID of the Action. | defaults to undefined|


### Return type

**ActionResponse**

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

# **getLoadBalancersAction**
> ActionResponse getLoadBalancersAction()

Returns a specific Action object. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getLoadBalancersAction(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Action. | defaults to undefined|


### Return type

**ActionResponse**

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

# **listLoadBalancerActions**
> ActionListResponseWithMeta listLoadBalancerActions()

Returns all Action objects for a Load Balancer. You can sort the results by using the `sort` URI parameter, and filter them with the `status` parameter. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'command' | 'command:asc' | 'command:desc' | 'status' | 'status:asc' | 'status:desc' | 'started' | 'started:asc' | 'started:desc' | 'finished' | 'finished:asc' | 'finished:desc'>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listLoadBalancerActions(
    id,
    sort,
    status,
    page,
    perPage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|
| **sort** | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;command&#39; &#124; &#39;command:asc&#39; &#124; &#39;command:desc&#39; &#124; &#39;status&#39; &#124; &#39;status:asc&#39; &#124; &#39;status:desc&#39; &#124; &#39;started&#39; &#124; &#39;started:asc&#39; &#124; &#39;started:desc&#39; &#124; &#39;finished&#39; &#124; &#39;finished:asc&#39; &#124; &#39;finished:desc&#39;>** | Sort actions by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.  | (optional) defaults to undefined|
| **status** | **Array<&#39;running&#39; &#124; &#39;success&#39; &#124; &#39;error&#39;>** | Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  | (optional) defaults to undefined|
| **page** | [**number**] | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 1|
| **perPage** | [**number**] | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 25|


### Return type

**ActionListResponseWithMeta**

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

# **listLoadBalancersActions**
> ActionListResponseWithMeta listLoadBalancersActions()

Returns all Action objects. You can `sort` the results by using the sort URI parameter, and filter them with the `status` and `id` parameter. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: Array<number>; //Filter the actions by ID. Can be used multiple times. The response will only contain actions matching the specified IDs.  (optional) (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'command' | 'command:asc' | 'command:desc' | 'status' | 'status:asc' | 'status:desc' | 'started' | 'started:asc' | 'started:desc' | 'finished' | 'finished:asc' | 'finished:desc'>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listLoadBalancersActions(
    id,
    sort,
    status,
    page,
    perPage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | **Array&lt;number&gt;** | Filter the actions by ID. Can be used multiple times. The response will only contain actions matching the specified IDs.  | (optional) defaults to undefined|
| **sort** | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;command&#39; &#124; &#39;command:asc&#39; &#124; &#39;command:desc&#39; &#124; &#39;status&#39; &#124; &#39;status:asc&#39; &#124; &#39;status:desc&#39; &#124; &#39;started&#39; &#124; &#39;started:asc&#39; &#124; &#39;started:desc&#39; &#124; &#39;finished&#39; &#124; &#39;finished:asc&#39; &#124; &#39;finished:desc&#39;>** | Sort actions by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.  | (optional) defaults to undefined|
| **status** | **Array<&#39;running&#39; &#124; &#39;success&#39; &#124; &#39;error&#39;>** | Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  | (optional) defaults to undefined|
| **page** | [**number**] | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 1|
| **perPage** | [**number**] | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 25|


### Return type

**ActionListResponseWithMeta**

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

# **removeLoadBalancerTarget**
> ActionResponse1 removeLoadBalancerTarget(removeTargetRequest)

Removes a target from a Load Balancer. 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    RemoveTargetRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let removeTargetRequest: RemoveTargetRequest; //

const { status, data } = await apiInstance.removeLoadBalancerTarget(
    id,
    removeTargetRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **removeTargetRequest** | **RemoveTargetRequest**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

# **updateLoadBalancerService**
> ActionResponse1 updateLoadBalancerService(updateLoadBalancerService)

Updates a Load Balancer Service.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `source_port_already_used` | The source port you are trying to add is already in use | 

### Example

```typescript
import {
    LoadBalancerActionsApi,
    Configuration,
    UpdateLoadBalancerService
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new LoadBalancerActionsApi(configuration);

let id: number; //ID of the Load Balancer. (default to undefined)
let updateLoadBalancerService: UpdateLoadBalancerService; //

const { status, data } = await apiInstance.updateLoadBalancerService(
    id,
    updateLoadBalancerService
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateLoadBalancerService** | **UpdateLoadBalancerService**|  | |
| **id** | [**number**] | ID of the Load Balancer. | defaults to undefined|


### Return type

**ActionResponse1**

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

