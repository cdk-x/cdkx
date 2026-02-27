/**
 * Interface for objects that can produce a value lazily at synthesis time.
 */
export interface IAnyProducer {
  produce(): unknown;
}

/**
 * A lazy value — a deferred computation that is resolved at synthesis time.
 *
 * Use `Lazy.any()` to wrap a producer whose value is not yet known at construction time
 * (e.g. it depends on another resource that hasn't been defined yet).
 *
 * The `Lazy` instance flows through the construct tree as a plain object reference.
 * At synthesis time, `LazyResolver` detects it and calls `produce()` to obtain the real value.
 *
 * @example
 * const replicas = Lazy.any({ produce: () => this.replicaCount });
 * new ProviderResource(this, 'Default', {
 *   type: 'Deployment',
 *   properties: { spec: { replicas } },
 * });
 */
export class Lazy {
  private constructor(private readonly producer: IAnyProducer) {}

  /**
   * Creates a lazy value from a producer.
   * The return type is `any` so it can be assigned to any typed property without casting.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static any(producer: IAnyProducer): any {
    return new Lazy(producer);
  }

  /**
   * Evaluates the producer and returns the concrete value.
   * Called by `LazyResolver` during synthesis.
   */
  public produce(): unknown {
    return this.producer.produce();
  }
}
