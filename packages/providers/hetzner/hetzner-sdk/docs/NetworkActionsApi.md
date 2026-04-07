# NetworkActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                                  | HTTP request                                      | Description                    |
| ------------------------------------------------------- | ------------------------------------------------- | ------------------------------ |
| [**addNetworkRoute**](#addnetworkroute)                 | **POST** /networks/{id}/actions/add_route         | Add a route to a Network       |
| [**addNetworkSubnet**](#addnetworksubnet)               | **POST** /networks/{id}/actions/add_subnet        | Add a subnet to a Network      |
| [**changeNetworkIpRange**](#changenetworkiprange)       | **POST** /networks/{id}/actions/change_ip_range   | Change IP range of a Network   |
| [**changeNetworkProtection**](#changenetworkprotection) | **POST** /networks/{id}/actions/change_protection | Change Network Protection      |
| [**deleteNetworkRoute**](#deletenetworkroute)           | **POST** /networks/{id}/actions/delete_route      | Delete a route from a Network  |
| [**deleteNetworkSubnet**](#deletenetworksubnet)         | **POST** /networks/{id}/actions/delete_subnet     | Delete a subnet from a Network |
| [**getNetworkAction**](#getnetworkaction)               | **GET** /networks/{id}/actions/{action_id}        | Get an Action for a Network    |
| [**getNetworksAction**](#getnetworksaction)             | **GET** /networks/actions/{id}                    | Get an Action                  |
| [**listNetworkActions**](#listnetworkactions)           | **GET** /networks/{id}/actions                    | List Actions for a Network     |
| [**listNetworksActions**](#listnetworksactions)         | **GET** /networks/actions                         | List Actions                   |

# **addNetworkRoute**

> ActionResponse1 addNetworkRoute(addRouteRequest)

Adds a route entry to a [Network](#tag/networks). If a change is currently being performed on this [Network](#tag/networks), a error response with code `conflict` will be returned.

### Example

```typescript
import {
  NetworkActionsApi,
  Configuration,
  AddRouteRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworkActionsApi(configuration);

let id: number; //ID of the Network. (default to undefined)
let addRouteRequest: AddRouteRequest; //

const { status, data } = await apiInstance.addNetworkRoute(id, addRouteRequest);
```

### Parameters

| Name                | Type                | Description        | Notes                 |
| ------------------- | ------------------- | ------------------ | --------------------- |
| **addRouteRequest** | **AddRouteRequest** |                    |                       |
| **id**              | [**number**]        | ID of the Network. | defaults to undefined |

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

# **addNetworkSubnet**

> ActionResponse1 addNetworkSubnet(addSubnetRequest)

Adds a new subnet to the [Network](#tag/networks). If the subnet `ip_range` is not provided, the first available `/24` IP range will be used. If a change is currently being performed on this [Network](#tag/networks), a error response with code `conflict` will be returned.

### Example

```typescript
import {
  NetworkActionsApi,
  Configuration,
  AddSubnetRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworkActionsApi(configuration);

let id: number; //ID of the Network. (default to undefined)
let addSubnetRequest: AddSubnetRequest; //

const { status, data } = await apiInstance.addNetworkSubnet(
  id,
  addSubnetRequest,
);
```

### Parameters

| Name                 | Type                 | Description        | Notes                 |
| -------------------- | -------------------- | ------------------ | --------------------- |
| **addSubnetRequest** | **AddSubnetRequest** |                    |                       |
| **id**               | [**number**]         | ID of the Network. | defaults to undefined |

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

# **changeNetworkIpRange**

> ActionResponse1 changeNetworkIpRange(changeIPRangeRequest)

Changes the IP range of a [Network](#tag/networks). The following restrictions apply to changing the IP range: - IP ranges can only be extended and never shrunk. - IPs can only be added to the end of the existing range, therefore only the netmask is allowed to be changed. To update the routes on the connected [Servers](#tag/servers), they need to be rebooted or the routes to be updated manually. For example if the [Network](#tag/networks) has a range of `10.0.0.0/16` to extend it the new range has to start with the IP `10.0.0.0` as well. The netmask `/16` can be changed to a smaller one then `16` therefore increasing the IP range. A valid entry would be `10.0.0.0/15`, `10.0.0.0/14` or `10.0.0.0/13` and so on. If a change is currently being performed on this [Network](#tag/networks), a error response with code `conflict` will be returned.

### Example

```typescript
import {
  NetworkActionsApi,
  Configuration,
  ChangeIPRangeRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworkActionsApi(configuration);

let id: number; //ID of the Network. (default to undefined)
let changeIPRangeRequest: ChangeIPRangeRequest; //

const { status, data } = await apiInstance.changeNetworkIpRange(
  id,
  changeIPRangeRequest,
);
```

### Parameters

| Name                     | Type                     | Description        | Notes                 |
| ------------------------ | ------------------------ | ------------------ | --------------------- |
| **changeIPRangeRequest** | **ChangeIPRangeRequest** |                    |                       |
| **id**                   | [**number**]             | ID of the Network. | defaults to undefined |

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

# **changeNetworkProtection**

> ActionResponse1 changeNetworkProtection(changeProtectionRequest)

Changes the protection settings of a [Network](#tag/networks). If a change is currently being performed on this [Network](#tag/networks), a error response with code `conflict` will be returned.

### Example

```typescript
import {
  NetworkActionsApi,
  Configuration,
  ChangeProtectionRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworkActionsApi(configuration);

let id: number; //ID of the Network. (default to undefined)
let changeProtectionRequest: ChangeProtectionRequest; //

const { status, data } = await apiInstance.changeNetworkProtection(
  id,
  changeProtectionRequest,
);
```

### Parameters

| Name                        | Type                        | Description        | Notes                 |
| --------------------------- | --------------------------- | ------------------ | --------------------- |
| **changeProtectionRequest** | **ChangeProtectionRequest** |                    |                       |
| **id**                      | [**number**]                | ID of the Network. | defaults to undefined |

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

# **deleteNetworkRoute**

> ActionResponse1 deleteNetworkRoute(deleteRouteRequest)

Delete a route entry from a [Network](#tag/networks). If a change is currently being performed on this [Network](#tag/networks), a error response with code `conflict` will be returned.

### Example

```typescript
import {
  NetworkActionsApi,
  Configuration,
  DeleteRouteRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworkActionsApi(configuration);

let id: number; //ID of the Network. (default to undefined)
let deleteRouteRequest: DeleteRouteRequest; //

const { status, data } = await apiInstance.deleteNetworkRoute(
  id,
  deleteRouteRequest,
);
```

### Parameters

| Name                   | Type                   | Description        | Notes                 |
| ---------------------- | ---------------------- | ------------------ | --------------------- |
| **deleteRouteRequest** | **DeleteRouteRequest** |                    |                       |
| **id**                 | [**number**]           | ID of the Network. | defaults to undefined |

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

# **deleteNetworkSubnet**

> ActionResponse1 deleteNetworkSubnet(deleteSubnetRequest)

Deletes a single subnet entry from a [Network](#tag/networks). Subnets containing attached resources can not be deleted, they must be detached beforehand. If a change is currently being performed on this [Network](#tag/networks), a error response with code `conflict` will be returned.

### Example

```typescript
import {
  NetworkActionsApi,
  Configuration,
  DeleteSubnetRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworkActionsApi(configuration);

let id: number; //ID of the Network. (default to undefined)
let deleteSubnetRequest: DeleteSubnetRequest; //

const { status, data } = await apiInstance.deleteNetworkSubnet(
  id,
  deleteSubnetRequest,
);
```

### Parameters

| Name                    | Type                    | Description        | Notes                 |
| ----------------------- | ----------------------- | ------------------ | --------------------- |
| **deleteSubnetRequest** | **DeleteSubnetRequest** |                    |                       |
| **id**                  | [**number**]            | ID of the Network. | defaults to undefined |

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

# **getNetworkAction**

> ActionResponse getNetworkAction()

Returns a specific [Action](#tag/actions) for a [Network](#tag/networks).

### Example

```typescript
import { NetworkActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworkActionsApi(configuration);

let id: number; //ID of the Network. (default to undefined)
let actionId: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getNetworkAction(id, actionId);
```

### Parameters

| Name         | Type         | Description        | Notes                 |
| ------------ | ------------ | ------------------ | --------------------- |
| **id**       | [**number**] | ID of the Network. | defaults to undefined |
| **actionId** | [**number**] | ID of the Action.  | defaults to undefined |

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

# **getNetworksAction**

> ActionResponse getNetworksAction()

Returns a single [Action](#tag/actions).

### Example

```typescript
import { NetworkActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworkActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getNetworksAction(id);
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

# **listNetworkActions**

> ActionListResponseWithMeta listNetworkActions()

Lists [Actions](#tag/actions) for a [Network](#tag/networks). Use the provided URI parameters to modify the result.

### Example

```typescript
import { NetworkActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworkActionsApi(configuration);

let id: number; //ID of the Network. (default to undefined)
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

const { status, data } = await apiInstance.listNetworkActions(
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
| **id**      | [**number**]                                                                                                                                                                                                                                                                                                                                                                                                             | ID of the Network.                                                                                                                        | defaults to undefined            |
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

# **listNetworksActions**

> ActionListResponseWithMeta listNetworksActions()

Lists multiple [Actions](#tag/actions). Use the provided URI parameters to modify the result.

### Example

```typescript
import { NetworkActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new NetworkActionsApi(configuration);

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

const { status, data } = await apiInstance.listNetworksActions(
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
