import {
  createNodesFromFiles,
  readJsonFile,
  type CreateNodesContext,
  type CreateNodesResult,
  type CreateNodesV2,
  type TargetConfiguration,
} from '@nx/devkit';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { JsiiTargetLanguage } from '../../internal/jsii-languages';
import { JsiiTargetsFactory } from './jsii-targets-factory';

const packageJsonGlob = '**/package.json';

/**
 * Infers this workspace's cdkx-specific Nx targets for every project,
 * computed dynamically from what's actually on disk rather than written
 * statically by a generator at scaffold time - so changing a project's
 * setup by hand takes effect immediately, with no need to re-run any
 * generator:
 *  - `jsii-*` targets for every project whose `package.json` has a
 *    top-level `jsii` block, driven by that block's `jsii.targets`
 *    languages (see `@cdk-x/nx:library`).
 *  - a `synth` target for every project with a `src/main.ts` entry file
 *    (see `@cdk-x/nx:app`).
 * Register in `nx.json`'s `"plugins"` array as `"@cdk-x/nx"`.
 */
export const createNodesV2: CreateNodesV2 = [
  packageJsonGlob,
  (packageJsonPaths, options, context) =>
    createNodesFromFiles(
      createCdkxProjectNode,
      packageJsonPaths,
      options,
      context,
    ),
];

function createCdkxProjectNode(
  packageJsonPath: string,
  _options: unknown,
  context: CreateNodesContext,
): CreateNodesResult {
  if (packageJsonPath.includes('node_modules/')) {
    return {};
  }

  const projectRoot = dirname(packageJsonPath);
  const packageJson = readJsonFile(
    join(context.workspaceRoot, packageJsonPath),
  );

  const targets: Record<string, TargetConfiguration> = {};

  if (packageJson.jsii) {
    const additionalLanguages = Object.keys(
      packageJson.jsii.targets ?? {},
    ) as JsiiTargetLanguage[];
    Object.assign(targets, JsiiTargetsFactory.build(additionalLanguages));
  }

  if (existsSync(join(context.workspaceRoot, projectRoot, 'src/main.ts'))) {
    targets.synth = {
      executor: '@cdk-x/nx:synth',
      dependsOn: ['^build'],
      outputs: ['{projectRoot}/cdkx.out'],
      cache: true,
    };
  }

  if (Object.keys(targets).length === 0) {
    return {};
  }

  return {
    projects: {
      [projectRoot]: { targets },
    },
  };
}
