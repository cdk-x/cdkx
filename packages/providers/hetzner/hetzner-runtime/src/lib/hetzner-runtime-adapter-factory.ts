import type {
  ProviderAdapter,
  ProviderAdapterFactory,
  RuntimeResourceConfig,
} from '@cdk-x/engine';
import { RuntimeAdapter } from '@cdk-x/engine';
import type { RuntimeLogger } from '@cdk-x/core';
import { RUNTIME_CONFIGS } from '@cdk-x/hetzner';
import { HetznerSdkFactory } from './hetzner-sdk-facade';
import type {
  HetznerSdkOptions,
  HetznerSdkFactoryDeps,
} from './hetzner-sdk-facade';
import { HetznerRuntimeContext } from './hetzner-runtime-context';
import { HetznerProviderRuntime } from './hetzner-provider-runtime';

// ─── No-op logger ─────────────────────────────────────────────────────────────

/**
 * Minimal no-op logger used as the initial {@link RuntimeLogger} before
 * the engine calls `setLogger()` to inject the real one.
 */
class NoopLogger implements RuntimeLogger {
  debug(): void {
    /* no-op */
  }
  info(): void {
    /* no-op */
  }
  warn(): void {
    /* no-op */
  }
  error(): void {
    /* no-op */
  }
  child(): RuntimeLogger {
    return this;
  }
}

// ─── Injectable deps ──────────────────────────────────────────────────────────

/**
 * Injectable dependencies for {@link HetznerRuntimeAdapterFactory}.
 * Tests override these to avoid hitting the real Hetzner API.
 */
export interface HetznerRuntimeAdapterFactoryDeps {
  /** Override SDK creation. Default: {@link HetznerSdkFactory.create}. */
  createSdk?: (
    options: HetznerSdkOptions,
    deps?: HetznerSdkFactoryDeps,
  ) => ReturnType<typeof HetznerSdkFactory.create>;

  /** Override the provider runtime. Default: `new HetznerProviderRuntime()`. */
  createRuntime?: () => HetznerProviderRuntime;

  /** Override the initial logger. Default: `new NoopLogger()`. */
  createLogger?: () => RuntimeLogger;

  /** Override the resource configs map. Default: {@link RUNTIME_CONFIGS}. */
  resourceConfigs?: Record<string, RuntimeResourceConfig>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Factory that creates a {@link RuntimeAdapter} for Hetzner Cloud from
 * environment variables.
 *
 * Reads `HCLOUD_TOKEN` from the supplied `env` object and throws
 * immediately with a descriptive message if it is absent, so the CLI
 * can fail fast before any API calls are made.
 *
 * @example
 * ```ts
 * const registry = new AdapterRegistry()
 *   .register(new HetznerRuntimeAdapterFactory());
 * ```
 */
export class HetznerRuntimeAdapterFactory implements ProviderAdapterFactory {
  readonly providerId = 'hetzner';
  private readonly deps: HetznerRuntimeAdapterFactoryDeps;

  constructor(deps: HetznerRuntimeAdapterFactoryDeps = {}) {
    this.deps = deps;
  }

  create(env: NodeJS.ProcessEnv): ProviderAdapter {
    const apiToken = env['HCLOUD_TOKEN'];
    if (!apiToken) {
      throw new Error(
        'HetznerRuntimeAdapterFactory: HCLOUD_TOKEN environment variable is not set.',
      );
    }

    const createSdk = this.deps.createSdk ?? HetznerSdkFactory.create;
    const sdk = createSdk({ apiToken });

    const logger = this.deps.createLogger
      ? this.deps.createLogger()
      : new NoopLogger();

    const context = new HetznerRuntimeContext(sdk, logger);

    const runtime = this.deps.createRuntime
      ? this.deps.createRuntime()
      : new HetznerProviderRuntime();

    const resourceConfigs = this.deps.resourceConfigs ?? RUNTIME_CONFIGS;

    return new RuntimeAdapter({
      runtime,
      context,
      resourceConfigs,
    });
  }
}
