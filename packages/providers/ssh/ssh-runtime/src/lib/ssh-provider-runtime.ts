import { ProviderRuntime } from '@cdk-x/core';
import type { SshSdk } from './ssh-sdk-facade';
import { SshRunbookHandler } from './handlers/runbook/runbook-handler';
import { SshPackageHandler } from './handlers/package/package-handler';

/**
 * SSH provider runtime.
 *
 * Registers one {@link ResourceHandler} per supported SSH resource type.
 */
export class SshProviderRuntime extends ProviderRuntime<SshSdk> {
  constructor() {
    super();
    this.register('SSH::Exec::Runbook', new SshRunbookHandler());
    this.register('SSH::System::Package', new SshPackageHandler());
  }

  listResourceTypes(): string[] {
    return Object.keys(this.handlers);
  }
}
