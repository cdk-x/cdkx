import chalk from 'chalk';
import Table from 'cli-table3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Construct, IConstruct } from 'constructs';
import { Acknowledgements } from '../acknowledgements/acknowledgements';
import { Notices, FrameworkNotices } from '../notices/notices';
import { IResolver } from '../resolvables/resolvables';
import { ResolverPipeline } from '../resolvables/resolver-pipeline';
import { Provider } from '../provider/provider';
import { Stack } from '../stack/stack';
import {
  CloudAssembly,
  CloudAssemblyBuilder,
} from '../assembly/cloud-assembly';
import { ISynthesisSession } from '../synthesizer/synthesizer';
import { CycleDetector, CycleError } from '../synthesizer/cycle-detector';
import { Asset } from '../asset/asset';
import { AnnotationCollector } from '../annotations/annotation-collector';
import { AnnotationEntry } from '../annotations/annotation-types';

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

  /**
   * Set of acknowledged annotation IDs that should be filtered out during synthesis.
   * These are typically loaded from cdkx.context.json by the CLI.
   * @default new Set()
   */
  readonly acknowledgedIds?: Set<string>;
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

  /** Path to cdkx.context.json for loading/cleaning acknowledgements. */
  private readonly contextFilePath: string;

  constructor(props: AppProps = {}) {
    // App is the tree root: no scope, empty string id.
    // `constructs` requires a non-null scope for non-root nodes; passing `undefined` is
    // intentional here and is the standard pattern for root constructs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(undefined as any, '');
    this.outdir = props.outdir ?? 'cdkx.out';
    this.globalResolvers = props.resolvers ?? [];
    this.contextFilePath = path.join(process.cwd(), 'cdkx.context.json');
  }

  /**
   * Loads acknowledged IDs from cdkx.context.json into the Acknowledgements singleton.
   * This allows `cdkx acknowledge <id>` to suppress notices during synthesis.
   */
  private loadAcknowledgementsFromContextFile(): void {
    try {
      if (!fs.existsSync(this.contextFilePath)) {
        return;
      }

      const content = fs.readFileSync(this.contextFilePath, 'utf-8');
      const data = JSON.parse(content) as {
        'acknowledged-issue-numbers'?: number[];
      };
      const ids = data['acknowledged-issue-numbers'] ?? [];

      // Register in Acknowledgements singleton
      const acks = Acknowledgements.of(this);
      for (const id of ids) {
        acks.add(this, id.toString());
      }
    } catch {
      // If file doesn't exist or is invalid, ignore
    }
  }

  /**
   * Cleans up orphaned acknowledged IDs from cdkx.context.json.
   * Removes IDs that are no longer used in any annotations.
   */
  private cleanupOrphanedAcknowledgements(usedIds: Set<string>): void {
    try {
      if (!fs.existsSync(this.contextFilePath)) {
        return;
      }

      const content = fs.readFileSync(this.contextFilePath, 'utf-8');
      const data = JSON.parse(content) as {
        'acknowledged-issue-numbers'?: number[];
      };
      const currentIds = data['acknowledged-issue-numbers'] ?? [];

      // Filter to only keep IDs that are actually used
      const cleanedIds = currentIds.filter((id) => usedIds.has(id.toString()));

      // Only write if there are changes
      if (cleanedIds.length !== currentIds.length) {
        const updatedData =
          cleanedIds.length > 0
            ? { 'acknowledged-issue-numbers': cleanedIds }
            : {};
        fs.writeFileSync(
          this.contextFilePath,
          JSON.stringify(updatedData, null, 2),
          'utf-8',
        );
      }
    } catch {
      // Ignore cleanup errors
    }
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
   * This means a `@cdk-x/github-actions` provider can register a resolver that turns
   * `SecretRef` tokens into `${{ secrets.NAME }}` strings, while a `@cdk-x/kubernetes`
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
    // Load acknowledgements from cdkx.context.json before synthesis
    this.loadAcknowledgementsFromContextFile();

    const stacks = this.node.findAll().filter(Stack.isStack);

    // Phase 1: Collect all stack dependency maps without writing any files.
    const depMap: Record<string, string[]> = {};
    for (const stack of stacks) {
      const synth = stack.synthesizer;
      if (typeof synth.collectDependencies === 'function') {
        depMap[stack.artifactId] = synth.collectDependencies();
      } else {
        depMap[stack.artifactId] = [];
      }
    }

    // Phase 2: Detect cycles — throw before writing anything.
    const cycleNodes = CycleDetector.detect(depMap);
    if (cycleNodes !== null) {
      throw new CycleError(cycleNodes);
    }

    // Phase 3: Full synthesis (write files and register artifacts).
    const builder = new CloudAssemblyBuilder(this.outdir);
    const session: ISynthesisSession = {
      outdir: this.outdir,
      assembly: builder,
    };

    // Phase 0: collect and stage all assets before any stack is synthesized
    // so that stack synthesizers can rely on asset artifacts being registered
    // in the manifest builder.
    this.synthesizeAssets(stacks, session);

    for (const stack of stacks) {
      stack.synthesizer.synthesize(session);
    }

    // Collect and display annotations (filtering out acknowledged ones)
    const collectResult = AnnotationCollector.collect(this);
    const annotations = collectResult.annotations;
    this.displayAnnotations(annotations);

    // Cleanup orphaned acknowledgements
    this.cleanupOrphanedAcknowledgements(collectResult.usedIds);

    // Phase 4: Display framework notices
    this.displayNotices();

    // Add annotations to assembly
    for (const stack of stacks) {
      const stackAnnotations = annotations.filter(
        (a) =>
          a.constructPath === stack.node.path ||
          a.constructPath.startsWith(`${stack.node.path}/`),
      );
      if (stackAnnotations.length > 0) {
        builder.addAnnotations(stack.artifactId, stackAnnotations);
      }
    }

    const assembly = builder.buildAssembly();

    // Throw if there are errors
    const hasErrors = annotations.some((a) => a.level === 'error');
    if (hasErrors) {
      throw new Error(
        'Synthesis failed: one or more error annotations were reported',
      );
    }

    return assembly;
  }

  private displayAnnotations(annotations: AnnotationEntry[]): void {
    for (const annotation of annotations) {
      const level = annotation.level;
      const prefix = `[${level.toUpperCase()}]`;
      const fullMessage = `${prefix} ${annotation.constructPath}: ${annotation.message}`;

      // Apply colors: info=blue, warning=yellow, error=red
      let coloredMessage: string;
      if (level === 'error') {
        coloredMessage = chalk.red(fullMessage);
      } else if (level === 'warning') {
        coloredMessage = chalk.yellow(fullMessage);
      } else {
        coloredMessage = chalk.blue(fullMessage);
      }

      console.log(coloredMessage);
    }
  }

  private displayNotices(): void {
    const notices = Notices.of(this);

    // Always add framework notices (they'll be filtered if acknowledged)
    notices.add(this, FrameworkNotices.EXPERIMENTAL);

    if (!notices.hasNotices()) {
      return;
    }

    console.log('');

    // Create table for notices with two columns
    const table = new Table({
      head: [chalk.bold('ID'), chalk.bold('NOTICES')],
      colWidths: [10, 66],
      wordWrap: true,
      style: {
        head: [],
        border: ['gray'],
      },
    });

    for (const notice of notices.list()) {
      const severityColor =
        notice.severity === 'critical'
          ? chalk.red
          : notice.severity === 'warning'
            ? chalk.yellow
            : chalk.blue;

      // Build content column: title with severity + message + optional URL
      // Using \n for line breaks within the cell (not new table rows)
      let content = `${chalk.bold(notice.title)}  ${severityColor(`[${notice.severity.toUpperCase()}]`)}`;
      content += '\n'; // Single line break (blank line)
      content += '\n' + notice.message;
      if (notice.url) {
        content += '\n'; // Single line break (blank line)
        content += '\n' + chalk.underline(notice.url);
      }

      // Two-column row: [ID, content]
      table.push([chalk.cyan(notice.id), content]);
    }

    console.log(table.toString());
    console.log('');
    console.log(chalk.dim('Run: cdkx acknowledge <id> to silence a notice'));
    console.log('');
  }

  /**
   * Walks every stack, collects descendant `Asset` instances, and stages each
   * one exactly once (deduplicated by hash). Called at the start of `synth()`
   * before any stack synthesizer runs.
   */
  private synthesizeAssets(stacks: Stack[], session: ISynthesisSession): void {
    const seen = new Set<string>();
    for (const stack of stacks) {
      for (const node of stack.node.findAll()) {
        if (!Asset.isAsset(node)) continue;
        if (seen.has(node.assetHash)) continue;
        seen.add(node.assetHash);
        node.synthesizeAsset(session);
      }
    }
  }
}
