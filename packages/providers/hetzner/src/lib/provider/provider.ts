import { Provider } from '@cdk-x/core';

/**
 * Provider for Hetzner Cloud resources.
 *
 * Extend this class to add custom resolvers, a custom synthesizer, or
 * deployment environment metadata (e.g. project name, datacenter).
 *
 * @example
 * const provider = new HetznerProvider();
 * const stack = new Stack(app, 'MyStack', { provider });
 */
export class HetznerProvider extends Provider {
  public readonly identifier = 'hetzner';
}
