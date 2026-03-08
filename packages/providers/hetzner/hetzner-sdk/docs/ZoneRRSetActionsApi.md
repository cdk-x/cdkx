# ZoneRRSetActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                                      | HTTP request                                                                      | Description                       |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------- |
| [**addZoneRrsetRecords**](#addzonerrsetrecords)             | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/add_records       | Add Records to an RRSet           |
| [**changeZoneRrsetProtection**](#changezonerrsetprotection) | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/change_protection | Change an RRSet\&#39;s Protection |
| [**changeZoneRrsetTtl**](#changezonerrsetttl)               | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/change_ttl        | Change an RRSet\&#39;s TTL        |
| [**removeZoneRrsetRecords**](#removezonerrsetrecords)       | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/remove_records    | Remove Records from an RRSet      |
| [**setZoneRrsetRecords**](#setzonerrsetrecords)             | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/set_records       | Set Records of an RRSet           |
| [**updateZoneRrsetRecords**](#updatezonerrsetrecords)       | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/update_records    | Update Records of an RRSet        |

# **addZoneRrsetRecords**

> ActionResponse1 addZoneRrsetRecords(addZoneRrsetRecordsRequest)

Adds resource records (RRs) to an [RRSet](#tag/zone-rrsets) in the [Zone](#tag/zones). For convenience, the [RRSet](#tag/zone-rrsets) will be automatically created if it doesn\'t exist. Otherwise, the new records are appended to the existing [RRSet](#tag/zone-rrsets). Only applicable for [Zones](#tag/zones) in primary mode. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. |

### Example

```typescript
import {
  ZoneRRSetActionsApi,
  Configuration,
  AddZoneRrsetRecordsRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let rrName: string; // (default to undefined)
let rrType:
  | 'A'
  | 'AAAA'
  | 'CAA'
  | 'CNAME'
  | 'DS'
  | 'HINFO'
  | 'HTTPS'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'RP'
  | 'SOA'
  | 'SRV'
  | 'SVCB'
  | 'TLSA'
  | 'TXT'; // (default to undefined)
let addZoneRrsetRecordsRequest: AddZoneRrsetRecordsRequest; //

const { status, data } = await apiInstance.addZoneRrsetRecords(
  idOrName,
  rrName,
  rrType,
  addZoneRrsetRecordsRequest,
);
```

### Parameters

| Name                           | Type                           | Description             | Notes                 |
| ------------------------------ | ------------------------------ | ----------------------- | --------------------- | --------------- | ------------ | --------------- | --------------- | ------------ | ------------ | ------------- | ------------ | ------------- | ------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --------------------- |
| **addZoneRrsetRecordsRequest** | **AddZoneRrsetRecordsRequest** |                         |                       |
| **idOrName**                   | [**string**]                   | ID or Name of the Zone. | defaults to undefined |
| **rrName**                     | [**string**]                   |                         | defaults to undefined |
| **rrType**                     | [\*\*&#39;A&#39;               | &#39;AAAA&#39;          | &#39;CAA&#39;         | &#39;CNAME&#39; | &#39;DS&#39; | &#39;HINFO&#39; | &#39;HTTPS&#39; | &#39;MX&#39; | &#39;NS&#39; | &#39;PTR&#39; | &#39;RP&#39; | &#39;SOA&#39; | &#39;SRV&#39; | &#39;SVCB&#39; | &#39;TLSA&#39; | &#39;TXT&#39;**]**Array<&#39;A&#39; &#124; &#39;AAAA&#39; &#124; &#39;CAA&#39; &#124; &#39;CNAME&#39; &#124; &#39;DS&#39; &#124; &#39;HINFO&#39; &#124; &#39;HTTPS&#39; &#124; &#39;MX&#39; &#124; &#39;NS&#39; &#124; &#39;PTR&#39; &#124; &#39;RP&#39; &#124; &#39;SOA&#39; &#124; &#39;SRV&#39; &#124; &#39;SVCB&#39; &#124; &#39;TLSA&#39; &#124; &#39;TXT&#39;>\*\* |     | defaults to undefined |

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

# **changeZoneRrsetProtection**

> ActionResponse1 changeZoneRrsetProtection(rRSetProtection)

Changes the protection of an [RRSet](#tag/zone-rrsets) in the [Zone](#tag/zones). Only applicable for [Zones](#tag/zones) in primary mode. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. |

### Example

```typescript
import {
  ZoneRRSetActionsApi,
  Configuration,
  RRSetProtection,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let rrName: string; // (default to undefined)
let rrType:
  | 'A'
  | 'AAAA'
  | 'CAA'
  | 'CNAME'
  | 'DS'
  | 'HINFO'
  | 'HTTPS'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'RP'
  | 'SOA'
  | 'SRV'
  | 'SVCB'
  | 'TLSA'
  | 'TXT'; // (default to undefined)
let rRSetProtection: RRSetProtection; //

const { status, data } = await apiInstance.changeZoneRrsetProtection(
  idOrName,
  rrName,
  rrType,
  rRSetProtection,
);
```

### Parameters

| Name                | Type                | Description             | Notes                 |
| ------------------- | ------------------- | ----------------------- | --------------------- | --------------- | ------------ | --------------- | --------------- | ------------ | ------------ | ------------- | ------------ | ------------- | ------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --------------------- |
| **rRSetProtection** | **RRSetProtection** |                         |                       |
| **idOrName**        | [**string**]        | ID or Name of the Zone. | defaults to undefined |
| **rrName**          | [**string**]        |                         | defaults to undefined |
| **rrType**          | [\*\*&#39;A&#39;    | &#39;AAAA&#39;          | &#39;CAA&#39;         | &#39;CNAME&#39; | &#39;DS&#39; | &#39;HINFO&#39; | &#39;HTTPS&#39; | &#39;MX&#39; | &#39;NS&#39; | &#39;PTR&#39; | &#39;RP&#39; | &#39;SOA&#39; | &#39;SRV&#39; | &#39;SVCB&#39; | &#39;TLSA&#39; | &#39;TXT&#39;**]**Array<&#39;A&#39; &#124; &#39;AAAA&#39; &#124; &#39;CAA&#39; &#124; &#39;CNAME&#39; &#124; &#39;DS&#39; &#124; &#39;HINFO&#39; &#124; &#39;HTTPS&#39; &#124; &#39;MX&#39; &#124; &#39;NS&#39; &#124; &#39;PTR&#39; &#124; &#39;RP&#39; &#124; &#39;SOA&#39; &#124; &#39;SRV&#39; &#124; &#39;SVCB&#39; &#124; &#39;TLSA&#39; &#124; &#39;TXT&#39;>\*\* |     | defaults to undefined |

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

# **changeZoneRrsetTtl**

> ActionResponse1 changeZoneRrsetTtl(changeZoneRrsetTtlRequest)

Changes the Time To Live (TTL) of an [RRSet](#tag/zone-rrsets) in the [Zone](#tag/zones). Only applicable for [Zones](#tag/zones) in primary mode. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. |

### Example

```typescript
import {
  ZoneRRSetActionsApi,
  Configuration,
  ChangeZoneRrsetTtlRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let rrName: string; // (default to undefined)
let rrType:
  | 'A'
  | 'AAAA'
  | 'CAA'
  | 'CNAME'
  | 'DS'
  | 'HINFO'
  | 'HTTPS'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'RP'
  | 'SOA'
  | 'SRV'
  | 'SVCB'
  | 'TLSA'
  | 'TXT'; // (default to undefined)
let changeZoneRrsetTtlRequest: ChangeZoneRrsetTtlRequest; //

const { status, data } = await apiInstance.changeZoneRrsetTtl(
  idOrName,
  rrName,
  rrType,
  changeZoneRrsetTtlRequest,
);
```

### Parameters

| Name                          | Type                          | Description             | Notes                 |
| ----------------------------- | ----------------------------- | ----------------------- | --------------------- | --------------- | ------------ | --------------- | --------------- | ------------ | ------------ | ------------- | ------------ | ------------- | ------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --------------------- |
| **changeZoneRrsetTtlRequest** | **ChangeZoneRrsetTtlRequest** |                         |                       |
| **idOrName**                  | [**string**]                  | ID or Name of the Zone. | defaults to undefined |
| **rrName**                    | [**string**]                  |                         | defaults to undefined |
| **rrType**                    | [\*\*&#39;A&#39;              | &#39;AAAA&#39;          | &#39;CAA&#39;         | &#39;CNAME&#39; | &#39;DS&#39; | &#39;HINFO&#39; | &#39;HTTPS&#39; | &#39;MX&#39; | &#39;NS&#39; | &#39;PTR&#39; | &#39;RP&#39; | &#39;SOA&#39; | &#39;SRV&#39; | &#39;SVCB&#39; | &#39;TLSA&#39; | &#39;TXT&#39;**]**Array<&#39;A&#39; &#124; &#39;AAAA&#39; &#124; &#39;CAA&#39; &#124; &#39;CNAME&#39; &#124; &#39;DS&#39; &#124; &#39;HINFO&#39; &#124; &#39;HTTPS&#39; &#124; &#39;MX&#39; &#124; &#39;NS&#39; &#124; &#39;PTR&#39; &#124; &#39;RP&#39; &#124; &#39;SOA&#39; &#124; &#39;SRV&#39; &#124; &#39;SVCB&#39; &#124; &#39;TLSA&#39; &#124; &#39;TXT&#39;>\*\* |     | defaults to undefined |

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

# **removeZoneRrsetRecords**

> ActionResponse1 removeZoneRrsetRecords(removeZoneRrsetRecordsRequest)

Removes resource records (RRs) from an existing [RRSet](#tag/zone-rrsets) in the [Zone](#tag/zones). For convenience, the [RRSet](#tag/zone-rrsets) will be automatically deleted if it doesn\'t contain any RRs afterwards. Only applicable for [Zones](#tag/zones) in primary mode. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. |

### Example

```typescript
import {
  ZoneRRSetActionsApi,
  Configuration,
  RemoveZoneRrsetRecordsRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let rrName: string; // (default to undefined)
let rrType:
  | 'A'
  | 'AAAA'
  | 'CAA'
  | 'CNAME'
  | 'DS'
  | 'HINFO'
  | 'HTTPS'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'RP'
  | 'SOA'
  | 'SRV'
  | 'SVCB'
  | 'TLSA'
  | 'TXT'; // (default to undefined)
let removeZoneRrsetRecordsRequest: RemoveZoneRrsetRecordsRequest; //

const { status, data } = await apiInstance.removeZoneRrsetRecords(
  idOrName,
  rrName,
  rrType,
  removeZoneRrsetRecordsRequest,
);
```

### Parameters

| Name                              | Type                              | Description             | Notes                 |
| --------------------------------- | --------------------------------- | ----------------------- | --------------------- | --------------- | ------------ | --------------- | --------------- | ------------ | ------------ | ------------- | ------------ | ------------- | ------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --------------------- |
| **removeZoneRrsetRecordsRequest** | **RemoveZoneRrsetRecordsRequest** |                         |                       |
| **idOrName**                      | [**string**]                      | ID or Name of the Zone. | defaults to undefined |
| **rrName**                        | [**string**]                      |                         | defaults to undefined |
| **rrType**                        | [\*\*&#39;A&#39;                  | &#39;AAAA&#39;          | &#39;CAA&#39;         | &#39;CNAME&#39; | &#39;DS&#39; | &#39;HINFO&#39; | &#39;HTTPS&#39; | &#39;MX&#39; | &#39;NS&#39; | &#39;PTR&#39; | &#39;RP&#39; | &#39;SOA&#39; | &#39;SRV&#39; | &#39;SVCB&#39; | &#39;TLSA&#39; | &#39;TXT&#39;**]**Array<&#39;A&#39; &#124; &#39;AAAA&#39; &#124; &#39;CAA&#39; &#124; &#39;CNAME&#39; &#124; &#39;DS&#39; &#124; &#39;HINFO&#39; &#124; &#39;HTTPS&#39; &#124; &#39;MX&#39; &#124; &#39;NS&#39; &#124; &#39;PTR&#39; &#124; &#39;RP&#39; &#124; &#39;SOA&#39; &#124; &#39;SRV&#39; &#124; &#39;SVCB&#39; &#124; &#39;TLSA&#39; &#124; &#39;TXT&#39;>\*\* |     | defaults to undefined |

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

# **setZoneRrsetRecords**

> ActionResponse1 setZoneRrsetRecords(setZoneRrsetRecordsRequest)

Overwrites the resource records (RRs) of an existing [RRSet](#tag/zone-rrsets) in the [Zone](#tag/zones). Only applicable for [Zones](#tag/zones) in primary mode. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. |

### Example

```typescript
import {
  ZoneRRSetActionsApi,
  Configuration,
  SetZoneRrsetRecordsRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let rrName: string; // (default to undefined)
let rrType:
  | 'A'
  | 'AAAA'
  | 'CAA'
  | 'CNAME'
  | 'DS'
  | 'HINFO'
  | 'HTTPS'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'RP'
  | 'SOA'
  | 'SRV'
  | 'SVCB'
  | 'TLSA'
  | 'TXT'; // (default to undefined)
let setZoneRrsetRecordsRequest: SetZoneRrsetRecordsRequest; //

const { status, data } = await apiInstance.setZoneRrsetRecords(
  idOrName,
  rrName,
  rrType,
  setZoneRrsetRecordsRequest,
);
```

### Parameters

| Name                           | Type                           | Description             | Notes                 |
| ------------------------------ | ------------------------------ | ----------------------- | --------------------- | --------------- | ------------ | --------------- | --------------- | ------------ | ------------ | ------------- | ------------ | ------------- | ------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --------------------- |
| **setZoneRrsetRecordsRequest** | **SetZoneRrsetRecordsRequest** |                         |                       |
| **idOrName**                   | [**string**]                   | ID or Name of the Zone. | defaults to undefined |
| **rrName**                     | [**string**]                   |                         | defaults to undefined |
| **rrType**                     | [\*\*&#39;A&#39;               | &#39;AAAA&#39;          | &#39;CAA&#39;         | &#39;CNAME&#39; | &#39;DS&#39; | &#39;HINFO&#39; | &#39;HTTPS&#39; | &#39;MX&#39; | &#39;NS&#39; | &#39;PTR&#39; | &#39;RP&#39; | &#39;SOA&#39; | &#39;SRV&#39; | &#39;SVCB&#39; | &#39;TLSA&#39; | &#39;TXT&#39;**]**Array<&#39;A&#39; &#124; &#39;AAAA&#39; &#124; &#39;CAA&#39; &#124; &#39;CNAME&#39; &#124; &#39;DS&#39; &#124; &#39;HINFO&#39; &#124; &#39;HTTPS&#39; &#124; &#39;MX&#39; &#124; &#39;NS&#39; &#124; &#39;PTR&#39; &#124; &#39;RP&#39; &#124; &#39;SOA&#39; &#124; &#39;SRV&#39; &#124; &#39;SVCB&#39; &#124; &#39;TLSA&#39; &#124; &#39;TXT&#39;>\*\* |     | defaults to undefined |

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

# **updateZoneRrsetRecords**

> ActionResponse1 updateZoneRrsetRecords(updateZoneRrsetRecordsRequest)

Updates resource records\' (RRs) comments of an existing [RRSet](#tag/zone-rrsets) in the [Zone](#tag/zones). Only applicable for [Zones](#tag/zones) in primary mode. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `incorrect_zone_mode` | This operation is not supported for this Zone\'s `mode`. |

### Example

```typescript
import {
  ZoneRRSetActionsApi,
  Configuration,
  UpdateZoneRrsetRecordsRequest,
} from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ZoneRRSetActionsApi(configuration);

let idOrName: string; //ID or Name of the Zone. (default to undefined)
let rrName: string; // (default to undefined)
let rrType:
  | 'A'
  | 'AAAA'
  | 'CAA'
  | 'CNAME'
  | 'DS'
  | 'HINFO'
  | 'HTTPS'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'RP'
  | 'SOA'
  | 'SRV'
  | 'SVCB'
  | 'TLSA'
  | 'TXT'; // (default to undefined)
let updateZoneRrsetRecordsRequest: UpdateZoneRrsetRecordsRequest; //

const { status, data } = await apiInstance.updateZoneRrsetRecords(
  idOrName,
  rrName,
  rrType,
  updateZoneRrsetRecordsRequest,
);
```

### Parameters

| Name                              | Type                              | Description             | Notes                 |
| --------------------------------- | --------------------------------- | ----------------------- | --------------------- | --------------- | ------------ | --------------- | --------------- | ------------ | ------------ | ------------- | ------------ | ------------- | ------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --------------------- |
| **updateZoneRrsetRecordsRequest** | **UpdateZoneRrsetRecordsRequest** |                         |                       |
| **idOrName**                      | [**string**]                      | ID or Name of the Zone. | defaults to undefined |
| **rrName**                        | [**string**]                      |                         | defaults to undefined |
| **rrType**                        | [\*\*&#39;A&#39;                  | &#39;AAAA&#39;          | &#39;CAA&#39;         | &#39;CNAME&#39; | &#39;DS&#39; | &#39;HINFO&#39; | &#39;HTTPS&#39; | &#39;MX&#39; | &#39;NS&#39; | &#39;PTR&#39; | &#39;RP&#39; | &#39;SOA&#39; | &#39;SRV&#39; | &#39;SVCB&#39; | &#39;TLSA&#39; | &#39;TXT&#39;**]**Array<&#39;A&#39; &#124; &#39;AAAA&#39; &#124; &#39;CAA&#39; &#124; &#39;CNAME&#39; &#124; &#39;DS&#39; &#124; &#39;HINFO&#39; &#124; &#39;HTTPS&#39; &#124; &#39;MX&#39; &#124; &#39;NS&#39; &#124; &#39;PTR&#39; &#124; &#39;RP&#39; &#124; &#39;SOA&#39; &#124; &#39;SRV&#39; &#124; &#39;SVCB&#39; &#124; &#39;TLSA&#39; &#124; &#39;TXT&#39;>\*\* |     | defaults to undefined |

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
| **200**     | Request succeeded.                  | -                |
| **4xx**     | Request failed with a user error.   | -                |
| **5xx**     | Request failed with a server error. | -                |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)
