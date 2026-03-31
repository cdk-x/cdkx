import {
  ResourceHandler,
  RuntimeContext,
  StabilizeStatus,
} from '@cdkx-io/core';
import { HetznerFirewallAttachment } from '@cdkx-io/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerFirewallAttachmentState {
  readonly physicalId: string;
  readonly firewallId: number;
  readonly serverId: number | undefined;
  readonly labelSelector: string | undefined;
}

export class HetznerFirewallAttachmentHandler extends ResourceHandler<
  HetznerFirewallAttachment,
  HetznerFirewallAttachmentState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFirewallAttachment,
  ): Promise<HetznerFirewallAttachmentState> {
    const firewallId = props.firewallId as number;
    const serverId =
      props.serverId != null ? (props.serverId as number) : undefined;
    const labelSelector = props.labelSelector;

    ctx.logger.info('provider.handler.firewall-attachment.create', {
      firewallId,
    });

    let response;
    try {
      response = await ctx.sdk.firewallActions.applyFirewallToResources(
        firewallId,
        { apply_to: [this.mapAttachment(serverId, labelSelector)] },
      );
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall-attachment.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    for (const action of response.data.actions ?? []) {
      await this.waitForAction(ctx, action.id);
    }

    return {
      physicalId: this.computePhysicalId(firewallId, serverId, labelSelector),
      firewallId,
      serverId,
      labelSelector,
    };
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerFirewallAttachment,
  ): Promise<HetznerFirewallAttachmentState> {
    const firewallId = props.firewallId as number;
    const serverId =
      props.serverId != null ? (props.serverId as number) : undefined;
    const labelSelector = props.labelSelector;

    ctx.logger.debug('provider.handler.firewall-attachment.get', {
      firewallId,
    });

    const physicalId = this.computePhysicalId(
      firewallId,
      serverId,
      labelSelector,
    );

    let response;
    try {
      response = await ctx.sdk.firewalls.getFirewall(firewallId);
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall-attachment.get.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const firewall = this.assertExists(
      response.data.firewall,
      `Hetzner API returned no firewall for id=${firewallId}`,
    );

    const found = (firewall.applied_to ?? []).some((entry) =>
      this.matchesPhysicalId(entry, physicalId, firewallId),
    );

    if (!found) {
      throw new Error(
        `FirewallAttachment '${physicalId}' not found in firewall ${firewallId}`,
      );
    }

    return { physicalId, firewallId, serverId, labelSelector };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerFirewallAttachmentState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.firewall-attachment.delete', {
      firewallId: state.firewallId,
      physicalId: state.physicalId,
    });

    let response;
    try {
      response = await ctx.sdk.firewallActions.removeFirewallFromResources(
        state.firewallId,
        {
          remove_from: [
            this.mapAttachment(state.serverId, state.labelSelector),
          ],
        },
      );
    } catch (err) {
      const errorData = this.extractErrorData(err);
      ctx.logger.info('provider.handler.firewall-attachment.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    for (const action of response.data.actions ?? []) {
      await this.waitForAction(ctx, action.id);
    }
  }

  async update(
    _ctx: RuntimeContext<HetznerSdk>,
    _props: HetznerFirewallAttachment,
    _state: HetznerFirewallAttachmentState,
  ): Promise<HetznerFirewallAttachmentState> {
    throw new Error(
      'FirewallAttachment cannot be updated. Delete and recreate to change the target.',
    );
  }

  private computePhysicalId(
    firewallId: number,
    serverId: number | undefined,
    labelSelector: string | undefined,
  ): string {
    return serverId != null
      ? `${firewallId}/server/${serverId}`
      : `${firewallId}/label_selector/${labelSelector}`;
  }

  private mapAttachment(
    serverId: number | undefined,
    labelSelector: string | undefined,
  ) {
    if (serverId != null) {
      return { type: 'server' as const, server: { id: serverId } };
    }
    return {
      type: 'label_selector' as const,
      label_selector: { selector: labelSelector! },
    };
  }

  private matchesPhysicalId(
    entry: { type: string; server?: { id: number } | null; label_selector?: { selector: string } | null },
    physicalId: string,
    firewallId: number,
  ): boolean {
    if (entry.type === 'server' && entry.server != null) {
      return physicalId === `${firewallId}/server/${entry.server.id}`;
    }
    if (entry.type === 'label_selector' && entry.label_selector != null) {
      return (
        physicalId ===
        `${firewallId}/label_selector/${entry.label_selector.selector}`
      );
    }
    return false;
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
}
