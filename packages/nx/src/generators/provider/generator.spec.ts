import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readJson, type Tree } from '@nx/devkit';

import { providerGenerator } from './generator';

// See library/generator.spec.ts for why prettier needs stubbing under this
// Jest/SWC setup.
jest.mock('prettier', () => ({}));

describe('provider generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('delegates to the library generator for the base scaffold', async () => {
    await providerGenerator(tree, {
      name: 'github',
      providerName: 'GitHub',
      apiVersion: 'github.cdk-x.com/v1',
    });

    expect(tree.exists('packages/github/src/lib/github/github.ts')).toBe(true);
    expect(tree.exists('packages/github/src/index.ts')).toBe(true);
    expect(readJson(tree, 'packages/github/package.json').jsii).toBeDefined();
  });

  it('defaults the description from providerName when none is given', async () => {
    await providerGenerator(tree, {
      name: 'github',
      providerName: 'GitHub',
      apiVersion: 'github.cdk-x.com/v1',
    });

    expect(readJson(tree, 'packages/github/package.json').description).toBe(
      'GitHub L1 constructs, generated from its JSON Schema.',
    );
  });

  it('honors an explicit description over the providerName default', async () => {
    await providerGenerator(tree, {
      name: 'github',
      providerName: 'GitHub',
      apiVersion: 'github.cdk-x.com/v1',
      description: 'Custom description.',
    });

    expect(readJson(tree, 'packages/github/package.json').description).toBe(
      'Custom description.',
    );
  });

  it('scaffolds a plain schemas/ directory, not a versioned schemas/v1/ subfolder', async () => {
    await providerGenerator(tree, {
      name: 'github',
      providerName: 'GitHub',
      apiVersion: 'github.cdk-x.com/v1',
    });

    expect(tree.exists('packages/github/schemas/.gitkeep')).toBe(true);
    expect(tree.exists('packages/github/schemas/v1')).toBe(false);
  });

  it('adds a generate-l1 target pre-filled with apiVersion and an empty schemas array', async () => {
    await providerGenerator(tree, {
      name: 'github',
      providerName: 'GitHub',
      apiVersion: 'github.cdk-x.com/v1',
    });

    const target = readJson(tree, 'packages/github/project.json').targets[
      'generate-l1'
    ];
    expect(target.executor).toBe('@cdk-x/nx:generate-l1');
    expect(target.options).toEqual({
      apiVersion: 'github.cdk-x.com/v1',
      schemas: [],
    });
    expect(target.inputs).toEqual(['{projectRoot}/schemas/**/*']);
    expect(target.outputs).toEqual(['{projectRoot}/src/lib/generated']);
    expect(target.cache).toBe(true);
  });

  it('adds @cdk-x/core and constructs as dependencies, since every generated L1 class needs them', async () => {
    await providerGenerator(tree, {
      name: 'github',
      providerName: 'GitHub',
      apiVersion: 'github.cdk-x.com/v1',
    });

    const packageJson = readJson(tree, 'packages/github/package.json');
    expect(packageJson.dependencies['@cdk-x/core']).toBe('^1.0.0-alpha.3');
    expect(packageJson.dependencies.constructs).toBe('^10.8.0');
    expect(packageJson.peerDependencies['@cdk-x/core']).toBe('^1.0.0-alpha.3');
    expect(packageJson.peerDependencies.constructs).toBe('^10.8.0');
    expect(packageJson.devDependencies.constructs).toBe('10.8.0');
  });

  it("does not wire generate-l1 into build's dependsOn", async () => {
    await providerGenerator(tree, {
      name: 'github',
      providerName: 'GitHub',
      apiVersion: 'github.cdk-x.com/v1',
    });

    const targets = readJson(tree, 'packages/github/project.json').targets;
    const buildDependsOn: string[] = targets.build?.dependsOn ?? [];
    expect(buildDependsOn).not.toContain('generate-l1');
  });

  it('passes languages and phase through to the library generator', async () => {
    await providerGenerator(tree, {
      name: 'github',
      providerName: 'GitHub',
      apiVersion: 'github.cdk-x.com/v1',
      languages: ['python'],
      phase: 'beta',
    });

    const packageJson = readJson(tree, 'packages/github/package.json');
    expect(Object.keys(packageJson.jsii.targets)).toEqual(['python']);
    expect(readJson(tree, 'packages/github/project.json').tags).toContain(
      'beta',
    );
  });
});
