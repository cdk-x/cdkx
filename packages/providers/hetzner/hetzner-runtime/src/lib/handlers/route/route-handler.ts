import {
  ResourceHandler,
  RuntimeContext,
  StabilizeStatus,
} from '@cdk-x/core';
import { HetznerSdk } from '../../hetzner-sdk-facade';

/**
 * Deserialized properties for a Hetzner Route resource.
 * Keys match the cdkx schema (camelCase).
 */
export interface HetznerRouteProps {
  readonly networkId: number;
  readonly destination: string;
  readonly gateway: string;
}

/**
 * Persisted state for a Hetzner Route resource.
 * Returned by {@link HetznerRouteHandler.create} and
 * {@link HetznerRouteHandler.get}. Stored by the engine in
 * `ResourceState.outputs`.
 */
export interface HetznerRouteState {
  readonly physicalId: string;
  readonly networkId: number;
  readonly destination: string;
  readonly gateway: string;
}

/**
 * Handler for `Hetzner::Networking::Route` resources.
 * Manages routes via the Hetzner Cloud Network Actions API.
 * Routes are identified by a composite physicalId: `${networkId}/${destination}`
 * since they don't have their own unique ID in the Hetzner API.
 *
 * All mutating SDK calls return a Hetzner Action object. We poll the action
 * until it reaches `success` (or `error`) before returning, because the
 * Hetzner Cloud API only allows one concurrent action per network — returning
 * before the action completes would cause a 422 on the next network operation.
 */
export class HetznerRouteHandler extends ResourceHandler<
  HetznerRouteProps,
  HetznerRouteState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerRouteProps,
  ): Promise<HetznerRouteState> {
    ctx.logger.info('provider.handler.route.create', {
      networkId: props.networkId,
      destination: props.destination,
      gateway: props.gateway,
    });

    const actionResponse = await ctx.sdk.networkActions.addNetworkRoute(
      props.networkId,
      {
        destination: props.destination,
        gateway: props.gateway,
      },
    );

    await this.waitForAction(ctx, actionResponse.data.action.id);

    // The action response doesn't contain the route details directly.
    // We need to fetch the network and find the route by its destination.
    const networkResponse = await ctx.sdk.networks.getNetwork(props.networkId);
    const network = this.assertExists(
      networkResponse.data.network,
      `Hetzner network not found: ${props.networkId}`,
    );

    const routes = network.routes ?? [];
    const route = routes.find((r) => r.destination === props.destination);

    if (!route) {
      throw new Error(
        `Route not found in network ${props.networkId} after creation`,
      );
    }

    const destination = this.assertExists(
      route.destination,
      'Route destination is missing from API response',
    );

    const gateway = this.assertExists(
      route.gateway,
      'Route gateway is missing from API response',
    );

    return {
      physicalId: `${props.networkId}/${destination}`,
      networkId: props.networkId,
      destination: destination,
      gateway: gateway,
    };
  }

  async update(): Promise<HetznerRouteState> {
    throw new Error(
      'HetznerRouteHandler.update: Routes cannot be updated. ' +
        'All properties are create-only. To modify a route, delete and recreate it.',
    );
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerRouteState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.route.delete', {
      physicalId: state.physicalId,
    });

    let actionResponse;
    try {
      actionResponse = await ctx.sdk.networkActions.deleteNetworkRoute(
        state.networkId,
        {
          destination: state.destination,
          gateway: state.gateway,
        },
      );
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.route.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, actionResponse.data.action.id);
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerRouteProps,
  ): Promise<HetznerRouteState> {
    ctx.logger.debug('provider.handler.route.get', {
      networkId: props.networkId,
      destination: props.destination,
    });

    const response = await ctx.sdk.networks.getNetwork(props.networkId);

    const network = this.assertExists(
      response.data.network,
      `Hetzner network not found: ${props.networkId}`,
    );

    const routes = network.routes ?? [];
    const route = routes.find((r) => r.destination === props.destination);

    if (!route) {
      throw new Error(
        `Route not found in network ${props.networkId} with destination ${props.destination}`,
      );
    }

    const destination = this.assertExists(
      route.destination,
      'Route destination is missing from API response',
    );

    const gateway = this.assertExists(
      route.gateway,
      'Route gateway is missing from API response',
    );

    return {
      physicalId: `${props.networkId}/${destination}`,
      networkId: props.networkId,
      destination: destination,
      gateway: gateway,
    };
  }

  /**
   * Polls a Hetzner Action until it reaches `success` or `error`.
   * Hetzner's network API only allows one concurrent action per network;
   * callers must wait for the action to complete before issuing the next one.
   */
  private async waitForAction(
    ctx: RuntimeContext<HetznerSdk>,
    actionId: number,
  ): Promise<void> {
    await this.waitUntilStabilized(async (): Promise<StabilizeStatus> => {
      const response = await ctx.sdk.actions.getAction(actionId);
      const status = response.data.action.status;
      if (status === 'success') return { status: 'ready' };
      if (status === 'running') return { status: 'pending' };
      return {
        status: 'failed',
        reason: `Hetzner action ${actionId} ended with status '${status}'`,
      };
    }, ctx.stabilizeConfig);
  }
}
