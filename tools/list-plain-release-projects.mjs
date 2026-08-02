// Lists every publishable project in the "plain" release group (project,
// name, root, release phase) as a JSON array on stdout, e.g.
// [{"project":"@cdk-x/nx","name":"nx","root":"packages/nx","phase":"alpha"}].
//
// `project` is the full Nx project identifier (needed for `nx release
// publish -p <project>`, which - unlike `nx build`/`nx run` - does NOT
// resolve unscoped short names). `name` is the short display name (used for
// GitHub environment names/artifact paths, mirroring list-release-projects.mjs).
//
// Projects are selected via the "plain" tag (nx.json's release.groups.plain
// is defined as `{ "projects": ["tag:plain"] }`) - this query mirrors that
// group definition via a positive `--projects=tag:plain` match, rather than
// `--exclude=tag:jsii`. `nx show projects --exclude` does work correctly,
// but staying in lockstep with the group's own selector (instead of its
// logical inverse) avoids two independent sources of truth for the same
// split. jsii-enabled projects carry the "jsii" tag instead (release.groups.jsii),
// set on project.json by hand for packages/core and automatically by
// @cdk-x/nx:library for generated libraries. Every publishable project needs
// exactly one of the two tags - nx.json has no implicit default group once
// any release group is defined, so an untagged project silently falls out of
// release automation entirely.
//
// Publishable-but-plain packages like @cdk-x/nx (a normal npm package, not a
// jsii construct library) already get versioned/changelogged/tagged by the
// existing nx-release-publish-driven scripts (release-version.mjs,
// release-changelog.mjs, release-local-*.mjs - all target "nx-release-publish",
// which every publishable project has regardless of jsii). What those scripts
// don't do is actually publish plain packages: the real publish step for jsii
// projects goes through jsii-pacmak/publib-*, which plain packages have no
// use for. This list drives the separate "publish plain packages via the
// standard `nx release publish`" step/job, alongside the jsii-specific one.
//
// Optional first arg: comma/space-separated Nx project names to filter down
// to, mirroring list-release-projects.mjs's `projects` filter.
import { nxJson } from './nx-json.mjs';
import { phaseOf } from './release-phases.mjs';

const filter = (process.argv[2] ?? '')
  .split(/[\s,]+/)
  .map((name) => name.trim())
  .filter(Boolean);

const projects = nxJson([
  'show',
  'projects',
  '--with-target',
  'nx-release-publish',
  '--projects=tag:plain',
]).filter((project) => filter.length === 0 || filter.includes(project));

const result = projects.map((project) => {
  const config = nxJson(['show', 'project', project]);
  return {
    project,
    name: config.root.split('/').pop(),
    root: config.root,
    phase: phaseOf(config),
  };
});

process.stdout.write(JSON.stringify(result));
