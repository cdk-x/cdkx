import type { ProviderAdapter, ProviderAdapterFactory } from '../adapter';

// ─── Static provider registry ────────────────────────────────────────────────

/**
 * Maps provider identifiers (as written in `manifest.json`) to the npm
 * package name that exports the corresponding {@link ProviderAdapterFactory}.
 *
 * Each package MUST export its factory class under the well-known name
 * `AdapterFactory` (i.e. `require(pkg).AdapterFactory`).
 *
 * Add new providers here as they are implemented.
 */
const PROVIDER_PACKAGES: Readonly<Record<string, string>> = {
  hetzner: '@cdk-x/hetzner-runtime',
  multipass: '@cdk-x/multipass-runtime',
};

// ─── Error ────────────────────────────────────────────────────────────────────

/**
 * Thrown when a provider identifier cannot be resolved to an adapter factory.
 */
export class PluginError extends Error {
  readonly providerId: string;

  constructor(providerId: string, cause?: string) {
    const message = cause
      ? `Plugin error for provider '${providerId}': ${cause}`
      : `Unknown provider '${providerId}'. ` +
        `Registered providers: ${Object.keys(PROVIDER_PACKAGES).join(', ')}.`;
    super(message);
    this.name = 'PluginError';
    this.providerId = providerId;
  }
}

// ─── Injectable deps ──────────────────────────────────────────────────────────

/**
 * Injectable dependencies for {@link PluginManager}.
 * Tests override `requireModule` to avoid loading real packages.
 */
export interface PluginManagerDeps {
  /**
   * Module loader. Default: Node's `require()`.
   * Signature matches `require(id)` — returns the module's exports object.
   */
  requireModule?: (id: string) => unknown;
}

// ─── PluginManager ────────────────────────────────────────────────────────────

/**
 * Discovers and instantiates {@link ProviderAdapter}s from provider runtime
 * packages using a static registry.
 *
 * The manager maps provider identifiers (e.g. `'hetzner'`) to npm package
 * names (e.g. `'@cdk-x/hetzner-runtime'`), dynamically `require()`s each
 * package, extracts the well-known `AdapterFactory` export, and calls
 * `factory.create(env)` to build the adapter.
 *
 * @example
 * ```ts
 * const manager = new PluginManager();
 * const adapters = manager.buildAdapters(['hetzner'], process.env);
 * // adapters = { hetzner: <ProviderAdapter> }
 * ```
 */
export class PluginManager {
  private readonly requireModule: (id: string) => unknown;

  constructor(deps: PluginManagerDeps = {}) {
    this.requireModule = deps.requireModule ?? require;
  }

  /**
   * Build adapters for the given provider IDs.
   *
   * @param providerIds - Unique provider identifiers found in the manifest.
   * @param env - Environment variables (typically `process.env`). Passed to
   *   each factory's `create()` method for credential resolution.
   * @returns A record mapping each provider ID to its instantiated adapter.
   * @throws {PluginError} If a provider ID is not in the static registry,
   *   the package cannot be loaded, or the package does not export
   *   `AdapterFactory`.
   */
  buildAdapters(
    providerIds: string[],
    env: NodeJS.ProcessEnv,
  ): Record<string, ProviderAdapter> {
    const adapters: Record<string, ProviderAdapter> = {};

    for (const id of providerIds) {
      const factory = this.loadFactory(id);
      adapters[id] = factory.create(env);
    }

    return adapters;
  }

  /**
   * Returns the set of provider IDs that have a registered package.
   */
  static registeredProviders(): string[] {
    return Object.keys(PROVIDER_PACKAGES);
  }

  // ─── Private helpers ────────────────────────────────────────────────

  private loadFactory(providerId: string): ProviderAdapterFactory {
    const packageName = PROVIDER_PACKAGES[providerId];
    if (!packageName) {
      throw new PluginError(providerId);
    }

    let mod: unknown;
    try {
      mod = this.requireModule(packageName);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new PluginError(
        providerId,
        `Failed to load package '${packageName}': ${message}`,
      );
    }

    const factoryCtor = (mod as Record<string, unknown> | undefined)?.[
      'AdapterFactory'
    ];
    if (typeof factoryCtor !== 'function') {
      throw new PluginError(
        providerId,
        `Package '${packageName}' does not export 'AdapterFactory'.`,
      );
    }

    const factory = new (factoryCtor as new () => ProviderAdapterFactory)();

    if (typeof factory.create !== 'function') {
      throw new PluginError(
        providerId,
        `'AdapterFactory' from '${packageName}' does not implement create().`,
      );
    }

    return factory;
  }
}
