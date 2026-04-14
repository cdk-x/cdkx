import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, isAbsolute } from 'path';
import { spawn } from 'child_process';
import { BaseCommand } from '../../lib/base-command.js';
import {
  MultipassConfigReader,
  type MultipassInstanceConfig,
} from './multipass-config-reader.js';

export interface StartCommandDeps {
  resolve?: (
    configPath: string,
    names: string[],
    all: boolean,
  ) => MultipassInstanceConfig[];
}

export class StartCommand extends BaseCommand {
  private readonly resolveInstances: (
    configPath: string,
    names: string[],
    all: boolean,
  ) => MultipassInstanceConfig[];

  private constructor(deps: StartCommandDeps = {}) {
    super();
    this.resolveInstances =
      deps.resolve ?? MultipassConfigReader.resolve.bind(MultipassConfigReader);
  }

  static create(deps?: StartCommandDeps): Command {
    return new StartCommand(deps).build();
  }

  build(): Command {
    return new Command('start')
      .description('Start stopped Multipass VMs')
      .argument('[names...]', 'VM names to start')
      .option('--all', 'Start all instances defined in config')
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
      console.log(chalk.cyan(`Starting ${instance.name}...`));
      const success = await this.runMultipass(['start', instance.name]);
      if (!success) {
        failures.push(instance.name);
        console.error(chalk.red(`✖ Failed to start ${instance.name}`));
      } else {
        console.log(chalk.green(`✔ Started ${instance.name}`));
      }
    }

    if (failures.length > 0) {
      this.fail(`Start failed for: ${failures.join(', ')}`);
    }
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

export const startCommand = StartCommand.create();
