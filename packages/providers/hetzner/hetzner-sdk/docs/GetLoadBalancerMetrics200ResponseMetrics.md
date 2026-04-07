# GetLoadBalancerMetrics200ResponseMetrics

## Properties

| Name            | Type                                                                                                                                          | Description                                                                                                           | Notes                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **start**       | **string**                                                                                                                                    | Start of period of metrics reported (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format). | [default to undefined] |
| **end**         | **string**                                                                                                                                    | End of period of metrics reported (in [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339#section-5.6) format).   | [default to undefined] |
| **step**        | **number**                                                                                                                                    | Resolution of results in seconds.                                                                                     | [default to undefined] |
| **time_series** | [**{ [key: string]: GetLoadBalancerMetrics200ResponseMetricsTimeSeriesValue; }**](GetLoadBalancerMetrics200ResponseMetricsTimeSeriesValue.md) | Hash with timeseries information, containing the name of timeseries as key.                                           | [default to undefined] |

## Example

```typescript
import { GetLoadBalancerMetrics200ResponseMetrics } from '@cdk-x/hetzner-sdk';

const instance: GetLoadBalancerMetrics200ResponseMetrics = {
  start,
  end,
  step,
  time_series,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
