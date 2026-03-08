# FloatingIPActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**assignFloatingIp**](#assignfloatingip) | **POST** /floating_ips/{id}/actions/assign | Assign a Floating IP to a Server|
|[**changeFloatingIpDnsPtr**](#changefloatingipdnsptr) | **POST** /floating_ips/{id}/actions/change_dns_ptr | Change reverse DNS records for a Floating IP|
|[**changeFloatingIpProtection**](#changefloatingipprotection) | **POST** /floating_ips/{id}/actions/change_protection | Change Floating IP Protection|
|[**getFloatingIpAction**](#getfloatingipaction) | **GET** /floating_ips/{id}/actions/{action_id} | Get an Action for a Floating IP|
|[**getFloatingIpsAction**](#getfloatingipsaction) | **GET** /floating_ips/actions/{id} | Get an Action|
|[**listFloatingIpActions**](#listfloatingipactions) | **GET** /floating_ips/{id}/actions | List Actions for a Floating IP|
|[**listFloatingIpsActions**](#listfloatingipsactions) | **GET** /floating_ips/actions | List Actions|
|[**unassignFloatingIp**](#unassignfloatingip) | **POST** /floating_ips/{id}/actions/unassign | Unassign a Floating IP|

# **assignFloatingIp**
> ActionResponse1 assignFloatingIp(floatingIPActionsAssignRequest)

Assigns a [Floating IP](#tag/floating-ips) to a [Server](#tag/servers).  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `floating_ip_assigned` | The [Floating IP](#tag/floating-ips) is already assigned | 

### Example

```typescript
import {
    FloatingIPActionsApi,
    Configuration,
    FloatingIPActionsAssignRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPActionsApi(configuration);

let id: number; //ID of the Floating IP. (default to undefined)
let floatingIPActionsAssignRequest: FloatingIPActionsAssignRequest; //

const { status, data } = await apiInstance.assignFloatingIp(
    id,
    floatingIPActionsAssignRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **floatingIPActionsAssignRequest** | **FloatingIPActionsAssignRequest**|  | |
| **id** | [**number**] | ID of the Floating IP. | defaults to undefined|


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

# **changeFloatingIpDnsPtr**
> ActionResponse1 changeFloatingIpDnsPtr(listFloatingIps200ResponseFloatingIpsInnerDnsPtrInner)

Change the reverse DNS records for this [Floating IP](#tag/floating-ips).  Allows to modify the PTR records set for the IP address. 

### Example

```typescript
import {
    FloatingIPActionsApi,
    Configuration,
    ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPActionsApi(configuration);

let id: number; //ID of the Floating IP. (default to undefined)
let listFloatingIps200ResponseFloatingIpsInnerDnsPtrInner: ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner; //The `ip` attributes specifies for which IP address the record is set. For IPv4 addresses this must be the exact address of the [Floating IP](#tag/floating-ips). For IPv6 addresses this must be a single address within the `/64` subnet of the [Floating IP](#tag/floating-ips).  The `dns_ptr` attribute specifies the hostname used for the IP address. Must be a fully qualified domain name (FQDN) without trailing dot.  For IPv6 [Floating IPs](#tag/floating-ips) up to 100 entries can be created. 

const { status, data } = await apiInstance.changeFloatingIpDnsPtr(
    id,
    listFloatingIps200ResponseFloatingIpsInnerDnsPtrInner
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **listFloatingIps200ResponseFloatingIpsInnerDnsPtrInner** | **ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner**| The &#x60;ip&#x60; attributes specifies for which IP address the record is set. For IPv4 addresses this must be the exact address of the [Floating IP](#tag/floating-ips). For IPv6 addresses this must be a single address within the &#x60;/64&#x60; subnet of the [Floating IP](#tag/floating-ips).  The &#x60;dns_ptr&#x60; attribute specifies the hostname used for the IP address. Must be a fully qualified domain name (FQDN) without trailing dot.  For IPv6 [Floating IPs](#tag/floating-ips) up to 100 entries can be created.  | |
| **id** | [**number**] | ID of the Floating IP. | defaults to undefined|


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

# **changeFloatingIpProtection**
> ActionResponse1 changeFloatingIpProtection(listFloatingIps200ResponseFloatingIpsInnerProtection)

Changes the protection settings configured for the [Floating IP](#tag/floating-ips). 

### Example

```typescript
import {
    FloatingIPActionsApi,
    Configuration,
    ListFloatingIps200ResponseFloatingIpsInnerProtection
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPActionsApi(configuration);

let id: number; //ID of the Floating IP. (default to undefined)
let listFloatingIps200ResponseFloatingIpsInnerProtection: ListFloatingIps200ResponseFloatingIpsInnerProtection; //

const { status, data } = await apiInstance.changeFloatingIpProtection(
    id,
    listFloatingIps200ResponseFloatingIpsInnerProtection
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **listFloatingIps200ResponseFloatingIpsInnerProtection** | **ListFloatingIps200ResponseFloatingIpsInnerProtection**|  | |
| **id** | [**number**] | ID of the Floating IP. | defaults to undefined|


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

# **getFloatingIpAction**
> ActionResponse getFloatingIpAction()

Returns a specific [Action](#tag/actions) for a [Floating IP](#tag/floating-ips). 

### Example

```typescript
import {
    FloatingIPActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPActionsApi(configuration);

let id: number; //ID of the Floating IP. (default to undefined)
let actionId: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getFloatingIpAction(
    id,
    actionId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Floating IP. | defaults to undefined|
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

# **getFloatingIpsAction**
> ActionResponse getFloatingIpsAction()

Returns a single [Action](#tag/actions). 

### Example

```typescript
import {
    FloatingIPActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getFloatingIpsAction(
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

# **listFloatingIpActions**
> ListFloatingIpActions200Response listFloatingIpActions()

Lists [Actions](#tag/actions) for a [Floating IP](#tag/floating-ips).  Use the provided URI parameters to modify the result. 

### Example

```typescript
import {
    FloatingIPActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPActionsApi(configuration);

let id: number; //ID of the Floating IP. (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'command' | 'command:asc' | 'command:desc' | 'status' | 'status:asc' | 'status:desc' | 'started' | 'started:asc' | 'started:desc' | 'finished' | 'finished:asc' | 'finished:desc'>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listFloatingIpActions(
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
| **id** | [**number**] | ID of the Floating IP. | defaults to undefined|
| **sort** | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;command&#39; &#124; &#39;command:asc&#39; &#124; &#39;command:desc&#39; &#124; &#39;status&#39; &#124; &#39;status:asc&#39; &#124; &#39;status:desc&#39; &#124; &#39;started&#39; &#124; &#39;started:asc&#39; &#124; &#39;started:desc&#39; &#124; &#39;finished&#39; &#124; &#39;finished:asc&#39; &#124; &#39;finished:desc&#39;>** | Sort actions by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.  | (optional) defaults to undefined|
| **status** | **Array<&#39;running&#39; &#124; &#39;success&#39; &#124; &#39;error&#39;>** | Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  | (optional) defaults to undefined|
| **page** | [**number**] | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 1|
| **perPage** | [**number**] | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 25|


### Return type

**ListFloatingIpActions200Response**

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

# **listFloatingIpsActions**
> ActionListResponseWithMeta listFloatingIpsActions()

Lists multiple [Actions](#tag/actions).  Use the provided URI parameters to modify the result. 

### Example

```typescript
import {
    FloatingIPActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPActionsApi(configuration);

let id: Array<number>; //Filter the actions by ID. Can be used multiple times. The response will only contain actions matching the specified IDs.  (optional) (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'command' | 'command:asc' | 'command:desc' | 'status' | 'status:asc' | 'status:desc' | 'started' | 'started:asc' | 'started:desc' | 'finished' | 'finished:asc' | 'finished:desc'>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listFloatingIpsActions(
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

# **unassignFloatingIp**
> ActionResponse1 unassignFloatingIp()

Unassigns a [Floating IP](#tag/floating-ips).  Results in the IP being unreachable. Can be assigned to another resource again. 

### Example

```typescript
import {
    FloatingIPActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPActionsApi(configuration);

let id: number; //ID of the Floating IP. (default to undefined)

const { status, data } = await apiInstance.unassignFloatingIp(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Floating IP. | defaults to undefined|


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

