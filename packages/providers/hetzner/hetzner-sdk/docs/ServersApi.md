# ServersApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                    | HTTP request                  | Description              |
| ----------------------------------------- | ----------------------------- | ------------------------ |
| [**createServer**](#createserver)         | **POST** /servers             | Create a Server          |
| [**deleteServer**](#deleteserver)         | **DELETE** /servers/{id}      | Delete a Server          |
| [**getServer**](#getserver)               | **GET** /servers/{id}         | Get a Server             |
| [**getServerMetrics**](#getservermetrics) | **GET** /servers/{id}/metrics | Get Metrics for a Server |
| [**listServers**](#listservers)           | **GET** /servers              | List Servers             |
| [**updateServer**](#updateserver)         | **PUT** /servers/{id}         | Update a Server          |

# **createServer**

> CreateServerResponse createServer(createServerRequest)

Creates a new Server. Returns preliminary information about the Server as well as an Action that covers progress of creation. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `412` | `primary_ip_version_mismatch` | The specified Primary IP has the wrong IP Version | | `422` | `placement_error` | An error during the placement occurred | | `422` | `primary_ip_assigned` | The specified Primary IP is already assigned to a server | | `422` | `primary_ip_datacenter_mismatch` | he specified Primary IP is in a different datacenter |

### Example

```typescript
import {
  ServersApi,
  Configuration,
  CreateServerRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServersApi(configuration);

let createServerRequest: CreateServerRequest; //Please note that Server names must be unique per Project and valid hostnames as per RFC 1123 (i.e. may only contain letters, digits, periods, and dashes).  For `server_type` you can either use the ID as listed in `/server_types` or its name.  For `image` you can either use the ID as listed in `/images` or its name.  If you want to create the Server in a Location, you must set `location` to the ID or name as listed in `/locations`.  Some properties like `start_after_create` or `automount` will trigger Actions after the Server is created. Those Actions are listed in the `next_actions` field in the response.  For accessing your Server we strongly recommend to use SSH keys by passing the respective key IDs in `ssh_keys`. If you do not specify any `ssh_keys` we will generate a root password for you and return it in the response.  Please note that provided user-data is stored in our systems. While we take measures to protect it we highly recommend that you don’t use it to store passwords or other sensitive information.

const { status, data } = await apiInstance.createServer(createServerRequest);
```

### Parameters

| Name                    | Type                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Notes |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **createServerRequest** | **CreateServerRequest** | Please note that Server names must be unique per Project and valid hostnames as per RFC 1123 (i.e. may only contain letters, digits, periods, and dashes). For &#x60;server_type&#x60; you can either use the ID as listed in &#x60;/server_types&#x60; or its name. For &#x60;image&#x60; you can either use the ID as listed in &#x60;/images&#x60; or its name. If you want to create the Server in a Location, you must set &#x60;location&#x60; to the ID or name as listed in &#x60;/locations&#x60;. Some properties like &#x60;start_after_create&#x60; or &#x60;automount&#x60; will trigger Actions after the Server is created. Those Actions are listed in the &#x60;next_actions&#x60; field in the response. For accessing your Server we strongly recommend to use SSH keys by passing the respective key IDs in &#x60;ssh_keys&#x60;. If you do not specify any &#x60;ssh_keys&#x60; we will generate a root password for you and return it in the response. Please note that provided user-data is stored in our systems. While we take measures to protect it we highly recommend that you don’t use it to store passwords or other sensitive information. |       |

### Return type

**CreateServerResponse**

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

# **deleteServer**

> DeleteServer200Response deleteServer()

Deletes a Server. This immediately removes the Server from your account, and it is no longer accessible. Any resources attached to the server (like Volumes, Primary IPs, Floating IPs, Firewalls, Placement Groups) are detached while the server is deleted.

### Example

```typescript
import { ServersApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServersApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.deleteServer(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

### Return type

**DeleteServer200Response**

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

# **getServer**

> GetServer200Response getServer()

Returns a specific Server object. The Server must exist inside the Project.

### Example

```typescript
import { ServersApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServersApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.getServer(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

### Return type

**GetServer200Response**

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

# **getServerMetrics**

> GetLoadBalancerMetrics200Response getServerMetrics()

Get Metrics for specified Server. You must specify the type of metric to get: cpu, disk or network. You can also specify more than one type by comma separation, e.g. cpu,disk. Depending on the type you will get different time series data | Type | Timeseries | Unit | Description | |---------|-------------------------|-----------|------------------------------------------------------| | cpu | cpu | percent | Percent CPU usage | | disk | disk.0.iops.read | iop/s | Number of read IO operations per second | | | disk.0.iops.write | iop/s | Number of write IO operations per second | | | disk.0.bandwidth.read | bytes/s | Bytes read per second | | | disk.0.bandwidth.write | bytes/s | Bytes written per second | | network | network.0.pps.in | packets/s | Public Network interface packets per second received | | | network.0.pps.out | packets/s | Public Network interface packets per second sent | | | network.0.bandwidth.in | bytes/s | Public Network interface bytes/s received | | | network.0.bandwidth.out | bytes/s | Public Network interface bytes/s sent | Metrics are available for the last 30 days only. If you do not provide the step argument we will automatically adjust it so that a maximum of 200 samples are returned. We limit the number of samples returned to a maximum of 500 and will adjust the step parameter accordingly.

### Example

```typescript
import { ServersApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServersApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let type: Array<'cpu' | 'disk' | 'network'>; //Type of metrics to get. (default to undefined)
let start: string; //Start of period to get Metrics for (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). (default to undefined)
let end: string; //End of period to get Metrics for (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). (default to undefined)
let step: string; //Resolution of results in seconds. (optional) (default to undefined)

const { status, data } = await apiInstance.getServerMetrics(
  id,
  type,
  start,
  end,
  step,
);
```

### Parameters

| Name      | Type                                                                    | Description                                                                                                          | Notes                            |
| --------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **id**    | [**number**]                                                            | ID of the Server.                                                                                                    | defaults to undefined            |
| **type**  | **Array<&#39;cpu&#39; &#124; &#39;disk&#39; &#124; &#39;network&#39;>** | Type of metrics to get.                                                                                              | defaults to undefined            |
| **start** | [**string**]                                                            | Start of period to get Metrics for (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). | defaults to undefined            |
| **end**   | [**string**]                                                            | End of period to get Metrics for (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).   | defaults to undefined            |
| **step**  | [**string**]                                                            | Resolution of results in seconds.                                                                                    | (optional) defaults to undefined |

### Return type

**GetLoadBalancerMetrics200Response**

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

# **listServers**

> ListServers200Response listServers()

Returns all existing Server objects.

### Example

```typescript
import { ServersApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServersApi(configuration);

let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
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
let status: Array<
  | 'running'
  | 'initializing'
  | 'starting'
  | 'stopping'
  | 'off'
  | 'deleting'
  | 'migrating'
  | 'rebuilding'
  | 'unknown'
>; //Filter resources by status. Can be used multiple times. The response will only contain the resources with the specified status.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listServers(
  name,
  labelSelector,
  sort,
  status,
  page,
  perPage,
);
```

### Parameters

| Name              | Type                                                                                                                                                                                                                                          | Description                                                                                                                                                                              | Notes                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **name**          | [**string**]                                                                                                                                                                                                                                  | Filter resources by their name. The response will only contain the resources matching exactly the specified name.                                                                        | (optional) defaults to undefined |
| **labelSelector** | [**string**]                                                                                                                                                                                                                                  | Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \&quot;[Label Selector](#description/label-selector)\&quot;. | (optional) defaults to undefined |
| **sort**          | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;name&#39; &#124; &#39;name:asc&#39; &#124; &#39;name:desc&#39; &#124; &#39;created&#39; &#124; &#39;created:asc&#39; &#124; &#39;created:desc&#39;>**       | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.                                              | (optional) defaults to undefined |
| **status**        | **Array<&#39;running&#39; &#124; &#39;initializing&#39; &#124; &#39;starting&#39; &#124; &#39;stopping&#39; &#124; &#39;off&#39; &#124; &#39;deleting&#39; &#124; &#39;migrating&#39; &#124; &#39;rebuilding&#39; &#124; &#39;unknown&#39;>** | Filter resources by status. Can be used multiple times. The response will only contain the resources with the specified status.                                                          | (optional) defaults to undefined |
| **page**          | [**number**]                                                                                                                                                                                                                                  | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                                                    | (optional) defaults to 1         |
| **perPage**       | [**number**]                                                                                                                                                                                                                                  | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                              | (optional) defaults to 25        |

### Return type

**ListServers200Response**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                         | Response headers                                       |
| ----------- | ----------------------------------- | ------------------------------------------------------ |
| **200**     | Request succeeded.                  | \* x-next - A link to the next page of responses. <br> |
| **4xx**     | Request failed with a user error.   | -                                                      |
| **5xx**     | Request failed with a server error. | -                                                      |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateServer**

> GetServer200Response updateServer(updateServerRequest)

Updates a Server. You can update a Server’s name and a Server’s labels. Please note that Server names must be unique per Project and valid hostnames as per RFC 1123 (i.e. may only contain letters, digits, periods, and dashes).

### Example

```typescript
import {
  ServersApi,
  Configuration,
  UpdateServerRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServersApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let updateServerRequest: UpdateServerRequest; //

const { status, data } = await apiInstance.updateServer(
  id,
  updateServerRequest,
);
```

### Parameters

| Name                    | Type                    | Description       | Notes                 |
| ----------------------- | ----------------------- | ----------------- | --------------------- |
| **updateServerRequest** | **UpdateServerRequest** |                   |                       |
| **id**                  | [**number**]            | ID of the Server. | defaults to undefined |

### Return type

**GetServer200Response**

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
