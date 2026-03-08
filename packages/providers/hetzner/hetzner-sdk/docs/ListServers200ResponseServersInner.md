# ListServers200ResponseServersInner

## Properties

| Name                  | Type                                                                                                                       | Description                                                                                                                                | Notes                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **id**                | **number**                                                                                                                 | ID of the [Server](#tag/servers).                                                                                                          | [default to undefined]            |
| **name**              | **string**                                                                                                                 | Name of the Server (must be unique per Project and a valid hostname as per RFC 1123).                                                      | [default to undefined]            |
| **status**            | **string**                                                                                                                 | Status of the Server.                                                                                                                      | [default to undefined]            |
| **created**           | **string**                                                                                                                 | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).              | [default to undefined]            |
| **public_net**        | [**ListServers200ResponseServersInnerPublicNet**](ListServers200ResponseServersInnerPublicNet.md)                          |                                                                                                                                            | [default to undefined]            |
| **private_net**       | [**Array&lt;ListServers200ResponseServersInnerPrivateNetInner&gt;**](ListServers200ResponseServersInnerPrivateNetInner.md) | Private networks information.                                                                                                              | [default to undefined]            |
| **server_type**       | [**ListServerTypes200ResponseServerTypesInner**](ListServerTypes200ResponseServerTypesInner.md)                            |                                                                                                                                            | [default to undefined]            |
| **datacenter**        | [**ListServers200ResponseServersInnerDatacenter**](ListServers200ResponseServersInnerDatacenter.md)                        |                                                                                                                                            | [default to undefined]            |
| **location**          | [**ListServers200ResponseServersInnerLocation**](ListServers200ResponseServersInnerLocation.md)                            |                                                                                                                                            | [default to undefined]            |
| **image**             | [**ListServers200ResponseServersInnerImage**](ListServers200ResponseServersInnerImage.md)                                  |                                                                                                                                            | [default to undefined]            |
| **iso**               | [**ListServers200ResponseServersInnerIso**](ListServers200ResponseServersInnerIso.md)                                      |                                                                                                                                            | [default to undefined]            |
| **rescue_enabled**    | **boolean**                                                                                                                | True if rescue mode is enabled. Server will then boot into rescue system on next reboot.                                                   | [default to undefined]            |
| **locked**            | **boolean**                                                                                                                | True if Server has been locked and is not available to user.                                                                               | [default to undefined]            |
| **backup_window**     | **string**                                                                                                                 | Time window (UTC) in which the backup will run, or null if the backups are not enabled.                                                    | [default to undefined]            |
| **outgoing_traffic**  | **number**                                                                                                                 | Outbound Traffic for the current billing period in bytes.                                                                                  | [default to undefined]            |
| **ingoing_traffic**   | **number**                                                                                                                 | Inbound Traffic for the current billing period in bytes.                                                                                   | [default to undefined]            |
| **included_traffic**  | **number**                                                                                                                 | Free Traffic for the current billing period in bytes.                                                                                      | [default to undefined]            |
| **protection**        | [**ListServers200ResponseServersInnerProtection**](ListServers200ResponseServersInnerProtection.md)                        |                                                                                                                                            | [default to undefined]            |
| **labels**            | **{ [key: string]: string; }**                                                                                             | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [default to undefined]            |
| **volumes**           | **Array&lt;number&gt;**                                                                                                    | IDs of Volumes assigned to this Server.                                                                                                    | [optional] [default to undefined] |
| **load_balancers**    | **Array&lt;number&gt;**                                                                                                    | Load Balancer IDs assigned to the server.                                                                                                  | [optional] [default to undefined] |
| **primary_disk_size** | **number**                                                                                                                 | Size of the primary Disk.                                                                                                                  | [default to undefined]            |
| **placement_group**   | [**PlacementGroupNullable**](PlacementGroupNullable.md)                                                                    |                                                                                                                                            | [optional] [default to undefined] |

## Example

```typescript
import { ListServers200ResponseServersInner } from '@cdkx-io/hetzner-sdk';

const instance: ListServers200ResponseServersInner = {
  id,
  name,
  status,
  created,
  public_net,
  private_net,
  server_type,
  datacenter,
  location,
  image,
  iso,
  rescue_enabled,
  locked,
  backup_window,
  outgoing_traffic,
  ingoing_traffic,
  included_traffic,
  protection,
  labels,
  volumes,
  load_balancers,
  primary_disk_size,
  placement_group,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
