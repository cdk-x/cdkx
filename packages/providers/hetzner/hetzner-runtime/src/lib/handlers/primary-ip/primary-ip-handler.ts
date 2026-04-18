import { ResourceHandler, RuntimeContext, Crn } from '@cdk-x/core';
import {
  HetznerPrimaryIp,
  PrimaryIpAssigneeType,
  PrimaryIpType,
} from '@cdk-x/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

/**
 * Persisted state for a Hetzner Primary IP resource.
 * Extends the generated props interface with the numeric id returned
 * by the API (required for update and delete calls).
 */
export interface HetznerPrimaryIpState extends HetznerPrimaryIp {
  readonly primaryIpId: number;
}

/**
 * Handler for `Hetzner::Networking::PrimaryIp` resources.
 * Translates cdkx CRUD lifecycle calls into Hetzner Cloud SDK
 * requests, mapping camelCase props to snake_case SDK types explicitly.
 */
export class HetznerPrimaryIpHandler extends ResourceHandler<
  HetznerPrimaryIp,
  HetznerPrimaryIpState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerPrimaryIp,
  ): Promise<HetznerPrimaryIpState> {
    ctx.logger.info('provider.handler.primary-ip.create', { name: props.name });

    let response;
    try {
      response = await ctx.sdk.primaryIps.createPrimaryIp({
        name: props.name,
        type: props.type as string as never,
        assignee_type: props.assigneeType as string as never,
        location: props.location as string | undefined,
        labels: props.labels,
        auto_delete: props.autoDelete,
      });
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.primary-ip.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const ip = this.assertExists(
      response.data.primary_ip,
      'Hetzner API returned no primary_ip object in create response',
    );

    return this.toState(ip);
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerPrimaryIp,
    state: HetznerPrimaryIpState,
  ): Promise<HetznerPrimaryIpState> {
    ctx.logger.info('provider.handler.primary-ip.update', {
      primaryIpId: state.primaryIpId,
      name: props.name,
    });

    let response;
    try {
      response = await ctx.sdk.primaryIps.updatePrimaryIp(state.primaryIpId, {
        name: props.name,
        labels: props.labels,
        auto_delete: props.autoDelete,
      });
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.primary-ip.update.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const ip = this.assertExists(
      response.data.primary_ip,
      'Hetzner API returned no primary_ip object in update response',
    );

    return this.toState(ip);
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerPrimaryIpState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.primary-ip.delete', {
      primaryIpId: state.primaryIpId,
    });

    try {
      await ctx.sdk.primaryIps.deletePrimaryIp(state.primaryIpId);
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.primary-ip.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerPrimaryIp,
  ): Promise<HetznerPrimaryIpState> {
    ctx.logger.debug('provider.handler.primary-ip.get', { name: props.name });

    const listResponse = await ctx.sdk.primaryIps.listPrimaryIps(props.name);

    const ips = listResponse.data.primary_ips ?? [];
    const ip = this.assertExists(
      ips[0],
      `Hetzner primary IP not found: ${props.name}`,
    );

    return this.toState(ip);
  }

  private toState(ip: {
    id: number;
    name: string;
    type: string;
    assignee_type: string;
    assignee_id: number | null;
    auto_delete: boolean;
    labels?: Record<string, string> | null;
  }): HetznerPrimaryIpState {
    return {
      primaryIpId: ip.id,
      name: ip.name,
      type: ip.type as PrimaryIpType,
      assigneeType: ip.assignee_type as PrimaryIpAssigneeType,
      assigneeId: ip.assignee_id,
      autoDelete: ip.auto_delete,
      labels: ip.labels ?? {},
    };
  }

  buildCrn(_props: HetznerPrimaryIp, state: HetznerPrimaryIpState): string {
    return Crn.format({
      provider: 'hetzner',
      domain: 'networking',
      resourceType: 'primary-ip',
      resourceId: String(state.primaryIpId),
    });
  }
}
