import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, isAbsolute } from 'path';
import { spawn } from 'child_process';
import { BaseCommand } from '../../lib/base-command.js';
import {
  MultipassConfigReader,
  type MultipassInstanceConfig,
} from './multipass-config-reader.js';

export interface StopCommandDeps {
  resolve?: (
    configPath: string,
    names: string[],
    all: boolean,
  ) => MultipassInstanceConfig[];
}

export class StopCommand extends BaseCommand {
  private readonly resolveInstances: (
    configPath: string,
    names: string[],
    all: boolean,
  ) => MultipassInstanceConfig[];

  private constructor(deps: StopCommandDeps = {}) {
    super();
    this.resolveInstances =
      deps.resolve ?? MultipassConfigReader.resolve.bind(MultipassConfigReader);
  }

  static create(deps?: StopCommandDeps): Command {
    return new StopCommand(deps).build();
  }

  build(): Command {
    return new Command('stop')
      .description('Stop running Multipass VMs')
      .argument('[names...]', 'VM names to stop')
      .option('--all', 'Stop all instances defined in config')
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
      console.log(chalk.cyan(`Stopping ${instance.name}...`));
      const success = await this.runMultipass(['stop', instance.name]);
      if (!success) {
        failures.push(instance.name);
        console.error(chalk.red(`✖ Failed to stop ${instance.name}`));
      } else {
        console.log(chalk.green(`✔ Stopped ${instance.name}`));
      }
    }

    if (failures.length > 0) {
      this.fail(`Stop failed for: ${failures.join(', ')}`);
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

export const stopCommand = StopCommand.create();
