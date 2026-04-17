import { spawnSync } from 'child_process';
import type { ProviderAdapter, ProviderAdapterFactory } from '@cdk-x/engine';
import { RuntimeAdapter } from '@cdk-x/engine';
import type { RuntimeLogger } from '@cdk-x/core';
import type { RuntimeResourceConfig } from '@cdk-x/multipass';
import { RUNTIME_CONFIGS } from '@cdk-x/multipass';
import { MultipassCliFactory, type MultipassSdk } from './multipass-cli-facade';
import { MultipassRuntimeContext } from './multipass-runtime-context';
import { MultipassProviderRuntime } from './multipass-provider-runtime';

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

// ─── Default synchronous installed check ─────────────────────────────────────

function defaultCheckInstalled(): void {
  const result = spawnSync('multipass', ['version'], { stdio: 'ignore' });
  if (result.error || result.status !== 0) {
    throw new Error(
      'Multipass is not installed or not on PATH. ' +
        'Install it from https://multipass.run and try again.',
    );
  }
}

// ─── Injectable deps ──────────────────────────────────────────────────────────

/**
 * Injectable dependencies for {@link MultipassRuntimeAdapterFactory}.
 * Tests override these to avoid spawning real processes or hitting real VMs.
 */
export interface MultipassRuntimeAdapterFactoryDeps {
  /**
   * Synchronous check that Multipass is installed.
   * Throws if not. Default: runs `multipass version` via spawnSync.
   */
  checkInstalled?: () => void;

  /** Override CLI creation. Default: `MultipassCliFactory.create()`. */
  createCli?: () => MultipassSdk;

  /** Override the provider runtime. Default: `new MultipassProviderRuntime()`. */
  createRuntime?: () => MultipassProviderRuntime;

  /** Override the initial logger. Default: `new NoopLogger()`. */
  createLogger?: () => RuntimeLogger;

  /** Override the resource configs map. Default: {@link RUNTIME_CONFIGS}. */
  resourceConfigs?: Record<string, RuntimeResourceConfig>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Factory that creates a {@link RuntimeAdapter} for Multipass.
 *
 * Calls `checkInstalled()` at construction time so that `cdkx deploy` fails
 * immediately with a clear error if Multipass is not installed, before any
 * stack processing begins.
 *
 * @example
 * ```ts
 * const registry = new AdapterRegistry()
 *   .register(new MultipassRuntimeAdapterFactory());
 * ```
 */
export class MultipassRuntimeAdapterFactory implements ProviderAdapterFactory {
  readonly providerId = 'multipass';
  private readonly deps: MultipassRuntimeAdapterFactoryDeps;

  constructor(deps: MultipassRuntimeAdapterFactoryDeps = {}) {
    this.deps = deps;
    const check = deps.checkInstalled ?? defaultCheckInstalled;
    check();
  }

  create(): ProviderAdapter {
    const createCli = this.deps.createCli ?? (() => MultipassCliFactory.create());
    const cli = createCli();

    const logger = this.deps.createLogger
      ? this.deps.createLogger()
      : new NoopLogger();

    const context = new MultipassRuntimeContext(cli, logger);

    const runtime = this.deps.createRuntime
      ? this.deps.createRuntime()
      : new MultipassProviderRuntime();

    const resourceConfigs = this.deps.resourceConfigs ?? RUNTIME_CONFIGS;

    return new RuntimeAdapter({
      runtime,
      context,
      resourceConfigs,
    });
  }
}

/** Well-known export name consumed by {@link PluginManager}. */
export const AdapterFactory = MultipassRuntimeAdapterFactory;
