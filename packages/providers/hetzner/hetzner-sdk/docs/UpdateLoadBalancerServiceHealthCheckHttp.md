# UpdateLoadBalancerServiceHealthCheckHttp

Additional configuration for protocol http.

## Properties

| Name             | Type                    | Description                                                                                                                                                                | Notes                             |
| ---------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **domain**       | **string**              | Host header to send in the HTTP request. May not contain spaces, percent or backslash symbols. Can be null, in that case no host header is sent.                           | [optional] [default to undefined] |
| **path**         | **string**              | HTTP path to use for health checks. May not contain literal spaces, use percent-encoding instead.                                                                          | [optional] [default to undefined] |
| **response**     | **string**              | String that must be contained in HTTP response in order to pass the health check.                                                                                          | [optional] [default to undefined] |
| **status_codes** | **Array&lt;string&gt;** | List of returned HTTP status codes in order to pass the health check. Supports the wildcards &#x60;?&#x60; for exactly one character and &#x60;\*&#x60; for multiple ones. | [optional] [default to undefined] |
| **tls**          | **boolean**             | Use HTTPS for health check.                                                                                                                                                | [optional] [default to undefined] |

## Example

```typescript
import { UpdateLoadBalancerServiceHealthCheckHttp } from '@cdk-x/hetzner-sdk';

const instance: UpdateLoadBalancerServiceHealthCheckHttp = {
  domain,
  path,
  response,
  status_codes,
  tls,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
