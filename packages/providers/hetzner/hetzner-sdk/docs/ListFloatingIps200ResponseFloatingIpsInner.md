# ListFloatingIps200ResponseFloatingIpsInner

## Properties

| Name              | Type                                                                                                                               | Description                                                                                                                                | Notes                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **id**            | **number**                                                                                                                         | ID of the [Floating IP](#tag/floating-ips).                                                                                                | [default to undefined] |
| **name**          | **string**                                                                                                                         | Name of the Resource. Must be unique per Project.                                                                                          | [default to undefined] |
| **description**   | **string**                                                                                                                         | Description of the Resource.                                                                                                               | [default to undefined] |
| **ip**            | **string**                                                                                                                         | IP address.                                                                                                                                | [default to undefined] |
| **type**          | **string**                                                                                                                         | The Floating IP type.                                                                                                                      | [default to undefined] |
| **server**        | **number**                                                                                                                         | [Server](#tag/servers) the [Floating IP](#tag/floating-ips) is assigned to. &#x60;null&#x60; if not assigned.                              | [default to undefined] |
| **dns_ptr**       | [**Array&lt;ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner&gt;**](ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner.md) | List of reverse DNS entries for the [Floating IP](#tag/floating-ips).                                                                      | [default to undefined] |
| **home_location** | [**ListFloatingIps200ResponseFloatingIpsInnerHomeLocation**](ListFloatingIps200ResponseFloatingIpsInnerHomeLocation.md)            |                                                                                                                                            | [default to undefined] |
| **blocked**       | **boolean**                                                                                                                        | Indicates whether the [Floating IP](#tag/floating-ips) is blocked.                                                                         | [default to undefined] |
| **protection**    | [**ListFloatingIps200ResponseFloatingIpsInnerProtection**](ListFloatingIps200ResponseFloatingIpsInnerProtection.md)                |                                                                                                                                            | [default to undefined] |
| **labels**        | **{ [key: string]: string; }**                                                                                                     | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [default to undefined] |
| **created**       | **string**                                                                                                                         | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).              | [default to undefined] |

## Example

```typescript
import { ListFloatingIps200ResponseFloatingIpsInner } from '@cdk-x/hetzner-sdk';

const instance: ListFloatingIps200ResponseFloatingIpsInner = {
  id,
  name,
  description,
  ip,
  type,
  server,
  dns_ptr,
  home_location,
  blocked,
  protection,
  labels,
  created,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
