import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readJson, type Tree } from '@nx/devkit';

import { libraryGenerator } from './generator';

// @nx/js's underlying init generator ensures prettier is requireable via
// @nx/devkit's ensurePackage('prettier', ...), whose return value it never
// actually uses. Under this Jest/SWC setup, prettier 3.x's own CJS
// entrypoint schedules an internal dynamic import that Jest's module loader
// rejects, surfacing as an unhandled rejection Jest attributes to whichever
// test happens to be running - unrelated to the generator's own behavior.
// Stub the module out so ensurePackage's require('prettier') never touches
// prettier's real, problematic entrypoint.
jest.mock('prettier', () => ({}));

describe('library generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('scaffolds the module-layout files under src/lib/<name>/', async () => {
    await libraryGenerator(tree, { name: 'widget' });

    expect(tree.exists('packages/widget/src/lib/widget/widget.ts')).toBe(true);
    expect(tree.exists('packages/widget/src/lib/widget/widget.spec.ts')).toBe(
      true,
    );
    expect(tree.exists('packages/widget/src/index.ts')).toBe(true);
    // @nx/js:library's default flat placeholder must be gone.
    expect(tree.exists('packages/widget/src/lib/widget.ts')).toBe(false);
  });

  it('includes only the requested jsii target languages, with npm always implicit', async () => {
    await libraryGenerator(tree, { name: 'widget', languages: ['python'] });

    const packageJson = readJson(tree, 'packages/widget/package.json');
    expect(Object.keys(packageJson.jsii.targets)).toEqual(['python']);
    expect(packageJson.jsii.targets.python).toEqual({
      distName: 'cdkx-widget',
      module: 'cdkx.widget',
    });
  });

  it('defaults to all four additional jsii target languages', async () => {
    await libraryGenerator(tree, { name: 'widget' });

    const packageJson = readJson(tree, 'packages/widget/package.json');
    expect(Object.keys(packageJson.jsii.targets).sort()).toEqual([
      'dotnet',
      'go',
      'java',
      'python',
    ]);
  });

  it('derives java/dotnet/go naming from the library name', async () => {
    await libraryGenerator(tree, { name: 'my-widget' });

    const packageJson = readJson(tree, 'packages/my-widget/package.json');
    expect(packageJson.jsii.targets.java).toEqual({
      package: 'com.cdkx.mywidget',
      maven: { groupId: 'com.cdk-x', artifactId: 'cdkx-my-widget' },
    });
    expect(packageJson.jsii.targets.dotnet).toEqual({
      namespace: 'CdkX.MyWidget',
      packageId: 'CdkX.MyWidget',
    });
    expect(packageJson.jsii.targets.go).toEqual({
      moduleName: 'github.com/cdk-x/cdkx-my-widget-go',
    });
  });

  it('scopes package.json exports/files/jsii block consistently with packages/core', async () => {
    await libraryGenerator(tree, { name: 'widget', languages: [] });

    const packageJson = readJson(tree, 'packages/widget/package.json');
    expect(packageJson.type).toBe('module');
    expect(packageJson.exports['.']).toEqual({
      '@cdk-x/cdkx': './src/index.ts',
      types: './dist/index.d.ts',
      import: './dist/index.js',
      default: './dist/index.js',
    });
    expect(packageJson.files).toEqual(['dist', '.jsii', '!**/*.tsbuildinfo']);
    expect(packageJson.jsii.outdir).toBe('dist-jsii');
    expect(packageJson.jsii.targets).toEqual({});
  });

  it('bundles tslib so jsii does not reject it as a non-jsii dependency', async () => {
    await libraryGenerator(tree, { name: 'widget' });

    const packageJson = readJson(tree, 'packages/widget/package.json');
    expect(packageJson.dependencies.tslib).toBeDefined();
    expect(packageJson.bundledDependencies).toEqual(['tslib']);
  });

  it('does not write any jsii-* targets into project.json - those are inferred', async () => {
    await libraryGenerator(tree, { name: 'widget' });

    const projectJson = readJson(tree, 'packages/widget/project.json');
    const targetNames = Object.keys(projectJson.targets ?? {});
    expect(targetNames.some((t) => t.startsWith('jsii-'))).toBe(false);
  });

  it('tags the project "jsii" so release.groups routes it to the jsii publish pipeline', async () => {
    await libraryGenerator(tree, { name: 'widget' });

    expect(readJson(tree, 'packages/widget/project.json').tags).toContain(
      'jsii',
    );
  });

  it('tags the project with its release phase, defaulting to alpha', async () => {
    await libraryGenerator(tree, { name: 'widget' });
    expect(readJson(tree, 'packages/widget/project.json').tags).toContain(
      'alpha',
    );

    await libraryGenerator(tree, { name: 'stable-widget', phase: 'stable' });
    expect(
      readJson(tree, 'packages/stable-widget/project.json').tags,
    ).toContain('stable');
  });

  // Three full libraryGenerator runs in one test - occasionally exceeds
  // Jest's default 5000ms under CI load, unlike its single/double-run
  // neighbors in this file, hence the explicit longer timeout below.
  it('sets package.json stability from the release phase: stable stays stable, everything else is experimental', async () => {
    await libraryGenerator(tree, { name: 'widget' });
    expect(readJson(tree, 'packages/widget/package.json').stability).toBe(
      'experimental',
    );

    await libraryGenerator(tree, { name: 'beta-widget', phase: 'beta' });
    expect(readJson(tree, 'packages/beta-widget/package.json').stability).toBe(
      'experimental',
    );

    await libraryGenerator(tree, { name: 'stable-widget', phase: 'stable' });
    expect(
      readJson(tree, 'packages/stable-widget/package.json').stability,
    ).toBe('stable');
  }, 15000);

  it('rejects non-kebab-case names', async () => {
    await expect(libraryGenerator(tree, { name: 'MyWidget' })).rejects.toThrow(
      /kebab-case/,
    );
  });

  it('rejects a name that already exists', async () => {
    await libraryGenerator(tree, { name: 'widget' });
    await expect(libraryGenerator(tree, { name: 'widget' })).rejects.toThrow(
      /already exists/,
    );
  });
});
