import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, isAbsolute } from 'path';
import { existsSync as fsExistsSync } from 'fs';
import { spawnSync as cpSpawnSync } from 'child_process';
import { BaseCommand } from '../../lib/base-command.js';

export interface SpawnResult {
  status: number | null;
  stderr: string;
  stdout: string;
}

export interface ProjectCommandDeps {
  existsSync?: (path: string) => boolean;
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

export class ProjectCommand extends BaseCommand {
  private readonly existsSync: (path: string) => boolean;
  private readonly spawnApp: (
    cmd: string,
    env: NodeJS.ProcessEnv,
    cwd: string,
  ) => SpawnResult;

  private constructor(deps: ProjectCommandDeps = {}) {
    super();
    this.existsSync = deps.existsSync ?? fsExistsSync;
    this.spawnApp = deps.spawnApp ?? defaultSpawnApp;
  }

  static create(deps?: ProjectCommandDeps): Command {
    return new ProjectCommand(deps).build();
  }

  build(): Command {
    return new Command('project')
      .description(
        'Synthesize project files from a .cdkxrc.ts declaration and write them to disk',
      )
      .option('-a, --app <path>', 'Path to the project config file')
      .action(async (options: { app?: string }) => {
        await this.run(() => this.execute(options));
      });
  }

  private async execute(options: { app?: string }): Promise<void> {
    const cwd = process.cwd();
    const appPath = options.app
      ? isAbsolute(options.app)
        ? options.app
        : resolve(cwd, options.app)
      : resolve(cwd, '.cdkxrc.ts');

    if (!this.existsSync(appPath)) {
      this.fail(
        `Project config not found: ${appPath}\nCreate a .cdkxrc.ts file or pass --app <path>.`,
      );
    }

    const outdir = 'cdkx.out';
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      CDKX_OUT_DIR: outdir,
    };

    const cmd = `npx ts-node ${appPath}`;
    const result = this.spawnApp(cmd, env, cwd);

    if (result.status !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim();
      this.fail(
        `Project config exited with code ${result.status}${detail ? `:\n${detail}` : ''}`,
      );
    }

    console.log(chalk.green('✔') + ' Project files written successfully.');
  }
}

export const projectCommand = ProjectCommand.create();
