import { Construct, IConstruct } from 'constructs';
import { Provider } from '../provider/provider';
import { IStackSynthesizer, IStackRef } from '../synthesizer/synthesizer';
import { ProviderResource } from '../provider-resource/provider-resource';
import { StackOutput } from '../stack-output/stack-output';

export interface StackProps {
  /**
   * The provider that this stack targets.
   * Determines the resolver pipeline, the default synthesizer, and the
   * `provider` identifier written to `manifest.json`.
   */
  readonly provider: Provider;

  /**
   * Override the synthesizer used to produce this stack's output file.
   * If not set, uses the synthesizer returned by `provider.getSynthesizer()`.
   */
  readonly synthesizer?: IStackSynthesizer;

  /**
   * An optional human-readable description for this stack.
   */
  readonly description?: string;

  /**
   * An optional human-readable name for this stack.
   * Used as `displayName` in the manifest and overrides the default (construct `id`).
   * Does not affect `artifactId` (which is always derived from the construct node path).
   */
  readonly stackName?: string;
}

/**
 * A Stack is a deployment unit targeting a single provider.
 *
 * Each Stack produces one output artifact (JSON or YAML) in `cdkx.out/`.
 * The provider determines the resolver pipeline and the default synthesizer.
 *
 * Multiple stacks with different providers can coexist under the same `App`:
 *
 * @example
 * const app = new App();
 * const k8s = new Stack(app, 'k8s-stack', { provider: new KubernetesProvider(...) });
 * const hetzner = new Stack(app, 'hetzner-stack', { provider: new HetznerProvider(...) });
 * app.synth();
 */
export class Stack extends Construct implements IStackRef {
  /**
   * Returns true if the given object is a `Stack` instance.
   */
  public static isStack(x: unknown): x is Stack {
    return x instanceof Stack;
  }

  /**
   * Finds the nearest `Stack` ancestor of the given construct (inclusive).
   * Throws if no `Stack` is found in the tree.
   */
  public static of(construct: IConstruct): Stack {
    let current: IConstruct | undefined = construct;
    while (current) {
      if (Stack.isStack(current)) return current;
      current = current.node.scope as IConstruct | undefined;
    }
    throw new Error(
      `No Stack found in the construct tree for construct at path '${construct.node.path}'. ` +
        `Make sure the construct is added as a descendant of a Stack.`,
    );
  }

  /** The provider this stack targets. */
  public readonly provider: Provider;

  /**
   * The artifact ID for this stack.
   * Derived from the construct node path — used as the output file name stem
   * and as the key in `manifest.json`.
   * Example: a stack at `App/my-k8s-stack` gets artifact ID `my-k8s-stack`.
   */
  public readonly artifactId: string;

  /** The synthesizer used to produce this stack's output artifact. */
  public readonly synthesizer: IStackSynthesizer;

  /** Optional description. */
  public readonly description?: string;

  /**
   * Human-readable name for this stack.
   * Defaults to the construct `id` when not explicitly set via `StackProps.stackName`.
   */
  public readonly stackName: string;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id);
    this.provider = props.provider;
    this.description = props.description;
    this.stackName = props.stackName ?? id;

    // Build artifact ID from the node path, replacing '/' with '-' and stripping leading '-'
    this.artifactId = this.node.path.replace(/\//g, '-').replace(/^-+/, '');

    this.synthesizer = props.synthesizer ?? props.provider.getSynthesizer();
    this.synthesizer.bind(this);
  }

  /**
   * The provider identifier string — delegates to `provider.identifier`.
   * Used by `IStackRef` without needing to expose the full `Provider` object.
   */
  public get providerIdentifier(): string {
    return this.provider.identifier;
  }

  /**
   * Provider-specific deployment target metadata — delegates to `provider.getEnvironment()`.
   * Written into `manifest.json` so the runtime engine knows where to deploy.
   */
  public get environment(): Record<string, unknown> {
    return this.provider.getEnvironment();
  }

  /**
   * Human-readable display name.
   * Returns `stackName` if explicitly set via `StackProps.stackName`,
   * otherwise falls back to the construct node path.
   */
  public get displayName(): string {
    return this.stackName;
  }

  /**
   * Returns all `ProviderResource` constructs that are descendants of this stack.
   * Used by synthesizers to collect the resources to serialize.
   */
  public getProviderResources(): ProviderResource[] {
    return this.node
      .findAll()
      .filter((c): c is ProviderResource =>
        ProviderResource.isProviderResource(c),
      );
  }

  /**
   * Returns all `StackOutput` constructs that are direct or indirect descendants
   * of this stack, keyed by their `outputKey`.
   *
   * The returned map is used by the synthesizer to write the `"outputs"` section
   * of the stack template and to populate the manifest.
   */
  public getOutputs(): StackOutput[] {
    return this.node
      .findAll()
      .filter((c): c is StackOutput => StackOutput.isStackOutput(c));
  }

  /**
   * Resolves a single value through this stack's resolver pipeline.
   *
   * Used by the `JsonSynthesizer` to resolve output token values (e.g.
   * `IResolvable` tokens like `ResourceAttribute`) at synthesis time.
   * Delegates to `App.getResolverPipeline(provider).resolve(...)`.
   */
  public resolveOutputValue(value: unknown): unknown {
    // Lazily import to avoid circular dependencies at module load time.
    const { App } = require('../app/app');
    const app = App.of(this);
    const pipeline = app.getResolverPipeline(this.provider);
    return pipeline.resolve([], value, this, this.provider.identifier);
  }
}
