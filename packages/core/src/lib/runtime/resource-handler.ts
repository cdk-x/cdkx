import { RuntimeContext } from './runtime-context';

export abstract class ResourceHandler<TProps, TState, TSdk> {
  abstract create(ctx: RuntimeContext<TSdk>, props: TProps): Promise<TState>;
  abstract update(
    ctx: RuntimeContext<TSdk>,
    props: TProps,
    state: TState,
  ): Promise<TState>;
  abstract delete(ctx: RuntimeContext<TSdk>, state: TState): Promise<void>;
  abstract get(ctx: RuntimeContext<TSdk>, props: TProps): Promise<TState>;
  protected assertExists<T>(value: T | undefined | null, msg?: string): T {
    if (value === undefined || value === null)
      throw new Error(msg ?? 'Value missing');
    return value;
  }
}
