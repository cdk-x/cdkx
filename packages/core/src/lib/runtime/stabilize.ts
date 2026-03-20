/**
 * Configuration for the stabilization polling loop used by
 * {@link ResourceHandler.waitUntilStabilized}.
 */
export interface StabilizeConfig {
  /** How long to wait between polling attempts, in milliseconds. */
  readonly intervalMs: number;
  /** Maximum total time to wait before giving up, in milliseconds. */
  readonly timeoutMs: number;
}

/**
 * Discriminated union returned by the `check` callback passed to
 * {@link ResourceHandler.waitUntilStabilized}.
 *
 * - `ready`   — the resource is fully operational; polling stops.
 * - `pending` — the resource is still provisioning; try again after `intervalMs`.
 * - `failed`  — a terminal error occurred; polling stops and an error is thrown.
 */
export type StabilizeStatus =
  | { readonly status: 'ready' }
  | { readonly status: 'pending' }
  | { readonly status: 'failed'; readonly reason: string };

/**
 * Thrown by {@link ResourceHandler.waitUntilStabilized} when the resource
 * does not reach a ready state within `config.timeoutMs` milliseconds.
 */
export class StabilizationTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Stabilization timed out after ${timeoutMs}ms`);
    this.name = 'StabilizationTimeoutError';
  }
}
