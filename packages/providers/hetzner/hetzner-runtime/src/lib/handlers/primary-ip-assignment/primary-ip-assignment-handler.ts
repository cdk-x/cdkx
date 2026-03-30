import {
  ResourceHandler,
  RuntimeContext,
  StabilizeStatus,
} from '@cdkx-io/core';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerPrimaryIpAssignmentProps {
  readonly primaryIpId: number;
  readonly assigneeId: number;
  readonly assigneeType: string;
}

export interface HetznerPrimaryIpAssignmentState {
  readonly primaryIpId: number;
  readonly assigneeId: number;
  readonly assigneeType: string;
}

export class HetznerPrimaryIpAssignmentHandler extends ResourceHandler<
  HetznerPrimaryIpAssignmentProps,
  HetznerPrimaryIpAssignmentState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerPrimaryIpAssignmentProps,
  ): Promise<HetznerPrimaryIpAssignmentState> {
    ctx.logger.info('provider.handler.primary-ip-assignment.create', {
      primaryIpId: props.primaryIpId,
      assigneeId: props.assigneeId,
      assigneeType: props.assigneeType,
    });

    let response;
    try {
      response = await ctx.sdk.primaryIpActions.assignPrimaryIp(
        props.primaryIpId,
        {
          assignee_id: props.assigneeId,
          assignee_type: props.assigneeType as never,
        },
      );
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.primary-ip-assignment.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, response.data.action.id);

    return {
      primaryIpId: props.primaryIpId,
      assigneeId: props.assigneeId,
      assigneeType: props.assigneeType,
    };
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerPrimaryIpAssignmentProps,
    state: HetznerPrimaryIpAssignmentState,
  ): Promise<HetznerPrimaryIpAssignmentState> {
    ctx.logger.info('provider.handler.primary-ip-assignment.update', {
      primaryIpId: state.primaryIpId,
      oldAssigneeId: state.assigneeId,
      newAssigneeId: props.assigneeId,
    });

    let unassignResponse;
    try {
      unassignResponse = await ctx.sdk.primaryIpActions.unassignPrimaryIp(
        state.primaryIpId,
      );
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info(
        'provider.handler.primary-ip-assignment.update.unassign.error',
        { error: errorData ?? String(err) },
      );
      throw err;
    }

    await this.waitForAction(ctx, unassignResponse.data.action.id);

    let assignResponse;
    try {
      assignResponse = await ctx.sdk.primaryIpActions.assignPrimaryIp(
        state.primaryIpId,
        {
          assignee_id: props.assigneeId,
          assignee_type: props.assigneeType as never,
        },
      );
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info(
        'provider.handler.primary-ip-assignment.update.assign.error',
        { error: errorData ?? String(err) },
      );
      throw err;
    }

    await this.waitForAction(ctx, assignResponse.data.action.id);

    return {
      primaryIpId: state.primaryIpId,
      assigneeId: props.assigneeId,
      assigneeType: props.assigneeType,
    };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerPrimaryIpAssignmentState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.primary-ip-assignment.delete', {
      primaryIpId: state.primaryIpId,
    });

    let response;
    try {
      response = await ctx.sdk.primaryIpActions.unassignPrimaryIp(
        state.primaryIpId,
      );
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.primary-ip-assignment.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, response.data.action.id);
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerPrimaryIpAssignmentProps,
  ): Promise<HetznerPrimaryIpAssignmentState> {
    ctx.logger.debug('provider.handler.primary-ip-assignment.get', {
      primaryIpId: props.primaryIpId,
    });

    let response;
    try {
      response = await ctx.sdk.primaryIps.getPrimaryIp(props.primaryIpId);
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.primary-ip-assignment.get.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const ip = this.assertExists(
      response.data.primary_ip,
      `Hetzner API returned no primary_ip object for id=${props.primaryIpId}`,
    );

    if (ip.assignee_id !== props.assigneeId) {
      throw new Error(
        `Primary IP ${props.primaryIpId} is not assigned to assignee ${props.assigneeId} (actual: ${ip.assignee_id ?? 'none'})`,
      );
    }

    return {
      primaryIpId: props.primaryIpId,
      assigneeId: props.assigneeId,
      assigneeType: props.assigneeType,
    };
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
}
