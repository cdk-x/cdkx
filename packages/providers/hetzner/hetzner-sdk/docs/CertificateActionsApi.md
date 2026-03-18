# CertificateActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                                  | HTTP request                                   | Description                     |
| ------------------------------------------------------- | ---------------------------------------------- | ------------------------------- |
| [**getCertificateAction**](#getcertificateaction)       | **GET** /certificates/{id}/actions/{action_id} | Get an Action for a Certificate |
| [**getCertificatesAction**](#getcertificatesaction)     | **GET** /certificates/actions/{id}             | Get an Action                   |
| [**listCertificateActions**](#listcertificateactions)   | **GET** /certificates/{id}/actions             | List Actions for a Certificate  |
| [**listCertificatesActions**](#listcertificatesactions) | **GET** /certificates/actions                  | List Actions                    |
| [**retryCertificate**](#retrycertificate)               | **POST** /certificates/{id}/actions/retry      | Retry Issuance or Renewal       |

# **getCertificateAction**

> ActionResponse getCertificateAction()

Returns a specific Action for a Certificate. Only type `managed` Certificates have Actions.

### Example

```typescript
import { CertificateActionsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new CertificateActionsApi(configuration);

let id: number; //ID of the Certificate. (default to undefined)
let actionId: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getCertificateAction(id, actionId);
```

### Parameters

| Name         | Type         | Description            | Notes                 |
| ------------ | ------------ | ---------------------- | --------------------- |
| **id**       | [**number**] | ID of the Certificate. | defaults to undefined |
| **actionId** | [**number**] | ID of the Action.      | defaults to undefined |

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

# **getCertificatesAction**

> ActionResponse getCertificatesAction()

Returns a specific Action object.

### Example

```typescript
import { CertificateActionsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new CertificateActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getCertificatesAction(id);
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

# **listCertificateActions**

> ActionListResponseWithMeta listCertificateActions()

Returns all Action objects for a Certificate. You can sort the results by using the `sort` URI parameter, and filter them with the `status` parameter. Only type `managed` Certificates can have Actions. For type `uploaded` Certificates the `actions` key will always contain an empty array.

### Example

```typescript
import { CertificateActionsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new CertificateActionsApi(configuration);

let id: number; //ID of the Certificate. (default to undefined)
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

const { status, data } = await apiInstance.listCertificateActions(
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
| **id**      | [**number**]                                                                                                                                                                                                                                                                                                                                                                                                             | ID of the Certificate.                                                                                                                    | defaults to undefined            |
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

# **listCertificatesActions**

> ActionListResponseWithMeta listCertificatesActions()

Returns all Action objects. You can `sort` the results by using the sort URI parameter, and filter them with the `status` and `id` parameter.

### Example

```typescript
import { CertificateActionsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new CertificateActionsApi(configuration);

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

const { status, data } = await apiInstance.listCertificatesActions(
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

# **retryCertificate**

> ActionResponse1 retryCertificate()

Retry a failed Certificate issuance or renewal. Only applicable if the type of the Certificate is `managed` and the issuance or renewal status is `failed`. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | | `caa_record_does_not_allow_ca` | CAA record does not allow certificate authority | | | `ca_dns_validation_failed` | Certificate Authority: DNS validation failed | | | `ca_too_many_authorizations_failed_recently` | Certificate Authority: Too many authorizations failed recently | | | `ca_too_many_certificates_issued_for_registered_domain` | Certificate Authority: Too many certificates issued for registered domain | | | `ca_too_many_duplicate_certificates` | Certificate Authority: Too many duplicate certificates | | | `could_not_verify_domain_delegated_to_zone` | Could not verify domain delegated to zone | | | `dns_zone_not_found` | DNS zone not found | | | `dns_zone_is_secondary_zone` | DNS zone is a secondary zone |

### Example

```typescript
import { CertificateActionsApi, Configuration } from '@cdkx-io/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new CertificateActionsApi(configuration);

let id: number; //ID of the Certificate. (default to undefined)

const { status, data } = await apiInstance.retryCertificate(id);
```

### Parameters

| Name   | Type         | Description            | Notes                 |
| ------ | ------------ | ---------------------- | --------------------- |
| **id** | [**number**] | ID of the Certificate. | defaults to undefined |

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
