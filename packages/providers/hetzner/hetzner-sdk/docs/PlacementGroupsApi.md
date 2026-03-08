# PlacementGroupsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createPlacementGroup**](#createplacementgroup) | **POST** /placement_groups | Create a PlacementGroup|
|[**deletePlacementGroup**](#deleteplacementgroup) | **DELETE** /placement_groups/{id} | Delete a PlacementGroup|
|[**getPlacementGroup**](#getplacementgroup) | **GET** /placement_groups/{id} | Get a PlacementGroup|
|[**listPlacementGroups**](#listplacementgroups) | **GET** /placement_groups | List Placement Groups|
|[**updatePlacementGroup**](#updateplacementgroup) | **PUT** /placement_groups/{id} | Update a PlacementGroup|

# **createPlacementGroup**
> CreatePlacementGroupResponse createPlacementGroup(createPlacementGroupRequest)

Creates a new Placement Group. 

### Example

```typescript
import {
    PlacementGroupsApi,
    Configuration,
    CreatePlacementGroupRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PlacementGroupsApi(configuration);

let createPlacementGroupRequest: CreatePlacementGroupRequest; //

const { status, data } = await apiInstance.createPlacementGroup(
    createPlacementGroupRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createPlacementGroupRequest** | **CreatePlacementGroupRequest**|  | |


### Return type

**CreatePlacementGroupResponse**

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

# **deletePlacementGroup**
> deletePlacementGroup()

Deletes a Placement Group. 

### Example

```typescript
import {
    PlacementGroupsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PlacementGroupsApi(configuration);

let id: number; //ID of the Placement Group. (default to undefined)

const { status, data } = await apiInstance.deletePlacementGroup(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Placement Group. | defaults to undefined|


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

# **getPlacementGroup**
> PlacementGroupResponse getPlacementGroup()

Gets a specific Placement Group object. 

### Example

```typescript
import {
    PlacementGroupsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PlacementGroupsApi(configuration);

let id: number; //ID of the Placement Group. (default to undefined)

const { status, data } = await apiInstance.getPlacementGroup(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Placement Group. | defaults to undefined|


### Return type

**PlacementGroupResponse**

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

# **listPlacementGroups**
> PlacementGroupsResponse listPlacementGroups()

Returns all Placement Group objects. 

### Example

```typescript
import {
    PlacementGroupsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PlacementGroupsApi(configuration);

let sort: Array<'id' | 'id:asc' | 'id:desc' | 'name' | 'name:asc' | 'name:desc' | 'created' | 'created:asc' | 'created:desc'>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
let type: Array<'spread'>; //Filter resources by type. Can be used multiple times. The response will only contain the resources with the specified type.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listPlacementGroups(
    sort,
    name,
    labelSelector,
    type,
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
| **type** | **Array<&#39;spread&#39;>** | Filter resources by type. Can be used multiple times. The response will only contain the resources with the specified type.  | (optional) defaults to undefined|
| **page** | [**number**] | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 1|
| **perPage** | [**number**] | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 25|


### Return type

**PlacementGroupsResponse**

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

# **updatePlacementGroup**
> PlacementGroupResponse updatePlacementGroup(updatePlacementGroupRequest)

Updates the Placement Group properties.  Note: if the Placement Group object changes during the request, the response will be a “conflict” error. 

### Example

```typescript
import {
    PlacementGroupsApi,
    Configuration,
    UpdatePlacementGroupRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PlacementGroupsApi(configuration);

let id: number; //ID of the Placement Group. (default to undefined)
let updatePlacementGroupRequest: UpdatePlacementGroupRequest; //

const { status, data } = await apiInstance.updatePlacementGroup(
    id,
    updatePlacementGroupRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updatePlacementGroupRequest** | **UpdatePlacementGroupRequest**|  | |
| **id** | [**number**] | ID of the Placement Group. | defaults to undefined|


### Return type

**PlacementGroupResponse**

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

