// =============================================================================
// AUTO-GENERATED — do not edit manually.
// Regenerate with: yarn nx run @cdk-x/hetzner:codegen
// =============================================================================

import { ProviderResource, PropertyValue, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * Firewalls which should be applied on the Server's public network interface at creation time.
 */
export interface ServerFirewall {
  /** ID of the Firewall. */
  readonly firewall: number;
}

/**
 * Public Network options.
 */
export interface ServerPublicNet {
  /** Attach an IPv4 on the public NIC. If false, no IPv4 address will be attached. */
  readonly enableIpv4?: boolean;
  /** Attach an IPv6 on the public NIC. If false, no IPv6 address will be attached. */
  readonly enableIpv6?: boolean;
  /** ID of the ipv4 Primary IP to use. If omitted and enable_ipv4 is true, a new ipv4 Primary IP will automatically be created. */
  readonly ipv4?: number | null;
  /** ID of the ipv6 Primary IP to use. If omitted and enable_ipv6 is true, a new ipv6 Primary IP will automatically be created. */
  readonly ipv6?: number | null;
}

/**
 * Properties that describe a Hetzner Server resource.
 */
export interface HetznerServer {
  /** Name of the Server to create (must be unique per Project and a valid hostname as per RFC 1123). */
  readonly name: string;
  /** ID or name of the Location to create the Server in (must not be used together with `datacenter`). */
  readonly location?: string;
  /** **Deprecated**: This property is deprecated and will be removed after the 1 July 2026. */
  readonly datacenter?: string;
  /** ID or name of the Server type this Server should be created with. */
  readonly serverType: string;
  /** This automatically triggers a [Power on a Server-Server Action](#tag/server-actions/poweron_server) after the creation is finished and is returned in the `next_actions` response object. */
  readonly startAfterCreate?: boolean;
  /** ID or name of the Image the Server is created from. */
  readonly image: string;
  /** ID of the Placement Group the Server should be in. */
  readonly placementGroup?: number;
  /** SSH key IDs (`integer`) or names (`string`) which should be injected into the Server at creation time. */
  readonly sshKeys?: string[];
  /** Volume IDs which should be attached to the Server at the creation time. Volumes must be in the same Location. */
  readonly volumes?: Array<number | IResolvable>;
  /** Network IDs which should be attached to the Server private network interface at the creation time. */
  readonly networks?: Array<number | IResolvable>;
  /** Firewalls which should be applied on the Server's public network interface at creation time. */
  readonly firewalls?: ServerFirewall[];
  /** Cloud-Init user data to use during Server creation. This field is limited to 32KiB. */
  readonly userData?: string;
  /** User-defined labels (`key/value` pairs) for the Resource. */
  readonly labels?: Record<string, string>;
  /** Auto-mount Volumes after attach. */
  readonly automount?: boolean;
  /** Public Network options. */
  readonly publicNet?: ServerPublicNet;
}

/**
 * Props for {@link NtvHetznerServer}.
 *
 * Identical to {@link HetznerServer} — extended here for future additions.
 */
export interface NtvHetznerServerProps extends HetznerServer {}

/**
 * L1 construct representing a `Hetzner::Compute::Server` resource.
 */
export class NtvHetznerServer extends ProviderResource {
  /**
   * Cloud-assigned ID of this server resource.
   */
  get serverId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'serverId' }),
    };
  }

  /**
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Resource configuration.
   */
  constructor(scope: Construct, id: string, props: NtvHetznerServerProps) {
    super(scope, id, {
      type: HetznerResourceType.Compute.SERVER,
      properties: props as unknown as Record<string, PropertyValue>,
    });
    this.node.defaultChild = this;
  }
}
