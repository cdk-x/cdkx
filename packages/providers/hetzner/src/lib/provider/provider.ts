import { Provider } from '@cdk-x/core';
import { HetznerAdapter, type HetznerAdapterOptions } from '../adapter/index';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Configuration for the Hetzner Cloud provider.
 */
export interface HetznerProviderConfig {
  /**
   * Hetzner Cloud API token.
   *
   * Required when using the deployment engine (`createAdapter()`).
   * Not needed for pure synthesis (construct tree → JSON manifest).
   */
  readonly apiToken?: string;

  /**
   * Override the base URL for the Hetzner Cloud API.
   * Useful for testing against a mock server.
   *
   * @default 'https://api.hetzner.cloud/v1'
   */
  readonly baseUrl?: string;

  /**
   * Options forwarded to the {@link HetznerAdapter}'s action poller
   * (poll interval and timeout for async Hetzner operations).
   */
  readonly pollerOptions?: HetznerAdapterOptions['pollerOptions'];
}

// ─── HetznerProvider ──────────────────────────────────────────────────────────

/**
 * Provider for Hetzner Cloud resources.
 *
 * Pass an instance of this class to `Stack` to synthesize Hetzner Cloud
 * resource manifests. Call {@link createAdapter} on the same instance to
 * obtain a {@link HetznerAdapter} for deployment.
 *
 * @example
 * ```ts
 * const provider = new HetznerProvider({ apiToken: process.env.HCLOUD_TOKEN });
 * const stack = new Stack(app, 'MyStack', { provider });
 *
 * // After synth, deploy with the engine:
 * const engine = new DeploymentEngine({
 *   adapters: { hetzner: provider.createAdapter() },
 *   outdir: 'cdkx.out',
 * });
 * ```
 */
export class HetznerProvider extends Provider {
  public readonly identifier = 'hetzner';

  private readonly config: HetznerProviderConfig;

  constructor(config: HetznerProviderConfig = {}) {
    super();
    this.config = config;
  }

  /**
   * Create a {@link HetznerAdapter} for use with the deployment engine.
   *
   * @throws `Error` when `apiToken` was not provided in the constructor config.
   */
  public createAdapter(): HetznerAdapter {
    if (this.config.apiToken === undefined) {
      throw new Error(
        'HetznerProvider.createAdapter(): apiToken is required. ' +
          'Pass it via the HetznerProviderConfig constructor argument.',
      );
    }

    return new HetznerAdapter({
      apiToken: this.config.apiToken,
      baseUrl: this.config.baseUrl,
      pollerOptions: this.config.pollerOptions,
    });
  }
}
