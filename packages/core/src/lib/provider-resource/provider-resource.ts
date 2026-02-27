import { Construct } from 'constructs';
import { RESOURCE_SYMBOL, PropertyValue } from '../constants.js';
import { RemovalPolicy, RemovalPolicyOptions } from '../removal-policy.js';
import { ProviderCreatePolicy, ProviderDeletionPolicy, ProviderUpdatePolicy } from './provider-resource-policy.js';
import { ProviderResourceCondition } from './provider-condition.js';

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
  public static isProviderResource(this: void, x: unknown): x is ProviderResource {
    return x !== null && typeof x === 'object' && RESOURCE_SYMBOL in (x as object);
  }

  /**
   * Options for this resource, such as condition, deletion policy, etc.
   */
  public readonly resourceOptions: IProviderResourceOptions = {};

  /** The resource type identifier. */
  public readonly type: string;

  /** The raw (pre-resolution) properties for this resource. */
  protected readonly properties?: Record<string, PropertyValue>;

  private readonly _dependencies: ProviderResource[] = [];

  constructor(scope: Construct, id: string, props: ProviderResourceProps) {
    super(scope, id);
    Object.defineProperty(this, RESOURCE_SYMBOL, { value: true });
    this.type = props.type;
    this.properties = props.properties;
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
  public applyRemovalPolicy(policy: RemovalPolicy | undefined, options: RemovalPolicyOptions = {}): void {
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
        updateReplacePolicy = options.applyToUpdateReplacePolicy ? ProviderDeletionPolicy.RETAIN : undefined;
        break;
    }

    this.resourceOptions.deletionPolicy = deletionPolicy;
    if (options.applyToUpdateReplacePolicy !== false) {
      this.resourceOptions.updateReplacePolicy = updateReplacePolicy;
    }
  }

  /**
   * Synthesizes this resource to a plain JSON-serializable object.
   *
   * Uses the resolver pipeline from the root `App` to resolve all `Lazy` values and
   * `IResolvable` tokens within the properties tree. The resolved properties are then
   * sanitized (null/undefined removed, unresolved tokens detected and thrown).
   *
   * Output shape:
   * ```json
   * {
   *   "type": "Deployment",
   *   "properties": { ... resolved properties ... }
   * }
   * ```
   */
  public toJson(): Record<string, unknown> {
    // Lazily import to avoid circular dependencies at module load time.
    // App and Stack are higher-level constructs that depend on ProviderResource,
    // so we resolve them at call time rather than at import time.
    const { App } = require('../app/app.js');
    const { Stack } = require('../stack/stack.js');

    const stack = Stack.of(this);
    const app = App.of(this);

    const pipeline = app.getResolverPipeline(stack.provider);

    const resolvedProperties = pipeline.resolve([], this.properties ?? {}, this, stack.provider.identifier);

    const sanitizedProperties = pipeline.sanitize(resolvedProperties);

    return {
      type: this.type,
      properties: sanitizedProperties,
    };
  }
}
