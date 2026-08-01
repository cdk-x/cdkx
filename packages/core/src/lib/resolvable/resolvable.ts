/**
 * Marker for a value that cannot be computed yet at construction time —
 * e.g. an attribute of a Resource that will only exist once it's actually
 * created/deployed. `resolve()` returns the placeholder form used in the
 * synthesized manifest (e.g. `{ ref: logicalId, attr }`), never a real value.
 *
 * IResolvable does NOT resolve to a real value in this package — actual
 * resolution against deployed state is the responsibility of the future
 * deploy engine, out of scope for @cdk-x/core.
 */
export interface IResolvable {
  resolve(): unknown;
}

/**
 * Static utilities for working with IResolvable values.
 * Not instantiable — mirrors the static-only utility class pattern used
 * elsewhere in the package (Stack.of(), Resource.of()).
 */
export class Resolvable {
  private constructor() {} // no instances — static-only class

  /**
   * Runtime type guard for IResolvable. Needed because a Resource's or
   * Component's raw property values are only known as `any` at the type
   * level — anything walking them at runtime (e.g. synth()'s dependency
   * inference) needs this to distinguish a resolvable placeholder from a
   * plain object that happens to have the same shape.
   *
   * @param value - any value found while walking a Resource's or Component's
   * properties, of unknown shape.
   * @returns true if `value` is an object exposing a callable `resolve()`
   * method, narrowing its type to IResolvable.
   * @example
   * const props = { name: 'bucket', arn: someLazyValue };
   * if (Resolvable.isResolvable(props.arn)) {
   *   // props.arn is now typed as IResolvable
   * }
   */
  public static isResolvable(value: unknown): value is IResolvable {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { resolve?: unknown }).resolve === 'function'
    );
  }
}
