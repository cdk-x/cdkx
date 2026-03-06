import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { BaseCommand } from '../../lib/base-command.js';
import { SchemaReader } from '../../lib/schema-reader.js';
import { CodeGenerator } from '../../lib/code-generator.js';
import { RegistryGenerator } from '../../lib/registry-generator.js';

// ---------------------------------------------------------------------------
// Deps interface (for testing)
// ---------------------------------------------------------------------------

/** Injectable dependencies for {@link GenerateCommand}. */
export interface GenerateCommandDeps {
  /** Check if a path exists. Defaults to `fs.existsSync`. */
  existsSync?: (path: string) => boolean;

  /** Read all schemas from a directory. Defaults to `SchemaReader.read`. */
  readSchemas?: typeof SchemaReader.read;

  /** Generate TypeScript source. Defaults to `CodeGenerator.generate`. */
  generateCode?: typeof CodeGenerator.generate;

  /** Generate resource registry source. Defaults to `RegistryGenerator.generate`. */
  generateRegistry?: typeof RegistryGenerator.generate;

  /** Write the output file. Defaults to `fs.writeFileSync`. */
  writeFile?: (filePath: string, content: string) => void;

  /** Log a success message. Defaults to `console.log`. */
  log?: (message: string) => void;
}

// ---------------------------------------------------------------------------
// GenerateCommand
// ---------------------------------------------------------------------------

/**
 * Implements the `spec-to-cdkx generate` command.
 *
 * Reads JSON Schema files from a `--schemas` directory and generates a single
 * TypeScript file with L1 constructs (nested interfaces, enums, props
 * interfaces, L1 classes) at `--output`.
 */
export class GenerateCommand extends BaseCommand {
  private constructor(private readonly deps: GenerateCommandDeps = {}) {
    super();
  }

  /**
   * Factory — creates a fresh `Command` with the given injectable deps.
   * Use `GenerateCommand.create()` in `main.ts` and tests.
   */
  public static create(deps?: GenerateCommandDeps): Command {
    return new GenerateCommand(deps).build();
  }

  /** @inheritdoc */
  public build(): Command {
    return new Command('generate')
      .description('Generate TypeScript L1 constructs from JSON Schema files')
      .requiredOption(
        '--prefix <prefix>',
        'L1 class prefix, e.g. "Htz" → HtzNetwork',
      )
      .requiredOption(
        '--provider-name <name>',
        'Human-readable provider name for JSDoc, e.g. "Hetzner"',
      )
      .requiredOption(
        '--resource-type-const <name>',
        'Name of the generated ResourceType constant, e.g. "HetznerResourceType"',
      )
      .option('-s, --schemas <dir>', 'Path to schemas directory', 'schemas/v1')
      .option(
        '-o, --output <file>',
        'Output file path',
        'src/lib/generated/resources.generated.ts',
      )
      .option(
        '--registry-output <file>',
        'Output file path for the resource registry (optional)',
      )
      .action(
        async (options: {
          prefix: string;
          providerName: string;
          resourceTypeConst: string;
          schemas: string;
          output: string;
          registryOutput?: string;
        }) => {
          await this.run(() => this.execute(options));
        },
      );
  }

  private async execute(options: {
    prefix: string;
    providerName: string;
    resourceTypeConst: string;
    schemas: string;
    output: string;
    registryOutput?: string;
  }): Promise<void> {
    const existsSync = this.deps.existsSync ?? fs.existsSync;
    const readSchemas = this.deps.readSchemas ?? SchemaReader.read;
    const generateCode = this.deps.generateCode ?? CodeGenerator.generate;
    const generateRegistry =
      this.deps.generateRegistry ?? RegistryGenerator.generate;
    const writeFile =
      this.deps.writeFile ??
      ((filePath: string, content: string) =>
        fs.writeFileSync(filePath, content, 'utf-8'));
    const log = this.deps.log ?? console.log;

    // Resolve schemas directory relative to cwd.
    const schemasDir = path.resolve(process.cwd(), options.schemas);
    if (!existsSync(schemasDir)) {
      this.fail(
        `Schemas directory not found: ${schemasDir}\n` +
          `  Hint: pass --schemas <dir> pointing to your *.schema.json files.`,
      );
    }

    // Resolve output path relative to cwd.
    const outputFile = path.resolve(process.cwd(), options.output);

    // Ensure the output directory exists.
    const outputDir = path.dirname(outputFile);
    if (!existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read + resolve schemas.
    const resources = readSchemas(schemasDir);
    if (resources.length === 0) {
      this.fail(
        `No resource schemas found in: ${schemasDir}\n` +
          `  Make sure there are *.schema.json files with a "typeName" field.`,
      );
    }

    // Generate TypeScript source.
    const source = generateCode(resources, {
      prefix: options.prefix,
      providerName: options.providerName,
      resourceTypeConst: options.resourceTypeConst,
    });

    // Write output file.
    writeFile(outputFile, source);

    log(
      chalk.green('✔') +
        ` Generated ${resources.length} resources → ${chalk.dim(outputFile)}`,
    );

    // Optionally generate the resource registry.
    if (options.registryOutput) {
      const registryFile = path.resolve(process.cwd(), options.registryOutput);
      const registryDir = path.dirname(registryFile);
      if (!existsSync(registryDir)) {
        fs.mkdirSync(registryDir, { recursive: true });
      }

      const registrySource = generateRegistry(resources, {
        resourceTypeConst: options.resourceTypeConst,
      });
      writeFile(registryFile, registrySource);

      const registryCount = resources.filter((r) => r.api !== undefined).length;
      log(
        chalk.green('✔') +
          ` Generated registry with ${registryCount} entries → ${chalk.dim(registryFile)}`,
      );
    }
  }
}

/** Singleton — registered in `main.ts`. */
export const generateCommand = GenerateCommand.create();
