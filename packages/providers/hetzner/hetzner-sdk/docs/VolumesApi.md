# VolumesApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                            | HTTP request             | Description     |
| --------------------------------- | ------------------------ | --------------- |
| [**createVolume**](#createvolume) | **POST** /volumes        | Create a Volume |
| [**deleteVolume**](#deletevolume) | **DELETE** /volumes/{id} | Delete a Volume |
| [**getVolume**](#getvolume)       | **GET** /volumes/{id}    | Get a Volume    |
| [**listVolumes**](#listvolumes)   | **GET** /volumes         | List Volumes    |
| [**updateVolume**](#updatevolume) | **PUT** /volumes/{id}    | Update a Volume |

# **createVolume**

> CreateVolume201Response createVolume(createVolumeRequest)

Creates a new Volume attached to a Server. If you want to create a Volume that is not attached to a Server, you need to provide the `location` key instead of `server`. This can be either the ID or the name of the Location this Volume will be created in. Note that a Volume can be attached to a Server only in the same Location as the Volume itself. Specifying the Server during Volume creation will automatically attach the Volume to that Server after it has been initialized. In that case, the `next_actions` key in the response is an array which contains a single `attach_volume` action. The minimum Volume size is 10GB and the maximum size is 10TB (10240GB). A volume’s name can consist of alphanumeric characters, dashes, underscores, and dots, but has to start and end with an alphanumeric character. The total length is limited to 64 characters. Volume names must be unique per Project. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `no_space_left_in_location` | There is no volume space left in the given location |

### Example

```typescript
import {
  VolumesApi,
  Configuration,
  CreateVolumeRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumesApi(configuration);

let createVolumeRequest: CreateVolumeRequest; //

const { status, data } = await apiInstance.createVolume(createVolumeRequest);
```

### Parameters

| Name                    | Type                    | Description | Notes |
| ----------------------- | ----------------------- | ----------- | ----- |
| **createVolumeRequest** | **CreateVolumeRequest** |             |       |

### Return type

**CreateVolume201Response**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                         | Response headers |
| ----------- | ----------------------------------- | ---------------- |
| **201**     | Request succeeded.                  | -                |
| **4xx**     | Request failed with a user error.   | -                |
| **5xx**     | Request failed with a server error. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteVolume**

> deleteVolume()

Deletes a volume. All Volume data is irreversibly destroyed. The Volume must not be attached to a Server and it must not have delete protection enabled.

### Example

```typescript
import { VolumesApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumesApi(configuration);

let id: number; //ID of the Volume. (default to undefined)

const { status, data } = await apiInstance.deleteVolume(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Volume. | defaults to undefined |

### Return type

void (empty response body)

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                         | Response headers |
| ----------- | ----------------------------------- | ---------------- |
| **204**     | Request succeeded.                  | -                |
| **4xx**     | Request failed with a user error.   | -                |
| **5xx**     | Request failed with a server error. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getVolume**

> GetVolume200Response getVolume()

Gets a specific Volume object.

### Example

```typescript
import { VolumesApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumesApi(configuration);

let id: number; //ID of the Volume. (default to undefined)

const { status, data } = await apiInstance.getVolume(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Volume. | defaults to undefined |

### Return type

**GetVolume200Response**

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

# **listVolumes**

> ListVolumes200Response listVolumes()

Gets all existing Volumes that you have available.

### Example

```typescript
import { VolumesApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumesApi(configuration);

let status: Array<'available' | 'creating'>; //Filter resources by status. Can be used multiple times. The response will only contain the resources with the specified status.  (optional) (default to undefined)
let sort: Array<
  | 'id'
  | 'id:asc'
  | 'id:desc'
  | 'name'
  | 'name:asc'
  | 'name:desc'
  | 'created'
  | 'created:asc'
  | 'created:desc'
>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listVolumes(
  status,
  sort,
  name,
  labelSelector,
  page,
  perPage,
);
```

### Parameters

| Name              | Type                                                                                                                                                                                                                                    | Description                                                                                                                                                                              | Notes                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **status**        | **Array<&#39;available&#39; &#124; &#39;creating&#39;>**                                                                                                                                                                                | Filter resources by status. Can be used multiple times. The response will only contain the resources with the specified status.                                                          | (optional) defaults to undefined |
| **sort**          | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;name&#39; &#124; &#39;name:asc&#39; &#124; &#39;name:desc&#39; &#124; &#39;created&#39; &#124; &#39;created:asc&#39; &#124; &#39;created:desc&#39;>** | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.                                              | (optional) defaults to undefined |
| **name**          | [**string**]                                                                                                                                                                                                                            | Filter resources by their name. The response will only contain the resources matching exactly the specified name.                                                                        | (optional) defaults to undefined |
| **labelSelector** | [**string**]                                                                                                                                                                                                                            | Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \&quot;[Label Selector](#description/label-selector)\&quot;. | (optional) defaults to undefined |
| **page**          | [**number**]                                                                                                                                                                                                                            | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                                                    | (optional) defaults to 1         |
| **perPage**       | [**number**]                                                                                                                                                                                                                            | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                              | (optional) defaults to 25        |

### Return type

**ListVolumes200Response**

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

# **updateVolume**

> GetVolume200Response updateVolume(updateVolumeRequest)

Updates the Volume properties.

### Example

```typescript
import {
  VolumesApi,
  Configuration,
  UpdateVolumeRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new VolumesApi(configuration);

let id: number; //ID of the Volume. (default to undefined)
let updateVolumeRequest: UpdateVolumeRequest; //

const { status, data } = await apiInstance.updateVolume(
  id,
  updateVolumeRequest,
);
```

### Parameters

| Name                    | Type                    | Description       | Notes                 |
| ----------------------- | ----------------------- | ----------------- | --------------------- |
| **updateVolumeRequest** | **UpdateVolumeRequest** |                   |                       |
| **id**                  | [**number**]            | ID of the Volume. | defaults to undefined |

### Return type

**GetVolume200Response**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

### HTTP response details

| Status code | Description                         | Response headers |
| ----------- | ----------------------------------- | ---------------- |
| **200**     | Request succeeded.                  | -                |
| **4xx**     | Request failed with a user error.   | -                |
| **5xx**     | Request failed with a server error. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
