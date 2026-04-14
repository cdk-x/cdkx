import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, isAbsolute } from 'path';
import { spawn } from 'child_process';
import { BaseCommand } from '../../lib/base-command.js';
import {
  MultipassConfigReader,
  type MultipassInstanceConfig,
} from './multipass-config-reader.js';

export interface LaunchCommandDeps {
  resolve?: (
    configPath: string,
    names: string[],
    all: boolean,
  ) => MultipassInstanceConfig[];
}

export class LaunchCommand extends BaseCommand {
  private readonly resolveInstances: (
    configPath: string,
    names: string[],
    all: boolean,
  ) => MultipassInstanceConfig[];

  private constructor(deps: LaunchCommandDeps = {}) {
    super();
    this.resolveInstances =
      deps.resolve ?? MultipassConfigReader.resolve.bind(MultipassConfigReader);
  }

  static create(deps?: LaunchCommandDeps): Command {
    return new LaunchCommand(deps).build();
  }

  build(): Command {
    return new Command('launch')
      .description('Launch (create and start) Multipass VMs')
      .argument('[names...]', 'VM names to launch')
      .option('--all', 'Launch all instances defined in config')
      .option('-c, --config <file>', 'Path to multipass.yaml', 'multipass.yaml')
      .action(
        async (names: string[], options: { all?: boolean; config: string }) => {
          await this.run(() => this.execute(names, options));
        },
      );
  }

  private async execute(
    names: string[],
    options: { all?: boolean; config: string },
  ): Promise<void> {
    const configPath = isAbsolute(options.config)
      ? options.config
      : resolve(process.cwd(), options.config);

    const instances = this.resolveInstances(
      configPath,
      names,
      options.all ?? false,
    );

    const failures: string[] = [];

    for (const instance of instances) {
      console.log(chalk.cyan(`Launching ${instance.name}...`));
      const success = await this.runMultipass(this.buildArgs(instance));
      if (!success) {
        failures.push(instance.name);
        console.error(chalk.red(`✖ Failed to launch ${instance.name}`));
      } else {
        console.log(chalk.green(`✔ Launched ${instance.name}`));
      }
    }

    if (failures.length > 0) {
      this.fail(`Launch failed for: ${failures.join(', ')}`);
    }
  }

  private buildArgs(instance: MultipassInstanceConfig): string[] {
    const args: string[] = ['launch'];

    if (instance.image) {
      args.push(instance.image);
    }

    args.push('--name', instance.name);

    if (instance.cpus !== undefined) {
      args.push('--cpus', String(instance.cpus));
    }
    if (instance.memory !== undefined) {
      args.push('--memory', instance.memory);
    }
    if (instance.disk !== undefined) {
      args.push('--disk', instance.disk);
    }

    return args;
  }

  private runMultipass(args: string[]): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = spawn('multipass', args, { stdio: 'inherit' });
      proc.on('close', (code) => resolve(code === 0));
      proc.on('error', (err) => {
        console.error(chalk.red(`Failed to run multipass: ${err.message}`));
        resolve(false);
      });
    });
  }
}

export const launchCommand = LaunchCommand.create();
