// Guards against releasing the wrong kind of version from the wrong branch:
//   - `main` may only release projects tagged "phase-stable" (or with no
//     phase-* tag at all, which defaults to "stable").
//   - `next` may only release projects tagged with a prerelease phase
//     ("phase-alpha"/"phase-beta"/"phase-rc").
//
// Any other branch is allowed to release anything (e.g. manual workflow_dispatch
// runs from a feature branch for testing) - only `main`/`next` are gated, since
// those are the two branches release.yml is meant to be dispatched from.
//
// Uses native tag-pattern project selection (two `nx show projects` calls
// total, regardless of how many publishable projects exist) instead of
// looping per project to inspect each one's config individually.
//
// Usage: node tools/validate-release-phase.mjs <branch> [--projects=<comma/space-separated names>]
// Exits non-zero with a clear message if any targeted project violates the rule.
import { nxJson } from './nx-json.mjs';
import { PHASES } from './release-phases.mjs';

const PRERELEASE_TAGS = PHASES.filter((phase) => phase !== 'stable')
  .map((phase) => `tag:phase-${phase}`)
  .join(',');

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

function projectsTagged(tagPattern) {
  return nxJson([
    'show',
    'projects',
    '--with-target',
    'nx-release-publish',
    `--projects=${tagPattern}`,
  ]).filter((project) => filter.length === 0 || filter.includes(project));
}

const allProjects = nxJson([
  'show',
  'projects',
  '--with-target',
  'nx-release-publish',
]).filter((project) => filter.length === 0 || filter.includes(project));

const prereleaseProjects = new Set(projectsTagged(PRERELEASE_TAGS));
// A project with no phase-* tag at all defaults to "stable", same as the
// phase-tag-reading helper in release-phases.mjs - so "stable" here is
// simply "not tagged as any prerelease phase".

let violatingProjects = [];
let violationReason = '';
if (branch === 'main') {
  violatingProjects = allProjects.filter((p) => prereleaseProjects.has(p));
  violationReason = 'only "stable" releases are allowed from main';
} else if (branch === 'next') {
  violatingProjects = allProjects.filter((p) => !prereleaseProjects.has(p));
  violationReason = 'stable releases must be cut from main, not next';
}

if (violatingProjects.length > 0) {
  console.error('Release phase validation failed:');
  for (const project of violatingProjects) {
    console.error(`  - ${project}: ${violationReason}.`);
  }
  process.exit(1);
}

console.log(`Release phase validation passed for branch "${branch}".`);
