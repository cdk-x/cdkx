import { Construct } from 'constructs';
import { RESOURCE_SYMBOL, PropertyValue } from '../constants';
import { makeUniqueId } from '../private/unique-id';
import { RemovalPolicy, RemovalPolicyOptions } from '../removal-policy';
import {
  ProviderCreatePolicy,
  ProviderDeletionPolicy,
  ProviderUpdatePolicy,
} from './provider-resource-policy';
import { ProviderResourceCondition } from './provider-condition';
import { IResolvable } from '../resolvables/resolvables';

export interface ProviderResourceProps {
  /** The resource type identifier (e.g. `'Deployment'`, `'server'`, `'workflow'`). */
  type: string;

  /** The resource properties to be resolved and serialized during synthesis. */
  properties?: Record<string, PropertyValue>;
}

export interface IProviderResourceOptions {
  /**
   * A condition to associate with this resource. When set, the resource is only
   * included in the synthesized output if the condition evaluates to true.
   */
  condition?: ProviderResourceCondition;

  /**
   * Configures the creation policy for this resource.
   * Prevents the resource from reaching creation-complete until the Engine
   * receives the specified number of success signals or the timeout is exceeded.
   */
  creationPolicy?: ProviderCreatePolicy;

  /**
   * Controls what happens to this resource when it is removed from the stack.
   * Maps to the underlying provider's deletion behaviour.
   */
  deletionPolicy?: ProviderDeletionPolicy;

  /**
   * Provider-specific update policy configuration.
   * The shape of this object is defined by the individual provider.
   */
  updatePolicy?: ProviderUpdatePolicy;

  /**
   * Controls what happens to the existing physical resource when it is replaced
   * during a stack update operation.
   */
  updateReplacePolicy?: ProviderDeletionPolicy;

  /**
   * The version of this resource. Usage is provider-specific.
   */
  version?: string;

  /**
   * A human-readable description for this resource.
   * Informational only — not passed to the underlying provider resource.
   */
  description?: string;

  /**
   * Arbitrary metadata associated with this resource.
   * Not the same as construct metadata.
   */
  metadata?: { [key: string]: unknown };
}

export class ProviderResource extends Construct {
  /**
   * Returns true if the given object is a `ProviderResource` instance.
   */
  public static isProviderResource(
    this: void,
    x: unknown,
  ): x is ProviderResource {
    return (
      x !== null && typeof x === 'object' && RESOURCE_SYMBOL in (x as object)
    );
  }

  /**
   * Options for this resource, such as condition, deletion policy, etc.
   */
  public readonly resourceOptions: IProviderResourceOptions = {};

  /**
   * Stable logical ID for this resource, derived from its construct node path.
   * Combines a human-readable prefix with an 8-character SHA-256 hash suffix,
   * guaranteeing uniqueness across renames/refactors.
   *
   * Format: `<PathSegments><HASH8>` — e.g. `MyStackWebServer3A1B2C3D`
   *
   * Used as the key in the synthesized stack JSON and as the target of
   * cross-resource `{ ref, attr }` references.
   */
  public readonly logicalId: string;

  /** The resource type identifier. */
  public readonly type: string;

  /** The raw (pre-resolution) properties for this resource. Used by the base `renderProperties()` implementation. */
  protected readonly properties?: Record<string, PropertyValue>;

  /**
   * An `IResolvable` that resolves to the CRN (Cloud Resource Name) of this resource.
   * Returns a `{ ref, attr }` token that the engine resolves at deploy time to the
   * actual CRN string constructed by the handler.
   */
  public readonly attrCrn: IResolvable;

  private readonly _dependencies: ProviderResource[] = [];

  constructor(scope: Construct, id: string, props: ProviderResourceProps) {
    super(scope, id);
    Object.defineProperty(this, RESOURCE_SYMBOL, { value: true });
    this.logicalId = makeUniqueId(this.node.path.split('/'));
    this.type = props.type;
    this.properties = props.properties;
    this.attrCrn = this.getAtt('crn');
  }

