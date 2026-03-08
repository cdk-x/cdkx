# ZonesApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createZone**](#createzone) | **POST** /zones | Create a Zone|
|[**deleteZone**](#deletezone) | **DELETE** /zones/{id_or_name} | Delete a Zone|
|[**getZone**](#getzone) | **GET** /zones/{id_or_name} | Get a Zone|
|[**getZoneZonefile**](#getzonezonefile) | **GET** /zones/{id_or_name}/zonefile | Export a Zone file|
|[**listZones**](#listzones) | **GET** /zones | List Zones|
|[**updateZone**](#updatezone) | **PUT** /zones/{id_or_name} | Update a Zone|

# **createZone**
> CreateZone201Response createZone(createZoneRequest)

Creates a [Zone](#tag/zones).  A default `SOA` and three `NS` resource records with the assigned Hetzner nameservers are created automatically. 

### Example

```typescript
import {
    ZonesApi,
    Configuration,
    CreateZoneRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZonesApi(configuration);

let createZoneRequest: CreateZoneRequest; //

const { status, data } = await apiInstance.createZone(
    createZoneRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createZoneRequest** | **CreateZoneRequest**|  | |


### Return type

**CreateZone201Response**

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

# **deleteZone**
> ActionResponse deleteZone()

Deletes a [Zone](#tag/zones). 

### Example

```typescript
import {
    ZonesApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZonesApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)

const { status, data } = await apiInstance.deleteZone(
    idOrName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|


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
|**201** | Request succeeded. |  -  |
|**4xx** | Request failed with a user error. |  -  |
|**5xx** | Request failed with a server error. |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getZone**
> GetZone200Response getZone()

Returns a single [Zone](#tag/zones). 

### Example

```typescript
import {
    ZonesApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZonesApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)

const { status, data } = await apiInstance.getZone(
    idOrName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|


### Return type

**GetZone200Response**

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

# **getZoneZonefile**
> GetZoneZonefile200Response getZoneZonefile()

Returns a generated [Zone](#tag/zones) file in BIND (RFC [1034](https://datatracker.ietf.org/doc/html/rfc1034)/[1035](https://datatracker.ietf.org/doc/html/rfc1035)) format.  Only applicable for [Zones](#tag/zones) in primary mode.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. | 

### Example

```typescript
import {
    ZonesApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZonesApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)

const { status, data } = await apiInstance.getZoneZonefile(
    idOrName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|


### Return type

**GetZoneZonefile200Response**

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

# **listZones**
> ListZones200Response listZones()

Returns all [Zones](#tag/zones).  Use the provided URI parameters to modify the result. 

### Example

```typescript
import {
    ZonesApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZonesApi(configuration);

let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let mode: 'primary' | 'secondary'; //Filter resources by their mode. The response will only contain the resources matching exactly the specified mode.  (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'name' | 'name:asc' | 'name:desc' | 'created' | 'created:asc' | 'created:desc'>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listZones(
    name,
    mode,
    labelSelector,
    sort,
    page,
    perPage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **name** | [**string**] | Filter resources by their name. The response will only contain the resources matching exactly the specified name.  | (optional) defaults to undefined|
| **mode** | [**&#39;primary&#39; | &#39;secondary&#39;**]**Array<&#39;primary&#39; &#124; &#39;secondary&#39;>** | Filter resources by their mode. The response will only contain the resources matching exactly the specified mode.  | (optional) defaults to undefined|
| **labelSelector** | [**string**] | Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \&quot;[Label Selector](#description/label-selector)\&quot;.  | (optional) defaults to undefined|
| **sort** | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;name&#39; &#124; &#39;name:asc&#39; &#124; &#39;name:desc&#39; &#124; &#39;created&#39; &#124; &#39;created:asc&#39; &#124; &#39;created:desc&#39;>** | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.  | (optional) defaults to undefined|
| **page** | [**number**] | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 1|
| **perPage** | [**number**] | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 25|


### Return type

**ListZones200Response**

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

# **updateZone**
> GetZone200Response updateZone(zoneUpdateRequest)

Updates a [Zone](#tag/zones).  To modify resource record sets ([RRSets](#tag/zone-rrsets)), use the [RRSet Actions endpoints](#tag/zone-rrset-actions). 

### Example

```typescript
import {
    ZonesApi,
    Configuration,
    ZoneUpdateRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZonesApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let zoneUpdateRequest: ZoneUpdateRequest; //

const { status, data } = await apiInstance.updateZone(
    idOrName,
    zoneUpdateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **zoneUpdateRequest** | **ZoneUpdateRequest**|  | |
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|


### Return type

**GetZone200Response**

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

