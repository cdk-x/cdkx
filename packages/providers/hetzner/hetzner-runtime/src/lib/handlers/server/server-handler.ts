import {
  ResourceHandler,
  RuntimeContext,
  StabilizeStatus,
} from '@cdk-x/core';
import { HetznerServer } from '@cdk-x/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

/**
 * Persisted state for a Hetzner Server resource.
 * Extends {@link HetznerServer} adding the `serverId` field.
 * Returned by {@link HetznerServerHandler.create} and
 * {@link HetznerServerHandler.get}. Stored by the engine in
 * `ResourceState.outputs`.
 */
export interface HetznerServerState extends HetznerServer {
  readonly serverId: number;
}

/**
 * Handler for `Hetzner::Compute::Server` resources.
 * Translates cdkx CRUD lifecycle calls into Hetzner Cloud SDK
 * requests, mapping camelCase props to snake_case SDK types
 * explicitly.
 *
 * Uses {@link ResourceHandler.waitUntilStabilized} to poll for
 * `running` status after create, ensuring dependent resources are
 * only provisioned once the server is fully operational.
 */
export class HetznerServerHandler extends ResourceHandler<
  HetznerServer,
  HetznerServerState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerServer,
  ): Promise<HetznerServerState> {
    ctx.logger.info('provider.handler.server.create', {
      name: props.name,
      serverType: props.serverType,
    });

    let response;
    try {
      response = await ctx.sdk.servers.createServer({
        name: props.name,
        location: props.location,
        datacenter: props.datacenter,
        server_type: props.serverType,
        start_after_create: props.startAfterCreate,
        image: props.image,
        placement_group: props.placementGroupId as number | undefined,
        ssh_keys: props.sshKeys as string[] | undefined,
        volumes: props.volumes as number[] | undefined,
        networks: props.networks as number[] | undefined,
        firewalls: props.firewalls,
        user_data: props.userData,
        labels: props.labels,
        automount: props.automount,
        public_net: props.publicNet
          ? {
              enable_ipv4: props.publicNet.enableIpv4,
              enable_ipv6: props.publicNet.enableIpv6,
              ipv4: props.publicNet.ipv4,
              ipv6: props.publicNet.ipv6,
            }
          : undefined,
      });
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.server.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const server = this.assertExists(
      response.data.server,
      'Hetzner API returned no server object in create response',
    );

    ctx.logger.info('provider.handler.server.stabilizing', {
      serverId: server.id,
      name: server.name,
    });

    await this.waitUntilStabilized(async (): Promise<StabilizeStatus> => {
      const getResponse = await ctx.sdk.servers.getServer(server.id);
      const current = this.assertExists(
        getResponse.data.server,
        `Hetzner API returned no server object when polling id=${server.id}`,
      );

      const status = current.status;

      if (status === 'running') {
        return { status: 'ready' };
      }

      if (status === 'initializing' || status === 'starting') {
        return { status: 'pending' };
      }

      return {
        status: 'failed',
        reason: `Server entered unexpected status '${status}' during provisioning`,
      };
    }, ctx.stabilizeConfig);

    return {
      serverId: server.id,
      name: server.name,
      location: props.location,
      datacenter: props.datacenter,
      serverType: props.serverType,
      startAfterCreate: props.startAfterCreate,
      image: props.image,
      placementGroupId: props.placementGroupId,
      sshKeys: props.sshKeys,
      volumes: props.volumes,
      networks: props.networks,
      firewalls: props.firewalls,
      userData: props.userData,
      labels: server.labels ?? {},
      automount: props.automount,
      publicNet: props.publicNet,
    };
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerServer,
    state: HetznerServerState,
  ): Promise<HetznerServerState> {
    ctx.logger.info('provider.handler.server.update', {
      serverId: state.serverId,
      name: props.name,
    });

    const response = await ctx.sdk.servers.updateServer(state.serverId, {
      name: props.name,
      labels: props.labels,
    });

    const server = this.assertExists(
      response.data.server,
      'Hetzner API returned no server object in update response',
    );

    return {
      serverId: server.id,
      name: server.name,
      location: props.location,
      datacenter: props.datacenter,
      serverType: props.serverType,
      startAfterCreate: props.startAfterCreate,
      image: props.image,
      placementGroupId: props.placementGroupId,
      sshKeys: props.sshKeys,
      volumes: props.volumes,
      networks: props.networks,
      firewalls: props.firewalls,
      userData: props.userData,
      labels: server.labels ?? {},
      automount: props.automount,
      publicNet: props.publicNet,
    };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerServerState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.server.delete', {
      serverId: state.serverId,
    });

    const deleteResponse = await ctx.sdk.servers.deleteServer(state.serverId);

    // deleteServer returns an async Action. Poll until it reaches 'success'
    // so the server's network attachments are fully released before dependent
    // resources (subnets, routes) are deleted.
    const action = deleteResponse.data.action;
    if (action) {
      await this.waitUntilStabilized(async (): Promise<StabilizeStatus> => {
        const actionResponse = await ctx.sdk.actions.getAction(action.id);
        const actionStatus = actionResponse.data.action.status;
        if (actionStatus === 'success') return { status: 'ready' };
        if (actionStatus === 'running') return { status: 'pending' };
        return {
          status: 'failed',
          reason: `Server deletion action ${action.id} ended with status '${actionStatus}'`,
        };
      }, ctx.stabilizeConfig);
    }
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerServer,
  ): Promise<HetznerServerState> {
    ctx.logger.debug('provider.handler.server.get', {
      name: props.name,
    });

    const listResponse = await ctx.sdk.servers.listServers(props.name);

    const servers = listResponse.data.servers ?? [];
    const server = this.assertExists(
      servers[0],
      `Hetzner server not found: ${props.name}`,
    );

    return {
      serverId: server.id,
      name: server.name,
      location: props.location,
      datacenter: props.datacenter,
      serverType: props.serverType,
      startAfterCreate: props.startAfterCreate,
      image: props.image,
      placementGroupId: props.placementGroupId,
      sshKeys: props.sshKeys,
      volumes: props.volumes,
      networks: props.networks,
      firewalls: props.firewalls,
      userData: props.userData,
      labels: server.labels ?? {},
      automount: props.automount,
      publicNet: props.publicNet,
    };
  }
}
