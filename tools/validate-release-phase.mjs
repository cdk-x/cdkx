// Guards against releasing the wrong kind of version from the wrong branch:
//   - `main` may only release projects whose `release.phase` (project.json) is
//     "stable" (or unset, which defaults to "stable").
//   - `next` may only release projects whose phase is a prerelease phase
//     (anything other than "stable").
//
// Any other branch is allowed to release anything (e.g. manual workflow_dispatch
// runs from a feature branch for testing) - only `main`/`next` are gated, since
// those are the two branches release.yml is meant to be dispatched from.
//
// Usage: node tools/validate-release-phase.mjs <branch> [--projects=<comma/space-separated names>]
// Exits non-zero with a clear message if any targeted project violates the rule.
import { nxJson } from './nx-json.mjs';

const [branch, ...rest] = process.argv.slice(2);
if (!branch) {
  console.error(
    'Usage: node tools/validate-release-phase.mjs <branch> [--projects=<names>]',
  );
  process.exit(1);
}

const projectsArg = rest.find((arg) => arg.startsWith('--projects='));
const filter = projectsArg
  ? projectsArg
      .slice('--projects='.length)
      .split(/[\s,]+/)
      .map((name) => name.trim())
      .filter(Boolean)
  : [];

const projects = nxJson([
  'show',
  'projects',
  '--with-target',
  'nx-release-publish',
]).filter((project) => filter.length === 0 || filter.includes(project));

const violations = [];
for (const project of projects) {
  const config = nxJson(['show', 'project', project]);
  const phase = config.release?.phase ?? 'stable';

  if (branch === 'main' && phase !== 'stable') {
    violations.push(
      `${project} is in phase "${phase}" - only "stable" releases are allowed from main.`,
    );
  }
  if (branch === 'next' && phase === 'stable') {
    violations.push(
      `${project} is in phase "stable" - stable releases must be cut from main, not next.`,
    );
  }
}

if (violations.length > 0) {
  console.error('Release phase validation failed:');
  for (const violation of violations) {
    console.error(`  - ${violation}`);
  }
  process.exit(1);
}

console.log(`Release phase validation passed for branch "${branch}".`);
