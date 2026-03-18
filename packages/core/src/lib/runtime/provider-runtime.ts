import { ResourceHandler } from './resource-handler';

/**
 * Base class for provider runtimes.
 *
 * Manages a registry of {@link ResourceHandler} instances keyed by
 * resource type string.  Provider packages extend this class to
 * register their handlers in the constructor.
 */
export abstract class ProviderRuntime<TSdk = unknown> {
  protected handlers: Record<string, ResourceHandler<unknown, unknown, TSdk>> =
    {};

  /** Returns the resource type strings this runtime can handle. */
  abstract listResourceTypes(): string[];

  /** Register a handler for a given resource type. */
  register<TProps, TState>(
    resourceType: string,
    handler: ResourceHandler<TProps, TState, TSdk>,
  ): void {
    this.handlers[resourceType] = handler as unknown as ResourceHandler<
      unknown,
      unknown,
      TSdk
    >;
  }

  /** Look up the handler for a resource type; throws if not found. */
  getHandler<TProps, TState>(
    resourceType: string,
  ): ResourceHandler<TProps, TState, TSdk> {
    const handler = this.handlers[resourceType] as
      | ResourceHandler<TProps, TState, TSdk>
      | undefined;
    if (!handler) {
      throw new Error(
        `No handler registered for resource type '${resourceType}'.`,
      );
    }
    return handler;
  }
}
