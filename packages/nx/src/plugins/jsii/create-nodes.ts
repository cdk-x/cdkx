import {
  createNodesFromFiles,
  readJsonFile,
  type CreateNodesContext,
  type CreateNodesResult,
  type CreateNodesV2,
} from '@nx/devkit';
import { dirname, join } from 'node:path';

import type { JsiiTargetLanguage } from '../../internal/jsii-languages';
import { JsiiTargetsFactory } from './jsii-targets-factory';

const packageJsonGlob = '**/package.json';

/**
 * Infers `jsii-*` Nx targets for every project whose `package.json` has a
 * top-level `jsii` block, computed dynamically from that block's
 * `jsii.targets` languages rather than written statically by
 * `@cdk-x/nx:library` at generation time - so changing a project's target
 * languages by hand takes effect immediately, with no need to re-run the
 * generator. Register in `nx.json`'s `"plugins"` array as `"@cdk-x/nx"`.
 */
export const createNodesV2: CreateNodesV2 = [
  packageJsonGlob,
  (packageJsonPaths, options, context) =>
    createNodesFromFiles(
      createJsiiProjectNode,
      packageJsonPaths,
      options,
      context,
    ),
];

function createJsiiProjectNode(
  packageJsonPath: string,
  _options: unknown,
  context: CreateNodesContext,
): CreateNodesResult {
  if (packageJsonPath.includes('node_modules/')) {
    return {};
  }

  const packageJson = readJsonFile(
    join(context.workspaceRoot, packageJsonPath),
  );
  if (!packageJson.jsii) {
    return {};
  }

  const additionalLanguages = Object.keys(
    packageJson.jsii.targets ?? {},
  ) as JsiiTargetLanguage[];

  return {
    projects: {
      [dirname(packageJsonPath)]: {
        targets: JsiiTargetsFactory.build(additionalLanguages),
      },
    },
  };
}
