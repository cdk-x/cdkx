import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import type { Tree } from '@nx/devkit';

import { PnpmWorkspace } from './pnpm-workspace';

describe('PnpmWorkspace', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(
      'pnpm-workspace.yaml',
      ['packages:', "  - 'packages/*'", 'linkWorkspacePackages: true', ''].join(
        '\n',
      ),
    );
  });

  it('is a no-op when the directory is already covered by a packages/* glob', () => {
    const before = tree.read('pnpm-workspace.yaml', 'utf-8');

    PnpmWorkspace.ensureIncluded(tree, 'packages/my-app');

    expect(tree.read('pnpm-workspace.yaml', 'utf-8')).toBe(before);
  });

  it('is a no-op when the directory is already listed verbatim', () => {
    tree.write(
      'pnpm-workspace.yaml',
      ['packages:', "  - 'packages/*'", "  - 'cdkx'", ''].join('\n'),
    );
    const before = tree.read('pnpm-workspace.yaml', 'utf-8');

    PnpmWorkspace.ensureIncluded(tree, 'cdkx');

    expect(tree.read('pnpm-workspace.yaml', 'utf-8')).toBe(before);
  });

  it('adds a root-level directory not covered by any existing glob', () => {
    PnpmWorkspace.ensureIncluded(tree, 'cdkx');

    const content = tree.read('pnpm-workspace.yaml', 'utf-8');
    expect(content).toContain("  - 'cdkx'");
    // Inserted into the packages: list, above the unrelated top-level key.
    expect(content?.indexOf("- 'cdkx'")).toBeLessThan(
      content?.indexOf('linkWorkspacePackages') ?? Infinity,
    );
  });

  it('adds a nested directory not covered by any existing glob', () => {
    PnpmWorkspace.ensureIncluded(tree, 'infra/my-infra');

    expect(tree.read('pnpm-workspace.yaml', 'utf-8')).toContain(
      "  - 'infra/my-infra'",
    );
  });

  it('does nothing when there is no pnpm-workspace.yaml', () => {
    tree.delete('pnpm-workspace.yaml');

    expect(() => PnpmWorkspace.ensureIncluded(tree, 'cdkx')).not.toThrow();
    expect(tree.exists('pnpm-workspace.yaml')).toBe(false);
  });
});
