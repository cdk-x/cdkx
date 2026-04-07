# ListServers200ResponseServersInnerLocation

Location this Resource is located at.

## Properties

| Name             | Type       | Description                                                                                                                                                          | Notes                  |
| ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **id**           | **number** | ID of the [Location](#tag/locations).                                                                                                                                | [default to undefined] |
| **name**         | **string** | Unique identifier of the [Location](#tag/locations).                                                                                                                 | [default to undefined] |
| **description**  | **string** | Human readable description of the [Location](#tag/locations).                                                                                                        | [default to undefined] |
| **country**      | **string** | Country the [Location](#tag/locations) resides in. ISO 3166-1 alpha-2 code of the country.                                                                           | [default to undefined] |
| **city**         | **string** | Name of the closest city to the [Location](#tag/locations). City name or city name and state in short form. E.g. &#x60;Falkenstein&#x60; or &#x60;Ashburn, VA&#x60;. | [default to undefined] |
| **latitude**     | **number** | Latitude of the city closest to the [Location](#tag/locations).                                                                                                      | [default to undefined] |
| **longitude**    | **number** | Longitude of the city closest to the [Location](#tag/locations).                                                                                                     | [default to undefined] |
| **network_zone** | **string** | Name of the Network Zone this [Location](#tag/locations) resides in.                                                                                                 | [default to undefined] |

## Example

```typescript
import { ListServers200ResponseServersInnerLocation } from '@cdk-x/hetzner-sdk';

const instance: ListServers200ResponseServersInnerLocation = {
  id,
  name,
  description,
  country,
  city,
  latitude,
  longitude,
  network_zone,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
