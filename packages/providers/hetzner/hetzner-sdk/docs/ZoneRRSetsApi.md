# ZoneRRSetsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createZoneRrset**](#createzonerrset) | **POST** /zones/{id_or_name}/rrsets | Create an RRSet|
|[**deleteZoneRrset**](#deletezonerrset) | **DELETE** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type} | Delete an RRSet|
|[**getZoneRrset**](#getzonerrset) | **GET** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type} | Get an RRSet|
|[**listZoneRrsets**](#listzonerrsets) | **GET** /zones/{id_or_name}/rrsets | List RRSets|
|[**updateZoneRrset**](#updatezonerrset) | **PUT** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type} | Update an RRSet|

# **createZoneRrset**
> CreateZoneRrset201Response createZoneRrset(createZoneRequestRrsetsInner)

Create an [RRSet](#tag/zone-rrsets) in the [Zone](#tag/zones).  Only applicable for [Zones](#tag/zones) in primary mode.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. | 

### Example

```typescript
import {
    ZoneRRSetsApi,
    Configuration,
    CreateZoneRequestRrsetsInner
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let createZoneRequestRrsetsInner: CreateZoneRequestRrsetsInner; //

const { status, data } = await apiInstance.createZoneRrset(
    idOrName,
    createZoneRequestRrsetsInner
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createZoneRequestRrsetsInner** | **CreateZoneRequestRrsetsInner**|  | |
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|


### Return type

**CreateZoneRrset201Response**

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

# **deleteZoneRrset**
> ActionResponse deleteZoneRrset()

Deletes an [RRSet](#tag/zone-rrsets) from the [Zone](#tag/zones).  Only applicable for [Zones](#tag/zones) in primary mode.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. | 

### Example

```typescript
import {
    ZoneRRSetsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let rrName: string; // (default to undefined)
let rrType: 'A' | 'AAAA' | 'CAA' | 'CNAME' | 'DS' | 'HINFO' | 'HTTPS' | 'MX' | 'NS' | 'PTR' | 'RP' | 'SOA' | 'SRV' | 'SVCB' | 'TLSA' | 'TXT'; // (default to undefined)

const { status, data } = await apiInstance.deleteZoneRrset(
    idOrName,
    rrName,
    rrType
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|
| **rrName** | [**string**] |  | defaults to undefined|
| **rrType** | [**&#39;A&#39; | &#39;AAAA&#39; | &#39;CAA&#39; | &#39;CNAME&#39; | &#39;DS&#39; | &#39;HINFO&#39; | &#39;HTTPS&#39; | &#39;MX&#39; | &#39;NS&#39; | &#39;PTR&#39; | &#39;RP&#39; | &#39;SOA&#39; | &#39;SRV&#39; | &#39;SVCB&#39; | &#39;TLSA&#39; | &#39;TXT&#39;**]**Array<&#39;A&#39; &#124; &#39;AAAA&#39; &#124; &#39;CAA&#39; &#124; &#39;CNAME&#39; &#124; &#39;DS&#39; &#124; &#39;HINFO&#39; &#124; &#39;HTTPS&#39; &#124; &#39;MX&#39; &#124; &#39;NS&#39; &#124; &#39;PTR&#39; &#124; &#39;RP&#39; &#124; &#39;SOA&#39; &#124; &#39;SRV&#39; &#124; &#39;SVCB&#39; &#124; &#39;TLSA&#39; &#124; &#39;TXT&#39;>** |  | defaults to undefined|


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

# **getZoneRrset**
> GetZoneRrset200Response getZoneRrset()

Returns a single [RRSet](#tag/zone-rrsets) from the [Zone](#tag/zones).  Only applicable for [Zones](#tag/zones) in primary mode.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. | 

### Example

```typescript
import {
    ZoneRRSetsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let rrName: string; // (default to undefined)
let rrType: 'A' | 'AAAA' | 'CAA' | 'CNAME' | 'DS' | 'HINFO' | 'HTTPS' | 'MX' | 'NS' | 'PTR' | 'RP' | 'SOA' | 'SRV' | 'SVCB' | 'TLSA' | 'TXT'; // (default to undefined)

const { status, data } = await apiInstance.getZoneRrset(
    idOrName,
    rrName,
    rrType
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|
| **rrName** | [**string**] |  | defaults to undefined|
| **rrType** | [**&#39;A&#39; | &#39;AAAA&#39; | &#39;CAA&#39; | &#39;CNAME&#39; | &#39;DS&#39; | &#39;HINFO&#39; | &#39;HTTPS&#39; | &#39;MX&#39; | &#39;NS&#39; | &#39;PTR&#39; | &#39;RP&#39; | &#39;SOA&#39; | &#39;SRV&#39; | &#39;SVCB&#39; | &#39;TLSA&#39; | &#39;TXT&#39;**]**Array<&#39;A&#39; &#124; &#39;AAAA&#39; &#124; &#39;CAA&#39; &#124; &#39;CNAME&#39; &#124; &#39;DS&#39; &#124; &#39;HINFO&#39; &#124; &#39;HTTPS&#39; &#124; &#39;MX&#39; &#124; &#39;NS&#39; &#124; &#39;PTR&#39; &#124; &#39;RP&#39; &#124; &#39;SOA&#39; &#124; &#39;SRV&#39; &#124; &#39;SVCB&#39; &#124; &#39;TLSA&#39; &#124; &#39;TXT&#39;>** |  | defaults to undefined|


### Return type

**GetZoneRrset200Response**

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

# **listZoneRrsets**
> ListZoneRrsets200Response listZoneRrsets()

Returns all [RRSets](#tag/zone-rrsets) in the [Zone](#tag/zones).  Use the provided URI parameters to modify the result.  The maximum value for `per_page` on this endpoint is `100` instead of `50`.  Only applicable for [Zones](#tag/zones) in primary mode.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. | 

### Example

```typescript
import {
    ZoneRRSetsApi,
    Configuration
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let type: Array<'A' | 'AAAA' | 'CAA' | 'CNAME' | 'DS' | 'HINFO' | 'HTTPS' | 'MX' | 'NS' | 'PTR' | 'RP' | 'SOA' | 'SRV' | 'SVCB' | 'TLSA' | 'TXT'>; //Filter resources by their type. Can be used multiple times. The response will only contain resources matching the specified types.  (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
let sort: Array<'id' | 'id:asc' | 'id:desc' | 'name' | 'name:asc' | 'name:desc' | 'created' | 'created:asc' | 'created:desc'>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listZoneRrsets(
    idOrName,
    name,
    type,
    labelSelector,
    sort,
    page,
    perPage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|
| **name** | [**string**] | Filter resources by their name. The response will only contain the resources matching exactly the specified name.  | (optional) defaults to undefined|
| **type** | **Array<&#39;A&#39; &#124; &#39;AAAA&#39; &#124; &#39;CAA&#39; &#124; &#39;CNAME&#39; &#124; &#39;DS&#39; &#124; &#39;HINFO&#39; &#124; &#39;HTTPS&#39; &#124; &#39;MX&#39; &#124; &#39;NS&#39; &#124; &#39;PTR&#39; &#124; &#39;RP&#39; &#124; &#39;SOA&#39; &#124; &#39;SRV&#39; &#124; &#39;SVCB&#39; &#124; &#39;TLSA&#39; &#124; &#39;TXT&#39;>** | Filter resources by their type. Can be used multiple times. The response will only contain resources matching the specified types.  | (optional) defaults to undefined|
| **labelSelector** | [**string**] | Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \&quot;[Label Selector](#description/label-selector)\&quot;.  | (optional) defaults to undefined|
| **sort** | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;name&#39; &#124; &#39;name:asc&#39; &#124; &#39;name:desc&#39; &#124; &#39;created&#39; &#124; &#39;created:asc&#39; &#124; &#39;created:desc&#39;>** | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.  | (optional) defaults to undefined|
| **page** | [**number**] | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 1|
| **perPage** | [**number**] | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;. | (optional) defaults to 25|


### Return type

**ListZoneRrsets200Response**

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

# **updateZoneRrset**
> GetZoneRrset200Response updateZoneRrset(updateZoneRrsetRequest)

Updates an [RRSet](#tag/zone-rrsets) in the [Zone](#tag/zones).  Only applicable for [Zones](#tag/zones) in primary mode.  #### Operation specific errors  | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. | 

### Example

```typescript
import {
    ZoneRRSetsApi,
    Configuration,
    UpdateZoneRrsetRequest
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let rrName: string; // (default to undefined)
let rrType: 'A' | 'AAAA' | 'CAA' | 'CNAME' | 'DS' | 'HINFO' | 'HTTPS' | 'MX' | 'NS' | 'PTR' | 'RP' | 'SOA' | 'SRV' | 'SVCB' | 'TLSA' | 'TXT'; // (default to undefined)
let updateZoneRrsetRequest: UpdateZoneRrsetRequest; //

const { status, data } = await apiInstance.updateZoneRrset(
    idOrName,
    rrName,
    rrType,
    updateZoneRrsetRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateZoneRrsetRequest** | **UpdateZoneRrsetRequest**|  | |
| **idOrName** | [**string**] | ID or Name of the Zone. | defaults to undefined|
| **rrName** | [**string**] |  | defaults to undefined|
| **rrType** | [**&#39;A&#39; | &#39;AAAA&#39; | &#39;CAA&#39; | &#39;CNAME&#39; | &#39;DS&#39; | &#39;HINFO&#39; | &#39;HTTPS&#39; | &#39;MX&#39; | &#39;NS&#39; | &#39;PTR&#39; | &#39;RP&#39; | &#39;SOA&#39; | &#39;SRV&#39; | &#39;SVCB&#39; | &#39;TLSA&#39; | &#39;TXT&#39;**]**Array<&#39;A&#39; &#124; &#39;AAAA&#39; &#124; &#39;CAA&#39; &#124; &#39;CNAME&#39; &#124; &#39;DS&#39; &#124; &#39;HINFO&#39; &#124; &#39;HTTPS&#39; &#124; &#39;MX&#39; &#124; &#39;NS&#39; &#124; &#39;PTR&#39; &#124; &#39;RP&#39; &#124; &#39;SOA&#39; &#124; &#39;SRV&#39; &#124; &#39;SVCB&#39; &#124; &#39;TLSA&#39; &#124; &#39;TXT&#39;>** |  | defaults to undefined|


### Return type

**GetZoneRrset200Response**

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

