// Guards which branch can release what:
//   - `main` releases every project according to its own current phase tag,
//     independently (alpha/beta/rc/stable all allowed side by side - phase is
//     a per-package concept, not a repo-wide one). The only extra guardrail:
//     whatever main is about to release AS "stable" must have package.json's
//     jsii `stability` field also say "stable" - catches drift between the
//     two signals (e.g. the tag got promoted but the field didn't, or vice
//     versa).
//   - `next` is for occasional, coordinated multi-package work (e.g. a v2
//     effort) - it may carry a project through alpha/beta/rc, but can never
//     cut a "stable" release. Stable graduation only ever happens on main,
//     after next is merged back in and the tag is promoted there.
//   - Every other branch (feature/*, PR refs) is rejected outright: real
//     releases (git commit/tag/changelog/real registries) only ever run from
//     main or next. Testing a build from any other branch goes through
//     `nx run release-local` (Verdaccio) instead - already exists, untouched
//     by this script.
//
// Uses native tag-pattern project selection (a handful of `nx show projects`
// calls total, regardless of how many publishable projects exist) instead of
// looping per project to inspect each one's config individually.
//
// Usage: node tools/validate-release-phase.mjs <branch> [--projects=<comma/space-separated names>]
// Exits non-zero with a clear message if any targeted project violates the rule.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { matchesFilter, nxJson, PHASES } from './release.mjs';

const PRERELEASE_TAGS = PHASES.filter((phase) => phase !== 'stable')
  .map((phase) => `tag:${phase}`)
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
  ]).filter((project) => matchesFilter(project, filter));
}

const allProjects = nxJson([
  'show',
  'projects',
  '--with-target',
  'nx-release-publish',
]).filter((project) => matchesFilter(project, filter));

const prereleaseProjects = new Set(projectsTagged(PRERELEASE_TAGS));
// A project with no phase tag at all defaults to "stable", same as the
// phase-tag-reading helper in release.mjs - so "stable" here is simply "not
// tagged as any prerelease phase".
const jsiiProjects = new Set(projectsTagged('tag:jsii'));

let violatingProjects = [];
let violationReason = '';
const stabilityMismatches = [];

if (branch === 'main') {
  const stableTargets = allProjects.filter((p) => !prereleaseProjects.has(p));
  for (const project of stableTargets) {
    if (!jsiiProjects.has(project)) continue; // "ts" projects have no jsii stability field
    const { root } = nxJson(['show', 'project', project]);
    const { stability } = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf-8'),
    );
    if (stability !== 'stable') {
      stabilityMismatches.push(project);
    }
  }
} else if (branch === 'next') {
  violatingProjects = allProjects.filter((p) => !prereleaseProjects.has(p));
  violationReason =
    'stable releases must be cut from main, not next - merge next into main first, then promote the tag there';
} else {
  console.error(
    `Real releases can only run from "main" or "next", not "${branch}". ` +
      'Use `nx run release-local` (Verdaccio) to test a build from this branch.',
  );
  process.exit(1);
}

if (violatingProjects.length > 0 || stabilityMismatches.length > 0) {
  console.error('Release phase validation failed:');
  for (const project of violatingProjects) {
    console.error(`  - ${project}: ${violationReason}.`);
  }
  for (const project of stabilityMismatches) {
    console.error(
      `  - ${project}: tagged "stable" but package.json's jsii stability is not "stable" - update one to match the other.`,
    );
  }
  process.exit(1);
}

console.log(`Release phase validation passed for branch "${branch}".`);
