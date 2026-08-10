import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readJson, updateJson, writeJson, type Tree } from '@nx/devkit';

import { appGenerator } from './generator';

// See library/generator.spec.ts for why prettier needs stubbing under this
// Jest/SWC setup.
jest.mock('prettier', () => ({}));

describe('app generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // @nx/js:library (bundler: 'none') only keeps the scaffolded
    // package.json when the tree looks like a "TS solution setup" -
    // otherwise it deletes it outright. createTreeWithEmptyWorkspace()'s
    // default fixture doesn't qualify, so replicate the real workspace's
    // setup (pnpm-workspace.yaml + a composite tsconfig.base.json/
    // tsconfig.json pair) here. Also match the real root package.json's
    // "@cdk-x/cdkx" name so the derived npm scope is "@cdk-x", not the
    // devkit testing fixture's default "@proj".
    updateJson(tree, 'package.json', (json) => {
      json.name = '@cdk-x/cdkx';
      return json;
    });
    tree.write('pnpm-workspace.yaml', 'packages:\n  - packages/*\n');
    writeJson(tree, 'tsconfig.base.json', {
      compilerOptions: { composite: true, declaration: true },
    });
    writeJson(tree, 'tsconfig.json', {
      extends: './tsconfig.base.json',
      files: [],
      include: [],
      references: [],
    });
  });

  it('scaffolds src/index.ts and src/main.ts at the given directory', async () => {
    await appGenerator(tree, { directory: 'packages/my-app' });

    expect(tree.exists('packages/my-app/src/index.ts')).toBe(true);
    expect(tree.exists('packages/my-app/src/main.ts')).toBe(true);
    expect(tree.exists('packages/my-app/src/lib')).toBe(false);
    expect(tree.exists('packages/my-app/README.md')).toBe(false);

    expect(tree.read('packages/my-app/src/index.ts', 'utf-8')).toContain(
      "import './main.js';",
    );
    const main = tree.read('packages/my-app/src/main.ts', 'utf-8');
    expect(main).toContain("import { App, Stack } from '@cdk-x/core';");
    expect(main).toContain("new Stack(app, 'MyAppStack');");
    expect(main).toContain('app.synth();');
  });

  it('is not tied to packages/<name> - any directory works', async () => {
    await appGenerator(tree, { directory: 'infra/my-infra' });

    expect(tree.exists('infra/my-infra/src/main.ts')).toBe(true);
    expect(readJson(tree, 'infra/my-infra/package.json').name).toBe(
      '@cdk-x/my-infra',
    );
  });

  it('adds a directory outside packages/* to pnpm-workspace.yaml', async () => {
    await appGenerator(tree, { directory: 'infra/my-infra' });

    expect(tree.read('pnpm-workspace.yaml', 'utf-8')).toContain(
      "  - 'infra/my-infra'",
    );
  });

  it('does not duplicate a pnpm-workspace.yaml entry already covered by packages/*', async () => {
    await appGenerator(tree, { directory: 'packages/my-app' });

    const content = tree.read('pnpm-workspace.yaml', 'utf-8') ?? '';
    expect(content.match(/packages\/\*/g)?.length).toBe(1);
  });

  it('derives the app name from the last path segment of directory by default', async () => {
    await appGenerator(tree, { directory: 'packages/widget' });

    expect(readJson(tree, 'packages/widget/package.json').name).toBe(
      '@cdk-x/widget',
    );
  });

  it('honors an explicit name distinct from the directory basename', async () => {
    await appGenerator(tree, { directory: 'cdkx', name: 'cdkx-app' });

    expect(readJson(tree, 'cdkx/package.json').name).toBe('@cdk-x/cdkx-app');
  });

  it('adds @cdk-x/core as a dependency', async () => {
    await appGenerator(tree, { directory: 'packages/my-app' });

    expect(
      readJson(tree, 'packages/my-app/package.json').dependencies[
        '@cdk-x/core'
      ],
    ).toBeDefined();
  });

  it('marks the project as an application, not a library', async () => {
    await appGenerator(tree, { directory: 'packages/my-app' });

    const projectJson = readJson(tree, 'packages/my-app/project.json');
    expect(projectJson.projectType).toBe('application');
    expect(projectJson.tags).toContain('app');
  });

  it('does not write a jsii block - apps are not jsii-published', async () => {
    await appGenerator(tree, { directory: 'packages/my-app' });

    expect(readJson(tree, 'packages/my-app/package.json').jsii).toBeUndefined();
  });

  it('rejects a non-kebab-case name', async () => {
    await expect(
      appGenerator(tree, { directory: 'packages/MyApp' }),
    ).rejects.toThrow(/kebab-case/);
  });

  it('rejects a directory that already exists', async () => {
    await appGenerator(tree, { directory: 'packages/my-app' });
    await expect(
      appGenerator(tree, { directory: 'packages/my-app' }),
    ).rejects.toThrow(/already exists/);
  });
});
