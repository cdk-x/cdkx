import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, isAbsolute, dirname, join } from 'path';
import { existsSync as fsExistsSync } from 'fs';
import {
  DeploymentEngine,
  type EngineEvent,
  type OutputHandler,
  ResourceStatus,
  StackStatus,
} from '@cdk-x/engine';
import { LoggerFactory } from '@cdk-x/logger';
import { BaseCommand } from '../../lib/base-command.js';
import {
  type CdkxConfig,
  readConfig as defaultReadConfig,
} from '../../lib/cdkx-config.js';

// ─── Defaults ─────────────────────────────────────────────────────────────────

function defaultReadConfigWrapper(path: string): CdkxConfig {
  return defaultReadConfig(path);
}

// ─── Event formatting ─────────────────────────────────────────────────────────

/** Pads a plain string to a fixed visual width (applied before chalk wrapping). */
function pad(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

function statusColor(status: ResourceStatus | StackStatus): string {
  const s = status as string;
  if (s === 'NO_CHANGES') return chalk.dim(s);
  if (s.endsWith('_COMPLETE')) return chalk.green(s);
  if (s.endsWith('_FAILED')) return chalk.red(s);
  if (s.includes('ROLLBACK')) return chalk.yellow(s);
  return chalk.cyan(s); // *_IN_PROGRESS
}

function renderEvent(event: EngineEvent): string {
  const parts = [
    chalk.white(pad(event.stackId, 20)),
    chalk.dim(pad(event.resourceType, 35)),
    pad(event.logicalResourceId, 35),
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
}

// ─── DeployCommand ────────────────────────────────────────────────────────────

/**
 * Implements the `cdkx deploy` command.
 *
 * Reads the cloud assembly and delegates all deployment work to the
 * DeploymentEngine. The engine handles provider loading, state management,
 * locking, and file logging. The CLI handles console output via outputHandler.
 */
export class DeployCommand extends BaseCommand {
  private readonly existsSync: (path: string) => boolean;
  private readonly readConfig: (path: string) => CdkxConfig;

  private constructor(deps: DeployCommandDeps = {}) {
    super();
    this.existsSync = deps.existsSync ?? fsExistsSync;
    this.readConfig = deps.readConfig ?? defaultReadConfigWrapper;
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
    // config file's directory.
    const configDir = dirname(configPath);
    const outdir = options.output ?? config.output ?? 'cdkx.out';
    const absoluteOutdir = isAbsolute(outdir)
      ? outdir
      : resolve(configDir, outdir);

    // State directory — always .cdkx/ next to cdkx.json.
    const stateDir = join(configDir, '.cdkx');

    // 4. Create the engine with file logging and console output handler.
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

    // 5. Deploy.
    const result = await engine.deploy();

    await logger.close?.();

    if (!result.success) {
      this.fail('Deployment failed — see above for details.');
    }
  }
}

export const deployCommand = DeployCommand.create();
