/**
 * Hetzner Cloud network zones.
 *
 * Each zone groups one or more physical locations. Resources within a stack
 * (networks, subnets, floating IPs, load balancers) must belong to the same
 * network zone.
 *
 * @see https://docs.hetzner.com/cloud/general/locations/
 */
export enum NetworkZone {
  EU_CENTRAL = 'eu-central',
  US_EAST = 'us-east',
  US_WEST = 'us-west',
  AP_SOUTHEAST = 'ap-southeast',
}

/**
 * Hetzner Cloud physical locations.
 *
 * | Location | City                | Network zone  |
 * |----------|---------------------|---------------|
 * | fsn1     | Falkenstein, DE     | eu-central    |
 * | nbg1     | Nuremberg, DE       | eu-central    |
 * | hel1     | Helsinki, FI        | eu-central    |
 * | ash      | Ashburn, VA, US     | us-east       |
 * | hil      | Hillsboro, OR, US   | us-west       |
 * | sin      | Singapore           | ap-southeast  |
 *
 * @see https://docs.hetzner.com/cloud/general/locations/
 */
export enum Location {
  FSN1 = 'fsn1',
  NBG1 = 'nbg1',
  HEL1 = 'hel1',
  ASH = 'ash',
  HIL = 'hil',
  SIN = 'sin',
}

/**
 * Hetzner Cloud resource type identifiers, grouped by domain.
 *
 * Use these constants instead of raw strings when setting the `type` field
 * on a `ProviderResource` — eliminates typos and provides autocompletion.
 *
 * @example
 * super(scope, id, {
 *   type: HetznerResourceType.Networking.NETWORK,
 *   properties: { ... },
 * });
 */
export const HetznerResourceType = {
  Networking: {
    NETWORK: 'Hetzner::Network::Network',
    SUBNET: 'Hetzner::Network::Subnet',
  },
} as const;
