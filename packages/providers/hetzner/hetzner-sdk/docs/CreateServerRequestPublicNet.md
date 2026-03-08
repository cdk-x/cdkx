# CreateServerRequestPublicNet

Public Network options.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**enable_ipv4** | **boolean** | Attach an IPv4 on the public NIC. If false, no IPv4 address will be attached. | [optional] [default to true]
**enable_ipv6** | **boolean** | Attach an IPv6 on the public NIC. If false, no IPv6 address will be attached. | [optional] [default to true]
**ipv4** | **number** | ID of the ipv4 Primary IP to use. If omitted and enable_ipv4 is true, a new ipv4 Primary IP will automatically be created. | [optional] [default to undefined]
**ipv6** | **number** | ID of the ipv6 Primary IP to use. If omitted and enable_ipv6 is true, a new ipv6 Primary IP will automatically be created. | [optional] [default to undefined]

## Example

```typescript
import { CreateServerRequestPublicNet } from '@cdkx-io/hetzner-sdk';

const instance: CreateServerRequestPublicNet = {
    enable_ipv4,
    enable_ipv6,
    ipv4,
    ipv6,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
