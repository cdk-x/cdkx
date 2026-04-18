import { ResourceHandler, RuntimeContext, Crn } from '@cdk-x/core';
import { HetznerSdk } from '../../hetzner-sdk-facade';

/**
 * Deserialized properties for a Hetzner Network resource.
 * Keys match the cdkx schema (camelCase).
 */
export interface HetznerNetworkProps {
  readonly name: string;
  readonly ipRange: string;
  readonly labels?: Record<string, string>;
  readonly exposeRoutesToVswitch?: boolean;
}

/**
 * Persisted state for a Hetzner Network resource.
 * Returned by {@link HetznerNetworkHandler.create} and
 * {@link HetznerNetworkHandler.get}. Stored by the engine in
 * `ResourceState.outputs`.
 */
export interface HetznerNetworkState {
  readonly networkId: number;
  readonly name: string;
  readonly ipRange: string;
  readonly labels: Record<string, string>;
  readonly exposeRoutesToVswitch: boolean;
}

/**
 * Handler for `Hetzner::Networking::Network` resources.
 * Translates cdkx CRUD lifecycle calls into Hetzner Cloud SDK
 * requests, mapping camelCase props to snake_case SDK types
 * explicitly.
 */
export class HetznerNetworkHandler extends ResourceHandler<
  HetznerNetworkProps,
  HetznerNetworkState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerNetworkProps,
  ): Promise<HetznerNetworkState> {
    ctx.logger.info('provider.handler.network.create', {
      name: props.name,
    });

    let response;
    try {
      response = await ctx.sdk.networks.createNetwork({
        name: props.name,
        ip_range: props.ipRange,
        labels: props.labels,
        expose_routes_to_vswitch: props.exposeRoutesToVswitch,
      });
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.network.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const network = this.assertExists(
      response.data.network,
      'Hetzner API returned no network object in create response',
    );

    return {
      networkId: network.id,
      name: network.name,
      ipRange: network.ip_range,
      labels: network.labels ?? {},
      exposeRoutesToVswitch: network.expose_routes_to_vswitch,
    };
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerNetworkProps,
    state: HetznerNetworkState,
  ): Promise<HetznerNetworkState> {
    ctx.logger.info('provider.handler.network.update', {
      networkId: state.networkId,
      name: props.name,
    });

    let response;
    try {
      response = await ctx.sdk.networks.updateNetwork(state.networkId, {
        name: props.name,
        labels: props.labels,
        expose_routes_to_vswitch: props.exposeRoutesToVswitch,
      });
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.network.update.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const network = this.assertExists(
      response.data.network,
      'Hetzner API returned no network object in update response',
    );

    return {
      networkId: network.id,
      name: network.name,
      ipRange: network.ip_range,
      labels: network.labels ?? {},
      exposeRoutesToVswitch: network.expose_routes_to_vswitch,
    };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerNetworkState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.network.delete', {
      networkId: state.networkId,
    });

    try {
      await ctx.sdk.networks.deleteNetwork(state.networkId);
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.network.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerNetworkProps,
  ): Promise<HetznerNetworkState> {
    ctx.logger.debug('provider.handler.network.get', {
      name: props.name,
    });

    const listResponse = await ctx.sdk.networks.listNetworks(
      undefined,
      props.name,
    );

    const networks = listResponse.data.networks ?? [];
    const network = this.assertExists(
      networks[0],
      `Hetzner network not found: ${props.name}`,
    );

    return {
      networkId: network.id,
      name: network.name,
      ipRange: network.ip_range,
      labels: network.labels ?? {},
      exposeRoutesToVswitch: network.expose_routes_to_vswitch,
    };
  }

  buildCrn(_props: HetznerNetworkProps, state: HetznerNetworkState): string {
    // Parse typeName: Hetzner::Networking::Network
    // For now, hardcode the values as we don't have typeName in props
    // In the future, typeName should be passed via props
    return Crn.format({
      provider: 'hetzner',
      domain: 'networking',
      // Region is not available in Network state, will be empty for now
      // ProjectId is out of scope for this iteration
      resourceType: 'network',
      resourceId: String(state.networkId),
    });
  }
}
