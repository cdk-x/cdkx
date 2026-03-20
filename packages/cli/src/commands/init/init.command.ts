import { Command } from 'commander';
import chalk from 'chalk';
import { resolve, isAbsolute, basename } from 'path';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { BaseCommand } from '../../lib/base-command.js';
import {
  InitTemplateEngine,
  InitFileSystem,
  InitMode,
  PackageManager,
} from '../../lib/init-template-engine.js';

// ─── Defaults ─────────────────────────────────────────────────────────────────

function defaultCreateFileSystem(): InitFileSystem {
  return {
    exists: (p) => existsSync(p),
    mkdir: (p, opts) => mkdirSync(p, opts),
    writeFile: (p, content) => writeFileSync(p, content, 'utf-8'),
    readFile: (p) => readFileSync(p, 'utf-8'),
  };
}

// ─── InitCommandDeps ──────────────────────────────────────────────────────────

export type InitCommandDeps = {
  createFileSystem?: () => InitFileSystem;
  detectMode?: (dir: string, exists: (p: string) => boolean) => InitMode;
  detectPackageManager?: (
    dir: string,
    exists: (p: string) => boolean,
  ) => PackageManager;
  installPackages?: (dir: string, pm: PackageManager) => void;
};

// ─── InitCommand ──────────────────────────────────────────────────────────────

export class InitCommand extends BaseCommand {
  private readonly createFileSystem: () => InitFileSystem;
  private readonly detectMode: (
    dir: string,
    exists: (p: string) => boolean,
  ) => InitMode;
  private readonly detectPackageManager: (
    dir: string,
    exists: (p: string) => boolean,
  ) => PackageManager;
  private readonly installPackages: (dir: string, pm: PackageManager) => void;

  private constructor(deps: InitCommandDeps = {}) {
    super();
    this.createFileSystem = deps.createFileSystem ?? defaultCreateFileSystem;
    this.detectMode = deps.detectMode ?? InitTemplateEngine.detectMode;
    this.detectPackageManager =
      deps.detectPackageManager ?? InitTemplateEngine.detectPackageManager;
    this.installPackages = deps.installPackages ?? (() => undefined);
  }

  static create(deps?: InitCommandDeps): Command {
    return new InitCommand(deps).build();
  }

  build(): Command {
    return new Command('init')
      .description('Scaffold a new cdkx project in the target directory')
      .argument(
        '[directory]',
        'Target directory (defaults to current directory)',
      )
      .option('--name <name>', 'Project name (defaults to directory basename)')
      .option('--mode <mode>', 'Init mode: empty, existing, or nx')
      .option(
        '--package-manager <pm>',
        'Package manager to use: yarn, npm, or pnpm',
      )
      .option('--no-install', 'Skip package manager install step')
      .action(
        async (
          directory: string | undefined,
          options: {
            name?: string;
            mode?: string;
            packageManager?: string;
            install: boolean;
          },
        ) => {
          await this.run(() => this.execute(directory, options));
        },
      );
  }

  private async execute(
    directory: string | undefined,
    options: {
      name?: string;
      mode?: string;
      packageManager?: string;
      install: boolean;
    },
  ): Promise<void> {
    const dir = directory
      ? isAbsolute(directory)
        ? directory
        : resolve(process.cwd(), directory)
      : process.cwd();

    const name = options.name ?? basename(dir);
    const fs = this.createFileSystem();
    const mode =
      (options.mode as InitMode | undefined) ??
      this.detectMode(dir, fs.exists.bind(fs));

    const engine = new InitTemplateEngine(fs);
    const result = engine.generate({ dir, name, mode });

    for (const file of result.created) {
      console.log(chalk.green('✔') + ` Created ${file}`);
    }
    for (const file of result.skipped) {
      console.log(chalk.yellow('⚠') + ` Skipped ${file} (already exists)`);
    }
    for (const file of result.merged) {
      console.log(chalk.cyan('↪') + ` Merged  ${file}`);
    }

    if (options.install) {
      const pm =
        (options.packageManager as PackageManager | undefined) ??
        this.detectPackageManager(dir, fs.exists.bind(fs));
      console.log(`  Running ${pm} install...`);
      this.installPackages(dir, pm);
    }

    console.log(chalk.green('✔') + " Done. Run 'cdkx synth' to get started.");
  }
}

export const initCommand = InitCommand.create();
