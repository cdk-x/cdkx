# ZoneActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**changeZonePrimaryNameservers**](#changezoneprimarynameservers) | **POST** /zones/{id_or_name}/actions/change_primary_nameservers | Change a Zone\&#39;s Primary Nameservers|
|[**changeZoneProtection**](#changezoneprotection) | **POST** /zones/{id_or_name}/actions/change_protection | Change a Zone\&#39;s Protection|
|[**changeZoneTtl**](#changezonettl) | **POST** /zones/{id_or_name}/actions/change_ttl | Change a Zone\&#39;s Default TTL|
|[**getZoneAction**](#getzoneaction) | **GET** /zones/{id_or_name}/actions/{action_id} | Get an Action for a Zone|
|[**getZonesAction**](#getzonesaction) | **GET** /zones/actions/{id} | Get an Action|
|[**importZoneZonefile**](#importzonezonefile) | **POST** /zones/{id_or_name}/actions/import_zonefile | Import a Zone file|
|[**listZoneActions**](#listzoneactions) | **GET** /zones/{id_or_name}/actions | List Actions for a Zone|
|[**listZonesActions**](#listzonesactions) | **GET** /zones/actions | List Actions|

# **changeZonePrimaryNameservers**
> ActionResponse1 changeZonePrimaryNameservers(changeZonePrimaryNameserversRequest)

Overwrites the primary nameservers of a [Zone](#tag/zones).  Only applicable for [Zones](#tag/zones) in secondary mode.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. | 

### Example

```typescript
import {
    ZoneActionsApi,
    Configuration,
    ChangeZonePrimaryNameserversRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let changeZonePrimaryNameserversRequest: ChangeZonePrimaryNameserversRequest; //

const { status, data } = await apiInstance.changeZonePrimaryNameservers(
    idOrName,
    changeZonePrimaryNameserversRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **changeZonePrimaryNameserversRequest** | **ChangeZonePrimaryNameserversRequest**|  | |
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|


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

# **changeZoneProtection**
> ActionResponse1 changeZoneProtection(changeZoneProtectionRequest)

Changes the protection configuration of a [Zone](#tag/zones). 

### Example

```typescript
import {
    ZoneActionsApi,
    Configuration,
    ChangeZoneProtectionRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let changeZoneProtectionRequest: ChangeZoneProtectionRequest; //

const { status, data } = await apiInstance.changeZoneProtection(
    idOrName,
    changeZoneProtectionRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **changeZoneProtectionRequest** | **ChangeZoneProtectionRequest**|  | |
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|


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

# **changeZoneTtl**
> ActionResponse1 changeZoneTtl(changeZoneTtlRequest)

Changes the default Time To Live (TTL) of a [Zone](#tag/zones).  This TTL is used for [RRSets](#tag/zone-rrsets) that do not explicitly define a TTL.  Only applicable for [Zones](#tag/zones) in primary mode.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. | 

### Example

```typescript
import {
    ZoneActionsApi,
    Configuration,
    ChangeZoneTtlRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let changeZoneTtlRequest: ChangeZoneTtlRequest; //

const { status, data } = await apiInstance.changeZoneTtl(
    idOrName,
    changeZoneTtlRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **changeZoneTtlRequest** | **ChangeZoneTtlRequest**|  | |
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|


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

# **getZoneAction**
> ActionResponse getZoneAction()

Returns a specific [Action](#tag/actions) for a [Zone](#tag/zones). 

### Example

```typescript
import {
    ZoneActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let actionId: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getZoneAction(
    idOrName,
    actionId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|
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

# **getZonesAction**
> ActionResponse getZonesAction()

Returns a specific [Action](#tag/actions). 

### Example

```typescript
import {
    ZoneActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getZonesAction(
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

# **importZoneZonefile**
> ActionResponse1 importZoneZonefile(importZoneZonefileRequest)

Imports a zone file, replacing all resource record sets ([RRSets](#tag/zone-rrsets)).  The import will fail if existing [RRSet](#tag/zone-rrsets) are `change` protected.  See [Zone file import](#tag/zones/zone-file-import) for more details. Only applicable for [Zones](#tag/zones) in primary mode.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. | 

### Example

```typescript
import {
    ZoneActionsApi,
    Configuration,
    ImportZoneZonefileRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let importZoneZonefileRequest: ImportZoneZonefileRequest; //

const { status, data } = await apiInstance.importZoneZonefile(
    idOrName,
    importZoneZonefileRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **importZoneZonefileRequest** | **ImportZoneZonefileRequest**|  | |
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|


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

# **listZoneActions**
> ActionListResponseWithMeta listZoneActions()

Returns all [Actions](#tag/actions) for a [Zone](#tag/zones).  Use the provided URI parameters to modify the result. 

### Example

```typescript
import {
    ZoneActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'command' | 'command:asc' | 'command:desc' | 'status' | 'status:asc' | 'status:desc' | 'started' | 'started:asc' | 'started:desc' | 'finished' | 'finished:asc' | 'finished:desc'>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listZoneActions(
    idOrName,
    sort,
    status,
    page,
    perPage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|
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

# **listZonesActions**
> ActionListResponseWithMeta listZonesActions()

Returns all [Zone](#tag/zones) [Actions](#tag/actions).  Use the provided URI parameters to modify the result. 

### Example

```typescript
import {
    ZoneActionsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneActionsApi(configuration);

let id: Array<number>; //Filter the actions by ID. Can be used multiple times. The response will only contain actions matching the specified IDs.  (optional) (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'command' | 'command:asc' | 'command:desc' | 'status' | 'status:asc' | 'status:desc' | 'started' | 'started:asc' | 'started:desc' | 'finished' | 'finished:asc' | 'finished:desc'>; //Sort actions by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let status: Array<'running' | 'success' | 'error'>; //Filter the actions by status. Can be used multiple times. The response will only contain actions matching the specified statuses.  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listZonesActions(
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

