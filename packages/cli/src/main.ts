import { Command } from 'commander';
import chalk from 'chalk';
import { synthCommand } from './commands/synth/index.js';
import { deployCommand } from './commands/deploy/index.js';
import { destroyCommand } from './commands/destroy/index.js';
import { initCommand } from './commands/init/index.js';
import { projectCommand } from './commands/project/index.js';
import { multipassCommand } from './commands/multipass/index.js';
import { acknowledgeCommand } from './commands/acknowledge/index.js';

const { version } = require('../package.json') as { version: string };

const inner = `  cdkx v${version}  —  multi-provider IaC CLI  `;
const border = '═'.repeat(inner.length);

const banner = [
  chalk.cyan(`╔${border}╗`),
  chalk.cyan('║') +
    '  ' +
    chalk.bold.white('cdkx') +
    chalk.dim(` v${version}`) +
    chalk.cyan('  —  ') +
    chalk.white('multi-provider IaC CLI') +
    '  ' +
    chalk.cyan('║'),
  chalk.cyan(`╚${border}╝`),
].join('\n');

const program = new Command();

program
  .name('cdkx')
  .description('CDK-X — multi-provider infrastructure as code')
  .version(version, '-V, --version', 'output the version number')
  .addHelpText('beforeAll', `\n${banner}\n`);

program.addCommand(initCommand);
program.addCommand(synthCommand);
program.addCommand(projectCommand);
program.addCommand(deployCommand);
program.addCommand(destroyCommand);
program.addCommand(multipassCommand);
program.addCommand(acknowledgeCommand);

program.parse(process.argv);
