# PrimaryIPActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                                      | HTTP request                                         | Description                                 |
| ----------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| [**assignPrimaryIp**](#assignprimaryip)                     | **POST** /primary_ips/{id}/actions/assign            | Assign a Primary IP to a resource           |
| [**changePrimaryIpDnsPtr**](#changeprimaryipdnsptr)         | **POST** /primary_ips/{id}/actions/change_dns_ptr    | Change reverse DNS records for a Primary IP |
| [**changePrimaryIpProtection**](#changeprimaryipprotection) | **POST** /primary_ips/{id}/actions/change_protection | Change Primary IP Protection                |
| [**getPrimaryIpAction**](#getprimaryipaction)               | **GET** /primary_ips/{id}/actions/{action_id}        | Get an Action for a Primary IP              |
| [**getPrimaryIpsAction**](#getprimaryipsaction)             | **GET** /primary_ips/actions/{id}                    | Get an Action                               |
| [**listPrimaryIpActions**](#listprimaryipactions)           | **GET** /primary_ips/{id}/actions                    | List Actions for a Primary IP               |
| [**listPrimaryIpsActions**](#listprimaryipsactions)         | **GET** /primary_ips/actions                         | List Actions                                |
| [**unassignPrimaryIp**](#unassignprimaryip)                 | **POST** /primary_ips/{id}/actions/unassign          | Unassign a Primary IP from a resource       |

# **assignPrimaryIp**

> ActionResponse1 assignPrimaryIp(primaryIPActionsAssignRequest)

Assign a [Primary IP](#tag/primary-ips) to a resource. A [Server](#tag/servers) can only have one [Primary IP](#tag/primary-ips) of type `ipv4` and one of type `ipv6` assigned. If you need more IPs use [Floating IPs](#tag/floating-ips). A [Server](#tag/servers) must be powered off (status `off`) in order for this operation to succeed. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `server_not_stopped` | The [Server](#tag/servers) is running, but needs to be powered off | | `422` | `primary_ip_already_assigned` | [Primary IP](#tag/primary-ips) is already assigned to a different [Server](#tag/servers) | | `422` | `server_has_ipv4` | The [Server](#tag/servers) already has an IPv4 address | | `422` | `server_has_ipv6` | The [Server](#tag/servers) already has an IPv6 address |

### Example

```typescript
import {
  PrimaryIPActionsApi,
  Configuration,
  PrimaryIPActionsAssignRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPActionsApi(configuration);

let id: number; //ID of the Primary IP. (default to undefined)
let primaryIPActionsAssignRequest: PrimaryIPActionsAssignRequest; //

const { status, data } = await apiInstance.assignPrimaryIp(
  id,
  primaryIPActionsAssignRequest,
);
```

### Parameters

| Name                              | Type                              | Description           | Notes                 |
| --------------------------------- | --------------------------------- | --------------------- | --------------------- |
| **primaryIPActionsAssignRequest** | **PrimaryIPActionsAssignRequest** |                       |                       |
| **id**                            | [**number**]                      | ID of the Primary IP. | defaults to undefined |

### Return type

**ActionResponse1**

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

# **changePrimaryIpDnsPtr**

> ActionResponse1 changePrimaryIpDnsPtr(listFloatingIps200ResponseFloatingIpsInnerDnsPtrInner)

Change the reverse DNS records for this [Primary IP](#tag/primary-ips). Allows to modify the PTR records set for the IP address.

### Example

```typescript
import {
  PrimaryIPActionsApi,
  Configuration,
  ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPActionsApi(configuration);

let id: number; //ID of the Primary IP. (default to undefined)
let listFloatingIps200ResponseFloatingIpsInnerDnsPtrInner: ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner; //The `ip` attributes specifies for which IP address the record is set. For IPv4 addresses this must be the exact address of the [Primary IP](#tag/primary-ips). For IPv6 addresses this must be a single address within the `/64` subnet of the [Primary IP](#tag/primary-ips).  The `dns_ptr` attribute specifies the hostname used for the IP address. Must be a fully qualified domain name (FQDN) without trailing dot.  For IPv6 [Primary IPs](#tag/primary-ips) up to 100 entries can be created.

const { status, data } = await apiInstance.changePrimaryIpDnsPtr(
  id,
  listFloatingIps200ResponseFloatingIpsInnerDnsPtrInner,
);
```

### Parameters

| Name                                                      | Type                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Notes                 |
| --------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **listFloatingIps200ResponseFloatingIpsInnerDnsPtrInner** | **ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner** | The &#x60;ip&#x60; attributes specifies for which IP address the record is set. For IPv4 addresses this must be the exact address of the [Primary IP](#tag/primary-ips). For IPv6 addresses this must be a single address within the &#x60;/64&#x60; subnet of the [Primary IP](#tag/primary-ips). The &#x60;dns_ptr&#x60; attribute specifies the hostname used for the IP address. Must be a fully qualified domain name (FQDN) without trailing dot. For IPv6 [Primary IPs](#tag/primary-ips) up to 100 entries can be created. |                       |
| **id**                                                    | [**number**]                                              | ID of the Primary IP.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | defaults to undefined |

### Return type

**ActionResponse1**

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

# **changePrimaryIpProtection**

> ActionResponse1 changePrimaryIpProtection(listFloatingIps200ResponseFloatingIpsInnerProtection)

Changes the protection configuration of a [Primary IP](#tag/primary-ips). A [Primary IPs](#tag/primary-ips) deletion protection can only be enabled if its `auto_delete` property is set to `false`.

### Example

```typescript
import {
  PrimaryIPActionsApi,
  Configuration,
  ListFloatingIps200ResponseFloatingIpsInnerProtection,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPActionsApi(configuration);

let id: number; //ID of the Primary IP. (default to undefined)
let listFloatingIps200ResponseFloatingIpsInnerProtection: ListFloatingIps200ResponseFloatingIpsInnerProtection; //

const { status, data } = await apiInstance.changePrimaryIpProtection(
  id,
  listFloatingIps200ResponseFloatingIpsInnerProtection,
);
```

### Parameters

| Name                                                     | Type                                                     | Description           | Notes                 |
| -------------------------------------------------------- | -------------------------------------------------------- | --------------------- | --------------------- |
| **listFloatingIps200ResponseFloatingIpsInnerProtection** | **ListFloatingIps200ResponseFloatingIpsInnerProtection** |                       |                       |
| **id**                                                   | [**number**]                                             | ID of the Primary IP. | defaults to undefined |

### Return type

**ActionResponse1**

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

# **getPrimaryIpAction**

> ActionResponse getPrimaryIpAction()

Returns a specific [Action](#tag/actions) for a [Primary IP](#tag/primary-ips).

### Example

```typescript
import { PrimaryIPActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPActionsApi(configuration);

let id: number; //ID of the Primary IP. (default to undefined)
let actionId: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getPrimaryIpAction(id, actionId);
```

### Parameters

| Name         | Type         | Description           | Notes                 |
| ------------ | ------------ | --------------------- | --------------------- |
| **id**       | [**number**] | ID of the Primary IP. | defaults to undefined |
| **actionId** | [**number**] | ID of the Action.     | defaults to undefined |

### Return type

**ActionResponse**

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

# **getPrimaryIpsAction**

> ActionResponse getPrimaryIpsAction()

Returns a single [Action](#tag/actions).

### Example

```typescript
import { PrimaryIPActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getPrimaryIpsAction(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Action. | defaults to undefined |

### Return type

**ActionResponse**

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

# **listPrimaryIpActions**

> ActionListResponseWithMeta listPrimaryIpActions()

Returns all [Actions](#tag/actions) for a [Primary IP](#tag/primary-ips). Use the provided URI parameters to modify the result.

### Example

```typescript
import { PrimaryIPActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPActionsApi(configuration);

let id: number; //ID of the Primary IP. (default to undefined)
let sort: Array<
  | 'id'
  | 'id:asc'
  | 'id:desc'
  | 'command'
  | 'command:asc'
  | 'command:desc'
  | 'status'
  | 'status:asc'
  | 'status:desc'
  | 'started'
  | 'started:asc'
  | 'started:desc'
  | 'finished'
  | 'finished:asc'
  | 'finished:desc'
>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listPrimaryIpActions(
  id,
  sort,
  status,
  page,
  perPage,
);
```

### Parameters

| Name        | Type                                                                                                                                                                                                                                                                                                                                                                                                                     | Description                                                                                                                               | Notes                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **id**      | [**number**]                                                                                                                                                                                                                                                                                                                                                                                                             | ID of the Primary IP.                                                                                                                     | defaults to undefined            |
| **sort**    | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;command&#39; &#124; &#39;command:asc&#39; &#124; &#39;command:desc&#39; &#124; &#39;status&#39; &#124; &#39;status:asc&#39; &#124; &#39;status:desc&#39; &#124; &#39;started&#39; &#124; &#39;started:asc&#39; &#124; &#39;started:desc&#39; &#124; &#39;finished&#39; &#124; &#39;finished:asc&#39; &#124; &#39;finished:desc&#39;>** | Sort actions by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;. | (optional) defaults to undefined |
| **status**  | **Array<&#39;running&#39; &#124; &#39;success&#39; &#124; &#39;error&#39;>**                                                                                                                                                                                                                                                                                                                                             | Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.         | (optional) defaults to undefined |
| **page**    | [**number**]                                                                                                                                                                                                                                                                                                                                                                                                             | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                     | (optional) defaults to 1         |
| **perPage** | [**number**]                                                                                                                                                                                                                                                                                                                                                                                                             | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.               | (optional) defaults to 25        |

### Return type

**ActionListResponseWithMeta**

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

# **listPrimaryIpsActions**

> ActionListResponseWithMeta listPrimaryIpsActions()

Lists multiple [Actions](#tag/actions). Use the provided URI parameters to modify the result.

### Example

```typescript
import { PrimaryIPActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPActionsApi(configuration);

let id: Array<number>; //Filter the actions by ID. Can be used multiple times. The response will only contain actions matching the specified IDs.  (optional) (default to undefined)
let sort: Array<
  | 'id'
  | 'id:asc'
  | 'id:desc'
  | 'command'
  | 'command:asc'
  | 'command:desc'
  | 'status'
  | 'status:asc'
  | 'status:desc'
  | 'started'
  | 'started:asc'
  | 'started:desc'
  | 'finished'
  | 'finished:asc'
  | 'finished:desc'
>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listPrimaryIpsActions(
  id,
  sort,
  status,
  page,
  perPage,
);
```

### Parameters

| Name        | Type                                                                                                                                                                                                                                                                                                                                                                                                                     | Description                                                                                                                               | Notes                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **id**      | **Array&lt;number&gt;**                                                                                                                                                                                                                                                                                                                                                                                                  | Filter the actions by ID. Can be used multiple times. The response will only contain actions matching the specified IDs.                  | (optional) defaults to undefined |
| **sort**    | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;command&#39; &#124; &#39;command:asc&#39; &#124; &#39;command:desc&#39; &#124; &#39;status&#39; &#124; &#39;status:asc&#39; &#124; &#39;status:desc&#39; &#124; &#39;started&#39; &#124; &#39;started:asc&#39; &#124; &#39;started:desc&#39; &#124; &#39;finished&#39; &#124; &#39;finished:asc&#39; &#124; &#39;finished:desc&#39;>** | Sort actions by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;. | (optional) defaults to undefined |
| **status**  | **Array<&#39;running&#39; &#124; &#39;success&#39; &#124; &#39;error&#39;>**                                                                                                                                                                                                                                                                                                                                             | Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.         | (optional) defaults to undefined |
| **page**    | [**number**]                                                                                                                                                                                                                                                                                                                                                                                                             | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                     | (optional) defaults to 1         |
| **perPage** | [**number**]                                                                                                                                                                                                                                                                                                                                                                                                             | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.               | (optional) defaults to 25        |

### Return type

**ActionListResponseWithMeta**

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

# **unassignPrimaryIp**

> ActionResponse1 unassignPrimaryIp()

Unassign a [Primary IP](#tag/primary-ips) from a resource. A [Server](#tag/servers) must be powered off (status `off`) in order for this operation to succeed. A [Server](#tag/servers) requires at least one network interface (public or private) to be powered on. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `server_not_stopped` | The [Server](#tag/servers) is running, but needs to be powered off | | `422` | `server_is_load_balancer_target` | The [Server](#tag/servers) IPv4 address is a loadbalancer target |

### Example

```typescript
import { PrimaryIPActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new PrimaryIPActionsApi(configuration);

let id: number; //ID of the Primary IP. (default to undefined)

const { status, data } = await apiInstance.unassignPrimaryIp(id);
```

### Parameters

| Name   | Type         | Description           | Notes                 |
| ------ | ------------ | --------------------- | --------------------- |
| **id** | [**number**] | ID of the Primary IP. | defaults to undefined |

### Return type

**ActionResponse1**

### Authorization

[APIToken](../README.md#APIToken)

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json

### HTTP response details

| Status code | Description                         | Response headers |
| ----------- | ----------------------------------- | ---------------- |
| **201**     | Request succeeded.                  | -                |
| **4xx**     | Request failed with a user error.   | -                |
| **5xx**     | Request failed with a server error. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
