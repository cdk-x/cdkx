import { ResourceHandler, RuntimeContext } from '@cdk-x/core';
import { HetznerFloatingIp, Location } from '@cdk-x/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

/**
 * Persisted state for a Hetzner Floating IP resource.
 * Extends the generated props interface with the numeric id returned
 * by the API (required for update and delete calls).
 */
export interface HetznerFloatingIpState extends HetznerFloatingIp {
  readonly floatingIpId: number;
}

/**
 * Handler for `Hetzner::Networking::FloatingIp` resources.
 * Translates cdkx CRUD lifecycle calls into Hetzner Cloud SDK
 * requests, mapping camelCase props to snake_case SDK types explicitly.
 */
export class HetznerFloatingIpHandler extends ResourceHandler<
  HetznerFloatingIp,
  HetznerFloatingIpState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFloatingIp,
  ): Promise<HetznerFloatingIpState> {
    ctx.logger.info('provider.handler.floating-ip.create', {
      name: props.name,
    });

    let response;
    try {
      response = await ctx.sdk.floatingIps.createFloatingIp({
        type: props.type,
        home_location: props.homeLocation as string | undefined,
        name: props.name,
        description: props.description,
        labels: props.labels,
      });
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.floating-ip.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const ip = this.assertExists(
      response.data.floating_ip,
      'Hetzner API returned no floating_ip object in create response',
    );

    return this.toState(ip);
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFloatingIp,
    state: HetznerFloatingIpState,
  ): Promise<HetznerFloatingIpState> {
    ctx.logger.info('provider.handler.floating-ip.update', {
      floatingIpId: state.floatingIpId,
      name: props.name,
    });

    let response;
    try {
      response = await ctx.sdk.floatingIps.updateFloatingIp(
        state.floatingIpId,
        {
          name: props.name,
          description: props.description,
          labels: props.labels,
        },
      );
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.floating-ip.update.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const ip = this.assertExists(
      response.data.floating_ip,
      'Hetzner API returned no floating_ip object in update response',
    );

    return this.toState(ip);
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerFloatingIpState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.floating-ip.delete', {
      floatingIpId: state.floatingIpId,
    });

    try {
      await ctx.sdk.floatingIps.deleteFloatingIp(state.floatingIpId);
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.floating-ip.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFloatingIp,
  ): Promise<HetznerFloatingIpState> {
    ctx.logger.debug('provider.handler.floating-ip.get', { name: props.name });

    const listResponse = await ctx.sdk.floatingIps.listFloatingIps(props.name);

    const ips = listResponse.data.floating_ips ?? [];
    const ip = this.assertExists(
      ips[0],
      `Hetzner floating IP not found: ${props.name}`,
    );

    return this.toState(ip);
  }

  private toState(ip: {
    id: number;
    type: string;
    name: string;
    description?: string | null;
    home_location: { name: string };
    labels?: Record<string, string> | null;
  }): HetznerFloatingIpState {
    return {
      floatingIpId: ip.id,
      type: ip.type as HetznerFloatingIp['type'],
      name: ip.name,
      description: ip.description,
      homeLocation: ip.home_location.name as Location,
      labels: ip.labels ?? {},
    };
  }
}
