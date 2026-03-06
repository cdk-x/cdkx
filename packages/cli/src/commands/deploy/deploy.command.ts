import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, isAbsolute, dirname, join } from 'path';
import { existsSync as fsExistsSync } from 'fs';
import {
  CloudAssemblyReader,
  DeploymentPlanner,
  DeploymentEngine,
  EventBus,
  type AssemblyStack,
  type DeploymentPlan,
  type DeploymentEngineOptions,
  type EngineEvent,
  ResourceStatus,
  StackStatus,
} from '@cdkx-io/engine';
import { HetznerAdapterFactory } from '@cdkx-io/hetzner';
import { BaseCommand } from '../../lib/base-command.js';
import {
  type CdkxConfig,
  readConfig as defaultReadConfig,
} from '../../lib/cdkx-config.js';
import { AdapterRegistry } from '../../lib/adapter-registry/index.js';
import { DeployLock } from '../../lib/deploy-lock/index.js';

// ─── Defaults ─────────────────────────────────────────────────────────────────

function defaultReadAssembly(outdir: string): AssemblyStack[] {
  return new CloudAssemblyReader(outdir).read();
}

function defaultPlanDeployment(stacks: AssemblyStack[]): DeploymentPlan {
  return new DeploymentPlanner().plan(stacks);
}

function defaultCreateEngine(opts: DeploymentEngineOptions): DeploymentEngine {
  return new DeploymentEngine(opts);
}

function defaultCreateLock(stateDir: string): DeployLock {
  return new DeployLock(stateDir);
}

const defaultRegistry = new AdapterRegistry().register(
  new HetznerAdapterFactory(),
);

// ─── Event formatting ─────────────────────────────────────────────────────────

function statusColor(status: ResourceStatus | StackStatus): string {
  const s = status as string;
  if (s.endsWith('_COMPLETE')) return chalk.green(s);
  if (s.endsWith('_FAILED')) return chalk.red(s);
  if (s.includes('ROLLBACK')) return chalk.yellow(s);
  return chalk.cyan(s); // *_IN_PROGRESS
}

function formatEvent(event: EngineEvent): string {
  const ts = event.timestamp.toISOString();
  const parts = [
    chalk.dim(ts),
    chalk.white(event.stackId),
    chalk.dim(event.resourceType),
    event.logicalResourceId,
    statusColor(event.resourceStatus),
  ];
  if (event.resourceStatusReason) {
    parts.push(chalk.dim(`(${event.resourceStatusReason})`));
  }
  return parts.join('  ');
}

// ─── DeployCommandDeps ────────────────────────────────────────────────────────

export interface DeployCommandDeps {
  existsSync?: (path: string) => boolean;
  readConfig?: (path: string) => CdkxConfig;
  readAssembly?: (outdir: string) => AssemblyStack[];
  planDeployment?: (stacks: AssemblyStack[]) => DeploymentPlan;
  createEngine?: (opts: DeploymentEngineOptions) => DeploymentEngine;
  /** Factory that creates a `DeployLock` for the given `stateDir`. */
  createLock?: (stateDir: string) => DeployLock;
  registry?: AdapterRegistry;
}

// ─── DeployCommand ────────────────────────────────────────────────────────────

/**
 * Implements the `cdkx deploy` command.
 *
 * Reads the cloud assembly produced by `cdkx synth`, builds a deployment
 * plan, and drives the deployment loop via `DeploymentEngine`. Progress is
 * streamed to stdout as engine events arrive.
 *
 * A deploy lock (`.cdkx/deploy.lock`) is acquired before the deployment
 * starts and released in a `finally` block, preventing concurrent deployments.
 */
export class DeployCommand extends BaseCommand {
  private readonly existsSync: (path: string) => boolean;
  private readonly readConfig: (path: string) => CdkxConfig;
  private readonly readAssembly: (outdir: string) => AssemblyStack[];
  private readonly planDeployment: (stacks: AssemblyStack[]) => DeploymentPlan;
  private readonly createEngine: (
    opts: DeploymentEngineOptions,
  ) => DeploymentEngine;
  private readonly createLock: (stateDir: string) => DeployLock;
  private readonly registry: AdapterRegistry;

