// Local Verdaccio release flow, for manual testing only - not part of the
// real release pipeline (tools/release.mjs / .github/workflows/release.yml).
// Kept as its own file rather than a mode of release.mjs: it pulls in a
// jest-tooling dependency (@nx/js/plugins/jest/local-registry) and
// orchestrates things (starting/stopping a registry, shelling out to
// jsii-publish-npm) that a real CI release never touches - bundling it into
// release.mjs would grow that script's surface/dependencies for an audience
// (local dev convenience) that's different from its actual job (real
// releases). Reuses version/publishTs/nxJson/matchesFilter from release.mjs
// rather than re-implementing them, same pattern as
// tools/validate-release-phase.mjs.
//
// Usage: node tools/release-local.mjs [--projects=<comma/space-separated names>]
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import { matchesFilter, nxJson, publishTs, version } from './release.mjs';

const LOCAL_REGISTRY = 'http://localhost:4873'; // must match project.json's local-registry target's port (4873)

// `version`/`publishTs` never commit here (no --git-commit/--git-tag passed),
// but releaseVersion/releaseChangelog still write the real version bump and
// changelog entry to disk regardless - "no commit" only means git history
// stays untouched, not that the working tree does. A local test run must
// never leave a package looking like it was actually released, so every
// touched package.json/CHANGELOG.md (and the lockfile) gets restored
// afterward - tracked files go back to their HEAD content, files that never
// existed in HEAD (e.g. a library's first-ever CHANGELOG.md) get deleted.
function existsInHead(path) {
  try {
    execFileSync('git', ['cat-file', '-e', `HEAD:${path}`], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function restore(path) {
  if (existsInHead(path)) {
    execFileSync('git', ['checkout', 'HEAD', '--', path], {
      stdio: 'inherit',
    });
    return;
  }
  try {
    execFileSync('git', ['reset', '-q', 'HEAD', '--', path], {
      stdio: 'ignore',
    });
  } catch {
    // Not staged either - nothing to unstage.
  }
  if (existsSync(path)) {
    rmSync(path, { force: true });
  }
}

function restoreWorkingTree(filter) {
  const projects = nxJson([
    'show',
    'projects',
    '--with-target',
    'nx-release-publish',
  ]).filter((project) => matchesFilter(project, filter));

  for (const project of projects) {
    const { root } = nxJson(['show', 'project', project]);
    restore(join(root, 'package.json'));
    restore(join(root, 'CHANGELOG.md'));
  }
  restore('pnpm-lock.yaml');
}

const projectsArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith('--projects='));
const projectsFilter = projectsArg
  ? projectsArg
      .slice('--projects='.length)
      .split(/[\s,]+/)
      .map((name) => name.trim())
      .filter(Boolean)
  : [];

const stopLocalRegistry = await startLocalRegistry({
  localRegistryTarget: '@cdk-x/cdkx:local-registry',
  storage: 'tmp/local-registry/storage',
  clearStorage: true,
});

try {
  await version({ projectsFilter, firstRelease: true }); // gitCommit/gitTag already default false

  const jsiiProjects = nxJson([
    'show',
    'projects',
    '--with-target',
    'jsii-publish-npm',
    '--projects=tag:jsii',
  ]).filter((project) => matchesFilter(project, projectsFilter));
  if (jsiiProjects.length > 0) {
    execFileSync(
      'pnpm',
      [
        'nx',
        'run-many',
        '-t',
        'jsii-publish-npm',
        '-p',
        jsiiProjects.join(','),
      ],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          NPM_REGISTRY: 'localhost:4873',
          DISABLE_HTTPS: 'true',
          NPM_TOKEN: 'local-verdaccio-fake-token',
        },
      },
    );
  }

  execFileSync('pnpm', ['nx', 'run-many', '-t', 'build', '-p', 'tag:ts'], {
    stdio: 'inherit',
  });
  await publishTs({
    projectsFilter,
    tag: 'latest',
    registry: LOCAL_REGISTRY,
    firstRelease: true,
  });
} catch (error) {
  // Caught explicitly (rather than left to crash as an uncaught exception)
  // so the process still exits normally, through Node's regular shutdown
  // path - letting an uncaught exception kill the process abruptly was
  // observed, live, to sometimes leave the Verdaccio server orphaned and
  // still listening: `stopLocalRegistry()`'s `childProcess.kill()` only
  // signals its direct child (the `nx run local-registry` wrapper), not the
  // Verdaccio server that process itself spawns as a grandchild, and an
  // abrupt crash doesn't give that signal time to propagate down the tree
  // the way a normal exit does.
  console.error(error);
  process.exitCode = 1;
} finally {
  restoreWorkingTree(projectsFilter);
  stopLocalRegistry();
}
