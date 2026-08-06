import * as path from 'node:path';

/**
 * Derives the base filename generated L1 output is written under, from a
 * vendored schema file's own path.
 */
export class SchemaOutputNaming {
  private constructor() {}

  /**
   * @param schemaFile - a vendored schema file path, e.g.
   * `"schemas/workflow.schema.json"`.
   * @returns the base name its generated output is written under, e.g.
   * `"workflow"` — so `CodeGenerator`'s output becomes
   * `workflow.generated.ts` and `DeployMetadataGenerator`'s becomes
   * `workflow.deploy.generated.ts`.
   * @example
   * SchemaOutputNaming.baseName('schemas/workflow.schema.json'); // 'workflow'
   */
  public static baseName(schemaFile: string): string {
    return path
      .basename(schemaFile)
      .replace(/\.schema\.json$/, '')
      .replace(/\.json$/, '');
  }
}
