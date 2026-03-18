import {
  ActionsApi,
  CertificatesApi,
  Configuration,
  FirewallsApi,
  FloatingIPsApi,
  LoadBalancersApi,
  NetworkActionsApi,
  NetworksApi,
  PlacementGroupsApi,
  PrimaryIPsApi,
  ServersApi,
  SSHKeysApi,
  VolumesApi,
} from '@cdkx-io/hetzner-sdk';

/**
 * Facade grouping the Hetzner Cloud SDK API classes used by cdkx
 * resource handlers. Each property exposes a typed API client for a
 * specific domain. Handlers receive this object via
 * {@link HetznerRuntimeContext} and call SDK methods directly.
 */
export interface HetznerSdk {
  readonly actions: ActionsApi;
  readonly certificates: CertificatesApi;
  readonly firewalls: FirewallsApi;
  readonly floatingIps: FloatingIPsApi;
  readonly loadBalancers: LoadBalancersApi;
  readonly networkActions: NetworkActionsApi;
  readonly networks: NetworksApi;
  readonly placementGroups: PlacementGroupsApi;
  readonly primaryIps: PrimaryIPsApi;
  readonly servers: ServersApi;
  readonly sshKeys: SSHKeysApi;
  readonly volumes: VolumesApi;
}

/**
 * Options for creating a {@link HetznerSdk} instance.
 */
export interface HetznerSdkOptions {
  /** Hetzner Cloud API token (Bearer authentication). */
  readonly apiToken: string;
  /** Base URL override. Default: `https://api.hetzner.cloud/v1`. */
  readonly basePath?: string;
}

/**
 * Injectable constructors for all SDK classes used by
 * {@link HetznerSdkFactory}. Tests override these to avoid hitting the
 * real Hetzner API. Each constructor accepts a single `Configuration`
 * argument and returns the corresponding API instance.
 */
export interface HetznerSdkFactoryDeps {
  Configuration?: typeof Configuration;
  ActionsApi?: typeof ActionsApi;
  CertificatesApi?: typeof CertificatesApi;
  FirewallsApi?: typeof FirewallsApi;
  FloatingIPsApi?: typeof FloatingIPsApi;
  LoadBalancersApi?: typeof LoadBalancersApi;
  NetworkActionsApi?: typeof NetworkActionsApi;
  NetworksApi?: typeof NetworksApi;
  PlacementGroupsApi?: typeof PlacementGroupsApi;
  PrimaryIPsApi?: typeof PrimaryIPsApi;
  ServersApi?: typeof ServersApi;
  SSHKeysApi?: typeof SSHKeysApi;
  VolumesApi?: typeof VolumesApi;
}

/**
 * Factory that creates a fully wired {@link HetznerSdk} instance.
 * All API classes share a single {@link Configuration} so authentication
 * and base URL are configured once.
 */
export class HetznerSdkFactory {
  static create(
    options: HetznerSdkOptions,
    deps: HetznerSdkFactoryDeps = {},
  ): HetznerSdk {
    const Cfg = deps.Configuration ?? Configuration;
    const config = new Cfg({
      accessToken: options.apiToken,
      basePath: options.basePath,
    });

    const Actions = deps.ActionsApi ?? ActionsApi;
    const Certificates = deps.CertificatesApi ?? CertificatesApi;
    const Firewalls = deps.FirewallsApi ?? FirewallsApi;
    const FloatingIPs = deps.FloatingIPsApi ?? FloatingIPsApi;
    const LoadBalancers = deps.LoadBalancersApi ?? LoadBalancersApi;
    const NetworkActions = deps.NetworkActionsApi ?? NetworkActionsApi;
    const Networks = deps.NetworksApi ?? NetworksApi;
    const PlacementGroups = deps.PlacementGroupsApi ?? PlacementGroupsApi;
    const PrimaryIPs = deps.PrimaryIPsApi ?? PrimaryIPsApi;
    const Servers = deps.ServersApi ?? ServersApi;
    const SSHKeys = deps.SSHKeysApi ?? SSHKeysApi;
    const Volumes = deps.VolumesApi ?? VolumesApi;

    return {
      actions: new Actions(config),
      certificates: new Certificates(config),
      firewalls: new Firewalls(config),
      floatingIps: new FloatingIPs(config),
      loadBalancers: new LoadBalancers(config),
      networkActions: new NetworkActions(config),
      networks: new Networks(config),
      placementGroups: new PlacementGroups(config),
      primaryIps: new PrimaryIPs(config),
      servers: new Servers(config),
      sshKeys: new SSHKeys(config),
      volumes: new Volumes(config),
    };
  }
}
