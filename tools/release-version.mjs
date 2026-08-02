// Bumps every publishable project's version, one `nx release version` call per
// project, because with `projectsRelationship: "independent"` different projects
// can be in different release phases (alpha/beta/rc/stable - see each project's
// `release.phase` in its project.json) and therefore need a different `--preid`.
// A single global `nx release version` invocation can only apply one `--preid`
// to the whole run, which can't express "core is alpha, some-other-lib is stable"
// at the same time.
//
// Phase -> behaviour:
//   - "stable" (or no `release.phase` set): no --preid. If the project is
//     currently on a prerelease version, this is what graduates it to a real
//     release (conventional commits still drives the bump itself).
//   - "alpha" | "beta" | "rc": --preid=<phase>, so the computed bump lands as
//     e.g. 1.1.0-alpha.0, then 1.1.0-alpha.1, etc. Changing the phase value
//     starts a fresh prerelease train (e.g. 1.1.0-beta.0).
//
// --first-release is a special case: conventional-commits bump math doesn't
// apply to a project's very first release, so an explicit version specifier is
// used instead of relying on --preid - 1.0.0 for stable, 1.0.0-<phase>.0
// otherwise (mirrors how a plain first stable release is always forced to
// exactly 1.0.0 rather than computed on top of whatever placeholder version is
// on disk).
//
// --projects=<comma/space-separated Nx project names> is handled here, not
// forwarded (each project gets its own explicit `-p <project>` call already) -
// mirrors the `projects` workflow_dispatch input, so a first-release run can
// target just the new library. Every other CLI arg (e.g. --git-commit=false
// --git-tag=false --git-push=false --first-release --dry-run) is forwarded
// as-is to each `nx release version` invocation.
import { execFileSync } from 'node:child_process';
import { nxJson } from './nx-json.mjs';

const rawArgs = process.argv.slice(2);
const projectsArg = rawArgs.find((arg) => arg.startsWith('--projects='));
const filter = projectsArg
  ? projectsArg
      .slice('--projects='.length)
      .split(/[\s,]+/)
      .map((name) => name.trim())
      .filter(Boolean)
  : [];
const extraArgs = rawArgs.filter((arg) => arg !== projectsArg);
const firstRelease = extraArgs.includes('--first-release');

const projects = nxJson(['show', 'projects', '--with-target', 'nx-release-publish']).filter(
  (project) => filter.length === 0 || filter.includes(project),
);

for (const project of projects) {
  const config = nxJson(['show', 'project', project]);
  const phase = config.release?.phase ?? 'stable';

  const args = ['release', 'version'];
  if (firstRelease) {
    args.push(phase === 'stable' ? '1.0.0' : `1.0.0-${phase}.0`);
  } else if (phase !== 'stable') {
    args.push(`--preid=${phase}`);
  }
  args.push('-p', project, ...extraArgs);

  execFileSync('pnpm', ['nx', ...args], { stdio: 'inherit' });
}
