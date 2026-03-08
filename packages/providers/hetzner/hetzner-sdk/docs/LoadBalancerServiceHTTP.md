# LoadBalancerServiceHTTP

Configuration option for protocols http and https.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cookie_name** | **string** | Name of the cookie used for sticky sessions. | [optional] [default to 'HCLBSTICKY']
**cookie_lifetime** | **number** | Lifetime of the cookie used for sticky sessions (in seconds). | [optional] [default to 300]
**certificates** | **Array&lt;number&gt;** | IDs of the Certificates to use for TLS/SSL termination by the Load Balancer; empty for TLS/SSL passthrough or if &#x60;protocol&#x60; is &#x60;http&#x60;. | [optional] [default to undefined]
**redirect_http** | **boolean** | Redirect HTTP requests to HTTPS. Only available if &#x60;protocol&#x60; is &#x60;https&#x60;. | [optional] [default to false]
**sticky_sessions** | **boolean** | Use sticky sessions. Only available if &#x60;protocol&#x60; is &#x60;http&#x60; or &#x60;https&#x60;. | [optional] [default to false]

## Example

```typescript
import { LoadBalancerServiceHTTP } from '@cdkx-io/hetzner-sdk';

const instance: LoadBalancerServiceHTTP = {
    cookie_name,
    cookie_lifetime,
    certificates,
    redirect_http,
    sticky_sessions,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
