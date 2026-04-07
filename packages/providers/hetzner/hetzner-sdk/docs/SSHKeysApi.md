# SSHKeysApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                            | HTTP request              | Description       |
| --------------------------------- | ------------------------- | ----------------- |
| [**createSshKey**](#createsshkey) | **POST** /ssh_keys        | Create an SSH key |
| [**deleteSshKey**](#deletesshkey) | **DELETE** /ssh_keys/{id} | Delete an SSH key |
| [**getSshKey**](#getsshkey)       | **GET** /ssh_keys/{id}    | Get a SSH key     |
| [**listSshKeys**](#listsshkeys)   | **GET** /ssh_keys         | List SSH keys     |
| [**updateSshKey**](#updatesshkey) | **PUT** /ssh_keys/{id}    | Update an SSH key |

# **createSshKey**

> CreateSshKey201Response createSshKey(createSshKeyRequest)

Creates a new SSH key with the given `name` and `public_key`. Once an SSH key is created, it can be used in other calls such as creating Servers.

### Example

```typescript
import {
  SSHKeysApi,
  Configuration,
  CreateSshKeyRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new SSHKeysApi(configuration);

let createSshKeyRequest: CreateSshKeyRequest; //

const { status, data } = await apiInstance.createSshKey(createSshKeyRequest);
```

### Parameters

| Name                    | Type                    | Description | Notes |
| ----------------------- | ----------------------- | ----------- | ----- |
| **createSshKeyRequest** | **CreateSshKeyRequest** |             |       |

### Return type

**CreateSshKey201Response**

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

# **deleteSshKey**

> deleteSshKey()

Deletes an SSH key. It cannot be used anymore.

### Example

```typescript
import { SSHKeysApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new SSHKeysApi(configuration);

let id: number; //ID of the SSH Key. (default to undefined)

const { status, data } = await apiInstance.deleteSshKey(id);
```

### Parameters

| Name   | Type         | Description        | Notes                 |
| ------ | ------------ | ------------------ | --------------------- |
| **id** | [**number**] | ID of the SSH Key. | defaults to undefined |

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

# **getSshKey**

> CreateSshKey201Response getSshKey()

Returns a specific SSH key object.

### Example

```typescript
import { SSHKeysApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new SSHKeysApi(configuration);

let id: number; //ID of the SSH Key. (default to undefined)

const { status, data } = await apiInstance.getSshKey(id);
```

### Parameters

| Name   | Type         | Description        | Notes                 |
| ------ | ------------ | ------------------ | --------------------- |
| **id** | [**number**] | ID of the SSH Key. | defaults to undefined |

### Return type

**CreateSshKey201Response**

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

# **listSshKeys**

> ListSshKeys200Response listSshKeys()

Returns all SSH key objects.

### Example

```typescript
import { SSHKeysApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new SSHKeysApi(configuration);

let sort: Array<
  'id' | 'id:asc' | 'id:desc' | 'name' | 'name:asc' | 'name:desc'
>; //Sort resources by field and direction. Can be used multiple times. For more information, see \"[Sorting](#description/sorting)\".  (optional) (default to undefined)
let name: string; //Filter resources by their name. The response will only contain the resources matching exactly the specified name.  (optional) (default to undefined)
let fingerprint: string; //Can be used to filter SSH keys by their fingerprint. The response will only contain the SSH key matching the specified fingerprint. (optional) (default to undefined)
let labelSelector: string; //Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \"[Label Selector](#description/label-selector)\".  (optional) (default to undefined)
let page: number; //Page number to return. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 1)
let perPage: number; //Maximum number of entries returned per page. For more information, see \"[Pagination](#description/pagination)\". (optional) (default to 25)

const { status, data } = await apiInstance.listSshKeys(
  sort,
  name,
  fingerprint,
  labelSelector,
  page,
  perPage,
);
```

### Parameters

| Name              | Type                                                                                                                                                | Description                                                                                                                                                                              | Notes                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **sort**          | **Array<&#39;id&#39; &#124; &#39;id:asc&#39; &#124; &#39;id:desc&#39; &#124; &#39;name&#39; &#124; &#39;name:asc&#39; &#124; &#39;name:desc&#39;>** | Sort resources by field and direction. Can be used multiple times. For more information, see \&quot;[Sorting](#description/sorting)\&quot;.                                              | (optional) defaults to undefined |
| **name**          | [**string**]                                                                                                                                        | Filter resources by their name. The response will only contain the resources matching exactly the specified name.                                                                        | (optional) defaults to undefined |
| **fingerprint**   | [**string**]                                                                                                                                        | Can be used to filter SSH keys by their fingerprint. The response will only contain the SSH key matching the specified fingerprint.                                                      | (optional) defaults to undefined |
| **labelSelector** | [**string**]                                                                                                                                        | Filter resources by labels. The response will only contain resources matching the label selector. For more information, see \&quot;[Label Selector](#description/label-selector)\&quot;. | (optional) defaults to undefined |
| **page**          | [**number**]                                                                                                                                        | Page number to return. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                                                    | (optional) defaults to 1         |
| **perPage**       | [**number**]                                                                                                                                        | Maximum number of entries returned per page. For more information, see \&quot;[Pagination](#description/pagination)\&quot;.                                                              | (optional) defaults to 25        |

### Return type

**ListSshKeys200Response**

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

# **updateSshKey**

> CreateSshKey201Response updateSshKey(updateSshKeyRequest)

Updates an SSH key. You can update an SSH key name and an SSH key labels.

### Example

```typescript
import {
  SSHKeysApi,
  Configuration,
  UpdateSshKeyRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new SSHKeysApi(configuration);

let id: number; //ID of the SSH Key. (default to undefined)
let updateSshKeyRequest: UpdateSshKeyRequest; //

const { status, data } = await apiInstance.updateSshKey(
  id,
  updateSshKeyRequest,
);
```

### Parameters

| Name                    | Type                    | Description        | Notes                 |
| ----------------------- | ----------------------- | ------------------ | --------------------- |
| **updateSshKeyRequest** | **UpdateSshKeyRequest** |                    |                       |
| **id**                  | [**number**]            | ID of the SSH Key. | defaults to undefined |

### Return type

**CreateSshKey201Response**

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
