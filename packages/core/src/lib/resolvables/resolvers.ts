import { Lazy } from './lazy';
import {
  IResolver,
  IResolvable,
  ResolveContext,
  ResolutionContext,
  Resolvables,
} from './resolvables';

/**
 * Built-in resolver that handles `Lazy` instances.
 *
 * When a value is an instance of `Lazy`, it calls `produce()` to obtain the concrete value.
 * The pipeline then recursively resolves the produced value, which allows a Lazy to
 * return another Lazy or another IResolvable.
 */
export class LazyResolver implements IResolver {
  public resolve(context: ResolutionContext): void {
    if (context.value instanceof Lazy) {
      context.replaceValue(context.value.produce());
    }
  }
}

/**
 * Built-in resolver that handles duck-typed `IResolvable` objects.
 *
 * Any object with a `resolve(context: ResolveContext): any` method is treated as a token,
 * regardless of its class hierarchy. This allows provider packages to define their own
 * token types (e.g. `SecretRef`, `ResourceAttribute`) without extending a base class from
 * `@cdk-x/core`.
 *
 * The resolver builds a `ResolveContext` (the IResolvable-facing interface) and passes it
 * to the object's `resolve()` method. The `ResolveContext.resolve()` function delegates back
 * to the full `ResolverPipeline` so nested values are recursively resolved.
 *
 * Note: `Lazy` instances also have a `produce()` method but NOT a `resolve()` method, so
 * they are handled exclusively by `LazyResolver` and never reach this resolver.
 */
export class ImplicitTokenResolver implements IResolver {
  constructor(
    /**
     * A callback to the pipeline's resolve function.
     * Injected at construction time to avoid a circular module dependency.
     */
    private readonly pipelineResolve: (
      key: string[],
      value: unknown,
      providerResource: object,
      provider: string,
    ) => unknown,
  ) {}

  public resolve(context: ResolutionContext): void {
    // Skip Lazy instances — they are handled by LazyResolver
    if (context.value instanceof Lazy) return;

    if (Resolvables.isResolvable(context.value)) {
      const resolveCtx: ResolveContext = {
        provider: context.provider,
        resolve: (v: unknown) =>
          this.pipelineResolve(
            context.key,
            v,
            context.providerResource,
            context.provider,
          ),
      };
      context.replaceValue((context.value as IResolvable).resolve(resolveCtx));
    }
  }
}
