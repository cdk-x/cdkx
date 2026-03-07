import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, isAbsolute, dirname } from 'path';
import { existsSync as fsExistsSync } from 'fs';
import { spawnSync as cpSpawnSync } from 'child_process';
import { BaseCommand } from '../../lib/base-command.js';
import {
  type CdkxConfig,
  readConfig as defaultReadConfig,
} from '../../lib/cdkx-config.js';

export interface SpawnResult {
  status: number | null;
  stderr: string;
  stdout: string;
}

export interface SynthCommandDeps {
  existsSync?: (path: string) => boolean;
  readConfig?: (path: string) => CdkxConfig;
  spawnApp?: (cmd: string, env: NodeJS.ProcessEnv, cwd: string) => SpawnResult;
}

function defaultSpawnApp(
  cmd: string,
  env: NodeJS.ProcessEnv,
  cwd: string,
): SpawnResult {
  const [bin, ...args] = cmd.split(' ');
  const result = cpSpawnSync(bin, args, {
    env,
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf-8',
    shell: true,
  });
  return {
    status: result.status,
    stderr: result.stderr ?? '',
    stdout: result.stdout ?? '',
  };
}

export class SynthCommand extends BaseCommand {
  private readonly existsSync: (path: string) => boolean;
  private readonly readConfig: (path: string) => CdkxConfig;
  private readonly spawnApp: (
    cmd: string,
    env: NodeJS.ProcessEnv,
    cwd: string,
  ) => SpawnResult;

  private constructor(deps: SynthCommandDeps = {}) {
    super();
    this.existsSync = deps.existsSync ?? fsExistsSync;
    this.readConfig = deps.readConfig ?? defaultReadConfig;
    this.spawnApp = deps.spawnApp ?? defaultSpawnApp;
  }

  static create(deps?: SynthCommandDeps): Command {
    return new SynthCommand(deps).build();
  }

  build(): Command {
    return new Command('synth')
      .description('Synthesize the CDK-X app into deployment manifests')
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
    const configPath = isAbsolute(options.config)
      ? options.config
      : resolve(process.cwd(), options.config);

    if (!this.existsSync(configPath)) {
      this.fail(
        `cdkx.json not found: ${configPath}\nRun 'cdkx init' to create a new project.`,
      );
    }

    const config = this.readConfig(configPath);

    if (!config.app) {
      this.fail(`'app' field is required in ${options.config}`);
    }

    const outputDir = options.output ?? config.output ?? 'cdkx.out';

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      CDKX_OUT_DIR: outputDir,
    };

    const cwd = dirname(configPath);
    const result = this.spawnApp(config.app, env, cwd);

    if (result.status !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim();
      this.fail(
        `App exited with code ${result.status}${detail ? `:\n${detail}` : ''}`,
      );
    }

    console.log(
      chalk.green('✔') +
        ' Synthesis complete — output written to ' +
        chalk.dim(outputDir),
    );
  }
}

export const synthCommand = SynthCommand.create();
