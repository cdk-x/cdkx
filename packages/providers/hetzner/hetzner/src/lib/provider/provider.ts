import { Provider } from '@cdk-x/core';

// ─── HetznerProvider ──────────────────────────────────────────────────────────

/**
 * Provider for Hetzner Cloud resources.
 *
 * Pass an instance of this class to `Stack` to synthesize Hetzner Cloud
 * resource manifests.
 *
 * @example
 * ```ts
 * const provider = new HetznerProvider();
 * const stack = new Stack(app, 'MyStack', { provider });
 * ```
 */
export class HetznerProvider extends Provider {
  public readonly identifier = 'hetzner';
}
