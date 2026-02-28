import { Command } from 'commander';
import chalk from 'chalk';
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

program.parse(process.argv);
