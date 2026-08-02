import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  logger,
  names,
  runTasksInSerial,
  updateJson,
  type GeneratorCallback,
  type Tree,
} from '@nx/devkit';
import { libraryGenerator as jsLibraryGenerator } from '@nx/js';
import * as path from 'node:path';
import { JsiiTargetsBuilder } from './jsii-targets-builder';
import type { JsiiLanguage, LibraryGeneratorSchema } from './schema';

const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const DEFAULT_LANGUAGES: JsiiLanguage[] = ['python', 'java', 'dotnet', 'go'];

/**
 * Scaffolds a new `@cdk-x/<name>` jsii-enabled TypeScript library.
 *
 * Delegates the base project scaffold to `@nx/js`'s `libraryGenerator`, then
 * replaces its flat `src/lib/<name>.ts` with the `src/lib/<name>/<name>.ts`
 * module layout this workspace follows, and patches `package.json` with an
 * inline `jsii` block scoped to the requested target languages.
 *
 * `jsii-*` build/package/publish targets are deliberately NOT written here —
 * they are computed dynamically by this plugin's `createNodesV2` inference
 * once `@cdk-x/nx` is registered in the workspace's `nx.json`.
 *
 * @param tree - the Nx virtual file system to scaffold into.
 * @param options - generator options (see {@link LibraryGeneratorSchema}).
 * @returns a task that installs dependencies once the tree is flushed to disk.
 */
export async function libraryGenerator(
  tree: Tree,
  options: LibraryGeneratorSchema,
): Promise<GeneratorCallback> {
  if (!NAME_PATTERN.test(options.name)) {
    throw new Error(
      `Invalid library name "${options.name}": must be kebab-case (e.g. "widget", "my-widget").`,
    );
  }

  const projectRoot = `packages/${options.name}`;
  if (tree.exists(projectRoot)) {
    throw new Error(
      `Library "${options.name}" already exists at ${projectRoot}.`,
    );
  }

  const languages = options.languages ?? DEFAULT_LANGUAGES;
  const phase = options.phase ?? 'alpha';
  const { className, fileName } = names(options.name);
  const description =
    options.description ??
    `${className} construct library for the cdk-x family.`;

  const libraryTask = await jsLibraryGenerator(tree, {
    directory: projectRoot,
    publishable: true,
    importPath: `@cdk-x/${options.name}`,
    bundler: 'tsc',
    unitTestRunner: 'jest',
    linter: 'eslint',
    useProjectJson: true,
    testEnvironment: 'node',
  });

  // @nx/js:library always scaffolds a flat src/lib/<name>.ts — replace it
  // with this workspace's src/lib/<name>/<name>.ts layout (see CLAUDE.md).
  tree.delete(path.join(projectRoot, 'src/lib'));

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    name: options.name,
    fileName,
    className,
    description,
  });

  updateJson(tree, path.join(projectRoot, 'package.json'), (json) => {
    json.type = 'module';
    json.description = description;
    json.main = './dist/index.js';
    json.module = './dist/index.js';
    json.types = './dist/index.d.ts';
    json.exports = {
      './package.json': './package.json',
      '.': {
        '@cdk-x/cdkx': './src/index.ts',
        types: './dist/index.d.ts',
        import: './dist/index.js',
        default: './dist/index.js',
      },
    };
    json.files = ['dist', '.jsii', '!**/*.tsbuildinfo'];
    // @nx/js:library adds tslib as a plain dependency (tsconfig.base.json
    // has importHelpers: true), but jsii requires every dependency to be
    // either jsii-enabled or bundled - bundle it, same as packages/core
    // bundles @swc/helpers.
    json.bundledDependencies = ['tslib'];
    json.author = { name: 'cdk-x', organization: true };
    json.repository = {
      type: 'git',
      url: 'https://github.com/cdk-x/cdkx.git',
      directory: projectRoot,
    };
    json.license = 'MIT';
    json.keywords = ['cdkx', 'cdk', 'constructs'];
    json.jsii = {
      outdir: 'dist-jsii',
      excludeTypescript: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
      targets: JsiiTargetsBuilder.build(options.name, className, languages),
      tsc: {
        rootDir: 'src',
        outDir: 'dist',
        forceConsistentCasingInFileNames: true,
        types: ['node'],
      },
    };
    return json;
  });

  // No jsii-* targets written here on purpose - @cdk-x/nx's createNodesV2
  // infers them from the `jsii` block above once registered in nx.json. The
  // "jsii" tag (not an auto-derived "npm:*" one) is what nx.json's
  // release.groups uses to route this project to the jsii publish pipeline
  // vs the plain `nx release publish` one. The "phase-<phase>" tag is what
  // tools/release-version.mjs/validate-release-phase.mjs use to batch/gate
  // by release phase without a per-project field.
  updateJson(tree, path.join(projectRoot, 'project.json'), (json) => {
    json.tags = [...(json.tags ?? []), 'jsii', `phase-${phase}`];
    return json;
  });

  if (languages.includes('go')) {
    logger.warn(
      `"${options.name}" targets Go - before running its jsii-publish-go target, create the ` +
        `dedicated repository github.com/cdk-x/cdkx-${options.name}-go. ` +
        `See CONTRIBUTING.md ("Publishing Go bindings") for the exact steps.`,
    );
  }

  await formatFiles(tree);

  return runTasksInSerial(libraryTask, () => installPackagesTask(tree));
}

export default libraryGenerator;
