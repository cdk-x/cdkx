import type { CreateNodesContext, CreateNodesResult } from '@nx/devkit';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createNodesV2 } from './create-nodes';

const [, createNodesFunction] = createNodesV2;

function targetNamesFor(
  result: CreateNodesResult,
  projectRoot: string,
): string[] {
  const project = result.projects?.[projectRoot];
  if (!project?.targets) {
    throw new Error(`Expected inferred targets for "${projectRoot}".`);
  }
  return Object.keys(project.targets);
}

describe('createNodesV2 (jsii)', () => {
  let workspaceRoot: string;

  beforeEach(() => {
    workspaceRoot = mkdtempSync(join(tmpdir(), 'cdkx-nx-create-nodes-'));
  });

  afterEach(() => {
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  function writePackageJson(
    relativeDir: string,
    content: Record<string, unknown>,
  ): string {
    const dir = join(workspaceRoot, relativeDir);
    mkdirSync(dir, { recursive: true });
    const packageJsonPath = join(relativeDir, 'package.json');
    writeFileSync(
      join(workspaceRoot, packageJsonPath),
      JSON.stringify(content),
    );
    return packageJsonPath;
  }

  function context(): CreateNodesContext {
    return { workspaceRoot, nxJsonConfiguration: {} };
  }

  it('produces no project for a package.json without a jsii block', async () => {
    const path = writePackageJson('packages/plain', { name: 'plain' });

    const result = await createNodesFunction([path], undefined, context());

    expect(result).toEqual([[path, {}]]);
  });

  it('infers only the npm-related targets when jsii.targets is empty', async () => {
    const path = writePackageJson('packages/widget', {
      name: '@cdk-x/widget',
      jsii: { targets: {} },
    });

    const [, result] = (
      await createNodesFunction([path], undefined, context())
    )[0];

    const targetNames = targetNamesFor(result, 'packages/widget').sort();
    expect(targetNames).toEqual(
      [
        'build',
        'jsii-compile',
        'jsii-docs',
        'jsii-package-all',
        'jsii-package-npm',
        'jsii-publish-npm',
        'nx-release-publish',
      ].sort(),
    );
  });

  it('infers per-language targets from jsii.targets keys', async () => {
    const path = writePackageJson('packages/widget', {
      name: '@cdk-x/widget',
      jsii: { targets: { python: {}, go: {} } },
    });

    const [, result] = (
      await createNodesFunction([path], undefined, context())
    )[0];

    const targetNames = targetNamesFor(result, 'packages/widget');
    expect(targetNames).toEqual(
      expect.arrayContaining([
        'jsii-package-python',
        'jsii-publish-python',
        'jsii-package-go',
        'jsii-publish-go',
      ]),
    );
    expect(targetNames).not.toEqual(
      expect.arrayContaining(['jsii-package-java', 'jsii-package-dotnet']),
    );
  });

  it('skips package.json files under node_modules', async () => {
    const path = writePackageJson('node_modules/some-dep', {
      name: 'some-dep',
      jsii: { targets: {} },
    });

    const result = await createNodesFunction([path], undefined, context());

    expect(result).toEqual([[path, {}]]);
  });
});
