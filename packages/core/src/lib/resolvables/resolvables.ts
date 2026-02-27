/**
 * Interface that any resolvable token must implement.
 * Any object with a `resolve()` method is treated as a resolvable token
 * by the ImplicitTokenResolver (duck typing — no base class required).
 */
export interface IResolvable {
  resolve(context: ResolveContext): unknown;
}

/**
 * Context passed to IResolvable.resolve().
 * Carries the provider identifier and the ability to recursively resolve nested values.
 */
export interface ResolveContext {
  /** The identifier of the provider being synthesized (e.g. 'kubernetes', 'hetzner'). */
  readonly provider: string;

  /** Recursively resolve a nested value using the full resolver pipeline. */
  resolve(value: unknown): unknown;
}

/**
 * Context object that flows through the resolver pipeline for a single value.
 * Each resolver inspects `value` and may call `replaceValue()` to substitute it.
 * The pipeline stops at the first resolver that calls `replaceValue()`.
 */
export class ResolutionContext {
  /** The replacement value set by a resolver. Only valid when `replaced === true`. */
  public replacedValue: unknown;

  /** Whether any resolver has replaced the value. */
  public replaced = false;

  constructor(
    /**
     * The ProviderResource being synthesized — root of the current synthesis call.
     * Typed as `object` to avoid a circular dependency with provider-resource.ts.
     */
    public readonly providerResource: object,

    /**
     * JSON path to the current value within the resource properties tree.
     * e.g. ['spec', 'containers', '0', 'image']
     */
    public readonly key: string[],

    /** The current value being evaluated by the pipeline. */
    public readonly value: unknown,

    /** The identifier of the provider being synthesized (e.g. 'kubernetes', 'hetzner'). */
    public readonly provider: string,
  ) {}

  /**
   * Called by a resolver to replace the current value.
   * Marks the context as replaced so the pipeline stops and re-resolves the new value.
   */
  public replaceValue(newValue: unknown): void {
    this.replacedValue = newValue;
    this.replaced = true;
  }
}

/**
 * Interface that all resolvers must implement.
 * A resolver inspects a ResolutionContext and optionally replaces the value
 * by calling context.replaceValue().
 */
export interface IResolver {
  resolve(context: ResolutionContext): void;
}

/**
 * Static utility class for working with IResolvable values.
 * Replaces the standalone `isResolvable` function to keep the codebase OOP-consistent.
 */
export abstract class Resolvables {
  /**
   * Type guard: returns true if the given value implements IResolvable
   * (i.e. has a `resolve` method — duck typing).
   */
  public static isResolvable(x: unknown): x is IResolvable {
    return typeof (x as Record<string, unknown>)?.resolve === 'function';
  }
}

/**
 * @deprecated Use `Resolvables.isResolvable()` instead.
 */
export function isResolvable(x: unknown): x is IResolvable {
  return Resolvables.isResolvable(x);
}
