import { ProviderRuntime } from '@cdkx-io/core';
import { HetznerSdk } from './hetzner-sdk-facade';
import {
  HetznerNetworkHandler,
  HetznerSubnetHandler,
  HetznerRouteHandler,
} from './handlers';

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
    this.register('Hetzner::Networking::Subnet', new HetznerSubnetHandler());
    this.register('Hetzner::Networking::Route', new HetznerRouteHandler());
  }

  listResourceTypes(): string[] {
    return Object.keys(this.handlers);
  }
}
