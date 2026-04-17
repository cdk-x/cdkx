import { Provider } from '@cdk-x/core';

/**
 * Provider for Multipass resources.
 *
 * @example
 * ```ts
 * const provider = new MltProvider();
 * const stack = new Stack(app, 'DevVMs', { provider });
 * ```
 */
export class MltProvider extends Provider {
  public readonly identifier = 'multipass';
}
