import { ResourceHandler, RuntimeContext, StabilizeStatus } from '@cdkx-io/core';
import { HetznerLoadBalancer } from '@cdkx-io/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerLoadBalancerState {
  readonly loadBalancerId: number;
  readonly loadBalancerType: string;
  readonly algorithm?: string;
  readonly publicInterface?: boolean;
}

export class HetznerLoadBalancerHandler extends ResourceHandler<
  HetznerLoadBalancer,
  HetznerLoadBalancerState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerLoadBalancer,
  ): Promise<HetznerLoadBalancerState> {
    ctx.logger.info('provider.handler.load-balancer.create', {
      name: props.name,
    });

    let response;
    try {
      response = await ctx.sdk.loadBalancers.createLoadBalancer({
        name: props.name,
        load_balancer_type: props.loadBalancerType,
        labels: props.labels,
        algorithm: props.algorithm
          ? { type: props.algorithm.type as 'round_robin' | 'least_connections' }
          : undefined,
        network_zone: props.networkZone,
        location: props.location,
      });
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer.create.error', {
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }

    const lb = this.assertExists(
      response.data.load_balancer,
      'Hetzner API returned no load_balancer object',
    );

    if (props.networkId !== undefined) {
      let attachResponse;
      try {
        attachResponse =
          await ctx.sdk.loadBalancerActions.attachLoadBalancerToNetwork(
            lb.id,
            { network: props.networkId as number },
          );
      } catch (err) {
        ctx.logger.error('provider.handler.load-balancer.attach.error', {
          loadBalancerId: lb.id,
          error: this.extractErrorData(err) ?? String(err),
        });
        throw err;
      }
      await this.waitForAction(ctx, attachResponse.data.action.id);
    }

    return {
      loadBalancerId: lb.id,
      loadBalancerType: lb.load_balancer_type.name,
      algorithm: lb.algorithm.type,
      publicInterface: lb.public_net.enabled,
    };
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerLoadBalancer,
  ): Promise<HetznerLoadBalancerState> {
    ctx.logger.debug('provider.handler.load-balancer.get', {
      name: props.name,
    });

    let response;
    try {
      response = await ctx.sdk.loadBalancers.listLoadBalancers(
        undefined,
        props.name,
      );
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer.get.error', {
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }

    const lb = this.assertExists(
      response.data.load_balancers.find((l) => l.name === props.name),
      `Load Balancer with name '${props.name}' not found`,
    );

    return {
      loadBalancerId: lb.id,
      loadBalancerType: lb.load_balancer_type.name,
      algorithm: lb.algorithm.type,
      publicInterface: lb.public_net.enabled,
    };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerLoadBalancerState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.load-balancer.delete', {
      loadBalancerId: state.loadBalancerId,
    });

    try {
      await ctx.sdk.loadBalancers.deleteLoadBalancer(state.loadBalancerId);
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer.delete.error', {
        loadBalancerId: state.loadBalancerId,
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerLoadBalancer,
    state: HetznerLoadBalancerState,
  ): Promise<HetznerLoadBalancerState> {
    ctx.logger.info('provider.handler.load-balancer.update', {
      loadBalancerId: state.loadBalancerId,
    });

    try {
      await ctx.sdk.loadBalancers.updateLoadBalancer(state.loadBalancerId, {
        name: props.name,
        labels: props.labels,
      });
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer.update.error', {
        loadBalancerId: state.loadBalancerId,
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }

    if (props.algorithm && props.algorithm.type !== state.algorithm) {
      try {
        await ctx.sdk.loadBalancerActions.changeLoadBalancerAlgorithm(
          state.loadBalancerId,
          { type: props.algorithm.type as 'round_robin' | 'least_connections' },
        );
      } catch (err) {
        ctx.logger.error(
          'provider.handler.load-balancer.change-algorithm.error',
          {
            loadBalancerId: state.loadBalancerId,
            error: this.extractErrorData(err) ?? String(err),
          },
        );
        throw err;
      }
    }

    if (props.loadBalancerType !== state.loadBalancerType) {
      try {
        await ctx.sdk.loadBalancerActions.changeLoadBalancerType(
          state.loadBalancerId,
          { load_balancer_type: props.loadBalancerType },
        );
      } catch (err) {
        ctx.logger.error('provider.handler.load-balancer.change-type.error', {
          loadBalancerId: state.loadBalancerId,
          error: this.extractErrorData(err) ?? String(err),
        });
        throw err;
      }
    }

    if (
      props.publicInterface !== undefined &&
      props.publicInterface !== state.publicInterface
    ) {
      try {
        if (props.publicInterface) {
          await ctx.sdk.loadBalancerActions.enableLoadBalancerPublicInterface(
            state.loadBalancerId,
          );
        } else {
          await ctx.sdk.loadBalancerActions.disableLoadBalancerPublicInterface(
            state.loadBalancerId,
          );
        }
      } catch (err) {
        ctx.logger.error(
          'provider.handler.load-balancer.change-public-interface.error',
          {
            loadBalancerId: state.loadBalancerId,
            error: this.extractErrorData(err) ?? String(err),
          },
        );
        throw err;
      }
    }

    return {
      loadBalancerId: state.loadBalancerId,
      loadBalancerType: props.loadBalancerType,
      algorithm: props.algorithm?.type ?? state.algorithm,
      publicInterface: props.publicInterface ?? state.publicInterface,
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

  private extractErrorData(err: unknown): unknown {
    return err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: unknown } }).response?.data
      : undefined;
  }
}
