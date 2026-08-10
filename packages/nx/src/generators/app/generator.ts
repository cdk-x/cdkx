import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  names,
  runTasksInSerial,
  updateJson,
  type GeneratorCallback,
  type Tree,
} from '@nx/devkit';
import { libraryGenerator as jsLibraryGenerator } from '@nx/js';
import * as path from 'node:path';

import { CDK_X_CORE_VERSION } from '../../internal/cdk-x-core-version';
import { PnpmWorkspace } from '../../internal/pnpm-workspace';
import type { AppGeneratorSchema } from './schema';

const NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Scaffolds the minimum needed to have a runnable cdkx app: a
 * `src/index.ts` entry, a `src/main.ts` that builds an `App`/`Stack` and
 * calls `.synth()`, ready to run via the `synth` Nx target this plugin
 * infers automatically once `src/main.ts` exists (see
 * `plugins/jsii/create-nodes.ts`).
 *
 * Unlike `library`/`provider`, `directory` is a first-class option instead
 * of being hardcoded to `packages/<name>` - an app isn't jsii-published, so
 * it isn't tied to this workspace's `packages/` convention (e.g. a
 * root-level app, or one under `infra/<name>`).
 *
 * @param tree - the Nx virtual file system to scaffold into.
 * @param options - generator options (see {@link AppGeneratorSchema}).
 * @returns a task that installs dependencies once the tree is flushed to disk.
 */
export async function appGenerator(
  tree: Tree,
  options: AppGeneratorSchema,
): Promise<GeneratorCallback> {
  const projectRoot = options.directory.replace(/\/+$/, '');
  if (tree.exists(projectRoot)) {
    throw new Error(`A project already exists at ${projectRoot}.`);
  }

  const name = options.name ?? path.basename(projectRoot);
  if (!NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid app name "${name}": must be kebab-case (e.g. "widget", "my-widget").`,
    );
  }

  const { className, fileName } = names(name);
  const description = options.description ?? `${className} cdkx app.`;

  // Unlike library/provider, directory isn't fixed to packages/<name> (see
  // the class doc above) - pnpm won't link @cdk-x/core into a project
  // outside pnpm-workspace.yaml's packages: globs, so make sure it's
  // covered before jsLibraryGenerator's installPackagesTask below runs a
  // real `pnpm install`.
  PnpmWorkspace.ensureIncluded(tree, projectRoot);

  const libraryTask = await jsLibraryGenerator(tree, {
    directory: projectRoot,
    name,
    publishable: false,
    bundler: 'none',
    unitTestRunner: 'none',
    linter: 'eslint',
    useProjectJson: true,
    testEnvironment: 'node',
  });

  // @nx/js:library always scaffolds a flat src/lib/<name>.ts and a
  // README.md - neither applies to an app (main.ts is a script, not a
  // class, so the src/lib/<name>/<name>.ts module layout doesn't apply
  // either; a generated README has nothing project-specific to say yet).
  tree.delete(path.join(projectRoot, 'src/lib'));
  tree.delete(path.join(projectRoot, 'README.md'));

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, {
    name,
    fileName,
    className,
    description,
  });

  updateJson(tree, path.join(projectRoot, 'package.json'), (json) => {
    json.description = description;
    json.dependencies = {
      ...json.dependencies,
      '@cdk-x/core': CDK_X_CORE_VERSION,
    };
    return json;
  });

  updateJson(tree, path.join(projectRoot, 'project.json'), (json) => {
    json.projectType = 'application';
    json.tags = [...(json.tags ?? []), 'app'];
    return json;
  });

  await formatFiles(tree);

  return runTasksInSerial(libraryTask, () => installPackagesTask(tree));
}

export default appGenerator;
