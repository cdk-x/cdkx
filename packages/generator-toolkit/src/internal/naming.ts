/**
 * String-casing helpers shared by {@link JsonSchemaAdapter} (deriving
 * PascalCase Component names from schema definition keys) and
 * {@link CodeGenerator} (deriving valid, camelCase class member names from
 * arbitrary JSON property keys). Not part of the public API surface.
 */
export class Naming {
  private constructor() {} // no instances — static-only class

  /**
   * Converts a kebab-case, snake_case, or camelCase identifier into
   * PascalCase.
   *
   * @param value - the source identifier, e.g. `"runs-on"` or `"normalJob"`.
   * @returns the PascalCase form, e.g. `"RunsOn"` or `"NormalJob"`.
   */
  public static toPascalCase(value: string): string {
    return Naming.toWords(value)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Converts a kebab-case, snake_case, or PascalCase identifier into
   * camelCase.
   *
   * @param value - the source identifier, e.g. `"runs-on"`.
   * @returns the camelCase form, e.g. `"runsOn"`.
   */
  public static toCamelCase(value: string): string {
    const pascal = Naming.toPascalCase(value);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Tests whether a string is already usable as a plain (unquoted)
   * TypeScript identifier / object property key.
   *
   * @param value - the string to test.
   * @returns true if `value` is a valid identifier, narrowing nothing (this
   * is a plain boolean predicate, not a type guard).
   */
  public static isValidIdentifier(value: string): boolean {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
  }

  private static toWords(value: string): string[] {
    return value
      .split(/[^A-Za-z0-9]+/)
      .filter((word) => word.length > 0)
      .flatMap((word) => word.split(/(?<=[a-z0-9])(?=[A-Z])/));
  }
}
