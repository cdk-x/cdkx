# LoadBalancerServiceHTTP1

Configuration option for protocols http and https.

## Properties

| Name                | Type                    | Description                                                                                                                                                  | Notes                             |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| **cookie_name**     | **string**              | Name of the cookie used for sticky sessions.                                                                                                                 | [optional] [default to undefined] |
| **cookie_lifetime** | **number**              | Lifetime of the cookie used for sticky sessions (in seconds).                                                                                                | [optional] [default to undefined] |
| **certificates**    | **Array&lt;number&gt;** | IDs of the Certificates to use for TLS/SSL termination by the Load Balancer; empty for TLS/SSL passthrough or if &#x60;protocol&#x60; is \&quot;http\&quot;. | [optional] [default to undefined] |
| **redirect_http**   | **boolean**             | Redirect HTTP requests to HTTPS. Only available if protocol is \&quot;https\&quot;.                                                                          | [optional] [default to false]     |
| **sticky_sessions** | **boolean**             | Use sticky sessions. Only available if protocol is \&quot;http\&quot; or \&quot;https\&quot;.                                                                | [optional] [default to false]     |

## Example

```typescript
import { LoadBalancerServiceHTTP1 } from '@cdk-x/hetzner-sdk';

const instance: LoadBalancerServiceHTTP1 = {
  cookie_name,
  cookie_lifetime,
  certificates,
  redirect_http,
  sticky_sessions,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
