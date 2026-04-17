import {
  MultipassCli,
  MultipassCliDeps,
} from '@cdk-x/multipass-sdk';

/**
 * The SDK type used by all Multipass resource handlers.
 *
 * For Multipass, the "SDK" is our {@link MultipassCli} wrapper around the
 * `multipass` CLI binary rather than an HTTP client library.
 * Handlers receive this type via {@link MultipassRuntimeContext}.
 */
export type MultipassSdk = MultipassCli;

/**
 * Injectable deps for {@link MultipassCliFactory}.
 * Tests override these to avoid spawning real processes.
 */
export type MultipassCliFactoryDeps = MultipassCliDeps;

/**
 * Factory that creates a {@link MultipassSdk} instance.
 *
 * @example
 * ```ts
 * const sdk = MultipassCliFactory.create();
 * ```
 */
export class MultipassCliFactory {
  static create(deps: MultipassCliFactoryDeps = {}): MultipassSdk {
    return new MultipassCli(deps);
  }
}
