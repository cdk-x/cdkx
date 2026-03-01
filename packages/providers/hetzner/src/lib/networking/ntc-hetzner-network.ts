import { ProviderResource, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * Properties that describe a Hetzner Cloud private network resource.
 */
export interface HetznerNetwork {
  /** The network name. */
  readonly name: string;
  /** The CIDR block for the network (e.g. `'10.0.0.0/16'`). */
  readonly ipRange: string;
  /** Arbitrary key-value labels attached to the resource. */
  readonly labels?: Record<string, string>;
  /** When `true`, routes are exposed to a connected vSwitch. */
  readonly exposeRoutesToVswitch?: boolean;
}

/**
 * Props for {@link NtvHetznerNetwork}.
 *
 * Identical to {@link HetznerNetwork} — extended here for future additions.
 */
export interface NtvHetznerNetworkProps extends HetznerNetwork {}

/**
 * L1 construct representing a `Hetzner::Network::Network` resource.
 *
 * Creates a private network in Hetzner Cloud. Subnets and servers can be
 * attached to it. Use `network.networkId` to pass the network reference to
 * other constructs without knowing the concrete ID at construction time.
 *
 * @example
 * const network = new NtvHetznerNetwork(stack, 'Network', {
 *   name: 'my-network',
 *   ipRange: '10.0.0.0/16',
 * });
 */
export class NtvHetznerNetwork extends ProviderResource {
  /**
   * A resolvable reference to this network's ID.
   *
   * Use this to pass the network ID to other constructs (e.g. subnets) without
   * knowing the concrete value at construction time:
   *
   * @example
   * const network = new NtvHetznerNetwork(stack, 'Network', { ... });
   * new NtvHetznerSubnet(stack, 'Subnet', {
   *   networkId: network.networkId,
   *   ...
   * });
   */
  get networkId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'networkId' }),
    };
  }

  /**
   * Creates a new `NtvHetznerNetwork`.
   *
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Network configuration.
   */
  constructor(scope: Construct, id: string, props: NtvHetznerNetworkProps) {
    super(scope, id, {
      type: HetznerResourceType.Networking.NETWORK,
      properties: {
        ...props,
      },
    });
    this.node.defaultChild = this;
  }
}
