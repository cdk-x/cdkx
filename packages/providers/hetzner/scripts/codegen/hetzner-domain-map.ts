/**
 * Maps Hetzner resource names (PascalCase) to their domain group.
 *
 * The domain determines:
 * - The subdirectory under `src/lib/` where the generated file is placed.
 * - The domain component of `providerType` (e.g. `Hetzner::Networking::Network`).
 * - The `HetznerResourceType` group key used in the generated L1 constructor.
 *
 * Resources outside this map are silently skipped by the extractor.
 */
export const HETZNER_DOMAIN_MAP: Record<string, string> = {
  // Networking
  Network: 'Networking',
  FloatingIp: 'Networking',
  PrimaryIp: 'Networking',
  // Compute
  Server: 'Compute',
  LoadBalancer: 'Compute',
  PlacementGroup: 'Compute',
  // Storage
  Volume: 'Storage',
  // Security
  Certificate: 'Security',
  Firewall: 'Security',
  SshKey: 'Security',
};

/**
 * The Hetzner resource names that have a POST endpoint at the collection level.
 *
 * Derived from paths that match `/<snake_case_plural>` with a POST operation.
 * This list is the source-of-truth for which resources the extractor generates.
 *
 * Key: snake_case path segment (as it appears in the OpenAPI spec).
 * Value: PascalCase resource name used for TypeScript identifiers.
 */
export const HETZNER_RESOURCE_PATHS: Record<string, string> = {
  certificates: 'Certificate',
  firewalls: 'Firewall',
  floating_ips: 'FloatingIp',
  load_balancers: 'LoadBalancer',
  networks: 'Network',
  placement_groups: 'PlacementGroup',
  primary_ips: 'PrimaryIp',
  servers: 'Server',
  ssh_keys: 'SshKey',
  volumes: 'Volume',
};
