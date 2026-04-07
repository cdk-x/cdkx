import { ResourceHandler, RuntimeContext } from '@cdk-x/core';
import { HetznerFirewall } from '@cdk-x/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerFirewallState {
  readonly firewallId: number;
}

export class HetznerFirewallHandler extends ResourceHandler<
  HetznerFirewall,
  HetznerFirewallState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFirewall,
  ): Promise<HetznerFirewallState> {
    ctx.logger.info('provider.handler.firewall.create', { name: props.name });

    let response;
    try {
      response = await ctx.sdk.firewalls.createFirewall({
        name: props.name,
        labels: props.labels,
      });
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const firewall = this.assertExists(
      response.data.firewall,
      'Hetzner API returned no firewall object',
    );

    return { firewallId: firewall.id };
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFirewall,
  ): Promise<HetznerFirewallState> {
    ctx.logger.debug('provider.handler.firewall.get', { name: props.name });

    let response;
    try {
      response = await ctx.sdk.firewalls.listFirewalls(undefined, props.name);
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall.get.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const firewall = this.assertExists(
      response.data.firewalls.find((f) => f.name === props.name),
      `Firewall with name '${props.name}' not found`,
    );

    return { firewallId: firewall.id };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerFirewallState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.firewall.delete', {
      firewallId: state.firewallId,
    });

    try {
      await ctx.sdk.firewalls.deleteFirewall(state.firewallId);
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFirewall,
    state: HetznerFirewallState,
  ): Promise<HetznerFirewallState> {
    ctx.logger.info('provider.handler.firewall.update', {
      firewallId: state.firewallId,
    });

    try {
      await ctx.sdk.firewalls.updateFirewall(state.firewallId, {
        name: props.name,
        labels: props.labels,
      });
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall.update.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    return { firewallId: state.firewallId };
  }

  private extractErrorData(err: unknown): unknown {
    return err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: unknown } }).response?.data
      : undefined;
  }
}
