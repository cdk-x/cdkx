import { ResourceHandler, RuntimeContext } from '@cdkx-io/core';
import { HetznerSdk } from '../../hetzner-sdk-facade';

/**
 * Deserialized properties for a Hetzner Subnet resource.
 * Keys match the cdkx schema (camelCase).
 */
export interface HetznerSubnetProps {
  readonly networkId: number;
  readonly type: 'cloud' | 'server' | 'vswitch';
  readonly networkZone: string;
  readonly ipRange?: string;
  readonly vswitchId?: number;
}

/**
 * Persisted state for a Hetzner Subnet resource.
 * Returned by {@link HetznerSubnetHandler.create} and
 * {@link HetznerSubnetHandler.get}. Stored by the engine in
 * `ResourceState.outputs`.
 */
export interface HetznerSubnetState {
  readonly physicalId: string;
  readonly networkId: number;
  readonly type: string;
  readonly networkZone: string;
  readonly ipRange: string;
  readonly vswitchId?: number;
  readonly gateway?: string;
}

/**
 * Handler for `Hetzner::Networking::Subnet` resources.
 * Manages subnets via the Hetzner Cloud Network Actions API.
 * Subnets are identified by a composite physicalId: `${networkId}/${ipRange}`
 * since they don't have their own unique ID in the Hetzner API.
 */
export class HetznerSubnetHandler extends ResourceHandler<
  HetznerSubnetProps,
  HetznerSubnetState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerSubnetProps,
  ): Promise<HetznerSubnetState> {
    ctx.logger.info('provider.handler.subnet.create', {
      networkId: props.networkId,
      ipRange: props.ipRange,
    });

    await ctx.sdk.networkActions.addNetworkSubnet(props.networkId, {
      type: props.type,
      network_zone: props.networkZone,
      ip_range: props.ipRange,
      vswitch_id: props.vswitchId,
    });

    // The action response doesn't contain the subnet details directly.
    // We need to fetch the network and find the subnet by its properties.
    // If ipRange was auto-assigned, we find it by matching type and zone.
    const networkResponse = await ctx.sdk.networks.getNetwork(props.networkId);
    const network = this.assertExists(
      networkResponse.data.network,
      `Hetzner network not found: ${props.networkId}`,
    );

    const subnets = network.subnets ?? [];

    // Find the subnet. If ipRange was provided, match by that.
    // Otherwise, match by type and zone (should be unique for auto-assigned)
    const subnet = props.ipRange
      ? subnets.find((s) => s.ip_range === props.ipRange)
      : subnets.find(
          (s) => s.type === props.type && s.network_zone === props.networkZone,
        );

    if (!subnet) {
      throw new Error(
        `Subnet not found in network ${props.networkId} after creation`,
      );
    }

    const ipRange = this.assertExists(
      subnet.ip_range,
      'Subnet ip_range is missing from API response',
    );

    return {
      physicalId: `${props.networkId}/${ipRange}`,
      networkId: props.networkId,
      type: subnet.type,
      networkZone: subnet.network_zone,
      ipRange: ipRange,
      vswitchId: subnet.vswitch_id ?? undefined,
      gateway: subnet.gateway ?? undefined,
    };
  }

  async update(): Promise<HetznerSubnetState> {
    throw new Error(
      'HetznerSubnetHandler.update: Subnets cannot be updated. ' +
        'All properties are create-only. To modify a subnet, delete and recreate it.',
    );
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerSubnetState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.subnet.delete', {
      physicalId: state.physicalId,
    });

    await ctx.sdk.networkActions.deleteNetworkSubnet(state.networkId, {
      ip_range: state.ipRange,
    });
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerSubnetProps,
  ): Promise<HetznerSubnetState> {
    ctx.logger.debug('provider.handler.subnet.get', {
      networkId: props.networkId,
      ipRange: props.ipRange,
    });

    const response = await ctx.sdk.networks.getNetwork(props.networkId);

    const network = this.assertExists(
      response.data.network,
      `Hetzner network not found: ${props.networkId}`,
    );

    const subnets = network.subnets ?? [];
    const ipRange = this.assertExists(
      props.ipRange,
      'ipRange is required to identify a subnet',
    );
    const subnet = subnets.find((s) => s.ip_range === ipRange);

    if (!subnet) {
      throw new Error(
        `Subnet not found in network ${props.networkId} with ipRange ${ipRange}`,
      );
    }

    const subnetIpRange = this.assertExists(
      subnet.ip_range,
      'Subnet ip_range is missing from API response',
    );

    const networkZone = this.assertExists(
      subnet.network_zone,
      'Subnet network_zone is missing from API response',
    );

    return {
      physicalId: `${props.networkId}/${subnetIpRange}`,
      networkId: props.networkId,
      type: subnet.type,
      networkZone: networkZone,
      ipRange: subnetIpRange,
      vswitchId: subnet.vswitch_id ?? undefined,
      gateway: subnet.gateway ?? undefined,
    };
  }
}
