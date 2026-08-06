import {
  formatFiles,
  updateJson,
  type GeneratorCallback,
  type Tree,
} from '@nx/devkit';
import * as path from 'node:path';
import { libraryGenerator } from '../library/generator';
import type { ProviderGeneratorSchema } from './schema';

/**
 * Scaffolds a new `@cdk-x/<name>` provider library: a jsii-enabled library
 * (delegating to `@cdk-x/nx:library`, the same way that generator itself
 * delegates to `@nx/js`'s), plus a plain `schemas/` directory for vendored
 * JSON Schema files and an initially-empty `generate-l1` target — ready to
 * fill in once a real schema is vendored.
 *
 * Deliberately no `schemas/v1/` versioned subfolder and no hand-authored
 * intermediate schema format — the file(s) under `schemas/` are meant to be
 * the real upstream provider schema, vendored byte-identical.
 *
 * @param tree - the Nx virtual file system to scaffold into.
 * @param options - generator options (see {@link ProviderGeneratorSchema}).
 * @returns a task that installs dependencies once the tree is flushed to disk.
 */
export async function providerGenerator(
  tree: Tree,
  options: ProviderGeneratorSchema,
): Promise<GeneratorCallback> {
  const projectRoot = `packages/${options.name}`;

  const libraryTask = await libraryGenerator(tree, {
    name: options.name,
    description:
      options.description ??
      `${options.providerName} L1 constructs, generated from its JSON Schema.`,
    languages: options.languages,
    phase: options.phase,
  });

  tree.write(path.join(projectRoot, 'schemas/.gitkeep'), '');

  // Not wired into build's dependsOn on purpose - generated output is
  // committed to git and regenerated on demand, matching this workspace's
  // existing pattern for anything codegen-derived.
  updateJson(tree, path.join(projectRoot, 'project.json'), (json) => {
    json.targets = {
      ...json.targets,
      'generate-l1': {
        executor: '@cdk-x/nx:generate-l1',
        inputs: ['{projectRoot}/schemas/**/*'],
        outputs: ['{projectRoot}/src/lib/generated'],
        cache: true,
        options: {
          apiVersion: options.apiVersion,
          schemas: [],
        },
      },
    };
    return json;
  });

  await formatFiles(tree);

  return libraryTask;
}

export default providerGenerator;
