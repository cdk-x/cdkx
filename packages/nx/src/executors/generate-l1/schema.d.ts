export type GenerateL1DeployMode = 'synth-only' | 'deploy';

export interface GenerateL1UnionOverrideVariant {
  definitionName: string;
  typeName: string;
  /**
   * A property name whose presence on a value identifies it as this
   * variant. Required for every variant except the last, which is used as
   * the unconditional fallback.
   */
  discriminantProperty?: string;
}

export interface GenerateL1UnionOverride {
  unionTypeName: string;
  variants: GenerateL1UnionOverrideVariant[];
}

export interface GenerateL1SchemaEntry {
  file: string;
  resourceType: string;
  mode: GenerateL1DeployMode;
  /**
   * Escape hatch, rarely needed: real structural-variant `oneOf`/`anyOf`
   * unions (branches `$ref` different named object definitions) are
   * auto-detected and auto-resolved by `@cdk-x/generator-toolkit`'s
   * `UnionDetector` — each variant's own uniquely-required field becomes
   * its discriminant, with no config needed. Only specify an entry here if
   * `UnionDetector` throws because a union is genuinely ambiguous (no
   * variant has a uniquely-required field distinguishing it from the
   * others).
   */
  unionOverrides?: GenerateL1UnionOverride[];
}

export interface GenerateL1ExecutorSchema {
  apiVersion: string;
  outputDir?: string;
  schemas: GenerateL1SchemaEntry[];
}
