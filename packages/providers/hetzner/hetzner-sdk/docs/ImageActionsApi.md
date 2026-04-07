# ImageActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                              | HTTP request                                    | Description                |
| --------------------------------------------------- | ----------------------------------------------- | -------------------------- |
| [**changeImageProtection**](#changeimageprotection) | **POST** /images/{id}/actions/change_protection | Change Image Protection    |
| [**getImageAction**](#getimageaction)               | **GET** /images/{id}/actions/{action_id}        | Get an Action for an Image |
| [**getImagesAction**](#getimagesaction)             | **GET** /images/actions/{id}                    | Get an Action              |
| [**listImageActions**](#listimageactions)           | **GET** /images/{id}/actions                    | List Actions for an Image  |
| [**listImagesActions**](#listimagesactions)         | **GET** /images/actions                         | List Actions               |

# **changeImageProtection**

> ActionResponse1 changeImageProtection(changeImageProtectionRequest)

Changes the protection configuration of the Image. Can only be used on snapshots.

### Example

```typescript
import {
  ImageActionsApi,
  Configuration,
  ChangeImageProtectionRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ImageActionsApi(configuration);

let id: number; //ID of the Image. (default to undefined)
let changeImageProtectionRequest: ChangeImageProtectionRequest; //

const { status, data } = await apiInstance.changeImageProtection(
  id,
  changeImageProtectionRequest,
);
```

### Parameters

| Name                             | Type                             | Description      | Notes                 |
| -------------------------------- | -------------------------------- | ---------------- | --------------------- |
| **changeImageProtectionRequest** | **ChangeImageProtectionRequest** |                  |                       |
| **id**                           | [**number**]                     | ID of the Image. | defaults to undefined |

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

# **getImageAction**

> ActionResponse getImageAction()

Returns a specific Action for an Image.

### Example

```typescript
import { ImageActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ImageActionsApi(configuration);

let id: number; //ID of the Image. (default to undefined)
let actionId: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getImageAction(id, actionId);
```

### Parameters

| Name         | Type         | Description       | Notes                 |
| ------------ | ------------ | ----------------- | --------------------- |
| **id**       | [**number**] | ID of the Image.  | defaults to undefined |
| **actionId** | [**number**] | ID of the Action. | defaults to undefined |

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

# **getImagesAction**

> ActionResponse getImagesAction()

Returns a specific Action object.

### Example

```typescript
import { ImageActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ImageActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getImagesAction(id);
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

# **listImageActions**

> ActionListResponseWithMeta listImageActions()

Returns all Action objects for an Image. You can sort the results by using the `sort` URI parameter, and filter them with the `status` parameter.

### Example

```typescript
import { ImageActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ImageActionsApi(configuration);

let id: number; //ID of the Image. (default to undefined)
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

const { status, data } = await apiInstance.listImageActions(
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
| **id**      | [**number**]                                                                                                                                                                                                                                                                                                                                                                                                             | ID of the Image.                                                                                                                          | defaults to undefined            |
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

# **listImagesActions**

> ActionListResponseWithMeta listImagesActions()

Returns all Action objects. You can `sort` the results by using the sort URI parameter, and filter them with the `status` and `id` parameter.

### Example

```typescript
import { ImageActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ImageActionsApi(configuration);

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

const { status, data } = await apiInstance.listImagesActions(
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
