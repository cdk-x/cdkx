import { ResourceHandler, RuntimeContext, Crn } from '@cdk-x/core';
import type { SSHDocument, DocumentStep } from '@cdk-x/ssh';
import type { SshSdk } from '../../ssh-sdk-facade';

export interface SshDocumentState {
  readonly name: string;
  readonly documentType: 'Command' | 'Automation';
  readonly content?: string;
  readonly mainSteps?: DocumentStep[];
  readonly parameters?: Record<string, unknown>;
}

export class SshDocumentHandler extends ResourceHandler<
  SSHDocument,
  SshDocumentState,
  SshSdk
> {
  override readonly deletable = false;

  async create(
    ctx: RuntimeContext<SshSdk>,
    props: SSHDocument,
  ): Promise<SshDocumentState> {
    ctx.logger.info('provider.handler.document.create', {
      name: props.name,
      documentType: props.documentType,
    });
    return this.toState(props);
  }

  async update(
    ctx: RuntimeContext<SshSdk>,
    props: SSHDocument,
    state: SshDocumentState,
  ): Promise<SshDocumentState> {
    ctx.logger.info('provider.handler.document.update', { name: state.name });
    return { ...this.toState(props), name: state.name };
  }

  async delete(
    ctx: RuntimeContext<SshSdk>,
    state: SshDocumentState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.document.delete', { name: state.name });
  }

  async get(
    ctx: RuntimeContext<SshSdk>,
    props: SSHDocument,
  ): Promise<SshDocumentState> {
    ctx.logger.debug('provider.handler.document.get', { name: props.name });
    return this.toState(props);
  }

  private toState(props: SSHDocument): SshDocumentState {
    return {
      name: props.name,
      documentType: props.documentType,
      content: props.content,
      mainSteps: props.mainSteps,
      parameters: props.parameters,
    };
  }

  buildCrn(_props: SSHDocument, state: SshDocumentState): string {
    return Crn.format({
      provider: 'ssh',
      domain: 'exec',
      resourceType: 'document',
      resourceId: state.name,
    });
  }
}
