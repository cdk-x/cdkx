import {
  ResourceHandler,
  RuntimeContext,
  StabilizeStatus,
  Crn,
} from '@cdk-x/core';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerFloatingIpAssignmentProps {
  readonly floatingIpId: number;
  readonly serverId: number;
}

export interface HetznerFloatingIpAssignmentState {
  readonly floatingIpId: number;
  readonly serverId: number;
}

export class HetznerFloatingIpAssignmentHandler extends ResourceHandler<
  HetznerFloatingIpAssignmentProps,
  HetznerFloatingIpAssignmentState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFloatingIpAssignmentProps,
  ): Promise<HetznerFloatingIpAssignmentState> {
    ctx.logger.info('provider.handler.floating-ip-assignment.create', {
      floatingIpId: props.floatingIpId,
      serverId: props.serverId,
    });

    const response = await ctx.sdk.floatingIpActions.assignFloatingIp(
      props.floatingIpId,
      { server: props.serverId },
    );

    await this.waitForAction(ctx, response.data.action.id);

    return { floatingIpId: props.floatingIpId, serverId: props.serverId };
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFloatingIpAssignmentProps,
    state: HetznerFloatingIpAssignmentState,
  ): Promise<HetznerFloatingIpAssignmentState> {
    ctx.logger.info('provider.handler.floating-ip-assignment.update', {
      floatingIpId: state.floatingIpId,
      oldServerId: state.serverId,
      newServerId: props.serverId,
    });

    const unassignResponse = await ctx.sdk.floatingIpActions.unassignFloatingIp(
      state.floatingIpId,
    );
    await this.waitForAction(ctx, unassignResponse.data.action.id);

    const assignResponse = await ctx.sdk.floatingIpActions.assignFloatingIp(
      state.floatingIpId,
      { server: props.serverId },
    );
    await this.waitForAction(ctx, assignResponse.data.action.id);

    return { floatingIpId: state.floatingIpId, serverId: props.serverId };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerFloatingIpAssignmentState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.floating-ip-assignment.delete', {
      floatingIpId: state.floatingIpId,
    });

    const response = await ctx.sdk.floatingIpActions.unassignFloatingIp(
      state.floatingIpId,
    );
    await this.waitForAction(ctx, response.data.action.id);
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFloatingIpAssignmentProps,
  ): Promise<HetznerFloatingIpAssignmentState> {
    ctx.logger.debug('provider.handler.floating-ip-assignment.get', {
      floatingIpId: props.floatingIpId,
    });

    const response = await ctx.sdk.floatingIps.getFloatingIp(
      props.floatingIpId,
    );

    const ip = this.assertExists(
      response.data.floating_ip,
      `Hetzner API returned no floating_ip object for id=${props.floatingIpId}`,
    );

    if (ip.server !== props.serverId) {
      throw new Error(
        `Floating IP ${props.floatingIpId} is not assigned to server ${props.serverId} (actual: ${ip.server ?? 'none'})`,
      );
    }

    return { floatingIpId: props.floatingIpId, serverId: props.serverId };
  }

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

  buildCrn(
    _props: HetznerFloatingIpAssignmentProps,
    state: HetznerFloatingIpAssignmentState,
  ): string {
    return Crn.format({
      provider: 'hetzner',
      domain: 'networking',
      resourceType: 'floating-ip-assignment',
      resourceId: `${state.floatingIpId}/${state.serverId}`,
    });
  }
}
