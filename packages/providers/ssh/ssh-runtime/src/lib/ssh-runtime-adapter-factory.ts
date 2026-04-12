import type {
  ProviderAdapter,
  ProviderAdapterFactory,
  RuntimeResourceConfig,
} from '@cdk-x/engine';
import { RuntimeAdapter } from '@cdk-x/engine';
import type { RuntimeLogger } from '@cdk-x/core';
import { RUNTIME_CONFIGS } from '@cdk-x/ssh';
import { SshSdkFactory } from './ssh-sdk-facade';
import type { SshSdk } from './ssh-sdk-facade';
import { SshRuntimeContext } from './ssh-runtime-context';
import { SshProviderRuntime } from './ssh-provider-runtime';

// ─── No-op logger ─────────────────────────────────────────────────────────────

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

export interface SshRuntimeAdapterFactoryDeps {
  createSdk?: () => SshSdk;
  createRuntime?: () => SshProviderRuntime;
  createLogger?: () => RuntimeLogger;
  resourceConfigs?: Record<string, RuntimeResourceConfig>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Factory that creates a {@link RuntimeAdapter} for the SSH provider.
 *
 * Unlike Hetzner, SSH requires no API token — connection details live in
 * each resource's props. The factory simply wires up the SDK and runtime.
 *
 * @example
 * ```ts
 * const registry = new AdapterRegistry()
 *   .register(new SshRuntimeAdapterFactory());
 * ```
 */
export class SshRuntimeAdapterFactory implements ProviderAdapterFactory {
  readonly providerId = 'ssh';
  private readonly deps: SshRuntimeAdapterFactoryDeps;

  constructor(deps: SshRuntimeAdapterFactoryDeps = {}) {
    this.deps = deps;
  }

  create(_env: NodeJS.ProcessEnv): ProviderAdapter {
    const sdk = this.deps.createSdk
      ? this.deps.createSdk()
      : SshSdkFactory.create();

    const logger = this.deps.createLogger
      ? this.deps.createLogger()
      : new NoopLogger();

    const context = new SshRuntimeContext(sdk, logger);

    const runtime = this.deps.createRuntime
      ? this.deps.createRuntime()
      : new SshProviderRuntime();

    const resourceConfigs = this.deps.resourceConfigs ?? RUNTIME_CONFIGS;

    return new RuntimeAdapter({ runtime, context, resourceConfigs });
  }
}

export { SshRuntimeAdapterFactory as AdapterFactory };
