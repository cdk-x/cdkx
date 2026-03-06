/**
 * Handler function type for engine events.
 */
export type EventHandler<T> = (event: T) => void;

/**
 * A lightweight synchronous Observer implementation.
 *
 * Subscribers register a handler and receive back an unsubscribe function.
 * The bus is intentionally simple — no async, no Node.js EventEmitter
 * dependency — so it is fully testable in isolation.
 *
 * @example
 * ```ts
 * const bus = new EventBus<EngineEvent>();
 *
 * const unsubscribe = bus.subscribe((event) => {
 *   console.log(event.resourceStatus);
 * });
 *
 * bus.emit(event); // calls all registered handlers synchronously
 * unsubscribe();   // removes this handler
 * bus.clear();     // removes all handlers (useful in tests)
 * ```
 */
export class EventBus<T> {
  private readonly handlers: Set<EventHandler<T>> = new Set();

  /**
   * Register a handler to be called on every emitted event.
   *
   * @returns A zero-argument unsubscribe function. Calling it removes the
   *   handler from the bus.
   */
  public subscribe(handler: EventHandler<T>): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  /**
   * Emit an event synchronously to all currently registered handlers.
   * Handlers are called in subscription order.
   */
  public emit(event: T): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }

  /**
   * Remove all registered handlers.
   * Useful for resetting the bus between tests.
   */
  public clear(): void {
    this.handlers.clear();
  }

  /**
   * Returns the number of currently registered handlers.
   * Useful for assertions in tests.
   */
  public get size(): number {
    return this.handlers.size;
  }
}
