import camelcase from 'camelcase';
import { TypeGenerator } from 'json2jsii';

/**
 * Name derivation shared by every piece that needs to compute the same
 * TypeScript type name `json2jsii` would compute for a `$ref` — kept in one
 * place so `Json2jsiiAdapter`'s generated interfaces, `PropsSerializerGenerator`'s
 * method names, and `UnionDetector`'s auto-derived variant names can never
 * independently drift apart.
 */
export class TypeNaming {
  private constructor() {} // no instances — static-only class

  /**
   * Extracts the definition name from a local `$ref` (`#/definitions/x` or
   * `#/$defs/x`).
   *
   * @param ref - the `$ref` string.
   * @returns the bare definition name, e.g. `"normalJob"`.
   * @throws if `ref` isn't a supported local reference.
   */
  public static extractDefinitionName(ref: string): string {
    const match = /^#\/(?:definitions|\$defs)\/(.+)$/.exec(ref);
    const name = match?.[1];
    if (!name) {
      throw new Error(`Unsupported $ref "${ref}".`);
    }
    return name;
  }

  /**
   * Derives a `$ref` target's PascalCase type name identically to
   * `json2jsii`'s own default `renderTypeName`
   * (`s => s.split('.').map(pascalCase).join('')`) composed with
   * `TypeGenerator.normalizeTypeName()`.
   *
   * @param definitionName - the bare definition name, e.g. `"normalJob"`.
   * @returns the PascalCase type name, e.g. `"NormalJob"`.
   */
  public static typeNameFromDefinitionName(definitionName: string): string {
    const rendered = definitionName
      .split('.')
      .map((part) => camelcase(part, { pascalCase: true }))
      .join('');
    return TypeGenerator.normalizeTypeName(rendered);
  }
}
