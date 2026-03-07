import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, isAbsolute, dirname, join } from 'path';
import { existsSync as fsExistsSync } from 'fs';
import { createInterface } from 'readline';
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
import { BaseCommand } from '../../lib/base-command';
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

/** Pads a plain string to a fixed visual width (applied before chalk wrapping). */
function pad(s: string, width: number): string {
  return s + ' '.repeat(Math.max(0, width - s.length));
}

interface ColWidths {
  stack: number;
  type: number;
  id: number;
}

/**
 * Computes column widths from the assembly data (before destroy starts).
 * This allows immediate event printing with correct alignment.
 */
function computeColWidthsFromAssembly(stacks: AssemblyStack[]): ColWidths {
  let stack = 0;
  let type = 'cdkx::stack'.length; // stack-level events use this type
  let id = 0;

  for (const s of stacks) {
    // Stack ID appears in the stackId column and as logicalResourceId for stack-level events
    if (s.id.length > stack) stack = s.id.length;
    if (s.id.length > id) id = s.id.length;

    // Resource types and logical IDs
    for (const r of s.resources) {
      if (r.type.length > type) type = r.type.length;
      if (r.logicalId.length > id) id = r.logicalId.length;
    }
  }

  return { stack, type, id };
}

function renderEvent(event: EngineEvent, widths: ColWidths): string {
  const stack = pad(event.stackId, widths.stack);
  const type = pad(event.resourceType, widths.type);
  const id = pad(event.logicalResourceId, widths.id);

  let status: string;
  const s = event.resourceStatus;

  if (
    s === ResourceStatus.DELETE_COMPLETE ||
    s === StackStatus.DELETE_COMPLETE
  ) {
    status = chalk.green(s);
  } else if (
    s === ResourceStatus.DELETE_IN_PROGRESS ||
    s === StackStatus.DELETE_IN_PROGRESS
  ) {
    status = chalk.yellow(s);
  } else if (
    s === ResourceStatus.DELETE_FAILED ||
    s === StackStatus.DELETE_FAILED
  ) {
    status = chalk.red(s);
  } else {
    status = chalk.dim(s);
  }

  return `${stack}  ${type}  ${id}  ${status}`;
}

// ─── User confirmation ────────────────────────────────────────────────────────

async function defaultPromptUser(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// ─── Command ──────────────────────────────────────────────────────────────────

export interface DestroyCommandDeps {
  existsSync?: typeof fsExistsSync;
  readConfig?: typeof defaultReadConfig;
  readAssembly?: typeof defaultReadAssembly;
  planDeployment?: typeof defaultPlanDeployment;
  createEngine?: typeof defaultCreateEngine;
  createLock?: typeof defaultCreateLock;
  registry?: AdapterRegistry;
  promptUser?: typeof defaultPromptUser;
}

export class DestroyCommand extends BaseCommand {
  private readonly existsSync: typeof fsExistsSync;
  private readonly readConfig: typeof defaultReadConfig;
  private readonly readAssembly: typeof defaultReadAssembly;
  private readonly planDeployment: typeof defaultPlanDeployment;
  private readonly createEngine: typeof defaultCreateEngine;
  private readonly createLock: typeof defaultCreateLock;
  private readonly registry: AdapterRegistry;
  private readonly promptUser: typeof defaultPromptUser;

  private constructor(deps: DestroyCommandDeps = {}) {
    super();
    this.existsSync = deps.existsSync ?? fsExistsSync;
    this.readConfig = deps.readConfig ?? defaultReadConfig;
    this.readAssembly = deps.readAssembly ?? defaultReadAssembly;
    this.planDeployment = deps.planDeployment ?? defaultPlanDeployment;
    this.createEngine = deps.createEngine ?? defaultCreateEngine;
    this.createLock = deps.createLock ?? defaultCreateLock;
    this.registry = deps.registry ?? defaultRegistry;
    this.promptUser = deps.promptUser ?? defaultPromptUser;
  }

  static create(deps?: DestroyCommandDeps): Command {
    return new DestroyCommand(deps).build();
  }

  build(): Command {
    return new Command('destroy')
      .description('Destroy all resources in the cloud assembly')
      .option(
        '-c, --config <file>',
        'Path to cdkx.json config file',
        'cdkx.json',
      )
      .option('-o, --output <dir>', 'Override output directory')
      .option('--force', 'Skip confirmation prompt')
      .action(
        async (options: {
          config: string;
          output?: string;
          force?: boolean;
        }) => {
          await this.run(() => this.execute(options));
        },
      );
  }

  private async execute(options: {
    config: string;
    output?: string;
    force?: boolean;
  }): Promise<void> {
    // 1. Resolve and validate the config path.
    const configPath = isAbsolute(options.config)
      ? options.config
      : resolve(process.cwd(), options.config);

    if (!this.existsSync(configPath)) {
      this.fail(
        `Config file not found: '${configPath}'.\n` +
          `Run 'cdkx init' to create a new cdkx.json file.`,
      );
    }

    // 2. Read and validate cdkx.json.
    const config: CdkxConfig = this.readConfig(configPath);

    if (config.app === undefined) {
      this.fail(
        `Invalid config: 'app' field is required in ${configPath}.\n` +
          `Example: { "app": "node dist/main.js" }`,
      );
    }

    const configDir = dirname(configPath);

    // 3. Compute absolute paths.
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

    // 5. Build the deployment plan (we'll reverse it for destruction).
    const plan = this.planDeployment(stacks);

    // 6. Build adapters from the registry (fails fast if a token is missing).
    const providerIds = [...new Set(stacks.map((s) => s.provider))];
    const adapters = this.registry.build(providerIds, process.env);

    // 7. Confirm destruction (unless --force is set).
    if (!options.force) {
      console.log(
        chalk.yellow(
          '⚠️  WARNING: This will destroy all resources in the following stacks:',
        ),
      );
      for (const stack of stacks) {
        console.log(chalk.yellow(`  - ${stack.id} (${stack.provider})`));
      }
      console.log();

      const confirmed = await this.promptUser(
        chalk.yellow('Are you sure you want to continue? (y/N): '),
      );

      if (!confirmed) {
        console.log(chalk.dim('Destroy cancelled.'));
        return;
      }
    }

    // 8. Compute column widths upfront from the assembly data.
    const widths = computeColWidthsFromAssembly(stacks);

    // 9. Acquire the deploy lock — prevents concurrent operations.
    const lock = this.createLock(stateDir);
    lock.acquire();

    try {
      // 10. Create the engine with an event bus for streaming progress.
      const eventBus = new EventBus<EngineEvent>();
      const engine = this.createEngine({
        adapters,
        assemblyDir: absoluteOutdir,
        stateDir,
        eventBus,
      });

      // 11. Stream events immediately as they happen.
      engine.subscribe((event) => {
        console.log(renderEvent(event, widths));
      });

      // 12. Destroy all stacks (reverse order).
      const result = await engine.destroy(stacks, plan);

      if (!result.success) {
        this.fail('Destroy failed — see above for details.');
      }

      console.log(chalk.green('✔') + ' All resources destroyed');
    } finally {
      lock.release();
    }
  }
}

export const destroyCommand = DestroyCommand.create();
