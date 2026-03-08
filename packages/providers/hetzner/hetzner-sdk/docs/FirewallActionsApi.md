# FirewallActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**applyFirewallToResources**](#applyfirewalltoresources) | **POST** /firewalls/{id}/actions/apply_to_resources | Apply to Resources|
|[**getFirewallAction**](#getfirewallaction) | **GET** /firewalls/{id}/actions/{action_id} | Get an Action for a Firewall|
|[**getFirewallsAction**](#getfirewallsaction) | **GET** /firewalls/actions/{id} | Get an Action|
|[**listFirewallActions**](#listfirewallactions) | **GET** /firewalls/{id}/actions | List Actions for a Firewall|
|[**listFirewallsActions**](#listfirewallsactions) | **GET** /firewalls/actions | List Actions|
|[**removeFirewallFromResources**](#removefirewallfromresources) | **POST** /firewalls/{id}/actions/remove_from_resources | Remove from Resources|
|[**setFirewallRules**](#setfirewallrules) | **POST** /firewalls/{id}/actions/set_rules | Set Rules|

# **applyFirewallToResources**
> ActionListResponse applyFirewallToResources(applyToResourcesRequest)

Applies a [Firewall](#tag/firewalls) to multiple resources.  Supported resources: - [Servers](#tag/servers) (with a public network interface) - [Label Selectors](#description/label-selector)  A [Server](#tag/servers) can be applied to [a maximum of 5 Firewalls](https://docs.hetzner.com/cloud/firewalls/overview#limits). This limit applies to [Servers](#tag/servers) applied via a matching [Label Selector](#description/label-selector) as well.  Updates to resources matching or no longer matching a [Label Selector](#description/label-selector) can take up to a few seconds to be processed.  A [Firewall](#tag/firewalls) is applied to a resource once the related [Action](#tag/actions) with command `apply_firewall` successfully finished.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `404` | `firewall_resource_not_found` | The resource the [Firewall](#tag/firewalls) should be applied to was not found | | `422` | `firewall_already_applied` | [Firewall](#tag/firewalls) is already applied to resource | | `422` | `incompatible_network_type` | The network type of the resource is not supported by [Firewalls](#tag/firewalls) | | `422` | `private_net_only_server` | The [Server](#tag/servers) the [Firewall](#tag/firewalls) should be applied to has no public interface | 

### Example

```typescript
import {
    FirewallActionsApi,
    Configuration,
    ApplyToResourcesRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallActionsApi(configuration);

let id: number; //ID of the Firewall. (default to undefined)
let applyToResourcesRequest: ApplyToResourcesRequest; //

const { status, data } = await apiInstance.applyFirewallToResources(
    id,
    applyToResourcesRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **applyToResourcesRequest** | **ApplyToResourcesRequest**|  | |
| **id** | [**number**] | ID of the Firewall. | defaults to undefined|


### Return type

**ActionListResponse**

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

# **getFirewallAction**
> ActionResponse getFirewallAction()

Returns a specific [Action](#tag/actions) for a [Firewall](#tag/firewalls). 

### Example

```typescript
import {
    FirewallActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallActionsApi(configuration);

let id: number; //ID of the Firewall. (default to undefined)
let actionId: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getFirewallAction(
    id,
    actionId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Firewall. | defaults to undefined|
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

# **getFirewallsAction**
> ActionResponse getFirewallsAction()

Returns the specific [Action](#tag/actions). 

### Example

```typescript
import {
    FirewallActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getFirewallsAction(
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

# **listFirewallActions**
> ActionListResponseWithMeta listFirewallActions()

Returns all [Actions](#tag/actions) for the [Firewall](#tag/firewalls).  Use the provided URI parameters to modify the result. 

### Example

```typescript
import {
    FirewallActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallActionsApi(configuration);

let id: number; //ID of the Firewall. (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'command' | 'command:asc' | 'command:desc' | 'status' | 'status:asc' | 'status:desc' | 'started' | 'started:asc' | 'started:desc' | 'finished' | 'finished:asc' | 'finished:desc'>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listFirewallActions(
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
| **id** | [**number**] | ID of the Firewall. | defaults to undefined|
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

# **listFirewallsActions**
> ActionListResponseWithMeta listFirewallsActions()

Returns all [Actions](#tag/actions) for [Firewalls](#tag/firewalls).  Use the provided URI parameters to modify the result. 

### Example

```typescript
import {
    FirewallActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallActionsApi(configuration);

let id: Array<number>; //Filter the actions by ID. Can be used multiple times. The response will only contain actions matching the specified IDs.  (optional) (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'command' | 'command:asc' | 'command:desc' | 'status' | 'status:asc' | 'status:desc' | 'started' | 'started:asc' | 'started:desc' | 'finished' | 'finished:asc' | 'finished:desc'>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listFirewallsActions(
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

# **removeFirewallFromResources**
> ActionListResponse removeFirewallFromResources(removeFromResourcesRequest)

Removes a [Firewall](#tag/firewalls) from multiple resources.  Supported resources: - [Servers](#tag/servers) (with a public network interface)  A [Firewall](#tag/firewalls) is removed from a resource once the related [Action](#tag/actions) with command `remove_firewall` successfully finished.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `404` | `firewall_resource_not_found` | The resource the [Firewall](#tag/firewalls) should be removed from was not found | | `422` | `firewall_managed_by_label_selector` | [Firewall](#tag/firewall) is applied via a [Label Selector](#description/label-selector) and cannot be removed manually | 

### Example

```typescript
import {
    FirewallActionsApi,
    Configuration,
    RemoveFromResourcesRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallActionsApi(configuration);

let id: number; //ID of the Firewall. (default to undefined)
let removeFromResourcesRequest: RemoveFromResourcesRequest; //

const { status, data } = await apiInstance.removeFirewallFromResources(
    id,
    removeFromResourcesRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **removeFromResourcesRequest** | **RemoveFromResourcesRequest**|  | |
| **id** | [**number**] | ID of the Firewall. | defaults to undefined|


### Return type

**ActionListResponse**

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

# **setFirewallRules**
> ActionListResponse setFirewallRules(setRulesRequest)

Set the rules of a [Firewall](#tag/firewalls).  Overwrites the existing rules with the given ones. Pass an empty array to remove all rules.  Rules are limited to 50 entries per [Firewall](#tag/firewalls) and [500 effective rules](https://docs.hetzner.com/cloud/firewalls/overview#limits). 

### Example

```typescript
import {
    FirewallActionsApi,
    Configuration,
    SetRulesRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallActionsApi(configuration);

let id: number; //ID of the Firewall. (default to undefined)
let setRulesRequest: SetRulesRequest; //

const { status, data } = await apiInstance.setFirewallRules(
    id,
    setRulesRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **setRulesRequest** | **SetRulesRequest**|  | |
| **id** | [**number**] | ID of the Firewall. | defaults to undefined|


### Return type

**ActionListResponse**

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

