import { Provider } from '@cdk-x/core';

/**
 * Provider for SSH remote execution resources.
 *
 * Pass an instance of this class to `Stack` to synthesize SSH resource manifests.
 *
 * @example
 * ```ts
 * const provider = new SshProvider();
 * const stack = new Stack(app, 'MyStack', { provider });
 * ```
 */
export class SshProvider extends Provider {
  public readonly identifier = 'ssh';
}
