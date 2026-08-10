import camelcase from 'camelcase';

/**
 * jsii's own reserved synthetic method names (see
 * https://github.com/aws/jsii-compiler/blob/0f142651abac9eff35dfbd74c141d5ff058b2a8a/src/assembler.ts#L3193)
 * — mirrors json2jsii's own `PROHIBITED_MEMBER_NAMES`, not exported by that
 * package, so duplicated here deliberately (this exact list, not a generic
 * one) to keep property-name derivation identical to the interfaces
 * `Json2jsiiAdapter` generates.
 */
const PROHIBITED_MEMBER_NAMES = ['build', 'equals', 'hashcode'];

/**
 * Property-name derivation shared by every piece that needs to compute the
 * same TypeScript member name `json2jsii` would compute for a schema
 * property key — kept in one place so `Json2jsiiAdapter`'s generated
 * interfaces, `PropsSerializerGenerator`'s `obj.<name>` accessors, and
 * `UnionDetector`'s discriminant checks (which run against the same
 * already-camelCased TS object, not the original schema key) can never
 * independently drift apart.
 */
export class PropertyNaming {
  private constructor() {} // no instances — static-only class

  /**
   * Derives a property's TypeScript member name from its original schema
   * key, identically to json2jsii's own `emitProperty`.
   *
   * @param originalKey - the property's original schema key, e.g. `"runs-on"`.
   * @returns the TypeScript member name, e.g. `"runsOn"`.
   */
  public static tsPropertyName(originalKey: string): string {
    let name = originalKey.startsWith('$')
      ? originalKey.substring(1)
      : originalKey;
    name = name.replace(/\//, '_');
    name = camelcase(name);
    if (PROHIBITED_MEMBER_NAMES.includes(name.toLowerCase())) {
      name = `${name}_`;
    }
    return name;
  }
}
