import {
  ResourceHandler,
  RuntimeContext,
  StabilizeStatus,
  Crn,
} from '@cdk-x/core';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerVolumeAttachmentProps {
  readonly volumeId: number;
  readonly serverId: number;
  readonly automount?: boolean;
}

export interface HetznerVolumeAttachmentState {
  readonly volumeId: number;
  readonly serverId: number;
}

export class HetznerVolumeAttachmentHandler extends ResourceHandler<
  HetznerVolumeAttachmentProps,
  HetznerVolumeAttachmentState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerVolumeAttachmentProps,
  ): Promise<HetznerVolumeAttachmentState> {
    ctx.logger.info('provider.handler.volume-attachment.create', {
      volumeId: props.volumeId,
      serverId: props.serverId,
    });

    let volumeResponse;
    try {
      volumeResponse = await ctx.sdk.volumes.getVolume(props.volumeId);
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.volume-attachment.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const volume = this.assertExists(
      volumeResponse.data.volume,
      `Hetzner API returned no volume object for id=${props.volumeId}`,
    );
    if (volume.server != null) {
      throw new Error(
        `Volume ${props.volumeId} is already attached to server ${volume.server}`,
      );
    }

    let attachResponse;
    try {
      attachResponse = await ctx.sdk.volumeActions.attachVolume(
        props.volumeId,
        { server: props.serverId, automount: props.automount },
      );
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.volume-attachment.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, attachResponse.data.action.id);

    return { volumeId: props.volumeId, serverId: props.serverId };
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerVolumeAttachmentProps,
    state: HetznerVolumeAttachmentState,
  ): Promise<HetznerVolumeAttachmentState> {
    ctx.logger.info('provider.handler.volume-attachment.update', {
      volumeId: state.volumeId,
      oldServerId: state.serverId,
      newServerId: props.serverId,
    });

    let detachResponse;
    try {
      detachResponse = await ctx.sdk.volumeActions.detachVolume(state.volumeId);
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.volume-attachment.update.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, detachResponse.data.action.id);

    let attachResponse;
    try {
      attachResponse = await ctx.sdk.volumeActions.attachVolume(
        state.volumeId,
        { server: props.serverId, automount: props.automount },
      );
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.volume-attachment.update.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, attachResponse.data.action.id);

    return { volumeId: state.volumeId, serverId: props.serverId };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerVolumeAttachmentState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.volume-attachment.delete', {
      volumeId: state.volumeId,
    });

    let response;
    try {
      response = await ctx.sdk.volumeActions.detachVolume(state.volumeId);
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.volume-attachment.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, response.data.action.id);
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerVolumeAttachmentProps,
  ): Promise<HetznerVolumeAttachmentState> {
    ctx.logger.debug('provider.handler.volume-attachment.get', {
      volumeId: props.volumeId,
    });

    let response;
    try {
      response = await ctx.sdk.volumes.getVolume(props.volumeId);
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.volume-attachment.get.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const volume = this.assertExists(
      response.data.volume,
      `Hetzner API returned no volume object for id=${props.volumeId}`,
    );

    if (volume.server !== props.serverId) {
      throw new Error(
        `Volume ${props.volumeId} is not attached to server ${props.serverId} (actual: ${volume.server ?? 'none'})`,
      );
    }

    return { volumeId: props.volumeId, serverId: props.serverId };
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
    _props: HetznerVolumeAttachmentProps,
    state: HetznerVolumeAttachmentState,
  ): string {
    return Crn.format({
      provider: 'hetzner',
      domain: 'storage',
      resourceType: 'volume-attachment',
      resourceId: `${state.volumeId}/${state.serverId}`,
    });
  }
}
