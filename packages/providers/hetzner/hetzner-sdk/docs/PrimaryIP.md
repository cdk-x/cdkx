# PrimaryIP

## Properties

| Name              | Type                                                                                                                               | Description                                                                                                                                | Notes                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **id**            | **number**                                                                                                                         | ID of the [Primary IP](#tag/primary-ips).                                                                                                  | [default to undefined] |
| **name**          | **string**                                                                                                                         | Name of the Resource. Must be unique per Project.                                                                                          | [default to undefined] |
| **labels**        | **{ [key: string]: string; }**                                                                                                     | User-defined labels (&#x60;key/value&#x60; pairs) for the Resource. For more information, see \&quot;[Labels](#description/labels)\&quot;. | [default to undefined] |
| **created**       | **string**                                                                                                                         | Point in time when the Resource was created (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).              | [default to undefined] |
| **blocked**       | **boolean**                                                                                                                        | Blocked state of the [Primary IP](#tag/primary-ips).                                                                                       | [default to undefined] |
| **datacenter**    | [**PrimaryIPDatacenter**](PrimaryIPDatacenter.md)                                                                                  |                                                                                                                                            | [default to undefined] |
| **location**      | [**PrimaryIPLocation**](PrimaryIPLocation.md)                                                                                      |                                                                                                                                            | [default to undefined] |
| **ip**            | **string**                                                                                                                         | IP address.                                                                                                                                | [default to undefined] |
| **dns_ptr**       | [**Array&lt;ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner&gt;**](ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner.md) | List of reverse DNS records.                                                                                                               | [default to undefined] |
| **protection**    | [**ListFloatingIps200ResponseFloatingIpsInnerProtection**](ListFloatingIps200ResponseFloatingIpsInnerProtection.md)                |                                                                                                                                            | [default to undefined] |
| **type**          | **string**                                                                                                                         | [Primary IP](#tag/primary-ips) type.                                                                                                       | [default to undefined] |
| **auto_delete**   | **boolean**                                                                                                                        | Auto deletion state. If enabled the [Primary IP](#tag/primary-ips) will be deleted once the assigned resource gets deleted.                | [default to false]     |
| **assignee_type** | **string**                                                                                                                         | Type of resource the [Primary IP](#tag/primary-ips) can get assigned to.                                                                   | [default to undefined] |
| **assignee_id**   | **number**                                                                                                                         | ID of resource the [Primary IP](#tag/primary-ips) is assigned to. &#x60;null&#x60; if the [Primary IP](#tag/primary-ips) is not assigned.  | [default to undefined] |

## Example

```typescript
import { PrimaryIP } from '@cdk-x/hetzner-sdk';

const instance: PrimaryIP = {
  id,
  name,
  labels,
  created,
  blocked,
  datacenter,
  location,
  ip,
  dns_ptr,
  protection,
  type,
  auto_delete,
  assignee_type,
  assignee_id,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
