# VolumeActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**attachVolume**](#attachvolume) | **POST** /volumes/{id}/actions/attach | Attach Volume to a Server|
|[**changeVolumeProtection**](#changevolumeprotection) | **POST** /volumes/{id}/actions/change_protection | Change Volume Protection|
|[**detachVolume**](#detachvolume) | **POST** /volumes/{id}/actions/detach | Detach Volume|
|[**getVolumeAction**](#getvolumeaction) | **GET** /volumes/{id}/actions/{action_id} | Get an Action for a Volume|
|[**getVolumesAction**](#getvolumesaction) | **GET** /volumes/actions/{id} | Get an Action|
|[**listVolumeActions**](#listvolumeactions) | **GET** /volumes/{id}/actions | List Actions for a Volume|
|[**listVolumesActions**](#listvolumesactions) | **GET** /volumes/actions | List Actions|
|[**resizeVolume**](#resizevolume) | **POST** /volumes/{id}/actions/resize | Resize Volume|

# **attachVolume**
> ActionResponse1 attachVolume(attachVolumeRequest)

Attaches a Volume to a Server. Works only if the Server is in the same Location as the Volume. 

### Example

```typescript
import {
    VolumeActionsApi,
    Configuration,
    AttachVolumeRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumeActionsApi(configuration);

let id: number; //ID of the Volume. (default to undefined)
let attachVolumeRequest: AttachVolumeRequest; //

const { status, data } = await apiInstance.attachVolume(
    id,
    attachVolumeRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **attachVolumeRequest** | **AttachVolumeRequest**|  | |
| **id** | [**number**] | ID of the Volume. | defaults to undefined|


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

# **changeVolumeProtection**
> ActionResponse1 changeVolumeProtection(changeVolumeProtectionRequest)

Changes the protection configuration of a Volume. 

### Example

```typescript
import {
    VolumeActionsApi,
    Configuration,
    ChangeVolumeProtectionRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumeActionsApi(configuration);

let id: number; //ID of the Volume. (default to undefined)
let changeVolumeProtectionRequest: ChangeVolumeProtectionRequest; //

const { status, data } = await apiInstance.changeVolumeProtection(
    id,
    changeVolumeProtectionRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **changeVolumeProtectionRequest** | **ChangeVolumeProtectionRequest**|  | |
| **id** | [**number**] | ID of the Volume. | defaults to undefined|


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

# **detachVolume**
> ActionResponse1 detachVolume()

Detaches a Volume from the Server it’s attached to. You may attach it to a Server again at a later time. 

### Example

```typescript
import {
    VolumeActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumeActionsApi(configuration);

let id: number; //ID of the Volume. (default to undefined)

const { status, data } = await apiInstance.detachVolume(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Volume. | defaults to undefined|


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

# **getVolumeAction**
> ActionResponse getVolumeAction()

Returns a specific Action for a Volume. 

### Example

```typescript
import {
    VolumeActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumeActionsApi(configuration);

let id: number; //ID of the Volume. (default to undefined)
let actionId: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getVolumeAction(
    id,
    actionId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Volume. | defaults to undefined|
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

# **getVolumesAction**
> ActionResponse getVolumesAction()

Returns a specific Action object. 

### Example

```typescript
import {
    VolumeActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumeActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getVolumesAction(
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

# **listVolumeActions**
> ActionListResponseWithMeta listVolumeActions()

Returns all Action objects for a Volume. You can `sort` the results by using the sort URI parameter, and filter them with the `status` parameter. 

### Example

```typescript
import {
    VolumeActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumeActionsApi(configuration);

let id: number; //ID of the Volume. (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'command' | 'command:asc' | 'command:desc' | 'status' | 'status:asc' | 'status:desc' | 'started' | 'started:asc' | 'started:desc' | 'finished' | 'finished:asc' | 'finished:desc'>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listVolumeActions(
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
| **id** | [**number**] | ID of the Volume. | defaults to undefined|
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

# **listVolumesActions**
> ActionListResponseWithMeta listVolumesActions()

Returns all Action objects. You can `sort` the results by using the sort URI parameter, and filter them with the `status` and `id` parameter. 

### Example

```typescript
import {
    VolumeActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumeActionsApi(configuration);

let id: Array<number>; //Filter the actions by ID. Can be used multiple times. The response will only contain actions matching the specified IDs.  (optional) (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'command' | 'command:asc' | 'command:desc' | 'status' | 'status:asc' | 'status:desc' | 'started' | 'started:asc' | 'started:desc' | 'finished' | 'finished:asc' | 'finished:desc'>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listVolumesActions(
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

# **resizeVolume**
> ActionResponse1 resizeVolume(resizeVolumeRequest)

Changes the size of a Volume. Note that downsizing a Volume is not possible. 

### Example

```typescript
import {
    VolumeActionsApi,
    Configuration,
    ResizeVolumeRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumeActionsApi(configuration);

let id: number; //ID of the Volume. (default to undefined)
let resizeVolumeRequest: ResizeVolumeRequest; //

const { status, data } = await apiInstance.resizeVolume(
    id,
    resizeVolumeRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **resizeVolumeRequest** | **ResizeVolumeRequest**|  | |
| **id** | [**number**] | ID of the Volume. | defaults to undefined|


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

