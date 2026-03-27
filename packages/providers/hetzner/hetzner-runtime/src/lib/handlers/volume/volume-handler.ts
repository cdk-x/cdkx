import { ResourceHandler, RuntimeContext } from '@cdkx-io/core';
import { HetznerVolume } from '@cdkx-io/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerVolumeState {
  readonly volumeId: number;
  readonly name: string;
  readonly size: number;
  readonly location: string;
  readonly format?: string;
  readonly labels: Record<string, string>;
}

export class HetznerVolumeHandler extends ResourceHandler<
  HetznerVolume,
  HetznerVolumeState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerVolume,
  ): Promise<HetznerVolumeState> {
    ctx.logger.info('provider.handler.volume.create', { name: props.name });

    const response = await ctx.sdk.volumes.createVolume({
      name: props.name,
      size: props.size,
      location: props.location,
      format: props.format,
      labels: props.labels,
    });

    const volume = this.assertExists(
      response.data.volume,
      'Hetzner API returned no volume object in create response',
    );

    return {
      volumeId: volume.id,
      name: volume.name,
      size: volume.size,
      location: volume.location.name,
      format: volume.format ?? undefined,
      labels: volume.labels ?? {},
    };
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerVolume,
    state: HetznerVolumeState,
  ): Promise<HetznerVolumeState> {
    ctx.logger.info('provider.handler.volume.update', {
      volumeId: state.volumeId,
      name: props.name,
    });

    if (props.size < state.size) {
      throw new Error(
        `Volume resize-down is not supported (current: ${state.size} GB, requested: ${props.size} GB)`,
      );
    }

    if (props.size > state.size) {
      await ctx.sdk.volumeActions.resizeVolume(state.volumeId, {
        size: props.size,
      });
    }

    const response = await ctx.sdk.volumes.updateVolume(state.volumeId, {
      name: props.name,
      labels: props.labels,
    });

    const volume = this.assertExists(
      response.data.volume,
      'Hetzner API returned no volume object in update response',
    );

    return {
      volumeId: volume.id,
      name: volume.name,
      size: props.size,
      location: state.location,
      format: state.format,
      labels: volume.labels ?? {},
    };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerVolumeState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.volume.delete', {
      volumeId: state.volumeId,
    });

    await ctx.sdk.volumes.deleteVolume(state.volumeId);
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerVolume,
  ): Promise<HetznerVolumeState> {
    ctx.logger.debug('provider.handler.volume.get', { name: props.name });

    const listResponse = await ctx.sdk.volumes.listVolumes(
      undefined,
      undefined,
      props.name,
    );

    const volumes = listResponse.data.volumes ?? [];
    const volume = this.assertExists(
      volumes[0],
      `Hetzner volume not found: ${props.name}`,
    );

    return {
      volumeId: volume.id,
      name: volume.name,
      size: volume.size,
      location: volume.location.name,
      format: volume.format ?? undefined,
      labels: volume.labels ?? {},
    };
  }
}
