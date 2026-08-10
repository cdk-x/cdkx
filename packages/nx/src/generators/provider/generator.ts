import {
  formatFiles,
  updateJson,
  type GeneratorCallback,
  type Tree,
} from '@nx/devkit';
import * as path from 'node:path';
import {
  CDK_X_CORE_DEV_VERSION,
  CDK_X_CORE_VERSION,
} from '../../internal/cdk-x-core-version';
import { libraryGenerator } from '../library/generator';
import type { ProviderGeneratorSchema } from './schema';

// Every generated L1 Resource extends @cdk-x/core's Resource and takes a
// constructs.Construct scope - both are hard requirements of the generated
// code itself (see @cdk-x/generator-toolkit's resource-wrapper-generator),
// not something a provider library can opt out of, so they belong in the
// scaffold, not left for each provider to add by hand.
const CONSTRUCTS_VERSION = '^10.8.0';
const CONSTRUCTS_DEV_VERSION = '10.8.0';
// Unlike npm, NuGet/PyPI/Maven/Go have no local-workspace-linking
// equivalent: a provider's jsii-package-{dotnet,python,java,go} targets
// always resolve CDK_X_CORE_VERSION against the real registries, so it must
// match an actually-published @cdk-x/core version, not an arbitrary floor -
// an old-but-technically-matching version (e.g. the very first alpha) would
// resolve to genuinely stale bindings and fail to compile against freshly
// generated L1 code.

/**
 * Scaffolds a new `@cdk-x/<name>` provider library: a jsii-enabled library
 * (delegating to `@cdk-x/nx:library`, the same way that generator itself
 * delegates to `@nx/js`'s), plus a plain `schemas/` directory for vendored
 * JSON Schema files and an initially-empty `generate-l1` target — ready to
 * fill in once a real schema is vendored. Also adds `@cdk-x/core` and
 * `constructs` as dependencies (both also as peer and dev dependencies) —
 * every generated L1 class extends `Resource` and takes a `Construct`
 * scope, so these are always needed, not something to add by hand per
 * provider. Both must be peer dependencies too: jsii requires any type
 * exposed in a module's public API (here, every generated class's base
 * class) to come from a peer, not a bundled, dependency.
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

  updateJson(tree, path.join(projectRoot, 'package.json'), (json) => {
    json.dependencies = {
      ...json.dependencies,
      '@cdk-x/core': CDK_X_CORE_VERSION,
      constructs: CONSTRUCTS_VERSION,
    };
    json.peerDependencies = {
      ...json.peerDependencies,
      '@cdk-x/core': CDK_X_CORE_VERSION,
      constructs: CONSTRUCTS_VERSION,
    };
    json.devDependencies = {
      ...json.devDependencies,
      '@cdk-x/core': CDK_X_CORE_DEV_VERSION,
      constructs: CONSTRUCTS_DEV_VERSION,
    };
    return json;
  });

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
