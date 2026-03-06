import { Command } from 'commander';
import chalk from 'chalk';
import { generateCommand } from './commands/generate/index.js';

const { version } = require('../package.json') as { version: string };

const program = new Command();

program
  .name('spec-to-cdkx')
  .description('Generate TypeScript L1 CDK constructs from JSON Schema files')
  .version(version);

// Banner
console.log(chalk.cyan('┌────────────────────────────────────┐'));
console.log(
  chalk.cyan('│') +
    ' ' +
    chalk.bold.white('spec-to-cdkx') +
    chalk.dim(` v${version}`) +
    ' ' +
    chalk.cyan('│'),
);
console.log(chalk.cyan('└────────────────────────────────────┘'));

program.addCommand(generateCommand);

program.parse(process.argv);
