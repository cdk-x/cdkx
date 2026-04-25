import { ProviderRuntime } from '@cdk-x/core';
import type { SshSdk } from './ssh-sdk-facade';
import { SshShellScriptHandler } from './handlers/shell-script/shell-script-handler';
import { SshDocumentHandler } from './handlers/document/document-handler';
import { SshRunDocumentHandler } from './handlers/run-document/run-document-handler';

/**
 * SSH provider runtime.
 *
 * Registers one {@link ResourceHandler} per supported SSH resource type.
 */
export class SshProviderRuntime extends ProviderRuntime<SshSdk> {
  constructor() {
    super();
    this.register('SSH::Exec::ShellScript', new SshShellScriptHandler());
    this.register('SSH::Exec::Document', new SshDocumentHandler());
    this.register('SSH::Exec::RunDocument', new SshRunDocumentHandler());
  }

  listResourceTypes(): string[] {
    return Object.keys(this.handlers);
  }
}
