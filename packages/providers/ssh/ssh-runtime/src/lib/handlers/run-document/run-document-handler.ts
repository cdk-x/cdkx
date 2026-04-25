import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ResourceHandler, RuntimeContext, Crn } from '@cdk-x/core';
import type { SSHRunDocument, RunDocumentStep } from '@cdk-x/ssh';
import type { SshSdk } from '../../ssh-sdk-facade';
import type { SshConnection } from '@cdk-x/ssh-sdk';

export interface SshRunDocumentState {
  readonly executionId: string;
  readonly documentName: string;
  readonly host: string;
  readonly port?: number;
  readonly user: string;
  readonly privateKeyPath: string;
}

export class SshRunDocumentHandler extends ResourceHandler<
  SSHRunDocument,
  SshRunDocumentState,
  SshSdk
> {
  async create(
    ctx: RuntimeContext<SshSdk>,
    props: SSHRunDocument,
  ): Promise<SshRunDocumentState> {
    const p = this.resolveProps(props);
    ctx.logger.info('provider.handler.run-document.create', {
      documentName: p.documentName,
      documentType: p.documentType,
      host: p.host,
    });

    const connection = await ctx.sdk.connect({
      host: p.host,
      port: p.port,
      user: p.user,
      privateKeyPath: p.privateKeyPath,
    });

    try {
      await this.executeDocument(ctx, connection, p);
    } finally {
      await connection.disconnect();
    }

    return {
      executionId: randomUUID(),
      documentName: p.documentName,
      host: p.host,
      port: p.port,
      user: p.user,
      privateKeyPath: p.privateKeyPath,
    };
  }

  async update(
    ctx: RuntimeContext<SshSdk>,
    props: SSHRunDocument,
    state: SshRunDocumentState,
  ): Promise<SshRunDocumentState> {
    ctx.logger.info('provider.handler.run-document.update', {
      executionId: state.executionId,
      documentName: state.documentName,
    });

    const connection = await ctx.sdk.connect({
      host: state.host,
      port: state.port,
      user: state.user,
      privateKeyPath: state.privateKeyPath,
    });

    try {
      await this.executeDocument(ctx, connection, this.resolveProps(props));
    } finally {
      await connection.disconnect();
    }

    return { ...state };
  }

  async delete(
    ctx: RuntimeContext<SshSdk>,
    state: SshRunDocumentState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.run-document.delete', {
      executionId: state.executionId,
    });
  }

  async get(
    ctx: RuntimeContext<SshSdk>,
    props: SSHRunDocument,
  ): Promise<SshRunDocumentState> {
    const p = this.resolveProps(props);
    ctx.logger.debug('provider.handler.run-document.get', { host: p.host });
    return {
      executionId: (props.executionId as string | undefined) ?? randomUUID(),
      documentName: p.documentName,
      host: p.host,
      port: p.port,
      user: p.user,
      privateKeyPath: p.privateKeyPath,
    };
  }

  private resolveProps(props: SSHRunDocument) {
    return {
      documentName: props.documentName,
      documentType: props.documentType,
      content: props.content,
      mainSteps: props.mainSteps,
      parameterValues: props.parameterValues,
      host: props.host,
      port: props.port,
      user: props.user,
      privateKeyPath: props.privateKeyPath,
    };
  }

  private async executeDocument(
    ctx: RuntimeContext<SshSdk>,
    connection: SshConnection,
    props: ReturnType<SshRunDocumentHandler['resolveProps']>,
  ): Promise<void> {
    if (props.documentType === 'Command') {
      const script = this.substituteParams(
        props.content ?? '',
        props.parameterValues,
      );
      ctx.logger.info('provider.handler.run-document.execute-command', {
        documentName: props.documentName,
      });
      const result = await connection.execute(script);
      this.logOutput(ctx, result.stdout, result.stderr);
      this.writeExecLog(
        props.documentName,
        'command',
        result.stdout,
        result.stderr,
      );
      if (result.code !== 0) {
        throw new Error(
          `Command document '${props.documentName}' failed with exit code ${result.code}: ${result.stderr}`,
        );
      }
      return;
    }

    for (const step of props.mainSteps ?? []) {
      await this.executeStep(
        ctx,
        connection,
        props.documentName,
        step,
        props.parameterValues,
      );
    }
  }

  private async executeStep(
    ctx: RuntimeContext<SshSdk>,
    connection: SshConnection,
    documentName: string,
    step: RunDocumentStep,
    parameterValues: Record<string, string> | undefined,
  ): Promise<void> {
    ctx.logger.info('provider.handler.run-document.execute-step', {
      documentName,
      stepName: step.name,
    });

    const commands = step.inputs.runCommand.map((cmd) =>
      this.substituteParams(cmd as string, parameterValues),
    );
    const script = commands.join('\n');

    const result = await connection.execute(script);
    this.logOutput(ctx, result.stdout, result.stderr);
    this.writeExecLog(documentName, step.name, result.stdout, result.stderr);
    if (result.code !== 0) {
      throw new Error(
        `Step '${step.name}' in document '${documentName}' failed with exit code ${result.code}: ${result.stderr}`,
      );
    }
  }

  buildCrn(_props: SSHRunDocument, state: SshRunDocumentState): string {
    return Crn.format({
      provider: 'ssh',
      domain: 'exec',
      resourceType: 'run-document',
      resourceId: state.executionId,
    });
  }

  private writeExecLog(
    documentName: string,
    stepName: string,
    stdout: string,
    stderr: string,
  ): void {
    try {
      const dir = join(process.cwd(), '.cdkx', 'exec-logs');
      mkdirSync(dir, { recursive: true });
      const safe = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '-');
      const filename = `${safe(documentName)}-${safe(stepName)}.log`;
      const parts: string[] = [];
      if (stdout.trim()) parts.push(stdout);
      if (stderr.trim()) parts.push(`--- stderr ---\n${stderr}`);
      writeFileSync(join(dir, filename), parts.join('\n'));
    } catch {
      // Non-fatal: file write failure must not break the deployment
    }
  }

  private logOutput(
    ctx: RuntimeContext<SshSdk>,
    stdout: string,
    stderr: string,
  ): void {
    if (stdout.trim()) {
      ctx.logger.info('provider.handler.run-document.stdout', { stdout });
    }
    if (stderr.trim()) {
      ctx.logger.warn('provider.handler.run-document.stderr', { stderr });
    }
  }

  private substituteParams(
    content: string,
    parameterValues: Record<string, string> | undefined,
  ): string {
    if (!parameterValues) return content;
    return content.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      return parameterValues[key] ?? `{{ ${key} }}`;
    });
  }
}
