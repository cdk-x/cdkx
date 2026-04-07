# ServerActionsApi

All URIs are relative to *https://api.hetzner.cloud/v1*

| Method                                                                | HTTP request                                               | Description                               |
| --------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| [**addServerToPlacementGroup**](#addservertoplacementgroup)           | **POST** /servers/{id}/actions/add_to_placement_group      | Add a Server to a Placement Group         |
| [**attachServerIso**](#attachserveriso)                               | **POST** /servers/{id}/actions/attach_iso                  | Attach an ISO to a Server                 |
| [**attachServerToNetwork**](#attachservertonetwork)                   | **POST** /servers/{id}/actions/attach_to_network           | Attach a Server to a Network              |
| [**changeServerAliasIps**](#changeserveraliasips)                     | **POST** /servers/{id}/actions/change_alias_ips            | Change alias IPs of a Network             |
| [**changeServerDnsPtr**](#changeserverdnsptr)                         | **POST** /servers/{id}/actions/change_dns_ptr              | Change reverse DNS entry for this Server  |
| [**changeServerProtection**](#changeserverprotection)                 | **POST** /servers/{id}/actions/change_protection           | Change Server Protection                  |
| [**changeServerType**](#changeservertype)                             | **POST** /servers/{id}/actions/change_type                 | Change the Type of a Server               |
| [**createServerImage**](#createserverimage)                           | **POST** /servers/{id}/actions/create_image                | Create Image from a Server                |
| [**detachServerFromNetwork**](#detachserverfromnetwork)               | **POST** /servers/{id}/actions/detach_from_network         | Detach a Server from a Network            |
| [**detachServerIso**](#detachserveriso)                               | **POST** /servers/{id}/actions/detach_iso                  | Detach an ISO from a Server               |
| [**disableServerBackup**](#disableserverbackup)                       | **POST** /servers/{id}/actions/disable_backup              | Disable Backups for a Server              |
| [**disableServerRescue**](#disableserverrescue)                       | **POST** /servers/{id}/actions/disable_rescue              | Disable Rescue Mode for a Server          |
| [**enableServerBackup**](#enableserverbackup)                         | **POST** /servers/{id}/actions/enable_backup               | Enable and Configure Backups for a Server |
| [**enableServerRescue**](#enableserverrescue)                         | **POST** /servers/{id}/actions/enable_rescue               | Enable Rescue Mode for a Server           |
| [**getServerAction**](#getserveraction)                               | **GET** /servers/{id}/actions/{action_id}                  | Get an Action for a Server                |
| [**getServersAction**](#getserversaction)                             | **GET** /servers/actions/{id}                              | Get an Action                             |
| [**listServerActions**](#listserveractions)                           | **GET** /servers/{id}/actions                              | List Actions for a Server                 |
| [**listServersActions**](#listserversactions)                         | **GET** /servers/actions                                   | List Actions                              |
| [**poweroffServer**](#poweroffserver)                                 | **POST** /servers/{id}/actions/poweroff                    | Power off a Server                        |
| [**poweronServer**](#poweronserver)                                   | **POST** /servers/{id}/actions/poweron                     | Power on a Server                         |
| [**rebootServer**](#rebootserver)                                     | **POST** /servers/{id}/actions/reboot                      | Soft-reboot a Server                      |
| [**rebuildServer**](#rebuildserver)                                   | **POST** /servers/{id}/actions/rebuild                     | Rebuild a Server from an Image            |
| [**removeServerFromPlacementGroup**](#removeserverfromplacementgroup) | **POST** /servers/{id}/actions/remove_from_placement_group | Remove from Placement Group               |
| [**requestServerConsole**](#requestserverconsole)                     | **POST** /servers/{id}/actions/request_console             | Request Console for a Server              |
| [**resetServer**](#resetserver)                                       | **POST** /servers/{id}/actions/reset                       | Reset a Server                            |
| [**resetServerPassword**](#resetserverpassword)                       | **POST** /servers/{id}/actions/reset_password              | Reset root Password of a Server           |
| [**shutdownServer**](#shutdownserver)                                 | **POST** /servers/{id}/actions/shutdown                    | Shutdown a Server                         |

# **addServerToPlacementGroup**

> ActionResponse1 addServerToPlacementGroup(addToPlacementGroupRequest)

Adds a Server to a Placement Group. Server must be powered off for this command to succeed. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `server_not_stopped` | The action requires a stopped server | | `422` | `already_in_placement_group` | The server is already part of a placement group |

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  AddToPlacementGroupRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let addToPlacementGroupRequest: AddToPlacementGroupRequest; //

const { status, data } = await apiInstance.addServerToPlacementGroup(
  id,
  addToPlacementGroupRequest,
);
```

### Parameters

| Name                           | Type                           | Description       | Notes                 |
| ------------------------------ | ------------------------------ | ----------------- | --------------------- |
| **addToPlacementGroupRequest** | **AddToPlacementGroupRequest** |                   |                       |
| **id**                         | [**number**]                   | ID of the Server. | defaults to undefined |

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

# **attachServerIso**

> ActionResponse1 attachServerIso(attachServerIsoRequest)

Attaches an ISO to a Server. The Server will immediately see it as a new disk. An already attached ISO will automatically be detached before the new ISO is attached. Servers with attached ISOs have a modified boot order: They will try to boot from the ISO first before falling back to hard disk.

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  AttachServerIsoRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let attachServerIsoRequest: AttachServerIsoRequest; //

const { status, data } = await apiInstance.attachServerIso(
  id,
  attachServerIsoRequest,
);
```

### Parameters

| Name                       | Type                       | Description       | Notes                 |
| -------------------------- | -------------------------- | ----------------- | --------------------- |
| **attachServerIsoRequest** | **AttachServerIsoRequest** |                   |                       |
| **id**                     | [**number**]               | ID of the Server. | defaults to undefined |

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

# **attachServerToNetwork**

> ActionResponse1 attachServerToNetwork(attachToNetworkRequest)

Attaches a Server to a network. This will complement the fixed public Server interface by adding an additional ethernet interface to the Server which is connected to the specified network. The Server will get an IP auto assigned from a subnet of type `server` in the same `network_zone`. Using the `alias_ips` attribute you can also define one or more additional IPs to the Servers. Please note that you will have to configure these IPs by hand on your Server since only the primary IP will be given out by DHCP. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `server_already_attached` | The server is already attached to the network | | `422` | `ip_not_available` | The provided Network IP is not available | | `422` | `no_subnet_available` | No Subnet or IP is available for the Server within the network | | `422` | `networks_overlap` | The network IP range overlaps with one of the server networks |

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  AttachToNetworkRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let attachToNetworkRequest: AttachToNetworkRequest; //

const { status, data } = await apiInstance.attachServerToNetwork(
  id,
  attachToNetworkRequest,
);
```

### Parameters

| Name                       | Type                       | Description       | Notes                 |
| -------------------------- | -------------------------- | ----------------- | --------------------- |
| **attachToNetworkRequest** | **AttachToNetworkRequest** |                   |                       |
| **id**                     | [**number**]               | ID of the Server. | defaults to undefined |

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

# **changeServerAliasIps**

> ActionResponse1 changeServerAliasIps(changeServerAliasIpsRequest)

Changes the alias IPs of an already attached Network. Note that the existing aliases for the specified Network will be replaced with these provided in the request body. So if you want to add an alias IP, you have to provide the existing ones from the Network plus the new alias IP in the request body.

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  ChangeServerAliasIpsRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let changeServerAliasIpsRequest: ChangeServerAliasIpsRequest; //

const { status, data } = await apiInstance.changeServerAliasIps(
  id,
  changeServerAliasIpsRequest,
);
```

### Parameters

| Name                            | Type                            | Description       | Notes                 |
| ------------------------------- | ------------------------------- | ----------------- | --------------------- |
| **changeServerAliasIpsRequest** | **ChangeServerAliasIpsRequest** |                   |                       |
| **id**                          | [**number**]                    | ID of the Server. | defaults to undefined |

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

# **changeServerDnsPtr**

> ActionResponse1 changeServerDnsPtr(changeServerDnsPtrRequest)

Changes the hostname that will appear when getting the hostname belonging to the primary IPs (IPv4 and IPv6) of this Server. Floating IPs assigned to the Server are not affected by this.

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  ChangeServerDnsPtrRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let changeServerDnsPtrRequest: ChangeServerDnsPtrRequest; //Select the IP address for which to change the DNS entry by passing `ip`. It can be either IPv4 or IPv6. The target hostname is set by passing `dns_ptr`, which must be a fully qualified domain name (FQDN) without trailing dot.

const { status, data } = await apiInstance.changeServerDnsPtr(
  id,
  changeServerDnsPtrRequest,
);
```

### Parameters

| Name                          | Type                          | Description                                                                                                                                                                                                                                           | Notes                 |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **changeServerDnsPtrRequest** | **ChangeServerDnsPtrRequest** | Select the IP address for which to change the DNS entry by passing &#x60;ip&#x60;. It can be either IPv4 or IPv6. The target hostname is set by passing &#x60;dns_ptr&#x60;, which must be a fully qualified domain name (FQDN) without trailing dot. |                       |
| **id**                        | [**number**]                  | ID of the Server.                                                                                                                                                                                                                                     | defaults to undefined |

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

# **changeServerProtection**

> ActionResponse1 changeServerProtection(changeServerProtectionRequest)

Changes the protection configuration of the Server.

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  ChangeServerProtectionRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let changeServerProtectionRequest: ChangeServerProtectionRequest; //

const { status, data } = await apiInstance.changeServerProtection(
  id,
  changeServerProtectionRequest,
);
```

### Parameters

| Name                              | Type                              | Description       | Notes                 |
| --------------------------------- | --------------------------------- | ----------------- | --------------------- |
| **changeServerProtectionRequest** | **ChangeServerProtectionRequest** |                   |                       |
| **id**                            | [**number**]                      | ID of the Server. | defaults to undefined |

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

# **changeServerType**

> ActionResponse1 changeServerType(changeServerTypeRequest)

Changes the type (Cores, RAM and disk sizes) of a Server. Server must be powered off for this command to succeed. This copies the content of its disk, and starts it again. You can only migrate to Server types with the same `storage_type` and equal or bigger disks. Shrinking disks is not possible as it might destroy data. If the disk gets upgraded, the Server type can not be downgraded any more. If you plan to downgrade the Server type, set `upgrade_disk` to `false`. #### Operation specific errors | Status | Code | Description | | --- | --- | --- | | `422` | `invalid_server_type` | The server type does not fit for the given server or is deprecated | | `422` | `server_not_stopped` | The action requires a stopped server |

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  ChangeServerTypeRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let changeServerTypeRequest: ChangeServerTypeRequest; //

const { status, data } = await apiInstance.changeServerType(
  id,
  changeServerTypeRequest,
);
```

### Parameters

| Name                        | Type                        | Description       | Notes                 |
| --------------------------- | --------------------------- | ----------------- | --------------------- |
| **changeServerTypeRequest** | **ChangeServerTypeRequest** |                   |                       |
| **id**                      | [**number**]                | ID of the Server. | defaults to undefined |

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

# **createServerImage**

> CreateServerImage201Response createServerImage(createImageRequest)

Creates an Image (snapshot) from a Server by copying the contents of its disks. This creates a snapshot of the current state of the disk and copies it into an Image. If the Server is currently running you must make sure that its disk content is consistent. Otherwise, the created Image may not be readable. To make sure disk content is consistent, we recommend to shut down the Server prior to creating an Image. You can either create a `backup` Image that is bound to the Server and therefore will be deleted when the Server is deleted, or you can create a `snapshot` Image which is completely independent of the Server it was created from and will survive Server deletion. Backup Images are only available when the backup option is enabled for the Server. Snapshot Images are billed on a per GB basis.

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  CreateImageRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let createImageRequest: CreateImageRequest; //

const { status, data } = await apiInstance.createServerImage(
  id,
  createImageRequest,
);
```

### Parameters

| Name                   | Type                   | Description       | Notes                 |
| ---------------------- | ---------------------- | ----------------- | --------------------- |
| **createImageRequest** | **CreateImageRequest** |                   |                       |
| **id**                 | [**number**]           | ID of the Server. | defaults to undefined |

### Return type

**CreateServerImage201Response**

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

# **detachServerFromNetwork**

> ActionResponse1 detachServerFromNetwork(detachFromNetworkRequest)

Detaches a Server from a network. The interface for this network will vanish.

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  DetachFromNetworkRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let detachFromNetworkRequest: DetachFromNetworkRequest; //

const { status, data } = await apiInstance.detachServerFromNetwork(
  id,
  detachFromNetworkRequest,
);
```

### Parameters

| Name                         | Type                         | Description       | Notes                 |
| ---------------------------- | ---------------------------- | ----------------- | --------------------- |
| **detachFromNetworkRequest** | **DetachFromNetworkRequest** |                   |                       |
| **id**                       | [**number**]                 | ID of the Server. | defaults to undefined |

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

# **detachServerIso**

> ActionResponse1 detachServerIso()

Detaches an ISO from a Server. In case no ISO Image is attached to the Server, the status of the returned Action is immediately set to `success`.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.detachServerIso(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

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

# **disableServerBackup**

> ActionResponse1 disableServerBackup()

Disables the automatic backup option and deletes all existing Backups for a Server. No more additional charges for backups will be made. Caution: This immediately removes all existing backups for the Server!

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.disableServerBackup(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

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

# **disableServerRescue**

> ActionResponse1 disableServerRescue()

Disables the Hetzner Rescue System for a Server. This makes a Server start from its disks on next reboot. Rescue Mode is automatically disabled when you first boot into it or if you do not use it for 60 minutes. Disabling rescue mode will not reboot your Server — you will have to do this yourself.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.disableServerRescue(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

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

# **enableServerBackup**

> ActionResponse1 enableServerBackup()

Enables and configures the automatic daily backup option for the Server. Enabling automatic backups will increase the price of the Server by 20%. In return, you will get seven slots where Images of type backup can be stored. Backups are automatically created daily.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.enableServerBackup(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

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

# **enableServerRescue**

> EnableServerRescue201Response enableServerRescue(enableServerRescueRequest)

Enable the Hetzner Rescue System for this Server. The next time a Server with enabled rescue mode boots it will start a special minimal Linux distribution designed for repair and reinstall. In case a Server cannot boot on its own you can use this to access a Server’s disks. Rescue Mode is automatically disabled when you first boot into it or if you do not use it for 60 minutes. Enabling rescue mode will not [reboot](https://docs.hetzner.cloud/#server-actions-soft-reboot-a-server) your Server — you will have to do this yourself.

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  EnableServerRescueRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let enableServerRescueRequest: EnableServerRescueRequest; //

const { status, data } = await apiInstance.enableServerRescue(
  id,
  enableServerRescueRequest,
);
```

### Parameters

| Name                          | Type                          | Description       | Notes                 |
| ----------------------------- | ----------------------------- | ----------------- | --------------------- |
| **enableServerRescueRequest** | **EnableServerRescueRequest** |                   |                       |
| **id**                        | [**number**]                  | ID of the Server. | defaults to undefined |

### Return type

**EnableServerRescue201Response**

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

# **getServerAction**

> ActionResponse getServerAction()

Returns a specific Action object for a Server.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let actionId: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getServerAction(id, actionId);
```

### Parameters

| Name         | Type         | Description       | Notes                 |
| ------------ | ------------ | ----------------- | --------------------- |
| **id**       | [**number**] | ID of the Server. | defaults to undefined |
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

# **getServersAction**

> ActionResponse getServersAction()

Returns a specific Action object.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Action. (default to undefined)

const { status, data } = await apiInstance.getServersAction(id);
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

# **listServerActions**

> ActionListResponseWithMeta listServerActions()

Returns all Action objects for a Server. You can `sort` the results by using the sort URI parameter, and filter them with the `status` parameter.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
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

const { status, data } = await apiInstance.listServerActions(
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
| **id**      | [**number**]                                                                                                                                                                                                                                                                                                                                                                                                             | ID of the Server.                                                                                                                         | defaults to undefined            |
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

# **listServersActions**

> ActionListResponseWithMeta listServersActions()

Returns all Action objects. You can `sort` the results by using the sort URI parameter, and filter them with the `status` and `id` parameter.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

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

const { status, data } = await apiInstance.listServersActions(
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

# **poweroffServer**

> ActionResponse1 poweroffServer()

Cuts power to the Server. This forcefully stops it without giving the Server operating system time to gracefully stop. May lead to data loss, equivalent to pulling the power cord. Power off should only be used when shutdown does not work.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.poweroffServer(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

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

# **poweronServer**

> ActionResponse1 poweronServer()

Starts a Server by turning its power on.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.poweronServer(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

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

# **rebootServer**

> ActionResponse1 rebootServer()

Reboots a Server gracefully by sending an ACPI request. The Server operating system must support ACPI and react to the request, otherwise the Server will not reboot.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.rebootServer(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

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

# **rebuildServer**

> RebuildServer201Response rebuildServer(rebuildServerRequest)

Rebuilds a Server overwriting its disk with the content of an Image, thereby **destroying all data** on the target Server The Image can either be one you have created earlier (`backup` or `snapshot` Image) or it can be a completely fresh `system` Image provided by us. You can get a list of all available Images with `GET /images`. Your Server will automatically be powered off before the rebuild command executes.

### Example

```typescript
import {
  ServerActionsApi,
  Configuration,
  RebuildServerRequest,
} from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)
let rebuildServerRequest: RebuildServerRequest; //To select which Image to rebuild from you can either pass an ID or a name as the `image` argument. Passing a name only works for `system` Images since the other Image types do not have a name set.

const { status, data } = await apiInstance.rebuildServer(
  id,
  rebuildServerRequest,
);
```

### Parameters

| Name                     | Type                     | Description                                                                                                                                                                                                              | Notes                 |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| **rebuildServerRequest** | **RebuildServerRequest** | To select which Image to rebuild from you can either pass an ID or a name as the &#x60;image&#x60; argument. Passing a name only works for &#x60;system&#x60; Images since the other Image types do not have a name set. |                       |
| **id**                   | [**number**]             | ID of the Server.                                                                                                                                                                                                        | defaults to undefined |

### Return type

**RebuildServer201Response**

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

# **removeServerFromPlacementGroup**

> ActionResponse1 removeServerFromPlacementGroup()

Removes a Server from a Placement Group.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.removeServerFromPlacementGroup(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

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

# **requestServerConsole**

> RequestServerConsole201Response requestServerConsole()

Requests credentials for remote access via VNC over websocket to keyboard, monitor, and mouse for a Server. The provided URL is valid for 1 minute, after this period a new url needs to be created to connect to the Server. How long the connection is open after the initial connect is not subject to this timeout.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.requestServerConsole(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

### Return type

**RequestServerConsole201Response**

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

# **resetServer**

> ActionResponse1 resetServer()

Cuts power to a Server and starts it again. This forcefully stops it without giving the Server operating system time to gracefully stop. This may lead to data loss, it’s equivalent to pulling the power cord and plugging it in again. Reset should only be used when reboot does not work.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.resetServer(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

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

# **resetServerPassword**

> ResetServerPassword201Response resetServerPassword()

Resets the root password. Only works for Linux systems that are running the qemu guest agent. Server must be powered on (status `running`) in order for this operation to succeed. This will generate a new password for this Server and return it. If this does not succeed you can use the rescue system to netboot the Server and manually change your Server password by hand.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.resetServerPassword(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

### Return type

**ResetServerPassword201Response**

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

# **shutdownServer**

> ActionResponse1 shutdownServer()

Shuts down a Server gracefully by sending an ACPI shutdown request. The Server operating system must support ACPI and react to the request, otherwise the Server will not shut down. Please note that the `action` status in this case only reflects whether the action was sent to the server. It does not mean that the server actually shut down successfully. If you need to ensure that the server is off, use the `poweroff` action.

### Example

```typescript
import { ServerActionsApi, Configuration } from '@cdk-x/hetzner-sdk';

const configuration = new Configuration();
const apiInstance = new ServerActionsApi(configuration);

let id: number; //ID of the Server. (default to undefined)

const { status, data } = await apiInstance.shutdownServer(id);
```

### Parameters

| Name   | Type         | Description       | Notes                 |
| ------ | ------------ | ----------------- | --------------------- |
| **id** | [**number**] | ID of the Server. | defaults to undefined |

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
