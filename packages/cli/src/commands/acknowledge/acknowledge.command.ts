import { Command } from 'commander';
import chalk from 'chalk';
import { CdkxContext } from '@cdk-x/core';
import { BaseCommand } from '../../lib/base-command.js';

export interface AcknowledgeCommandDeps {
  getContextPath?: () => string;
}

export class AcknowledgeCommand extends BaseCommand {
  private readonly getContextPath: () => string;

  private constructor(deps: AcknowledgeCommandDeps = {}) {
    super();
    this.getContextPath = deps.getContextPath ?? (() => {
      // Default: cdkx.context.json in current working directory
      return process.cwd() + '/cdkx.context.json';
    });
  }

  static create(deps?: AcknowledgeCommandDeps): Command {
    return new AcknowledgeCommand(deps).build();
  }

  build(): Command {
    return new Command('acknowledge')
      .description('Acknowledge an issue ID to suppress its notice')
      .argument('[id]', 'The issue ID to acknowledge (numeric)')
      .option('--list', 'List all acknowledged issue IDs')
      .action(async (id: string | undefined, options: { list?: boolean }) => {
        await this.run(() => this.execute(id, options));
      });
  }

  private async execute(id: string | undefined, options: { list?: boolean }): Promise<void> {
    const contextPath = this.getContextPath();
    const context = new CdkxContext(contextPath);

    // Handle --list option
    if (options.list) {
      const acknowledgedIds = context.listAcknowledgements();
      
      if (acknowledgedIds.length === 0) {
        console.log(chalk.dim('No issues have been acknowledged.'));
        return;
      }

      console.log(chalk.bold('Acknowledged Issues:'));
      console.log('');
      for (const ackId of acknowledgedIds) {
        console.log(`  ${chalk.cyan(ackId)}`);
      }
      console.log('');
      console.log(chalk.dim(`Total: ${acknowledgedIds.length} issue(s)`));
      return;
    }

    // Validate ID is provided for non-list operations
    if (!id) {
      this.fail('Issue ID is required. Use --list to see acknowledged issues.');
    }

    // Validate that ID is numeric
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      this.fail(`Invalid issue ID: ${id}. Must be a number.`);
    }

    // Check if already acknowledged
    if (context.isAcknowledged(numId)) {
      console.log(chalk.yellow('⚠') + ` Issue ${chalk.cyan(id)} is already acknowledged.`);
      return;
    }

    // Add acknowledgement
    context.acknowledge(numId);

    console.log(
      chalk.green('✔') +
        ' Acknowledged issue ' +
        chalk.cyan(id) +
        '. It will no longer be displayed during synthesis.',
    );
  }
}

export const acknowledgeCommand = AcknowledgeCommand.create();
