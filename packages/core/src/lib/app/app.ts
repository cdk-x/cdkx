import { Construct, IConstruct } from 'constructs';
import { IResolver } from '../resolvables/resolvables';
import { ResolverPipeline } from '../resolvables/resolver-pipeline';
import { Provider } from '../provider/provider';
import { Stack } from '../stack/stack';
import {
  CloudAssembly,
  CloudAssemblyBuilder,
} from '../assembly/cloud-assembly';
import { ISynthesisSession } from '../synthesizer/synthesizer';

export interface AppProps {
  /**
   * The output directory where synthesized artifacts are written.
   * Equivalent to `cdk.out` in AWS CDK.
   * @default 'cdkx.out'
   */
  readonly outdir?: string;

  /**
   * Global custom resolvers prepended to every stack's resolver pipeline,
   * regardless of provider. These run before provider-specific resolvers
   * and before the built-in `LazyResolver` and `ImplicitTokenResolver`.
   * @default []
   */
  readonly resolvers?: IResolver[];
}

/**
 * The root of the cdkx construct tree and the entry point for synthesis.
 *
 * `App` owns the resolver pipeline factory (one pipeline per provider, built lazily)
 * and orchestrates the synthesis of all child `Stack` instances.
 *
 * @example
 * const app = new App({ outdir: 'cdkx.out' });
 *
 * new Stack(app, 'k8s-stack', { provider: new KubernetesProvider({ ... }) });
 * new Stack(app, 'hetzner-stack', { provider: new HetznerProvider({ ... }) });
 *
 * app.synth();
 * // Produces:
 * //   cdkx.out/manifest.json
 * //   cdkx.out/k8s-stack.yaml
 * //   cdkx.out/hetzner-stack.json
 */
export class App extends Construct {
  /**
   * Returns true if the given object is an `App` instance.
   */
  public static isApp(x: unknown): x is App {
    return x instanceof App;
  }

  /**
   * Finds the root `App` of the construct tree containing the given construct.
   * Throws if no `App` is found (i.e. the construct is not rooted in an App).
   */
  public static of(construct: IConstruct): App {
    let current: IConstruct | undefined = construct;
    while (current) {
      if (App.isApp(current)) return current;
      current = current.node.scope as IConstruct | undefined;
    }
    throw new Error(
      `No App found in the construct tree for construct at path '${construct.node.path}'. ` +
        `Make sure the construct tree is rooted in an App.`,
    );
  }

  /** Absolute path to the output directory. */
  public readonly outdir: string;

  /** Global custom resolvers applied to all stacks, regardless of provider. */
  private readonly globalResolvers: IResolver[];

  /** Cache of resolver pipelines keyed by provider identifier. */
  private readonly pipelineCache = new Map<string, ResolverPipeline>();

  constructor(props: AppProps = {}) {
    // App is the tree root: no scope, empty string id.
    // `constructs` requires a non-null scope for non-root nodes; passing `undefined` is
    // intentional here and is the standard pattern for root constructs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(undefined as any, '');
    this.outdir = props.outdir ?? 'cdkx.out';
    this.globalResolvers = props.resolvers ?? [];
  }

  /**
   * Returns the resolver pipeline for a given provider.
   *
   * The pipeline is built once per provider and cached for reuse. It consists of:
   * 1. Global custom resolvers (from `AppProps.resolvers`)
   * 2. Provider-specific resolvers (from `Provider.getResolvers()`)
   * 3. Built-in `LazyResolver`
   * 4. Built-in `ImplicitTokenResolver`
   *
   * This means a `@cdkx/github-actions` provider can register a resolver that turns
   * `SecretRef` tokens into `${{ secrets.NAME }}` strings, while a `@cdkx/kubernetes`
   * provider resolves the same token to `{ secretKeyRef: { name, key } }`.
   */
  public getResolverPipeline(provider: Provider): ResolverPipeline {
    const cached = this.pipelineCache.get(provider.identifier);
    if (cached) return cached;

    const pipeline = new ResolverPipeline([
      ...this.globalResolvers,
      ...provider.getResolvers(),
    ]);

    this.pipelineCache.set(provider.identifier, pipeline);
    return pipeline;
  }

  /**
   * Synthesizes the entire construct tree.
   *
   * Traverses all `Stack` children in construct tree order and calls
   * `stack.synthesizer.synthesize(session)` on each. Finally writes
   * `manifest.json` and returns the sealed `CloudAssembly`.
   *
   * @returns The immutable `CloudAssembly` describing the synthesis output.
   */
  public synth(): CloudAssembly {
    const builder = new CloudAssemblyBuilder(this.outdir);
    const session: ISynthesisSession = {
      outdir: this.outdir,
      assembly: builder,
    };

    // Traverse all constructs, synthesize stacks in tree order
    for (const construct of this.node.findAll()) {
      if (Stack.isStack(construct)) {
        construct.synthesizer.synthesize(session);
      }
    }

    return builder.buildAssembly();
  }
}
