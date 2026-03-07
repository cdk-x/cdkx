import type { ProviderAdapter, ProviderAdapterFactory } from '@cdkx-io/engine';
import { HetznerAdapter } from './hetzner-adapter';

/**
 * Factory that creates a {@link HetznerAdapter} from environment variables.
 *
 * Reads `HCLOUD_TOKEN` from the supplied `env` object and throws immediately
 * with a descriptive message if it is absent, so the CLI can fail fast before
 * any API calls are made.
 *
 * @example
 * ```ts
 * const registry = new AdapterRegistry()
 *   .register(new HetznerAdapterFactory());
 * ```
 */
export class HetznerAdapterFactory implements ProviderAdapterFactory {
  readonly providerId = 'hetzner';

  create(env: NodeJS.ProcessEnv): ProviderAdapter {
    const apiToken = env['HCLOUD_TOKEN'];
    if (!apiToken) {
      throw new Error(
        'HetznerAdapterFactory: HCLOUD_TOKEN environment variable is not set.',
      );
    }
    return new HetznerAdapter({ apiToken });
  }
}
