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
   * A 3-letter, PascalCase provider prefix applied to the generated
   * `Resource` class's name only — e.g. `"Ghb"` turns `Workflow` into
   * `GhbWorkflow`, mirroring AWS CDK's `Cfn` convention for marking an L1
   * construct as auto-generated. Every schema entry for the same provider
   * should use the same prefix. Does not affect `resourceType` itself (the
   * Resource's runtime identity, e.g. its `DEPLOY_CONFIGS` key), nor the
   * `Props` interface, the serializer class, or any nested type — those
   * keep exactly the names `json2jsii`/`PropsSerializerGenerator` would
   * give them with no prefix at all. Must match `^[A-Z][a-z]{2}$` (e.g.
   * `"Cfn"`, `"Ghb"`); omit to leave the class name unprefixed.
   */
  prefix?: string;
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
