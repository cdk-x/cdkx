export interface ResourceWrapperOptions {
  /**
   * The PascalCase `resourceType` — the Resource's semantic identity
   * (matches `DeployMetadataGenerator`'s `DEPLOY_CONFIGS` key and the
   * synthesized manifest's `resourceType` field). Deliberately independent
   * of {@link className}: a provider prefix changes how the class is
   * *named* in code, never what the Resource *is* at runtime.
   */
  readonly resourceType: string;

  /**
   * The emitted TypeScript class name, e.g. `"GhbWorkflow"` — usually
   * `resourceType` with a provider prefix applied (mirroring AWS CDK's
   * `Cfn` convention for marking a construct as auto-generated L1), or
   * just `resourceType` unchanged when the provider has no prefix
   * configured. The caller (the `generate-l1` executor) decides this; this
   * generator has no opinion on prefixing.
   */
  readonly className: string;

  /** The `<provider>.cdk-x.com/v<N>` apiVersion this Resource carries. */
  readonly apiVersion: string;

  /** The name of the `json2jsii`-generated props interface, e.g. `"WorkflowProps"`. */
  readonly propsTypeName: string;

  /**
   * The name of the {@link PropsSerializerGenerator}-generated static-only
   * serializer class for this Resource file, e.g. `"WorkflowSerializer"`.
   */
  readonly serializerClassName: string;
}

/**
 * Generates the `Resource` subclass wrapping a `json2jsii`-generated
 * `<ResourceType>Props` interface — the class-emitting half of what the
 * (now-deleted) `CodeGenerator` used to do, minus everything related to
 * `Component`: L1 auto-generation only ever produces `Resource` subclasses
 * now, never nested constructs (see the L1 codegen plan). `Component`
 * itself is untouched and still available in `@cdk-x/core` for hand-written
 * L2 authoring — this generator simply never references it.
 *
 * Deliberately holds a single `props` bag rather than flattening every
 * schema property onto individual class members: `json2jsii` already owns
 * every naming/casing/nesting decision for `<ResourceType>Props` (including
 * jsii-safe camelCasing of arbitrary JSON keys) — re-deriving individual
 * members here would duplicate that logic a second time and risk drift.
 *
 * `toProperties()` delegates to {@link PropsSerializerGenerator}'s
 * generated serializer class rather than a bare function — `json2jsii`'s
 * own `toJson*` function generation is disabled entirely (see
 * `Json2jsiiAdapter`'s class doc) since standalone exported functions
 * conflict with this workspace's OOP-only rule.
 *
 * Returns only the class declaration itself, not a full file — the caller
 * (the `generate-l1` executor) combines this with the `json2jsii`-rendered
 * types (interfaces/enums) and the serializer class into one generated file
 * per Resource.
 */
export class ResourceWrapperGenerator {
  private constructor() {} // no instances — static-only class

  /**
   * Generates the `Resource` subclass declaration for one Resource root.
   *
   * @param options - the Resource's identity, its emitted class name, its
   * `json2jsii`-generated props type name, and its serializer class name.
   * @returns the generated class declaration source, ending in a trailing
   * newline.
   * @example
   * const source = ResourceWrapperGenerator.generate({
   *   resourceType: 'Workflow',
   *   className: 'GhbWorkflow',
   *   apiVersion: 'github.cdk-x.com/v1',
   *   propsTypeName: 'GhbWorkflowProps',
   *   serializerClassName: 'GhbWorkflowSerializer',
   * });
   */
  public static generate(options: ResourceWrapperOptions): string {
    const {
      resourceType,
      className,
      apiVersion,
      propsTypeName,
      serializerClassName,
    } = options;
    return [
      `export class ${className} extends Resource {`,
      `  public readonly resourceType = '${resourceType}';`,
      `  public readonly apiVersion = '${apiVersion}';`,
      '',
      `  constructor(scope: Construct, id: string, public readonly props: ${propsTypeName}) {`,
      '    super(scope, id);',
      '  }',
      '',
      '  protected toProperties(): Record<string, unknown> {',
      `    return ${serializerClassName}.toJson${propsTypeName}(this.props) ?? {};`,
      '  }',
      '}',
      '',
    ].join('\n');
  }
}
