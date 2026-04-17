import { ResourceHandler, RuntimeContext } from '@cdk-x/core';
import type { MultipassSdk } from '../../multipass-cli-facade';
import type { MultipassLaunchOpts } from '@cdk-x/multipass-sdk';

/**
 * Props for a Multipass instance resource.
 * Keys match the MltInstance construct (camelCase).
 */
export interface MultipassInstanceProps {
  readonly name: string;
  readonly image?: string;
  readonly cpus?: number;
  readonly memory?: string;
  readonly disk?: string;
  readonly bridged?: boolean;
  readonly timeout?: number;
  readonly networks?: unknown[];
  readonly mounts?: unknown[];
  readonly cloudInit?: string;
}

/**
 * Persisted state for a Multipass instance.
 * Returned by create/get and stored by the engine in ResourceState.outputs.
 */
export interface MultipassInstanceState {
  readonly name: string;
  readonly ipAddress: string;
  readonly sshUser: string;
}

/**
 * Handler for `Multipass::Compute::Instance` resources.
 *
 * All properties are createOnly — no update path exists.
 * The engine will never call update() for this resource type.
 */
export class MultipassInstanceHandler extends ResourceHandler<
  MultipassInstanceProps,
  MultipassInstanceState,
  MultipassSdk
> {
  async create(
    ctx: RuntimeContext<MultipassSdk>,
    props: MultipassInstanceProps,
  ): Promise<MultipassInstanceState> {
    ctx.logger.info('provider.handler.instance.create', { name: props.name });

    const opts: MultipassLaunchOpts = {
      name: props.name,
      image: props.image,
      cpus: props.cpus,
      memory: props.memory,
      disk: props.disk,
      bridged: props.bridged,
      timeout: props.timeout,
      cloudInit: props.cloudInit,
    };

    await ctx.sdk.launch(opts);

    return this.fetchState(ctx, props.name);
  }

  async update(
    ctx: RuntimeContext<MultipassSdk>,
    props: MultipassInstanceProps,
  ): Promise<MultipassInstanceState> {
    // All props are createOnly — engine should never call this.
    ctx.logger.warn('provider.handler.instance.update.skipped', {
      name: props.name,
    });
    return this.fetchState(ctx, props.name);
  }

  async delete(
    ctx: RuntimeContext<MultipassSdk>,
    state: MultipassInstanceState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.instance.delete', { name: state.name });
    await ctx.sdk.delete(state.name);
  }

  async get(
    ctx: RuntimeContext<MultipassSdk>,
    props: MultipassInstanceProps,
  ): Promise<MultipassInstanceState> {
    ctx.logger.debug('provider.handler.instance.get', { name: props.name });
    return this.fetchState(ctx, props.name);
  }

  private async fetchState(
    ctx: RuntimeContext<MultipassSdk>,
    name: string,
  ): Promise<MultipassInstanceState> {
    const info = await ctx.sdk.info(name);
    return {
      name: info.name,
      ipAddress: info.ipAddress,
      sshUser: info.sshUser,
    };
  }
}
