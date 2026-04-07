import { ResourceHandler, RuntimeContext, StabilizeStatus } from '@cdk-x/core';
import { HetznerLoadBalancerTarget } from '@cdk-x/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerLoadBalancerTargetState {
  readonly physicalId: string;
  readonly loadBalancerId: number;
  readonly type: string;
  readonly serverId?: number;
  readonly labelSelector?: string;
  readonly ip?: string;
}

export class HetznerLoadBalancerTargetHandler extends ResourceHandler<
  HetznerLoadBalancerTarget,
  HetznerLoadBalancerTargetState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerLoadBalancerTarget,
  ): Promise<HetznerLoadBalancerTargetState> {
    const loadBalancerId = props.loadBalancerId as number;
    const type = props.type as string;

    ctx.logger.info('provider.handler.load-balancer-target.create', {
      loadBalancerId,
      type,
    });

    const body = this.buildAddBody(props);

    let response;
    try {
      response = await ctx.sdk.loadBalancerActions.addLoadBalancerTarget(
        loadBalancerId,
        body,
      );
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer-target.create.error', {
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, response.data.action.id);

    return this.buildState(loadBalancerId, props);
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerLoadBalancerTarget,
  ): Promise<HetznerLoadBalancerTargetState> {
    const loadBalancerId = props.loadBalancerId as number;

    ctx.logger.debug('provider.handler.load-balancer-target.get', {
      loadBalancerId,
      type: props.type,
    });

    let response;
    try {
      response = await ctx.sdk.loadBalancers.getLoadBalancer(loadBalancerId);
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer-target.get.error', {
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }

    const lb = this.assertExists(
      response.data.load_balancer,
      `Load Balancer with id '${loadBalancerId}' not found`,
    );

    const found = (lb.targets ?? []).some((t) =>
      this.matchesTarget(t, props),
    );

    if (!found) {
      const identity = this.targetIdentity(props);
      throw new Error(
        `LoadBalancerTarget '${props.type}/${identity}' not found on lb ${loadBalancerId}`,
      );
    }

    return this.buildState(loadBalancerId, props);
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerLoadBalancerTargetState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.load-balancer-target.delete', {
      physicalId: state.physicalId,
    });

    const body = this.buildRemoveBody(state);

    let response;
    try {
      response = await ctx.sdk.loadBalancerActions.removeLoadBalancerTarget(
        state.loadBalancerId,
        body,
      );
    } catch (err) {
      ctx.logger.error('provider.handler.load-balancer-target.delete.error', {
        error: this.extractErrorData(err) ?? String(err),
      });
      throw err;
    }

    await this.waitForAction(ctx, response.data.action.id);
  }

  async update(
    _ctx: RuntimeContext<HetznerSdk>,
    _props: HetznerLoadBalancerTarget,
    _state: HetznerLoadBalancerTargetState,
  ): Promise<HetznerLoadBalancerTargetState> {
    throw new Error(
      'Invariant: LoadBalancerTarget cannot be updated in-place. ' +
        'The engine performs delete+create for any property change.',
    );
  }

  private buildAddBody(props: HetznerLoadBalancerTarget) {
    const type = props.type as string;
    const body: Record<string, unknown> = { type };

    if (type === 'server' && props.serverId != null) {
      body['server'] = { id: props.serverId as number };
    } else if (type === 'label_selector' && props.labelSelector != null) {
      body['label_selector'] = { selector: props.labelSelector };
    } else if (type === 'ip' && props.ip != null) {
      body['ip'] = { ip: props.ip };
    }

    if (props.usePrivateIp !== undefined) {
      body['use_private_ip'] = props.usePrivateIp;
    }

    return body as unknown as Parameters<
      HetznerSdk['loadBalancerActions']['addLoadBalancerTarget']
    >[1];
  }

  private buildRemoveBody(state: HetznerLoadBalancerTargetState) {
    const body: Record<string, unknown> = { type: state.type };

    if (state.type === 'server' && state.serverId != null) {
      body['server'] = { id: state.serverId };
    } else if (state.type === 'label_selector' && state.labelSelector != null) {
      body['label_selector'] = { selector: state.labelSelector };
    } else if (state.type === 'ip' && state.ip != null) {
      body['ip'] = { ip: state.ip };
    }

    return body as unknown as Parameters<
      HetznerSdk['loadBalancerActions']['removeLoadBalancerTarget']
    >[1];
  }

  private buildState(
    loadBalancerId: number,
    props: HetznerLoadBalancerTarget,
  ): HetznerLoadBalancerTargetState {
    const type = props.type as string;
    const serverId = props.serverId != null ? (props.serverId as number) : undefined;
    const labelSelector = props.labelSelector;
    const ip = props.ip;

    return {
      physicalId: `${loadBalancerId}/${type}/${this.targetIdentityFromParts(type, serverId, labelSelector, ip)}`,
      loadBalancerId,
      type,
      serverId,
      labelSelector,
      ip,
    };
  }

  private matchesTarget(
    target: { type: string; server?: { id: number } | null; label_selector?: { selector: string } | null; ip?: { ip: string } | null },
    props: HetznerLoadBalancerTarget,
  ): boolean {
    const type = props.type as string;
    if (target.type !== type) return false;

    if (type === 'server') {
      return target.server?.id === (props.serverId as number);
    }
    if (type === 'label_selector') {
      return target.label_selector?.selector === props.labelSelector;
    }
    if (type === 'ip') {
      return target.ip?.ip === props.ip;
    }
    return false;
  }

  private targetIdentity(props: HetznerLoadBalancerTarget): string {
    const type = props.type as string;
    return this.targetIdentityFromParts(
      type,
      props.serverId != null ? (props.serverId as number) : undefined,
      props.labelSelector,
      props.ip,
    );
  }

  private targetIdentityFromParts(
    type: string,
    serverId: number | undefined,
    labelSelector: string | undefined,
    ip: string | undefined,
  ): string {
    if (type === 'server') return String(serverId);
    if (type === 'label_selector') return labelSelector ?? '';
    if (type === 'ip') return ip ?? '';
    return '';
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
