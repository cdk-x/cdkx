import type { Tree } from '@nx/devkit';
import * as path from 'node:path';

/**
 * Minimal `pnpm-workspace.yaml` `packages:` list editor - handles exactly
 * the shape this workspace's `pnpm-workspace.yaml` uses (a flat list of
 * glob strings under a top-level `packages:` key), not general YAML. Only
 * needed by generators that scaffold outside the `packages/*` glob every
 * other project already lives under (see `@cdk-x/nx:app`'s `directory`
 * option).
 */
export class PnpmWorkspace {
  private constructor() {} // no instances — static-only class

  /**
   * Adds `projectRoot` to `pnpm-workspace.yaml`'s `packages:` list, unless
   * it's already covered by an existing entry (an exact match, or a
   * `<dir>/*` glob whose `<dir>` is `projectRoot`'s parent). A no-op if the
   * tree has no `pnpm-workspace.yaml` at all.
   *
   * @param tree - the Nx virtual file system to edit.
   * @param projectRoot - the project directory to ensure is included,
   * relative to the workspace root (e.g. `"cdkx"`, `"infra/my-infra"`).
   * @example
   * PnpmWorkspace.ensureIncluded(tree, 'infra/my-infra');
   */
  public static ensureIncluded(tree: Tree, projectRoot: string): void {
    if (!tree.exists('pnpm-workspace.yaml')) {
      return;
    }

    const lines = (tree.read('pnpm-workspace.yaml', 'utf-8') ?? '').split('\n');
    const packagesLine = lines.findIndex((line) => /^packages:\s*$/.test(line));
    if (packagesLine === -1) {
      throw new Error(
        `pnpm-workspace.yaml has no top-level "packages:" list to add "${projectRoot}" to.`,
      );
    }

    let insertAt = packagesLine + 1;
    const entries: string[] = [];
    while (insertAt < lines.length) {
      const match = lines[insertAt].match(/^\s*-\s*['"]?([^'"]+?)['"]?\s*$/);
      if (!match) break;
      entries.push(match[1]);
      insertAt++;
    }

    if (PnpmWorkspace.isCovered(entries, projectRoot)) {
      return;
    }

    lines.splice(insertAt, 0, `  - '${projectRoot}'`);
    tree.write('pnpm-workspace.yaml', lines.join('\n'));
  }

  private static isCovered(entries: string[], projectRoot: string): boolean {
    return entries.some((entry) => {
      if (entry === projectRoot) {
        return true;
      }
      if (entry.endsWith('/*')) {
        return path.posix.dirname(projectRoot) === entry.slice(0, -2);
      }
      return false;
    });
  }
}
