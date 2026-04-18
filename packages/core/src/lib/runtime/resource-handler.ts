import { RuntimeContext } from './runtime-context';
import {
  StabilizeConfig,
  StabilizeStatus,
  StabilizationTimeoutError,
} from './stabilize';

export abstract class ResourceHandler<TProps, TState, TSdk> {
  abstract create(ctx: RuntimeContext<TSdk>, props: TProps): Promise<TState>;
  abstract update(
    ctx: RuntimeContext<TSdk>,
    props: TProps,
    state: TState,
  ): Promise<TState>;
  abstract delete(ctx: RuntimeContext<TSdk>, state: TState): Promise<void>;
  abstract get(ctx: RuntimeContext<TSdk>, props: TProps): Promise<TState>;

  /**
   * Build the CRN (Cloud Resource Name) for this resource.
   * Called by the RuntimeAdapter after create() to include the CRN in CreateResult.
   *
   * @param props - The resource properties (includes typeName for parsing)
   * @param state - The resource state returned by create() (includes resourceId)
   * @returns The CRN string in format: crn:cdkx:<provider>:<domain>[:<region>][:<account>]:<resource-type>/<resource-id>
   */
  abstract buildCrn(props: TProps, state: TState): string;

  /**
   * Poll `check` until the resource reaches a stable, usable state.
   *
   * Returns immediately when `check` returns `{ status: 'ready' }`.
   * Throws the supplied `reason` when `check` returns `{ status: 'failed' }`.
   * Throws {@link StabilizationTimeoutError} when `config.timeoutMs` elapses
   * before a `ready` response is received.
   *
   * Calls `check` at approximately `config.intervalMs` intervals.
   */
  protected async waitUntilStabilized(
    check: () => Promise<StabilizeStatus>,
    config: StabilizeConfig,
  ): Promise<void> {
    const deadline = Date.now() + config.timeoutMs;

    while (true) {
      const result = await check();

      if (result.status === 'ready') return;

      if (result.status === 'failed') {
        throw new Error(result.reason);
      }

      // status === 'pending'
      if (Date.now() >= deadline) {
        throw new StabilizationTimeoutError(config.timeoutMs);
      }

      await new Promise<void>((resolve) =>
        setTimeout(resolve, config.intervalMs),
      );
    }
  }

  protected assertExists<T>(value: T | undefined | null, msg?: string): T {
    if (value === undefined || value === null)
      throw new Error(msg ?? 'Value missing');
    return value;
  }
}