  /**
   * Returns an `IResolvable` that resolves to a `{ ref, attr }` token
   * referencing an output attribute of this resource.
   *
   * Used by L1 constructs to expose cross-resource reference attributes
   * (e.g. `attrNetworkId`, `attrServerId`) that the engine resolves at
   * deploy time by reading the named output from the created resource.
   *
   * @param attr - The attribute name to reference (e.g. `'networkId'`).
   */
  public getAtt(attr: string): IResolvable {
    const logicalId = this.logicalId;
    return {
      resolve: () => ({ ref: logicalId, attr }),
    };
  }

  /**
   * Returns an `IResolvable` that resolves to `{ ref: logicalId }` — a
   * whole-object reference token used by file-rendering synthesizers
   * (e.g. `YamlFileSynthesizer`) to compose this resource's full output
   * into a parent resource's array field.
   *
   * Unlike `getAtt()`, no `attr` is included. The synthesizer resolves
   * the token to the complete resolved data of the referenced resource.
   */
  public get ref(): IResolvable {
    const logicalId = this.logicalId;
    return {
      resolve: () => ({ ref: logicalId }),
    };
  }

  /**
   * Returns the properties object used during synthesis.
   *
   * The base implementation returns `this.properties` (the value passed to the
   * constructor). L1 subclasses generated by `spec-to-cdkx` **override** this
   * method to build the properties object from their own public mutable members,
   * following the same pattern as AWS CDK's `cfnProperties` getter.
   *
   * Override this in custom L1s to expose mutable properties that can be
   * mutated post-construction and still be correctly reflected at synthesis time.
   */
  protected renderProperties(): Record<string, PropertyValue> {
    return this.properties ?? {};
  }

  /**
   * Adds an explicit dependency on another `ProviderResource`.
   * This ensures the dependent resource is synthesized after this one.
   */
  public addDependency(resource: ProviderResource): void {
    this._dependencies.push(resource);
    this.node.addDependency(resource);
  }

  /**
   * Applies a removal policy to this resource.
   * Maps the high-level `RemovalPolicy` enum to provider-level deletion/replace policies.
   */
  public applyRemovalPolicy(
    policy: RemovalPolicy | undefined,
    options: RemovalPolicyOptions = {},
  ): void {
    policy = policy ?? options.default ?? RemovalPolicy.RETAIN;

    let deletionPolicy: ProviderDeletionPolicy;
    let updateReplacePolicy: ProviderDeletionPolicy | undefined;

    switch (policy) {
      case RemovalPolicy.DESTROY:
        deletionPolicy = ProviderDeletionPolicy.DELETE;
        updateReplacePolicy = ProviderDeletionPolicy.DELETE;
        break;
      case RemovalPolicy.RETAIN:
        deletionPolicy = ProviderDeletionPolicy.RETAIN;
        updateReplacePolicy = ProviderDeletionPolicy.RETAIN;
        break;
      case RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE:
        deletionPolicy = ProviderDeletionPolicy.RETAIN_EXCEPT_ON_CREATE;
        updateReplacePolicy = options.applyToUpdateReplacePolicy
          ? ProviderDeletionPolicy.RETAIN
          : undefined;
        break;
    }

    this.resourceOptions.deletionPolicy = deletionPolicy;
    if (options.applyToUpdateReplacePolicy !== false) {
      this.resourceOptions.updateReplacePolicy = updateReplacePolicy;
    }
  }

  /**
   * Returns the raw (pre-resolution) output data for this resource.
   *
   * Used by file-rendering synthesizers (e.g. `YamlFileSynthesizer`) as the
   * output shape instead of `toJson()`. Unlike `toJson()`, no resolution or
   * sanitization is applied — `{ ref, attr }` tokens remain as-is so that
   * the synthesizer can inspect them for composition.
   *
   * Delegates to `renderProperties()`, so L1 subclasses that override
   * `renderProperties()` automatically get the correct output here too.
   */
  public toOutputData(): unknown {
    return this.renderProperties();
  }

