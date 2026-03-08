# PrimaryIPsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                  | HTTP request                 | Description         |
| --------------------------------------- | ---------------------------- | ------------------- |
| [**createPrimaryIp**](#createprimaryip) | **POST** /primary_ips        | Create a Primary IP |
| [**deletePrimaryIp**](#deleteprimaryip) | **DELETE** /primary_ips/{id} | Delete a Primary IP |
| [**getPrimaryIp**](#getprimaryip)       | **GET** /primary_ips/{id}    | Get a Primary IP    |
| [**listPrimaryIps**](#listprimaryips)   | **GET** /primary_ips         | List Primary IPs    |
| [**updatePrimaryIp**](#updateprimaryip) | **PUT** /primary_ips/{id}    | Update a Primary IP |

# **createPrimaryIp**

> CreatePrimaryIPResponse createPrimaryIp(primaryIPCreateRequest)

Create a new [Primary IP](#tag/primary-ips). Can optionally be assigned to a resource by providing an `assignee_id` and `assignee_type`. If not assigned to a resource the `location` key needs to be provided. This can be either the ID or the name of the [Location](#tag/locations) this [Primary IP](#tag/primary-ips) shall be created in. A [Primary IP](#tag/primary-ips) can only be assigned to resource in the same [Location](#tag/locations) later on. The `datacenter` key is deprecated in favor of `location` and will be removed after 01 July 2026. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `server_not_stopped` | The specified [Server](#tag/servers) is running, but needs to be powered off | | `422` | `server_has_ipv4` | The [Server](#tag/servers) already has an ipv4 address | | `422` | `server_has_ipv6` | The [Server](#tag/servers) already has an ipv6 address |

### Example

```typescript
import {
  PrimaryIPsApi,
  Configuration,
  PrimaryIPCreateRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPsApi(configuration);

let primaryIPCreateRequest: PrimaryIPCreateRequest; //Request Body for creating a new [Primary IP](#tag/primary-ips).  The `location`, `datacenter` and `assignee_id`/`assignee_type` attributes are mutually exclusive.

const { status, data } = await apiInstance.createPrimaryIp(
  primaryIPCreateRequest,
);
```

### Parameters

| Name                       | Type                       | Description                                                                                                                                                                                               | Notes |
| -------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| **primaryIPCreateRequest** | **PrimaryIPCreateRequest** | Request Body for creating a new [Primary IP](#tag/primary-ips). The &#x60;location&#x60;, &#x60;datacenter&#x60; and &#x60;assignee_id&#x60;/&#x60;assignee_type&#x60; attributes are mutually exclusive. |       |

### Return type

**CreatePrimaryIPResponse**

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

# **deletePrimaryIp**

> deletePrimaryIp()

Deletes a [Primary IP](#tag/primary-ips). The [Server](#tag/servers) must be powered off (status `off`) in order for this operation to succeed. If assigned to a [Server](#tag/servers) the [Primary IP](#tag/primary-ips) will be unassigned automatically until 1 May 2026. After this date, the [Primary IP](#tag/primary-ips) needs to be unassigned before it can be deleted. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `must_be_unassigned` | Error when IP is still assigned to a Resource. This error will appear as of 1 May 2026. |

### Example

```typescript
import { PrimaryIPsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPsApi(configuration);

let id: number; //ID of the Primary IP. (default to undefined)

const { status, data } = await apiInstance.deletePrimaryIp(id);
```

### Parameters

| Name   | Type         | Description           | Notes                 |
| ------ | ------------ | --------------------- | --------------------- |
| **id** | [**number**] | ID of the Primary IP. | defaults to undefined |

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

# **getPrimaryIp**

> PrimaryIPResponse getPrimaryIp()

Returns a [Primary IP](#tag/primary-ips).

### Example

```typescript
import { PrimaryIPsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPsApi(configuration);

let id: number; //ID of the Primary IP. (default to undefined)

const { status, data } = await apiInstance.getPrimaryIp(id);
```

### Parameters

| Name   | Type         | Description           | Notes                 |
| ------ | ------------ | --------------------- | --------------------- |
| **id** | [**number**] | ID of the Primary IP. | defaults to undefined |

### Return type

**PrimaryIPResponse**

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

# **listPrimaryIps**

> PrimaryIPsResponse listPrimaryIps()

List multiple [Primary IPs](#tag/primary-ips). Use the provided URI parameters to modify the result.

### Example

```typescript
import { PrimaryIPsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPsApi(configuration);

let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
let ip: string; //Filter results by IP address. (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)
let sort: Array<
  'id' | 'id:asc' | 'id:desc' | 'created' | 'created:asc' | 'created:desc'
>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)

const { status, data } = await apiInstance.listPrimaryIps(
  name,
  labelSelector,
  ip,
  page,
  perPage,
  sort,
);
```

### Parameters

| Name              | Type                                                                                                                                                         | Description                                                                                                                                                                              | Notes                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **name**          | [**string**]                                                                                                                                                 | Filter resources by their name. The response will only contain the resources matching exactly the specified name.                                                                        | (optional) defaults to undefined |
| **labelSelector** | [**string**]                                                                                                                                                 | Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \&quot;[Label Selector](#description/label-selector)\&quot;. | (optional) defaults to undefined |
| **ip**            | [**string**]                                                                                                                                                 | Filter results by IP address.                                                                                                                                                            | (optional) defaults to undefined |
| **page**          | [**number**]                                                                                                                                                 | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                                                    | (optional) defaults to 1         |
| **perPage**       | [**number**]                                                                                                                                                 | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                              | (optional) defaults to 25        |
| **sort**          | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;created&#39; &#124; &#39;created:asc&#39; &#124; &#39;created:desc&#39;>** | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.                                              | (optional) defaults to undefined |

### Return type

**PrimaryIPsResponse**

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

# **updatePrimaryIp**

> PrimaryIPResponse updatePrimaryIp(primaryIPUpdateRequest)

Update a [Primary IP](#tag/primary-ips). If another change is concurrently performed on this [Primary IP](#tag/primary-ips), a error response with code `conflict` will be returned.

### Example

```typescript
import {
  PrimaryIPsApi,
  Configuration,
  PrimaryIPUpdateRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPsApi(configuration);

let id: number; //ID of the Primary IP. (default to undefined)
let primaryIPUpdateRequest: PrimaryIPUpdateRequest; //

const { status, data } = await apiInstance.updatePrimaryIp(
  id,
  primaryIPUpdateRequest,
);
```

### Parameters

| Name                       | Type                       | Description           | Notes                 |
| -------------------------- | -------------------------- | --------------------- | --------------------- |
| **primaryIPUpdateRequest** | **PrimaryIPUpdateRequest** |                       |                       |
| **id**                     | [**number**]               | ID of the Primary IP. | defaults to undefined |

### Return type

**PrimaryIPResponse**

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
