import { Provider } from '@cdk-x/core';

/**
 * Provider for Multipass resources.
 *
 * Use with a `Stack` and `YamlFileSynthesizer` to synthesize Multipass VM
 * configuration files committed to the repository.
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