  /**
   * Synthesizes this resource to a plain JSON-serializable object.
   *
   * Uses the resolver pipeline from the root `App` to resolve all `Lazy` values and
   * `IResolvable` tokens within the properties tree. The resolved properties are then
   * sanitized (null/undefined removed, unresolved tokens detected and thrown).
   *
   * The `dependsOn` field is always computed and emitted when non-empty. It is
   * the deduplicated union of:
   * - Logical IDs from explicit `addDependency()` calls.
   * - Logical IDs referenced by `{ ref, attr }` tokens found anywhere in the
   *   resolved (sanitized) properties tree.
   *
   * Output shape — a single-key object keyed by the resource's `logicalId`:
   * ```json
   * {
   *   "MyStackWebServer3A1B2C3D": {
   *     "type": "hetzner::Server",
   *     "properties": { ... resolved properties ... },
   *     "metadata": { "cdkx:path": "MyStack/WebServer/Resource" },
   *     "dependsOn": ["MyStackNetwork1A2B3C4D"]
   *   }
   * }
   * ```
   * The `dependsOn` key is omitted when there are no dependencies.
   */
  public toJson(): Record<string, unknown> {
    // Lazily import to avoid circular dependencies at module load time.
    // App and Stack are higher-level constructs that depend on ProviderResource,
    // so we resolve them at call time rather than at import time.
    const { ResolverPipeline } = require('../resolvables/resolver-pipeline');

    // Use a generic resolver pipeline (not tied to a specific provider)
    // since each resource now knows its own provider
    const pipeline = ResolverPipeline.withBuiltins();

    // Extract provider from typeName for the resolver context
    const providerId = this.type.split('::')[0].toLowerCase();

    const resolvedProperties = pipeline.resolve(
      [],
      this.renderProperties(),
      this,
      providerId,
    );

    const sanitizedProperties = pipeline.sanitize(resolvedProperties);

    // Build the deduplicated dependsOn set:
    // 1. Explicit deps registered via addDependency().
    // 2. Implicit deps inferred from { ref, attr } tokens in the resolved properties.
    const dependsOnSet = new Set<string>();

    for (const dep of this._dependencies) {
      dependsOnSet.add(dep.logicalId);
    }

    this.collectRefLogicalIds(sanitizedProperties, dependsOnSet);

    const entry: Record<string, unknown> = {
      type: this.type,
      provider: providerId,
      properties: sanitizedProperties,
      metadata: {
        'cdkx:path': this.node.path,
      },
    };

    if (dependsOnSet.size > 0) {
      entry['dependsOn'] = Array.from(dependsOnSet);
    }

    return { [this.logicalId]: entry };
  }

  /**
   * Recursively walks a resolved (sanitized) properties tree and collects
   * all `ref` values from `{ ref, attr }` tokens into the given set.
   *
   * This is used by `toJson()` to build the unified `dependsOn` list that
   * combines explicit `addDependency()` calls with implicit token-based refs.
   */
  private collectRefLogicalIds(obj: unknown, refs: Set<string>): void {
    if (obj === null || obj === undefined) return;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.collectRefLogicalIds(item, refs);
      }
      return;
    }

    if (typeof obj === 'object') {
      const record = obj as Record<string, unknown>;
      // Detect a { ref, attr } token: plain object with exactly these two string keys.
      if (
        typeof record['ref'] === 'string' &&
        typeof record['attr'] === 'string' &&
        Object.keys(record).length === 2
      ) {
        refs.add(record['ref']);
        return;
      }
      // Otherwise recurse into all values.
      for (const value of Object.values(record)) {
        this.collectRefLogicalIds(value, refs);
      }
    }
  }
}
