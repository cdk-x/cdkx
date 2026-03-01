// =============================================================================
// AUTO-GENERATED — do not edit manually.
// Regenerate with: yarn nx run @cdk-x/hetzner:codegen
// =============================================================================

import { ProviderResource, PropertyValue, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * Array of subnets to allocate.
 */
export interface NetworkSubnet {
  /** Type of subnet. */
  readonly type: NetworkSubnetType;
  /** IP range of the subnet. */
  readonly ipRange?: string;
  /** Name of the [Network Zone](#tag/network-zones). */
  readonly networkZone: string;
  /** ID of the robot vSwitch. */
  readonly vswitchId?: string | number | IResolvable;
}

/**
 * Array of routes set in this [Network](#tag/networks).
 */
export interface NetworkRoute {
  /** Destination network or host of the route. */
  readonly destination: string;
  /** Gateway of the route. */
  readonly gateway: string;
}

/**
 * Type of subnet.

 */
export enum NetworkSubnetType {
  /** Used to connect cloud [Servers](#tag/servers) and [Load Balancers](#tag/load-balancers). */
  CLOUD = 'cloud',
  /** Same as the `cloud` type. **Deprecated**, use the `cloud` type instead. */
  SERVER = 'server',
  /** Used to [connect cloud Servers and Load Balancers with dedicated Servers](https://docs.hetzner.com/cloud/networks/connect-dedi-vswitch). */
  VSWITCH = 'vswitch',
}

/**
 * Properties that describe a Hetzner Network resource.
 */
export interface HetznerNetwork {
  /** Name of the [Network](#tag/networks). */
  readonly name: string;
  /** IP range of the [Network](#tag/networks). */
  readonly ipRange: string;
  /** User-defined labels (`key/value` pairs) for the Resource. */
  readonly labels?: Record<string, string>;
  /** Array of subnets to allocate. */
  readonly subnets?: NetworkSubnet[];
  /** Array of routes set in this [Network](#tag/networks). */
  readonly routes?: NetworkRoute[];
  /** Toggle to expose routes to the [Networks](#tag/networks) vSwitch. */
  readonly exposeRoutesToVswitch?: boolean;
}

/**
 * Props for {@link NtvHetznerNetwork}.
 *
 * Identical to {@link HetznerNetwork} — extended here for future additions.
 */
export interface NtvHetznerNetworkProps extends HetznerNetwork {}

/**
 * L1 construct representing a `Hetzner::Networking::Network` resource.
 */
export class NtvHetznerNetwork extends ProviderResource {
  /**
   * Cloud-assigned ID of this network resource.
   */
  get networkId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'networkId' }),
    };
  }

  /**
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Resource configuration.
   */
  constructor(scope: Construct, id: string, props: NtvHetznerNetworkProps) {
    super(scope, id, {
      type: HetznerResourceType.Networking.NETWORK,
      properties: props as unknown as Record<string, PropertyValue>,
    });
    this.node.defaultChild = this;
  }
}
