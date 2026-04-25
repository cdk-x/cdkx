import { ResourceHandler, RuntimeContext, Crn } from '@cdk-x/core';
import type { SSHShellScript } from '@cdk-x/ssh';
import type { SshSdk } from '../../ssh-sdk-facade';

export interface SshShellScriptState {
  readonly name: string;
  readonly runCommand: string[];
  readonly parameters?: Record<string, unknown>;
}

export class SshShellScriptHandler extends ResourceHandler<
  SSHShellScript,
  SshShellScriptState,
  SshSdk
> {
  override readonly deletable = false;

  async create(
    ctx: RuntimeContext<SshSdk>,
    props: SSHShellScript,
  ): Promise<SshShellScriptState> {
    ctx.logger.info('provider.handler.shell-script.create', {
      name: props.name,
    });
    return {
      name: props.name,
      runCommand: props.runCommand as string[],
      parameters: props.parameters,
    };
  }

  async update(
    ctx: RuntimeContext<SshSdk>,
    props: SSHShellScript,
    state: SshShellScriptState,
  ): Promise<SshShellScriptState> {
    ctx.logger.info('provider.handler.shell-script.update', {
      name: state.name,
    });
    return {
      name: state.name,
      runCommand: props.runCommand as string[],
      parameters: props.parameters,
    };
  }

  async delete(
    ctx: RuntimeContext<SshSdk>,
    state: SshShellScriptState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.shell-script.delete', {
      name: state.name,
    });
  }

  async get(
    ctx: RuntimeContext<SshSdk>,
    props: SSHShellScript,
  ): Promise<SshShellScriptState> {
    ctx.logger.debug('provider.handler.shell-script.get', { name: props.name });
    return {
      name: props.name,
      runCommand: props.runCommand as string[],
      parameters: props.parameters,
    };
  }

  buildCrn(_props: SSHShellScript, state: SshShellScriptState): string {
    return Crn.format({
      provider: 'ssh',
      domain: 'exec',
      resourceType: 'shell-script',
      resourceId: state.name,
    });
  }
}
