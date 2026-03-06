import type { ProviderAdapter, ProviderAdapterFactory } from '@cdkx-io/engine';

/**
 * Registry that maps provider identifiers to their {@link ProviderAdapterFactory}.
 *
 * At CLI startup, all known provider factories are registered once. When the
 * deploy command reads the cloud assembly, it calls {@link build} with the
 * list of provider IDs found in the manifest — the registry instantiates each
 * adapter using the supplied environment (for credential sourcing) and returns
 * the map expected by `DeploymentEngine`.
 *
 * @example
 * ```ts
 * const registry = new AdapterRegistry()
 *   .register(new HetznerAdapterFactory())
 *   .register(new KubernetesAdapterFactory());
 *
 * const adapters = registry.build(['hetzner'], process.env);
 * // { hetzner: HetznerAdapter }
 * ```
 */
export class AdapterRegistry {
  private readonly factories = new Map<string, ProviderAdapterFactory>();

  /**
   * Register a factory for a provider.
   * If a factory for the same `providerId` is already registered, it is
   * replaced by the new one (last registration wins).
   *
   * Returns `this` to allow chained `.register()` calls.
   */
  register(factory: ProviderAdapterFactory): this {
    this.factories.set(factory.providerId, factory);
    return this;
  }

  /**
   * Instantiate an adapter for each provider ID in `providerIds`.
   *
   * Calls `factory.create(env)` for each ID. If any ID has no registered
   * factory, throws immediately with a descriptive message before creating
   * any adapters.
   *
   * @param providerIds - Unique provider identifiers found in the manifest.
   * @param env - Environment variables (typically `process.env`).
   * @returns A map of provider ID → adapter, ready to pass to `DeploymentEngine`.
   * @throws If a provider ID has no registered factory.
   */
  build(
    providerIds: string[],
    env: NodeJS.ProcessEnv,
  ): Record<string, ProviderAdapter> {
    // Fail fast — validate all providers before creating any adapter.
    for (const id of providerIds) {
      if (!this.factories.has(id)) {
        throw new Error(
          `No adapter factory registered for provider '${id}'. ` +
            `Registered providers: ${[...this.factories.keys()].join(', ') || '(none)'}.`,
        );
      }
    }

    const adapters: Record<string, ProviderAdapter> = {};
    for (const id of providerIds) {
      // Non-null assertion is safe — we validated above.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      adapters[id] = this.factories.get(id)!.create(env);
    }
    return adapters;
  }
}
