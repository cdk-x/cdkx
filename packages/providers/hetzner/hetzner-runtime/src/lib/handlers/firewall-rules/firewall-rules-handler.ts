import {
  ResourceHandler,
  RuntimeContext,
  StabilizeStatus,
  Crn,
} from '@cdk-x/core';
import { FirewallRule, HetznerFirewallRules } from '@cdk-x/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerFirewallRulesState {
  readonly firewallId: number;
}

export class HetznerFirewallRulesHandler extends ResourceHandler<
  HetznerFirewallRules,
  HetznerFirewallRulesState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFirewallRules,
  ): Promise<HetznerFirewallRulesState> {
    ctx.logger.info('provider.handler.firewall-rules.create', {
      firewallId: props.firewallId,
    });

    const firewallId = props.firewallId as number;
    let response;
    try {
      response = await ctx.sdk.firewallActions.setFirewallRules(firewallId, {
        rules: props.rules?.map((r) => this.mapRule(r)) ?? [],
      });
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall-rules.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    for (const action of response.data.actions ?? []) {
      await this.waitForAction(ctx, action.id);
    }

    return { firewallId };
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFirewallRules,
  ): Promise<HetznerFirewallRulesState> {
    ctx.logger.debug('provider.handler.firewall-rules.get', {
      firewallId: props.firewallId,
    });

    const firewallId = props.firewallId as number;
    try {
      await ctx.sdk.firewalls.getFirewall(firewallId);
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall-rules.get.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    return { firewallId };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerFirewallRulesState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.firewall-rules.delete', {
      firewallId: state.firewallId,
    });

    let response;
    try {
      response = await ctx.sdk.firewallActions.setFirewallRules(
        state.firewallId,
        { rules: [] },
      );
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall-rules.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    for (const action of response.data.actions ?? []) {
      await this.waitForAction(ctx, action.id);
    }
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFirewallRules,
    state: HetznerFirewallRulesState,
  ): Promise<HetznerFirewallRulesState> {
    ctx.logger.info('provider.handler.firewall-rules.update', {
      firewallId: state.firewallId,
    });

    let response;
    try {
      response = await ctx.sdk.firewallActions.setFirewallRules(
        state.firewallId,
        { rules: props.rules?.map((r) => this.mapRule(r)) ?? [] },
      );
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall-rules.update.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    for (const action of response.data.actions ?? []) {
      await this.waitForAction(ctx, action.id);
    }

    return { firewallId: state.firewallId };
  }

  private mapRule(rule: FirewallRule) {
    return {
      description: rule.description,
      direction: rule.direction as never,
      source_ips: rule.sourceIps as string[] | undefined,
      destination_ips: rule.destinationIps as string[] | undefined,
      protocol: rule.protocol as never,
      port: rule.port,
    };
  }

  private extractErrorData(err: unknown): unknown {
    return err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: unknown } }).response?.data
      : undefined;
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
    _props: HetznerFirewallRules,
    state: HetznerFirewallRulesState,
  ): string {
    return Crn.format({
      provider: 'hetzner',
      domain: 'security',
      resourceType: 'firewall-rules',
      resourceId: String(state.firewallId),
    });
  }
}
