# FloatingIPsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                    | HTTP request                  | Description          |
| ----------------------------------------- | ----------------------------- | -------------------- |
| [**createFloatingIp**](#createfloatingip) | **POST** /floating_ips        | Create a Floating IP |
| [**deleteFloatingIp**](#deletefloatingip) | **DELETE** /floating_ips/{id} | Delete a Floating IP |
| [**getFloatingIp**](#getfloatingip)       | **GET** /floating_ips/{id}    | Get a Floating IP    |
| [**listFloatingIps**](#listfloatingips)   | **GET** /floating_ips         | List Floating IPs    |
| [**updateFloatingIp**](#updatefloatingip) | **PUT** /floating_ips/{id}    | Update a Floating IP |

# **createFloatingIp**

> CreateFloatingIp201Response createFloatingIp(floatingIPCreateRequest)

Create a [Floating IP](#tag/floating-ips). Provide the `server` attribute to assign the [Floating IP](#tag/floating-ips) to that server or provide a `home_location` to locate the [Floating IP](#tag/floating-ips) at. Note that the [Floating IP](#tag/floating-ips) can be assigned to a [Server](#tag/servers) in any [Location](#tag/locations) later on. For optimal routing it is advised to use the [Floating IP](#tag/floating-ips) in the same [Location](#tag/locations) it was created in.

### Example

```typescript
import {
  FloatingIPsApi,
  Configuration,
  FloatingIPCreateRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPsApi(configuration);

let floatingIPCreateRequest: FloatingIPCreateRequest; //The `type` argument is required while `home_location` and `server` are mutually exclusive.

const { status, data } = await apiInstance.createFloatingIp(
  floatingIPCreateRequest,
);
```

### Parameters

| Name                        | Type                        | Description                                                                                                              | Notes |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----- |
| **floatingIPCreateRequest** | **FloatingIPCreateRequest** | The &#x60;type&#x60; argument is required while &#x60;home_location&#x60; and &#x60;server&#x60; are mutually exclusive. |       |

### Return type

**CreateFloatingIp201Response**

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

# **deleteFloatingIp**

> deleteFloatingIp()

Deletes a [Floating IP](#tag/floating-ips). If assigned to a [Server](#tag/servers) the [Floating IP](#tag/floating-ips) will be unassigned automatically until 1 May 2026. After this date, the [Floating IP](#tag/floating-ips) needs to be unassigned before it can be deleted. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `must_be_unassigned` | Error when IP is still assigned to a Resource. This error will appear as of 1 May 2026. |

### Example

```typescript
import { FloatingIPsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPsApi(configuration);

let id: number; //ID of the Floating IP. (default to undefined)

const { status, data } = await apiInstance.deleteFloatingIp(id);
```

### Parameters

| Name   | Type         | Description            | Notes                 |
| ------ | ------------ | ---------------------- | --------------------- |
| **id** | [**number**] | ID of the Floating IP. | defaults to undefined |

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

# **getFloatingIp**

> GetFloatingIp200Response getFloatingIp()

Returns a single [Floating IP](#tag/floating-ips).

### Example

```typescript
import { FloatingIPsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPsApi(configuration);

let id: number; //ID of the Floating IP. (default to undefined)

const { status, data } = await apiInstance.getFloatingIp(id);
```

### Parameters

| Name   | Type         | Description            | Notes                 |
| ------ | ------------ | ---------------------- | --------------------- |
| **id** | [**number**] | ID of the Floating IP. | defaults to undefined |

### Return type

**GetFloatingIp200Response**

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

# **listFloatingIps**

> ListFloatingIps200Response listFloatingIps()

List multiple [Floating IPs](#tag/floating-ips). Use the provided URI parameters to modify the result.

### Example

```typescript
import { FloatingIPsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPsApi(configuration);

let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
let sort: Array<
  'id' | 'id:asc' | 'id:desc' | 'created' | 'created:asc' | 'created:desc'
>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listFloatingIps(
  name,
  labelSelector,
  sort,
  page,
  perPage,
);
```

### Parameters

| Name              | Type                                                                                                                                                         | Description                                                                                                                                                                              | Notes                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **name**          | [**string**]                                                                                                                                                 | Filter resources by their name. The response will only contain the resources matching exactly the specified name.                                                                        | (optional) defaults to undefined |
| **labelSelector** | [**string**]                                                                                                                                                 | Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \&quot;[Label Selector](#description/label-selector)\&quot;. | (optional) defaults to undefined |
| **sort**          | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;created&#39; &#124; &#39;created:asc&#39; &#124; &#39;created:desc&#39;>** | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.                                              | (optional) defaults to undefined |
| **page**          | [**number**]                                                                                                                                                 | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                                                    | (optional) defaults to 1         |
| **perPage**       | [**number**]                                                                                                                                                 | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                              | (optional) defaults to 25        |

### Return type

**ListFloatingIps200Response**

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

# **updateFloatingIp**

> GetFloatingIp200Response updateFloatingIp(floatingIPUpdateRequest)

Update a [Floating IP](#tag/floating-ips).

### Example

```typescript
import {
  FloatingIPsApi,
  Configuration,
  FloatingIPUpdateRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FloatingIPsApi(configuration);

let id: number; //ID of the Floating IP. (default to undefined)
let floatingIPUpdateRequest: FloatingIPUpdateRequest; //

const { status, data } = await apiInstance.updateFloatingIp(
  id,
  floatingIPUpdateRequest,
);
```

### Parameters

| Name                        | Type                        | Description            | Notes                 |
| --------------------------- | --------------------------- | ---------------------- | --------------------- |
| **floatingIPUpdateRequest** | **FloatingIPUpdateRequest** |                        |                       |
| **id**                      | [**number**]                | ID of the Floating IP. | defaults to undefined |

### Return type

**GetFloatingIp200Response**

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