  private constructor(deps: DeployCommandDeps = {}) {
    super();
    this.existsSync = deps.existsSync ?? fsExistsSync;
    this.readConfig = deps.readConfig ?? defaultReadConfig;
    this.readAssembly = deps.readAssembly ?? defaultReadAssembly;
    this.planDeployment = deps.planDeployment ?? defaultPlanDeployment;
    this.createEngine = deps.createEngine ?? defaultCreateEngine;
    this.createLock = deps.createLock ?? defaultCreateLock;
    this.registry = deps.registry ?? defaultRegistry;
  }

  static create(deps?: DeployCommandDeps): Command {
    return new DeployCommand(deps).build();
  }

  build(): Command {
    return new Command('deploy')
      .description(
        'Deploy the synthesized cloud assembly to the target provider',
      )
      .option(
        '-c, --config <file>',
        'Path to cdkx.json config file',
        'cdkx.json',
      )
      .option('-o, --output <dir>', 'Override output directory')
      .action(async (options: { config: string; output?: string }) => {
        await this.run(() => this.execute(options));
      });
  }

  private async execute(options: {
    config: string;
    output?: string;
  }): Promise<void> {
    // 1. Resolve and validate config path.
    const configPath = isAbsolute(options.config)
      ? options.config
      : resolve(process.cwd(), options.config);

    if (!this.existsSync(configPath)) {
      this.fail(
        `cdkx.json not found: ${configPath}\nRun 'cdkx init' to create a new project.`,
      );
    }

    // 2. Read and validate config.
    const config = this.readConfig(configPath);

    if (!config.app) {
      this.fail(`'app' field is required in ${options.config}`);
    }

    // 3. Resolve output directory — relative paths are resolved from the
    // config file's directory, so `cdkx deploy --config /path/to/cdkx.json`
    // picks up the assembly written next to that config file.
    const configDir = dirname(configPath);
    const outdir = options.output ?? config.output ?? 'cdkx.out';
    const absoluteOutdir = isAbsolute(outdir)
      ? outdir
      : resolve(configDir, outdir);

    // State directory — always .cdkx/ next to cdkx.json. Kept separate from
    // the assembly outdir so state lives in a gitignored local directory.
    const stateDir = join(configDir, '.cdkx');

    // 4. Read the cloud assembly.
    const stacks = this.readAssembly(absoluteOutdir);

    if (stacks.length === 0) {
      this.fail(
        `No stacks found in cloud assembly at '${absoluteOutdir}'.\n` +
          `Run 'cdkx synth' first to generate the deployment manifests.`,
      );
    }

    // 5. Build the deployment plan.
    const plan = this.planDeployment(stacks);

    // 6. Build adapters from the registry (fails fast if a token is missing).
    const providerIds = [...new Set(stacks.map((s) => s.provider))];
    const adapters = this.registry.build(providerIds, process.env);

    // 7. Acquire the deploy lock — prevents concurrent deployments.
    const lock = this.createLock(stateDir);
    lock.acquire();

    try {
      // 8. Create the engine with an event bus for streaming progress.
      const eventBus = new EventBus<EngineEvent>();
      const engine = this.createEngine({
        adapters,
        assemblyDir: absoluteOutdir,
        stateDir,
        eventBus,
      });

      // 9. Stream events to stdout.
      engine.subscribe((event) => {
        console.log(formatEvent(event));
      });

      // 10. Deploy.
      const result = await engine.deploy(stacks, plan);

      if (!result.success) {
        this.fail('Deployment failed — see above for details.');
      }

      console.log(chalk.green('✔') + ' Deployment complete');
    } finally {
      lock.release();
    }
  }
}

export const deployCommand = DeployCommand.create();
