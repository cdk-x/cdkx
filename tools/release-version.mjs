// Bumps every publishable project's version, batched by release phase
// (alpha/beta/rc/stable - see the "phase-<phase>" tag on each project's
// project.json), because with `projectsRelationship: "independent"` different
// projects can be in different phases and therefore need a different
// `--preid`. A single global `nx release version` invocation can only apply
// one `--preid` to the whole run, which can't express "core is alpha,
// some-other-lib is stable" at the same time - but native `nx release
// version` DOES correctly compute each project's own independent bump within
// a single multi-project invocation, so batching by the small, fixed set of
// phases (not looping once per project) keeps this to at most 4 `nx`
// invocations regardless of how many libraries exist.
//
// Phase -> behaviour:
//   - "stable" (or no phase-* tag, which defaults to "stable"): no --preid.
//     If the project is currently on a prerelease version, this is what
//     graduates it to a real release (conventional commits still drives the
//     bump itself).
//   - "alpha" | "beta" | "rc": --preid=<phase>, so the computed bump lands as
//     e.g. 1.1.0-alpha.0, then 1.1.0-alpha.1, etc. Changing the phase tag
//     starts a fresh prerelease train (e.g. 1.1.0-beta.0).
//
// --first-release is a special case: conventional-commits bump math doesn't
// apply to a project's very first release, so an explicit version specifier
// is used instead of relying on --preid - 1.0.0 for stable, 1.0.0-<phase>.0
// otherwise (mirrors how a plain first stable release is always forced to
// exactly 1.0.0 rather than computed on top of whatever placeholder version
// is on disk). Every project in a phase's batch gets the same specifier
// string, which is correct since it's each project's own first version in
// that phase, independently of any other project.
//
// --projects=<comma/space-separated Nx project names> narrows each phase's
// batch down to the intersection with this list (mirrors the `projects`
// workflow_dispatch input, so a first-release run can target just the new
// library) rather than being forwarded directly - a plain comma-join with a
// tag pattern would be a union (OR), not the intersection needed here, so
// the filtering happens in JS instead. Every other CLI arg (e.g.
// --git-commit=false --git-tag=false --git-push=false --first-release
// --dry-run) is forwarded as-is to each `nx release version` invocation.
import { execFileSync } from 'node:child_process';
import { nxJson } from './nx-json.mjs';
import { PHASES } from './release-phases.mjs';

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

for (const phase of PHASES) {
  const phaseProjects = nxJson([
    'show',
    'projects',
    '--with-target',
    'nx-release-publish',
    `--projects=tag:phase-${phase}`,
  ]).filter((project) => filter.length === 0 || filter.includes(project));

  if (phaseProjects.length === 0) {
    continue;
  }

  const args = ['release', 'version'];
  if (firstRelease) {
    args.push(phase === 'stable' ? '1.0.0' : `1.0.0-${phase}.0`);
  } else if (phase !== 'stable') {
    args.push(`--preid=${phase}`);
  }
  args.push('-p', phaseProjects.join(','), ...extraArgs);

  execFileSync('pnpm', ['nx', ...args], { stdio: 'inherit' });
}
