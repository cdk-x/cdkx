import { ProviderRuntime } from '@cdk-x/core';
import type { MultipassSdk } from './multipass-cli-facade';
import { MultipassInstanceHandler } from './handlers';

/**
 * Multipass provider runtime.
 *
 * Registers one {@link ResourceHandler} per supported Multipass resource type.
 */
export class MultipassProviderRuntime extends ProviderRuntime<MultipassSdk> {
  constructor() {
    super();
    this.register(
      'Multipass::Compute::Instance',
      new MultipassInstanceHandler(),
    );
  }

  listResourceTypes(): string[] {
    return Object.keys(this.handlers);
  }
}
