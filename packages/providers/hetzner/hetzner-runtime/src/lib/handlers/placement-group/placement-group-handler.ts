import { ResourceHandler, RuntimeContext, Crn } from '@cdk-x/core';
import { HetznerPlacementGroup } from '@cdk-x/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

export interface HetznerPlacementGroupState {
  readonly placementGroupId: number;
  readonly name: string;
  readonly type: string;
  readonly labels: Record<string, string>;
  readonly serverIds: number[];
}

export class HetznerPlacementGroupHandler extends ResourceHandler<
  HetznerPlacementGroup,
  HetznerPlacementGroupState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerPlacementGroup,
  ): Promise<HetznerPlacementGroupState> {
    ctx.logger.info('provider.handler.placement-group.create', {
      name: props.name,
    });

    let response;
    try {
      response = await ctx.sdk.placementGroups.createPlacementGroup({
        name: props.name,
        type: props.type as unknown as 'spread',
        labels: props.labels,
      });
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.placement-group.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const pg = this.assertExists(
      response.data.placement_group,
      'Hetzner API returned no placement_group object in create response',
    );

    return {
      placementGroupId: pg.id,
      name: pg.name,
      type: pg.type,
      labels: pg.labels ?? {},
      serverIds: pg.servers ?? [],
    };
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerPlacementGroup,
    state: HetznerPlacementGroupState,
  ): Promise<HetznerPlacementGroupState> {
    ctx.logger.info('provider.handler.placement-group.update', {
      placementGroupId: state.placementGroupId,
      name: props.name,
    });

    let response;
    try {
      response = await ctx.sdk.placementGroups.updatePlacementGroup(
        state.placementGroupId,
        {
          name: props.name,
          labels: props.labels,
        },
      );
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.placement-group.update.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const pg = this.assertExists(
      response.data.placement_group,
      'Hetzner API returned no placement_group object in update response',
    );

    return {
      placementGroupId: pg.id,
      name: pg.name,
      type: pg.type,
      labels: pg.labels ?? {},
      serverIds: pg.servers ?? [],
    };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerPlacementGroupState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.placement-group.delete', {
      placementGroupId: state.placementGroupId,
    });

    try {
      await ctx.sdk.placementGroups.deletePlacementGroup(
        state.placementGroupId,
      );
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.placement-group.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerPlacementGroup,
  ): Promise<HetznerPlacementGroupState> {
    ctx.logger.debug('provider.handler.placement-group.get', {
      name: props.name,
    });

    const listResponse = await ctx.sdk.placementGroups.listPlacementGroups(
      undefined,
      props.name,
    );

    const groups = listResponse.data.placement_groups ?? [];
    const pg = this.assertExists(
      groups[0],
      `Hetzner placement group not found: ${props.name}`,
    );

    return {
      placementGroupId: pg.id,
      name: pg.name,
      type: pg.type,
      labels: pg.labels ?? {},
      serverIds: pg.servers ?? [],
    };
  }

  buildCrn(
    _props: HetznerPlacementGroup,
    state: HetznerPlacementGroupState,
  ): string {
    return Crn.format({
      provider: 'hetzner',
      domain: 'compute',
      resourceType: 'placement-group',
      resourceId: String(state.placementGroupId),
    });
  }
}
