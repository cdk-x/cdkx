import { IResolver, ResolutionContext } from './resolvables.js';
import { LazyResolver, ImplicitTokenResolver } from './resolvers.js';

/**
 * Options for `ResolverPipeline.sanitize()`.
 */
export interface SanitizeOptions {
  /**
   * Whether to sort object keys alphabetically in the output.
   * Useful for deterministic/diff-friendly output.
   * @default false
   */
  readonly sortKeys?: boolean;
}

/**
 * The core resolution engine for cdkx synthesis.
 *
 * Encapsulates an ordered list of `IResolver` instances and applies them recursively
 * to a value tree (plain objects, arrays, primitives, Lazy instances, IResolvable tokens).
 *
 * Resolution algorithm:
 * 1. Run each resolver in order against the current value (first-wins).
 * 2. If a resolver calls `replaceValue()`, recursively re-resolve the replacement
 *    (supports Lazy → IResolvable chains).
 * 3. If no resolver fires, recurse structurally into arrays and plain objects.
 * 4. Return primitives (string, number, boolean, null) as-is.
 *
 * After resolution, call `sanitize()` to strip nulls/undefineds and validate that
 * no unresolved token objects remain in the tree.
 */
export class ResolverPipeline {
  private readonly resolvers: IResolver[];

  constructor(resolvers: IResolver[]) {
    // ImplicitTokenResolver needs a reference to `this.resolve` to support recursive
    // resolution of nested values within IResolvable.resolve() calls.
    // We inject it as a callback at construction time to avoid circular dependencies.
    const implicitTokenResolver = new ImplicitTokenResolver(
      (key, value, providerResource, provider) =>
        this.resolve(key, value, providerResource, provider),
    );

    this.resolvers = [...resolvers, new LazyResolver(), implicitTokenResolver];
  }

  /**
   * Creates a `ResolverPipeline` with only the built-in resolvers (no custom resolvers).
   */
  public static withBuiltins(): ResolverPipeline {
    return new ResolverPipeline([]);
  }

  /**
   * Recursively resolves a value tree.
   *
   * @param key     - JSON path to the current value (e.g. `['spec', 'replicas']`)
   * @param value   - The value to resolve
   * @param providerResource - The ProviderResource being synthesized (for context)
   * @param provider - The provider identifier (e.g. `'kubernetes'`, `'hetzner'`)
   */
  public resolve(
    key: string[],
    value: unknown,
    providerResource: object,
    provider: string,
  ): unknown {
    if (value == null) return value;

    // 1. Run the resolver pipeline (first resolver to call replaceValue wins)
    const context = new ResolutionContext(
      providerResource,
      key,
      value,
      provider,
    );

    for (const resolver of this.resolvers) {
      resolver.resolve(context);
      if (context.replaced) {
        // Recursively resolve the replacement — supports Lazy → IResolvable chains
        return this.resolve(
          key,
          context.replacedValue,
          providerResource,
          provider,
        );
      }
    }

    // 2. No resolver fired — recurse structurally

    if (Array.isArray(value)) {
      return value.map((item, i) =>
        this.resolve([...key, String(i)], item, providerResource, provider),
      );
    }

    if (typeof value === 'object' && value.constructor === Object) {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = this.resolve([...key, k], v, providerResource, provider);
      }
      return result;
    }

    // 3. Primitive leaf (string, number, boolean) — return as-is
    return value;
  }

  /**
   * Post-resolution sanitization.
   *
   * - Removes `null` and `undefined` values from objects (they are omitted in the output).
   * - Throws an error if a non-plain object (class instance) survives resolution,
   *   which indicates an unresolved token — a programming error.
   * - Optionally sorts object keys for deterministic output.
   *
   * @param obj     - The resolved value tree to sanitize
   * @param options - Sanitization options
   */
  public sanitize(obj: unknown, options: SanitizeOptions = {}): unknown {
    if (obj == null) return undefined;

    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj
        .map((item) => this.sanitize(item, options))
        .filter((item) => item !== undefined);
    }

    // Throw if a class instance survived resolution (unresolved token)
    if (obj.constructor !== Object) {
      throw new Error(
        `Unresolved token of type '${obj.constructor.name}' found during synthesis. ` +
          `Ensure all Lazy and IResolvable values are properly registered with the resolver pipeline.`,
      );
    }

    const keys = options.sortKeys ? Object.keys(obj).sort() : Object.keys(obj);
    const result: Record<string, unknown> = {};
    const record = obj as Record<string, unknown>;

    for (const key of keys) {
      const sanitized = this.sanitize(record[key], options);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }

    return result;
  }
}
