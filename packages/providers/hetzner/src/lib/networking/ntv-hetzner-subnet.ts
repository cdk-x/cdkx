import { ProviderResource, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType, NetworkZone } from '../common/index.js';

/**
 * The type of a Hetzner Cloud subnet.
 *
 * Determines how the subnet interacts with Hetzner infrastructure.
 */
export enum SubnetType {
  /** A cloud subnet — used for Hetzner Cloud servers. */
  CLOUD = 'cloud',
  /** A server subnet — used for Hetzner Root (bare-metal) servers. */
  SERVER = 'server',
  /** A vSwitch subnet — used to connect Hetzner Cloud and Root Server networks via a vSwitch. */
  VSWITCH = 'vswitch',
}

/**
 * Properties that describe a Hetzner Cloud subnet resource.
 */
export interface HetznerSubnet {
  /**
   * The ID of the parent network this subnet belongs to.
   *
   * Accepts a plain `string` or `number` ID, or an `IResolvable` token
   * (e.g. `network.networkId`) for cross-resource references that are
   * resolved at synthesis time.
   */
  readonly networkId: string | number | IResolvable;
  /** The subnet type — determines connectivity behaviour. */
  readonly type: SubnetType;
  /** The network zone the subnet resides in. Must match the parent network's zone. */
  readonly networkZone: NetworkZone;
  /** The CIDR block for the subnet (e.g. `'10.0.1.0/24'`). Must be within the parent network's IP range. */
  readonly ipRange: string;
  /** The vSwitch ID. Required only when `type` is `SubnetType.VSWITCH`. */
  readonly vswitchId?: number;
}

/**
 * Props for {@link NtvHetznerSubnet}.
 *
 * Identical to {@link HetznerSubnet} — extended here for future additions.
 */
export interface NtvHetznerSubnetProps extends HetznerSubnet {}

/**
 * L1 construct representing a `Hetzner::Network::Subnet` resource.
 *
 * Creates a subnet inside an existing Hetzner Cloud network. Use
 * `network.networkId` to reference the parent network without hard-coding
 * its ID at construction time.
 *
 * @example
 * const network = new NtvHetznerNetwork(stack, 'Network', {
 *   name: 'my-network',
 *   ipRange: '10.0.0.0/16',
 * });
 *
 * const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
 *   networkId: network.networkId,
 *   type: SubnetType.CLOUD,
 *   networkZone: NetworkZone.EU_CENTRAL,
 *   ipRange: '10.0.1.0/24',
 * });
 */
export class NtvHetznerSubnet extends ProviderResource {
  /**
   * A resolvable reference to this subnet's ID.
   *
   * Use this to pass the subnet ID to other constructs without knowing
   * the concrete value at construction time:
   *
   * @example
   * const subnet = new NtvHetznerSubnet(stack, 'Subnet', { ... });
   * new NtvHetznerServer(stack, 'Server', {
   *   subnetId: subnet.subnetId,
   *   ...
   * });
   */
  get subnetId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'subnetId' }),
    };
  }

  /**
   * Creates a new `NtvHetznerSubnet`.
   *
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Subnet configuration.
   */
  constructor(scope: Construct, id: string, props: NtvHetznerSubnetProps) {
    super(scope, id, {
      type: HetznerResourceType.Networking.SUBNET,
      properties: {
        ...props,
      },
    });
    this.node.defaultChild = this;
  }
}
