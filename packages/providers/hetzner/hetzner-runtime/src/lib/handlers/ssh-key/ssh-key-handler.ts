import { ResourceHandler, RuntimeContext } from '@cdk-x/core';
import { HetznerSshKey } from '@cdk-x/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

/**
 * Persisted state for a Hetzner SSH Key resource.
 * Extends the generated props interface with the numeric id returned
 * by the API (required for update and delete calls) and the fingerprint
 * computed server-side on create.
 */
export interface HetznerSshKeyState extends HetznerSshKey {
  readonly sshKeyId: number;
  readonly fingerprint: string;
}

/**
 * Handler for `Hetzner::Security::SshKey` resources.
 * Translates cdkx CRUD lifecycle calls into Hetzner Cloud SDK
 * requests, mapping camelCase props to snake_case SDK types explicitly.
 */
export class HetznerSshKeyHandler extends ResourceHandler<
  HetznerSshKey,
  HetznerSshKeyState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerSshKey,
  ): Promise<HetznerSshKeyState> {
    ctx.logger.info('provider.handler.ssh-key.create', { name: props.name });

    let response;
    try {
      response = await ctx.sdk.sshKeys.createSshKey({
        name: props.name,
        public_key: props.publicKey,
        labels: props.labels,
      });
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.ssh-key.create.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const key = this.assertExists(
      response.data.ssh_key,
      'Hetzner API returned no ssh_key object in create response',
    );

    return {
      sshKeyId: key.id,
      name: key.name,
      publicKey: key.public_key,
      fingerprint: key.fingerprint,
      labels: key.labels ?? {},
    };
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerSshKey,
    state: HetznerSshKeyState,
  ): Promise<HetznerSshKeyState> {
    ctx.logger.info('provider.handler.ssh-key.update', {
      sshKeyId: state.sshKeyId,
      name: props.name,
    });

    let response;
    try {
      response = await ctx.sdk.sshKeys.updateSshKey(state.sshKeyId, {
        name: props.name,
        labels: props.labels,
      });
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.ssh-key.update.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }

    const key = this.assertExists(
      response.data.ssh_key,
      'Hetzner API returned no ssh_key object in update response',
    );

    return {
      sshKeyId: key.id,
      name: key.name,
      publicKey: key.public_key,
      fingerprint: key.fingerprint,
      labels: key.labels ?? {},
    };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerSshKeyState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.ssh-key.delete', {
      sshKeyId: state.sshKeyId,
    });

    try {
      await ctx.sdk.sshKeys.deleteSshKey(state.sshKeyId);
    } catch (err) {
      const errorData =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: unknown } }).response?.data
          : undefined;
      ctx.logger.info('provider.handler.ssh-key.delete.error', {
        error: errorData ?? String(err),
      });
      throw err;
    }
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerSshKey,
  ): Promise<HetznerSshKeyState> {
    ctx.logger.debug('provider.handler.ssh-key.get', { name: props.name });

    const listResponse = await ctx.sdk.sshKeys.listSshKeys(
      undefined,
      props.name,
    );

    const keys = listResponse.data.ssh_keys ?? [];
    const key = this.assertExists(
      keys[0],
      `Hetzner ssh key not found: ${props.name}`,
    );

    return {
      sshKeyId: key.id,
      name: key.name,
      publicKey: key.public_key,
      fingerprint: key.fingerprint,
      labels: key.labels ?? {},
    };
  }
}
