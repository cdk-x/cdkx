# ListServers200ResponseServersInnerPublicNetIpv6

IPv6 network assigned to this Server and its reverse DNS entry.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | ID of the [Primary IP](#tag/primary-ips). | [optional] [default to undefined]
**ip** | **string** | IP address (v6) of this Server. | [default to undefined]
**blocked** | **boolean** | If the IP is blocked by our anti abuse dept. | [default to undefined]
**dns_ptr** | [**Array&lt;ListServers200ResponseServersInnerPublicNetIpv6DnsPtrInner&gt;**](ListServers200ResponseServersInnerPublicNetIpv6DnsPtrInner.md) | Reverse DNS PTR entries for the IPv6 addresses of this Server. | [default to undefined]

## Example

```typescript
import { ListServers200ResponseServersInnerPublicNetIpv6 } from '@cdkx-io/hetzner-sdk';

const instance: ListServers200ResponseServersInnerPublicNetIpv6 = {
    id,
    ip,
    blocked,
    dns_ptr,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
