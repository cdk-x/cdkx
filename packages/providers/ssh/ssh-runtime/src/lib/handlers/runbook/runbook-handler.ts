import { randomUUID } from 'node:crypto';
import { ResourceHandler, RuntimeContext } from '@cdk-x/core';
import type { SSHRunbook } from '@cdk-x/ssh';
import type { SshSdk } from '../../ssh-sdk-facade';

export interface SshRunbookState {
  readonly executionId: string;
  readonly host: string;
  readonly port?: number;
  readonly user: string;
  readonly privateKeyPath: string;
}

/**
 * Handler for `SSH::Exec::Runbook` resources.
 *
 * On `create()`, validates SSH connectivity to the target host by opening
 * and immediately closing a connection. Returns the connection details as
 * state so dependent task resources can resolve them via `getAtt()` tokens.
 */
export class SshRunbookHandler extends ResourceHandler<
  SSHRunbook,
  SshRunbookState,
  SshSdk
> {
  async create(
    ctx: RuntimeContext<SshSdk>,
    props: SSHRunbook,
  ): Promise<SshRunbookState> {
    ctx.logger.info('provider.handler.runbook.create', { host: props.host });

    const connection = await ctx.sdk.connect({
      host: props.host,
      port: props.port,
      user: props.user,
      privateKeyPath: props.privateKeyPath,
    });
    await connection.disconnect();

    return {
      executionId: randomUUID(),
      host: props.host,
      port: props.port,
      user: props.user,
      privateKeyPath: props.privateKeyPath,
    };
  }

  async update(
    ctx: RuntimeContext<SshSdk>,
    props: SSHRunbook,
    state: SshRunbookState,
  ): Promise<SshRunbookState> {
    ctx.logger.info('provider.handler.runbook.update', {
      executionId: state.executionId,
    });
    return { ...state };
  }

  async delete(
    ctx: RuntimeContext<SshSdk>,
    state: SshRunbookState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.runbook.delete', {
      executionId: state.executionId,
    });
  }

  async get(
    ctx: RuntimeContext<SshSdk>,
    props: SSHRunbook,
  ): Promise<SshRunbookState> {
    ctx.logger.debug('provider.handler.runbook.get', { host: props.host });
    const connection = await ctx.sdk.connect({
      host: props.host,
      port: props.port,
      user: props.user,
      privateKeyPath: props.privateKeyPath,
    });
    await connection.disconnect();
    return {
      executionId: props.executionId ?? randomUUID(),
      host: props.host,
      port: props.port,
      user: props.user,
      privateKeyPath: props.privateKeyPath,
    };
  }
}
