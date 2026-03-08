# ImagesApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**deleteImage**](#deleteimage) | **DELETE** /images/{id} | Delete an Image|
|[**getImage**](#getimage) | **GET** /images/{id} | Get an Image|
|[**listImages**](#listimages) | **GET** /images | List Images|
|[**updateImage**](#updateimage) | **PUT** /images/{id} | Update an Image|

# **deleteImage**
> deleteImage()

Deletes an Image. Only Images of type `snapshot` and `backup` can be deleted. 

### Example

```typescript
import {
    ImagesApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ImagesApi(configuration);

let id: number; //ID of the Image. (default to undefined)

const { status, data } = await apiInstance.deleteImage(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Image. | defaults to undefined|


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

# **getImage**
> GetImage200Response getImage()

Returns a specific Image object. 

### Example

```typescript
import {
    ImagesApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ImagesApi(configuration);

let id: number; //ID of the Image. (default to undefined)

const { status, data } = await apiInstance.getImage(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | ID of the Image. | defaults to undefined|


### Return type

**GetImage200Response**

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

# **listImages**
> ListImages200Response listImages()

Returns all Image objects. You can select specific Image types only and sort the results by using URI parameters. 

### Example

```typescript
import {
    ImagesApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ImagesApi(configuration);

let sort: Array<'id' | 'id:asc' | 'id:desc' | 'name' | 'name:asc' | 'name:desc' | 'created' | 'created:asc' | 'created:desc'>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let type: Array<'system' | 'app' | 'snapshot' | 'backup'>; //Filter resources by type. Can be used multiple times. The response will only contain the resources with the specified type.  (optional) (default to undefined)
let status: Array<'available' | 'creating' | 'unavailable'>; //Filter resources by status. Can be used multiple times. The response will only contain the resources with the specified status.  (optional) (default to undefined)
let boundTo: Array<string>; //Can be used multiple times. Server ID linked to the Image. Only available for Images of type `backup`. (optional) (default to undefined)
let includeDeprecated: boolean; //Can be used multiple times. (optional) (default to undefined)
let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
let architecture: 'x86' | 'arm'; //Filter resources by cpu architecture. The response will only contain the resources with the specified cpu architecture.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listImages(
    sort,
    type,
    status,
    boundTo,
    includeDeprecated,
    name,
    labelSelector,
    architecture,
    page,
    perPage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **sort** | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;name&#39; &#124; &#39;name:asc&#39; &#124; &#39;name:desc&#39; &#124; &#39;created&#39; &#124; &#39;created:asc&#39; &#124; &#39;created:desc&#39;>** | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.  | (optional) defaults to undefined|
| **type** | **Array<&#39;system&#39; &#124; &#39;app&#39; &#124; &#39;snapshot&#39; &#124; &#39;backup&#39;>** | Filter resources by type. Can be used multiple times. The response will only contain the resources with the specified type.  | (optional) defaults to undefined|
| **status** | **Array<&#39;available&#39; &#124; &#39;creating&#39; &#124; &#39;unavailable&#39;>** | Filter resources by status. Can be used multiple times. The response will only contain the resources with the specified status.  | (optional) defaults to undefined|
| **boundTo** | **Array&lt;string&gt;** | Can be used multiple times. Server ID linked to the Image. Only available for Images of type &#x60;backup&#x60;. | (optional) defaults to undefined|
| **includeDeprecated** | [**boolean**] | Can be used multiple times. | (optional) defaults to undefined|
| **name** | [**string**] | Filter resources by their name. The response will only contain the resources matching exactly the specified name.  | (optional) defaults to undefined|
| **labelSelector** | [**string**] | Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \&quot;[Label Selector](#description/label-selector)\&quot;.  | (optional) defaults to undefined|
| **architecture** | [**&#39;x86&#39; | &#39;arm&#39;**]**Array<&#39;x86&#39; &#124; &#39;arm&#39;>** | Filter resources by cpu architecture. The response will only contain the resources with the specified cpu architecture.  | (optional) defaults to undefined|
| **page** | [**number**] | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 1|
| **perPage** | [**number**] | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 25|


### Return type

**ListImages200Response**

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

# **updateImage**
> GetImage200Response updateImage(updateImageRequest)

Updates the Image. You may change the description, convert a Backup Image to a Snapshot Image or change the Image labels. Only Images of type `snapshot` and `backup` can be updated. 

### Example

```typescript
import {
    ImagesApi,
    Configuration,
    UpdateImageRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ImagesApi(configuration);

let id: number; //ID of the Image. (default to undefined)
let updateImageRequest: UpdateImageRequest; //

const { status, data } = await apiInstance.updateImage(
    id,
    updateImageRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateImageRequest** | **UpdateImageRequest**|  | |
| **id** | [**number**] | ID of the Image. | defaults to undefined|


### Return type

**GetImage200Response**

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

