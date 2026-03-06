import type { HetznerClient } from './hetzner-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionPollerOptions {
  /**
   * How long to wait between polls in milliseconds.
   * @default 2000
   */
  readonly pollInterval?: number;
  /**
   * Maximum total time to wait for an action to complete, in milliseconds.
   * @default 300_000 (5 minutes)
   */
  readonly pollTimeout?: number;
}

/** Shape of a Hetzner Action object as returned by the API. */
interface HetznerAction {
  id: number;
  status: 'running' | 'success' | 'error';
  progress: number;
  error?: {
    code: string;
    message: string;
  };
}

/** Shape of the `/actions/{id}` response. */
interface GetActionResponse {
  action: HetznerAction;
}

// ─── ActionPoller ─────────────────────────────────────────────────────────────

/**
 * Polls `GET /actions/{id}` until the action reaches a terminal state.
 *
 * Hetzner Cloud uses an async action model for many operations (server
 * creation, network changes, etc.). The API returns an `action` object with
 * `status: 'running'` immediately; this poller waits until
 * `status === 'success'` or throws on `status === 'error'` / timeout.
 *
 * @example
 * ```ts
 * const poller = new ActionPoller(client, { pollInterval: 1000 });
 * await poller.poll(actionId); // resolves when action completes
 * ```
 */
export class ActionPoller {
  private readonly pollInterval: number;
  private readonly pollTimeout: number;

  constructor(
    private readonly client: HetznerClient,
    options: ActionPollerOptions = {},
  ) {
    this.pollInterval = options.pollInterval ?? 2_000;
    this.pollTimeout = options.pollTimeout ?? 300_000;
  }

  /**
   * Poll the given action ID until it reaches a terminal state.
   *
   * Uses `Promise.race` between the polling loop and a timeout promise.
   * The timeout handle is always cleared in a `finally` block so that no
   * unhandled rejection leaks after the race settles.
   *
   * @param actionId - The Hetzner action ID to poll.
   * @throws `Error` if the action fails (`status === 'error'`).
   * @throws `Error` if the action does not complete within `pollTimeout`.
   */
  public async poll(actionId: number): Promise<void> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () =>
          reject(
            new Error(
              `Hetzner action ${actionId} timed out after ${this.pollTimeout}ms`,
            ),
          ),
        this.pollTimeout,
      );
    });
    // Suppress unhandled-rejection warnings for the timeout promise — the
    // rejection is consumed by Promise.race below. Without this, if the poll
    // loop wins the race and the timeout fires afterwards, Node reports the
    // timeout rejection as unhandled.
    timeoutPromise.catch(() => undefined);

    try {
      await Promise.race([this.pollLoop(actionId), timeoutPromise]);
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private async pollLoop(actionId: number): Promise<void> {
    while (true) {
      const { action } = await this.client.get<GetActionResponse>(
        `/actions/${actionId}`,
      );

      if (action.status === 'success') {
        return;
      }

      if (action.status === 'error') {
        const msg =
          action.error !== undefined
            ? `${action.error.code}: ${action.error.message}`
            : 'Action failed with unknown error';
        throw new Error(`Hetzner action ${actionId} failed: ${msg}`);
      }

      // status === 'running' — wait and retry
      await this.sleep(this.pollInterval);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
