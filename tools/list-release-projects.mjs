// Lists every jsii-publishable project (name + root dir + release phase) as a
// JSON array on stdout, e.g.
// [{"name":"core","root":"packages/core","phase":"alpha"}, ...].
//
// Used by the release workflow to build dynamic matrices (per-package publish
// jobs) without ever having to hardcode/update a package list in the YAML as
// new libraries are added to the workspace. `phase` (from each project's
// `release.phase` in project.json, default "stable") drives the npm dist-tag:
// a "stable" package publishes under npm's default "latest" tag, anything else
// must publish under its own phase tag (NPM_DIST_TAG=<phase>) so a prerelease
// never becomes what `npm install <pkg>` resolves to.
//
// Optional first arg: comma/space-separated Nx project names (e.g. "core") to
// filter down to - mirrors the `projects` workflow_dispatch input, so a
// first-release run can target just the new library instead of every project
// with a jsii-publish-npm target.
import { nxJson } from './nx-json.mjs';

const filter = (process.argv[2] ?? '')
  .split(/[\s,]+/)
  .map((name) => name.trim())
  .filter(Boolean);

const projects = nxJson(['show', 'projects', '--with-target', 'jsii-publish-npm']).filter(
  (project) => filter.length === 0 || filter.includes(project),
);

const result = projects.map((project) => {
  const config = nxJson(['show', 'project', project]);
  return {
    name: config.root.split('/').pop(),
    root: config.root,
    phase: config.release?.phase ?? 'stable',
  };
});

process.stdout.write(JSON.stringify(result));
