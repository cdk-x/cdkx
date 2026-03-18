import { ActionPoller } from './action-poller';
import type { HetznerClient } from './hetzner-client';

// ─── Mock client ──────────────────────────────────────────────────────────────

function makeClient(
  responses: Array<{
    status: 'running' | 'success' | 'error';
    errorMsg?: string;
  }>,
): HetznerClient {
  let callCount = 0;
  return {
    get: jest.fn(async () => {
      const r = responses[Math.min(callCount++, responses.length - 1)];
      return {
        action: {
          id: 42,
          status: r.status,
          progress: r.status === 'success' ? 100 : 50,
          ...(r.status === 'error' && r.errorMsg !== undefined
            ? { error: { code: 'action_failed', message: r.errorMsg } }
            : {}),
        },
      };
    }),
  } as unknown as HetznerClient;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ActionPoller', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('resolves immediately when action is already successful', async () => {
    const client = makeClient([{ status: 'success' }]);
    const poller = new ActionPoller(client, { pollInterval: 100 });

    await expect(poller.poll(42)).resolves.toBeUndefined();
    expect(client.get).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith('/actions/42');
  });

  it('polls until success after running responses', async () => {
    const client = makeClient([
      { status: 'running' },
      { status: 'running' },
      { status: 'success' },
    ]);
    const poller = new ActionPoller(client, { pollInterval: 100 });

    const promise = poller.poll(42);

    // Advance timers to trigger sleeps
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toBeUndefined();
    expect(client.get).toHaveBeenCalledTimes(3);
  });

  it('throws when action status is error', async () => {
    const client = makeClient([
      { status: 'error', errorMsg: 'resource limit reached' },
    ]);
    const poller = new ActionPoller(client, { pollInterval: 100 });

    await expect(poller.poll(42)).rejects.toThrow(
      'Hetzner action 42 failed: action_failed: resource limit reached',
    );
  });

  it('throws a generic message when error has no details', async () => {
    const client: HetznerClient = {
      get: jest.fn(async () => ({
        action: { id: 99, status: 'error', progress: 0 },
      })),
    } as unknown as HetznerClient;

    const poller = new ActionPoller(client, { pollInterval: 100 });

    await expect(poller.poll(99)).rejects.toThrow(
      'Hetzner action 99 failed: Action failed with unknown error',
    );
  });

  it('throws a timeout error when action does not complete in time', async () => {
    // Always returns 'running'
    const client = makeClient([{ status: 'running' }]);
    const poller = new ActionPoller(client, {
      pollInterval: 100,
      pollTimeout: 250,
    });

    const promise = poller.poll(42);
    // Start the assertion BEFORE advancing timers. We intentionally do NOT
    // await advanceTimersByTimeAsync first — if we did, the rejection would
    // propagate before our rejects.toThrow() handler is attached, causing an
    // unhandled rejection failure.
    const assertion = expect(promise).rejects.toThrow(
      'Hetzner action 42 timed out after 250ms',
    );
    // Advance past the pollTimeout so the timeout timer fires.
    await jest.advanceTimersByTimeAsync(251);
    await assertion;
  });

  it('polls using the correct action path', async () => {
    const client = makeClient([{ status: 'success' }]);
    const poller = new ActionPoller(client);

    await poller.poll(7);
    expect(client.get).toHaveBeenCalledWith('/actions/7');
  });

  it('uses default pollInterval of 2000ms when not specified', async () => {
    // Two 'running', then 'success'
    const client = makeClient([{ status: 'running' }, { status: 'success' }]);
    const poller = new ActionPoller(client);

    const promise = poller.poll(42);
    // With default 2s interval, advance 2s to trigger the sleep
    await jest.advanceTimersByTimeAsync(2001);

    await expect(promise).resolves.toBeUndefined();
  });
});
