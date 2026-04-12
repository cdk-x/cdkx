import { randomUUID } from 'node:crypto';
import { ResourceHandler, RuntimeContext } from '@cdk-x/core';
import type { SSHPackage } from '@cdk-x/ssh';
import type { SshSdk } from '../../ssh-sdk-facade';

export interface SshPackageState {
  readonly executionId: string;
  readonly packageName: string;
  readonly host: string;
  readonly user: string;
  readonly privateKeyPath: string;
  readonly port?: number;
}

/**
 * Handler for `SSH::System::Package` resources.
 *
 * - `get()`: checks whether the package is installed via `dpkg -l`.
 * - `create()`: installs the package asynchronously with `nohup apt-get`
 *   and polls the job status file until done or failed.
 * - `delete()`: uninstalls the package (supports rollback).
 */
export class SshPackageHandler extends ResourceHandler<
  SSHPackage,
  SshPackageState,
  SshSdk
> {
  async create(
    ctx: RuntimeContext<SshSdk>,
    props: SSHPackage,
  ): Promise<SshPackageState> {
    ctx.logger.info('provider.handler.package.create', {
      packageName: props.packageName,
    });

    const jobId = randomUUID();
    const connection = await ctx.sdk.connect({
      host: props.host,
      port: props.port,
      user: props.user,
      privateKeyPath: props.privateKeyPath,
    });

    try {
      await connection.nohupExecute(
        `apt-get install -y ${props.packageName}`,
        jobId,
      );

      await this.waitUntilStabilized(async () => {
        const status = await connection.checkJobStatus(jobId);
        if (status === 'done') return { status: 'ready' };
        if (status === 'failed')
          return {
            status: 'failed',
            reason: `Package installation failed for '${props.packageName}'`,
          };
        return { status: 'pending' };
      }, ctx.stabilizeConfig);
    } finally {
      await connection.disconnect();
    }

    return {
      executionId: randomUUID(),
      packageName: props.packageName,
      host: props.host,
      port: props.port,
      user: props.user,
      privateKeyPath: props.privateKeyPath,
    };
  }

  async update(
    ctx: RuntimeContext<SshSdk>,
    props: SSHPackage,
    state: SshPackageState,
  ): Promise<SshPackageState> {
    ctx.logger.info('provider.handler.package.update', {
      packageName: props.packageName,
    });
    return { ...state, packageName: props.packageName };
  }

  async delete(
    ctx: RuntimeContext<SshSdk>,
    state: SshPackageState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.package.delete', {
      packageName: state.packageName,
    });

    const connection = await ctx.sdk.connect({
      host: state.host,
      port: state.port,
      user: state.user,
      privateKeyPath: state.privateKeyPath,
    });
    try {
      await connection.execute(`apt-get remove -y ${state.packageName}`);
    } finally {
      await connection.disconnect();
    }
  }

  async get(
    ctx: RuntimeContext<SshSdk>,
    props: SSHPackage,
  ): Promise<SshPackageState> {
    ctx.logger.debug('provider.handler.package.get', {
      packageName: props.packageName,
    });

    const connection = await ctx.sdk.connect({
      host: props.host,
      port: props.port,
      user: props.user,
      privateKeyPath: props.privateKeyPath,
    });

    let result;
    try {
      result = await connection.execute(`dpkg -l ${props.packageName}`);
    } finally {
      await connection.disconnect();
    }

    if (result.code !== 0) {
      throw new Error(
        `Package '${props.packageName}' is not installed on ${props.host}`,
      );
    }

    return {
      executionId: props.executionId ?? randomUUID(),
      packageName: props.packageName,
      host: props.host,
      port: props.port,
      user: props.user,
      privateKeyPath: props.privateKeyPath,
    };
  }
}
