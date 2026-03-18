# FirewallsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                | HTTP request               | Description       |
| ------------------------------------- | -------------------------- | ----------------- |
| [**createFirewall**](#createfirewall) | **POST** /firewalls        | Create a Firewall |
| [**deleteFirewall**](#deletefirewall) | **DELETE** /firewalls/{id} | Delete a Firewall |
| [**getFirewall**](#getfirewall)       | **GET** /firewalls/{id}    | Get a Firewall    |
| [**listFirewalls**](#listfirewalls)   | **GET** /firewalls         | List Firewalls    |
| [**updateFirewall**](#updatefirewall) | **PUT** /firewalls/{id}    | Update a Firewall |

# **createFirewall**

> CreateFirewallResponse createFirewall(createFirewallRequest)

Create a [Firewall](#tag/firewalls). #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `server_already_added` | The [Server](#tag/servers) was applied more than once. | | `422` | `incompatible_network_type` | The resources network type is not supported by [Firewalls](#tag/firewalls). | | `422` | `firewall_resource_not_found` | The resource the [Firewall](#tag/firewalls) should be attached to was not found. |

### Example

```typescript
import {
  FirewallsApi,
  Configuration,
  CreateFirewallRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallsApi(configuration);

let createFirewallRequest: CreateFirewallRequest; //

const { status, data } = await apiInstance.createFirewall(
  createFirewallRequest,
);
```

### Parameters

| Name                      | Type                      | Description | Notes |
| ------------------------- | ------------------------- | ----------- | ----- |
| **createFirewallRequest** | **CreateFirewallRequest** |             |       |

### Return type

**CreateFirewallResponse**

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

# **deleteFirewall**

> deleteFirewall()

Deletes the [Firewall](#tag/firewalls). #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `resource_in_use` | [Firewall](#tag/firewalls) still applied to a resource |

### Example

```typescript
import { FirewallsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallsApi(configuration);

let id: number; //ID of the Firewall. (default to undefined)

const { status, data } = await apiInstance.deleteFirewall(id);
```

### Parameters

| Name   | Type         | Description         | Notes                 |
| ------ | ------------ | ------------------- | --------------------- |
| **id** | [**number**] | ID of the Firewall. | defaults to undefined |

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

# **getFirewall**

> FirewallResponse1 getFirewall()

Returns a single [Firewall](#tag/firewalls).

### Example

```typescript
import { FirewallsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallsApi(configuration);

let id: number; //ID of the Firewall. (default to undefined)

const { status, data } = await apiInstance.getFirewall(id);
```

### Parameters

| Name   | Type         | Description         | Notes                 |
| ------ | ------------ | ------------------- | --------------------- |
| **id** | [**number**] | ID of the Firewall. | defaults to undefined |

### Return type

**FirewallResponse1**

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

# **listFirewalls**

> FirewallsResponse listFirewalls()

Returns all [Firewalls](#tag/firewalls). Use the provided URI parameters to modify the result.

### Example

```typescript
import { FirewallsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallsApi(configuration);

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

const { status, data } = await apiInstance.listFirewalls(
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
| **sort**          | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;name&#39; &#124; &#39;name:asc&#39; &#124; &#39;name:desc&#39; &#124; &#39;created&#39; &#124; &#39;created:asc&#39; &#124; &#39;created:desc&#39;>** | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.                                              | (optional) defaults to undefined |
| **name**          | [**string**]                                                                                                                                                                                                                            | Filter resources by their name. The response will only contain the resources matching exactly the specified name.                                                                        | (optional) defaults to undefined |
| **labelSelector** | [**string**]                                                                                                                                                                                                                            | Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \&quot;[Label Selector](#description/label-selector)\&quot;. | (optional) defaults to undefined |
| **page**          | [**number**]                                                                                                                                                                                                                            | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                                                    | (optional) defaults to 1         |
| **perPage**       | [**number**]                                                                                                                                                                                                                            | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                              | (optional) defaults to 25        |

### Return type

**FirewallsResponse**

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

# **updateFirewall**

> FirewallResponse1 updateFirewall(updateFirewallRequest)

Update a [Firewall](#tag/firewalls). In case of a parallel running change on the [Firewall](#tag/firewalls) a `conflict` error will be returned.

### Example

```typescript
import {
  FirewallsApi,
  Configuration,
  UpdateFirewallRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new FirewallsApi(configuration);

let id: number; //ID of the Firewall. (default to undefined)
let updateFirewallRequest: UpdateFirewallRequest; //

const { status, data } = await apiInstance.updateFirewall(
  id,
  updateFirewallRequest,
);
```

### Parameters

| Name                      | Type                      | Description         | Notes                 |
| ------------------------- | ------------------------- | ------------------- | --------------------- |
| **updateFirewallRequest** | **UpdateFirewallRequest** |                     |                       |
| **id**                    | [**number**]              | ID of the Firewall. | defaults to undefined |

### Return type

**FirewallResponse1**

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
