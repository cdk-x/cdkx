# AttachToNetworkRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**network** | **number** | ID of an existing network to attach the Server to. | [default to undefined]
**ip** | **string** | IP to request to be assigned to this Server; if you do not provide this then you will be auto assigned an IP address. | [optional] [default to undefined]
**alias_ips** | **Array&lt;string&gt;** | Additional IPs to be assigned to this Server. | [optional] [default to undefined]
**ip_range** | **string** | IP range in CIDR block notation of the subnet to attach to.  This allows for auto assigning an IP address for a specific subnet. Providing &#x60;ip&#x60; that is not part of &#x60;ip_range&#x60; will result in an error.  | [optional] [default to undefined]

## Example

```typescript
import { AttachToNetworkRequest } from '@cdkx-io/hetzner-sdk';

const instance: AttachToNetworkRequest = {
    network,
    ip,
    alias_ips,
    ip_range,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
