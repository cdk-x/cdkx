import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, isAbsolute, dirname, join } from 'path';
import { existsSync as fsExistsSync } from 'fs';
import { createInterface } from 'readline';
import {
  DeploymentEngine,
  type EngineEvent,
  type OutputHandler,
  ResourceStatus,
  StackStatus,
} from '@cdkx-io/engine';
import { LoggerFactory } from '@cdkx-io/logger';
import { BaseCommand } from '../../lib/base-command';
import {
  type CdkxConfig,
  readConfig as defaultReadConfig,
} from '../../lib/cdkx-config.js';

// ─── Defaults ─────────────────────────────────────────────────────────────────

function defaultReadConfigWrapper(path: string): CdkxConfig {
  return defaultReadConfig(path);
}

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

// ─── Event formatting ─────────────────────────────────────────────────────────

/** Pads a plain string to a fixed visual width (applied before chalk wrapping). */
function pad(s: string, width: number): string {
  return s + ' '.repeat(Math.max(0, width - s.length));
}

function renderEvent(event: EngineEvent): string {
  const stack = pad(event.stackId, 20);
  const type = pad(event.resourceType, 35);
  const id = pad(event.logicalResourceId, 35);

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

  let line = `${stack}  ${type}  ${id}  ${status}`;
  if (event.resourceStatusReason) {
    line += `  ${chalk.dim(`(${event.resourceStatusReason})`)}`;
  }
  return line;
}

// ─── DestroyCommandDeps ───────────────────────────────────────────────────────

export interface DestroyCommandDeps {
  existsSync?: typeof fsExistsSync;
  readConfig?: typeof defaultReadConfig;
  promptUser?: typeof defaultPromptUser;
}

// ─── DestroyCommand ───────────────────────────────────────────────────────────

/**
 * Implements the `cdkx destroy` command.
 *
 * Reads the cloud assembly, confirms with the user, and delegates all
 * destruction work to the DeploymentEngine. The engine handles provider
 * loading, state management, locking, and file logging. The CLI handles
 * console output via outputHandler.
 */
export class DestroyCommand extends BaseCommand {
  private readonly existsSync: typeof fsExistsSync;
  private readonly readConfig: typeof defaultReadConfig;
  private readonly promptUser: typeof defaultPromptUser;

  private constructor(deps: DestroyCommandDeps = {}) {
    super();
    this.existsSync = deps.existsSync ?? fsExistsSync;
    this.readConfig = deps.readConfig ?? defaultReadConfigWrapper;
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

    // State directory — always .cdkx/ next to cdkx.json.
    const stateDir = join(configDir, '.cdkx');

    // 4. Confirm destruction (unless --force is set).
    if (!options.force) {
      console.log(
        chalk.yellow(
          '⚠️  WARNING: This will destroy all resources in the cloud assembly.',
        ),
      );
      console.log();

      const confirmed = await this.promptUser(
        chalk.yellow('Are you sure you want to continue? (y/N): '),
      );

      if (!confirmed) {
        console.log(chalk.dim('Destroy cancelled.'));
        return;
      }
    }

    // 5. Create the engine with file logging and console output handler.
    const logger = LoggerFactory.createEngineLogger({
      logDir: stateDir,
    });

    // Output handler for console display
    const outputHandler: OutputHandler = (event) => {
      console.log(renderEvent(event));
    };

    const engine = new DeploymentEngine({
      assemblyDir: absoluteOutdir,
      stateDir,
      logger,
      outputHandler,
    });

    // 6. Destroy all stacks.
    const result = await engine.destroy();

    if (!result.success) {
      this.fail('Destroy failed — see above for details.');
    }

    console.log(chalk.green('✔') + ' All resources destroyed');
  }
}

export const destroyCommand = DestroyCommand.create();
