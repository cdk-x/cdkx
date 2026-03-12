import { ProviderRuntime } from '@cdkx-io/core';
import { HetznerSdk } from './hetzner-sdk-facade';
import { HetznerNetworkHandler } from './handlers';

/**
 * Hetzner Cloud provider runtime.
 *
 * Registers one {@link ResourceHandler} per supported Hetzner resource
 * type.  The engine resolves the correct handler via
 * `getHandler(resourceType)` during deployment.
 */
export class HetznerProviderRuntime extends ProviderRuntime<HetznerSdk> {
  constructor() {
    super();
    this.register('Hetzner::Networking::Network', new HetznerNetworkHandler());
  }

  listResourceTypes(): string[] {
    return Object.keys(this.handlers);
  }
}
