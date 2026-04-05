import { ResourceHandler, RuntimeContext, StabilizeStatus } from '@cdkx-io/core';
import { HetznerLoadBalancerService } from '@cdkx-io/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerLoadBalancerServiceState {
  readonly physicalId: string;
  readonly loadBalancerId: number;
  readonly listenPort: number;
}

export class HetznerLoadBalancerServiceHandler extends ResourceHandler<
  HetznerLoadBalancerService,
  HetznerLoadBalancerServiceState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerLoadBalancerService,
  ): Promise<HetznerLoadBalancerServiceState> {
    const loadBalancerId = props.loadBalancerId as number;

    ctx.logger.info('provider.handler.load-balancer-service.create', {
      loadBalancerId,
      listenPort: props.listenPort,
    });

    let response;
    try {
      response = await ctx.sdk.loadBalancerActions.addLoadBalancerService(
        loadBalancerId,
        {
          listen_port: props.listenPort,
          destination_port: props.destinationPort,
          protocol: props.protocol,
          proxyprotocol: props.proxyprotocol,
        } as unknown as Parameters<
          HetznerSdk['loadBalancerActions']['addLoadBalancerService']
        >[1],
      );
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer-service.create.error', {
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, response.data.action.id);

    return {
      physicalId: `${loadBalancerId}/${props.listenPort}`,
      loadBalancerId,
      listenPort: props.listenPort,
    };
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerLoadBalancerService,
  ): Promise<HetznerLoadBalancerServiceState> {
    const loadBalancerId = props.loadBalancerId as number;

    ctx.logger.debug('provider.handler.load-balancer-service.get', {
      loadBalancerId,
      listenPort: props.listenPort,
    });

    let response;
    try {
      response = await ctx.sdk.loadBalancers.getLoadBalancer(loadBalancerId);
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer-service.get.error', {
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }

    const lb = this.assertExists(
      response.data.load_balancer,
      `Load Balancer with id '${loadBalancerId}' not found`,
    );

    const service = (lb.services ?? []).find(
      (s) => s.listen_port === props.listenPort,
    );

    if (!service) {
      throw new Error(
        `LoadBalancerService with listenPort '${props.listenPort}' not found on lb ${loadBalancerId}`,
      );
    }

    return {
      physicalId: `${loadBalancerId}/${props.listenPort}`,
      loadBalancerId,
      listenPort: props.listenPort,
    };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerLoadBalancerServiceState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.load-balancer-service.delete', {
      physicalId: state.physicalId,
    });

    let response;
    try {
      response = await ctx.sdk.loadBalancerActions.deleteLoadBalancerService(
        state.loadBalancerId,
        { listen_port: state.listenPort },
      );
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer-service.delete.error', {
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, response.data.action.id);
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerLoadBalancerService,
    state: HetznerLoadBalancerServiceState,
  ): Promise<HetznerLoadBalancerServiceState> {
    ctx.logger.info('provider.handler.load-balancer-service.update', {
      physicalId: state.physicalId,
    });

    let response;
    try {
      response = await ctx.sdk.loadBalancerActions.updateLoadBalancerService(
        state.loadBalancerId,
        {
          listen_port: state.listenPort,
          destination_port: props.destinationPort,
          protocol: props.protocol as 'tcp' | 'http' | 'https' | undefined,
          proxyprotocol: props.proxyprotocol,
        },
      );
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer-service.update.error', {
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, response.data.action.id);

    return state;
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
