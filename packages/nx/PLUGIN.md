# @cdk-x/nx

Nx plugin for scaffolding and building jsii-enabled TypeScript libraries in the cdk-x family. Generic by design: it knows nothing about cdk8s, cdktf, or aws-cdk specifically — family-specific plugins (e.g. a future `@cdk-x/nx-cdk8s`) are meant to be built on top of it, the same way `@nx/react` builds on `@nx/js`.

## Overview

- **Generator**: `@cdk-x/nx:library` scaffolds a new `packages/<name>` library with jsii configured in its `package.json`.
- **Inference**: this plugin's `createNodesV2` scans every `package.json` in the workspace for a top-level `jsii` key and dynamically computes that project's `jsii-*` build/package/publish targets — nothing is written into `project.json` by the generator.
- **Executors**: `jsii-compile`, `jsii-docs`, `jsii-package`, `jsii-publish` wrap the `jsii` / `jsii-docgen` / `jsii-pacmak` / `publib-*` CLIs with validated options and clearer error surfacing than raw `nx:run-commands`.

## Installation

This plugin provides inferred tasks, which requires it to be registered in the workspace's `nx.json`. The generator does **not** do this automatically — it's a one-time manual step:

```jsonc
// nx.json
{
  "plugins": [
    { "plugin": "@nx/js/typescript", "options": {/* ... */} },
    { "plugin": "@nx/eslint/plugin", "options": { "targetName": "lint" } },
    { "plugin": "@nx/jest/plugin", "options": { "targetName": "test" } },
    "@cdk-x/nx",
  ],
}
```

`@cdk-x/nx` must be built (`nx build nx`) and resolvable from `node_modules` (via the pnpm workspace symlink, or as an installed npm dependency in a consuming repo) before Nx's plugin loader can pick it up.

## Generator: `@cdk-x/nx:library`

```sh
nx g @cdk-x/nx:library <name> [--description=<text>] [--languages=python,java,dotnet,go] [--phase=alpha|beta|rc|stable]
```

| Option        | Default                                                 | Description                                                                                                                                                                                                                               |
| ------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | _(required)_                                            | Kebab-case library name. Creates `packages/<name>`, npm package `@cdk-x/<name>`.                                                                                                                                                          |
| `description` | `"<ClassName> construct library for the cdk-x family."` | One-line npm package description.                                                                                                                                                                                                         |
| `languages`   | `python,java,dotnet,go`                                 | Additional jsii target languages. npm/JS bindings are always implicit and not a choice.                                                                                                                                                   |
| `phase`       | `alpha`                                                 | Release phase recorded as a `project.json` tag (read by `tools/validate-release-phase.mjs` / `tools/release.mjs`) and mapped to `package.json`'s jsii `stability` field: `stable` stays `stable`, everything else becomes `experimental`. |

What it does:

1. Scaffolds the base project via `@nx/js`'s `libraryGenerator` (`publishable: true`, `bundler: tsc`, `unitTestRunner: jest`, `linter: eslint`).
2. Replaces the default flat `src/lib/<name>.ts` with `src/lib/<name>/<name>.ts` + co-located spec, per this workspace's module-layout convention.
3. Patches `package.json` with an ESM `exports` map (matching `packages/core`'s `@cdk-x/cdkx` custom-condition shape), an inline `jsii` block scoped to the requested languages, and a jsii `stability` field derived from `phase`.
4. Tags `project.json` with `"jsii"` and the phase (e.g. `"alpha"`) — no `jsii-*` targets are written; those come from this plugin's inference once registered in `nx.json`.
5. If `go` is selected, prints a warning: the library's dedicated `github.com/cdk-x/cdkx-<name>-go` repository must be created before its `jsii-publish-go` target can run (see [CONTRIBUTING.md](../../CONTRIBUTING.md#publishing-go-bindings)).

### Per-language naming

Derived automatically from the library name — no prompts:

| Language | Convention                                                        | Example (`name: widget`)          |
| -------- | ----------------------------------------------------------------- | --------------------------------- |
| Java     | `com.cdkx.<name>`, groupId `com.cdk-x`, artifactId `cdkx-<name>`  | `com.cdkx.widget`                 |
| Python   | `distName cdkx-<name>`, `module cdkx.<name>`                      | `cdkx.widget`                     |
| .NET     | `namespace`/`packageId` `CdkX.<PascalName>`                       | `CdkX.Widget`                     |
| Go       | one dedicated repo per library: `github.com/cdk-x/cdkx-<name>-go` | `github.com/cdk-x/cdkx-widget-go` |

## Inferred targets

For every project whose `package.json` has a top-level `jsii` key:

| Target                                     | Executor                                                 | `dependsOn`                                                  | Present when                          |
| ------------------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| `jsii-compile`                             | `@cdk-x/nx:jsii-compile`                                 | `^jsii-compile`                                              | always                                |
| `jsii-docs`                                | `@cdk-x/nx:jsii-docs`                                    | `jsii-compile`                                               | always                                |
| `jsii-package-npm`                         | `@cdk-x/nx:jsii-package`                                 | `jsii-compile`                                               | always                                |
| `jsii-package-{python,java,dotnet,go}`     | `@cdk-x/nx:jsii-package`                                 | `jsii-compile` (+ `^jsii-package-<lang>` for java/dotnet/go) | language present under `jsii.targets` |
| `jsii-package-all`                         | `nx:noop`                                                | every `jsii-package-*` + `jsii-docs`                         | always                                |
| `jsii-publish-{npm,python,java,dotnet,go}` | `@cdk-x/nx:jsii-publish`                                 | matching `jsii-package-<lang>`                               | matching package target present       |
| `nx-release-publish`                       | _(augments Nx's own synthesized target)_                 | `^nx-release-publish`, `jsii-compile`                        | always                                |
| `build`                                    | _(augments a `build` target inferred by another plugin)_ | `^build`, `jsii-package-all`                                 | always                                |

The `java`/`dotnet`/`go` package targets additionally depend on their upstream `^jsii-package-<lang>` because those toolchains benefit from local caches (`~/.m2`, a local NuGet feed, the Go module cache) being populated by dependency libraries first — `python`/`npm` don't carry that dependency, matching `packages/core`'s existing hand-written targets exactly.

The `build` augmentation exists so a single `nx run-many -t build -p tag:jsii` cascades into full multi-language packaging, not just TypeScript compilation — this is what the `jsii` release group's `groupPreVersionCommand` (`nx.json`) runs before versioning, and it's what lets `.github/workflows/release.yml` skip a separate build/build-jsii step entirely: every jsii package is already fully packaged as a side effect of preparing to version it.

**This augmentation only reaches projects with no `build` target of their own in `project.json`** (confirmed empirically: an explicit project.json target fully replaces a same-named inferred one rather than merging with it — unlike merging between multiple plugins' _inferred_ targets, which does work, e.g. against whatever `@nx/js/typescript` infers for a `@cdk-x/nx:library`-generated project). `packages/core` predates the generator and hand-writes its own `build` target, so it also hand-writes this same `dependsOn: ["^build", "jsii-package-all"]` directly in its `project.json` — any _future_ hand-written jsii project would need the same, but a generated one gets it for free from inference alone.

## Executors

- **`jsii-compile`** — `{ tsconfigFileName?: string }` (default `tsconfig.jsii.json`). Runs `jsii --generate-tsconfig <file>`.
- **`jsii-docs`** — `{ languages?: string[], output?: string }` (defaults: all five jsii-docgen languages, `dist-jsii/docs/API`). Runs `jsii-docgen`.
- **`jsii-package`** — `{ target: 'npm'|'python'|'java'|'dotnet'|'go', outdir?: string }`. Runs `jsii-pacmak -t <mapped-target> --outdir <outdir> .` (`npm` maps to pacmak's `js` target).
- **`jsii-publish`** — `{ target: same enum, dir?: string }`. Runs the matching `publib-*` binary. For `target: 'go'`, first checks the library's `github.com/cdk-x/cdkx-<name>-go` repository is reachable (`git ls-remote`), failing with a clear message instead of a confusing `publib-golang` clone error if it isn't.

## Known limitations

- **Go publishing requires a pre-created, per-library GitHub repository.** The generator only warns; it does not create `github.com/cdk-x/cdkx-<name>-go` for you. See [CONTRIBUTING.md](../../CONTRIBUTING.md#publishing-go-bindings).
- **No family-specific generators yet.** This package only produces generic jsii libraries. cdk8s/cdktf/aws-cdk-specific scaffolding (base classes, doc sites, etc.) is expected to live in separate, future `@cdk-x/nx-*` packages built on top of this one.

## Publishing @cdk-x/nx itself

This package is an ordinary TypeScript npm package (not jsii-compiled), so it publishes via Nx's standard `nx-release-publish` target instead of the `jsii-publish-*` pipeline above. Routing is done via **`nx.json`'s `release.groups`**: a `jsii` group (`{ "projects": ["tag:jsii"], "projectsRelationship": "independent" }`) and a `ts` group (same shape, tag `ts` — plain TypeScript/JS, no jsii bindings). Every jsii-enabled project (`packages/core`, and any library `@cdk-x/nx:library` generates) is tagged `"jsii"` in its `project.json`; every `ts`-group publishable project (currently just `packages/nx` itself) is tagged `"ts"` by hand. **Every publishable project needs exactly one of these two tags** — once any `release.groups` are defined, Nx's implicit "release everything publishable" default group no longer applies, so an untagged project silently falls out of release automation entirely.

Release orchestration for both groups is consolidated into a single script, `tools/release.mjs`, built on Nx's _programmatic_ release API (`releaseVersion`/`releaseChangelog`/`releasePublish` imported from `nx/release`) rather than shelling out to the `nx release` CLI:

- **`node tools/release.mjs version`** — bumps every publishable project's version and generates its changelog entry, batched by release phase (not by project or by group): a single `releaseVersion`/`releaseChangelog` call pair per phase can freely mix `jsii`- and `ts`-tagged projects together, since phase (not group) is what forces batching — `--preid` applies to a whole call, and different projects can be in different phases. Using the programmatic API (instead of the combined `nx release` CLI command, which has no `--git-commit`/`--git-tag`/`--git-push` flags at all) is what lets `gitCommit`/`gitTag` be controlled per call with zero `nx.json` changes: `releaseChangelog` is fed the exact `versionData` its own `releaseVersion` call just returned, so no explicit `--version` argument and no per-project loop are ever needed. Returns the list of projects that actually got a real version bump, read directly off `releaseVersion`'s own return value — not from `nx show projects --affected` (unreliable here: it resolves via `git merge-base(base, head)`, and this workflow commits directly to `main`/`next`, so that diff can silently be empty) or a git tag diff.
- **`node tools/release.mjs publish-ts`** — publishes every `ts`-tagged project via `releasePublish`, scoped by tag. `ts` packages have exactly one publish target (npm), so no per-language batching is needed here, unlike jsii.
- **`node tools/release.mjs list --group=<jsii|ts>`** — the `{project, name, root, phase}` listing both release groups' CI publish-job matrices need, so no package list is ever hardcoded in `.github/workflows/release.yml`.

jsii per-language publishing (npm/python/java/dotnet/go) is deliberately **not** a mode of this script — there's no single entry point that fans out per language the way `releaseVersion`/`releaseChangelog`/`releasePublish` do for a project list, so each language stays a direct `publib-<lang>` invocation in its own CI job (`publish-maven`/`publish-go`/`publish-pypi`/`publish-npm`/`publish-nuget` in `release.yml`), one job per registry, each with its own `environment:` for OIDC/Trusted Publisher scoping — mirroring [projen's own release workflow](https://github.com/projen/projen/blob/main/.github/workflows/release.yml): one job builds+versions+packages once, uploads a single artifact, and separate per-registry jobs each download it and publish their own language.

- **`tools/validate-release-phase.mjs`** (unchanged) — pure custom business rule (branch name → allowed phase) with no Nx-native equivalent, resolved via two native tag-pattern `nx show projects` calls. Imports `nxJson`/`PHASES` from `tools/release.mjs` rather than duplicating them.

Phase itself is tracked as a bare `alpha`/`beta`/`rc`/`stable` project tag (`tools/release.mjs` exports the fixed `PHASES` list and a `phaseOf()` reader that matches a project's tags against it), not a custom `release.phase` JSON field — this is what lets `version`/`validate-release-phase.mjs` use native tag-pattern filtering instead of walking every project's config in JS. The same phase also drives `package.json`'s jsii `stability` field (see the generator's `phase` option above): `stable` → `stable`, everything else → `experimental`.

Nx CLI gotchas worth knowing if you touch this:

- The combined `nx release` command (no subcommand) has **no** `--git-commit`/`--git-tag`/`--git-push` flags at all — passing them errors `Unknown arguments: gitCommit, gitTag, gitPush`. Its git behavior comes solely from `nx.json`'s `release.git.*` (defaulting to `commit: true, tag: true`, `push` only ever true when a remote release is being created). This is exactly why `tools/release.mjs` uses the _programmatic_ `releaseVersion`/`releaseChangelog`/`releasePublish` functions instead — those accept `gitCommit`/`gitTag`/`gitPush` as plain function options, verified live in this repo.
- `releaseVersion`/`releaseChangelog` stage their changes with git (`git add`) even when `gitCommit: false`, unless `stageChanges: false` is also passed explicitly — `tools/release.mjs` always sets `stageChanges` to match `gitCommit`, so the local Verdaccio flow (which never commits) never leaves anything in the index either.
- `nx release publish -p`/`-g` require the **full** scoped project/group identifiers as configured — `-p` needs the full scoped project name, unlike `nx build`/`nx run`, which also resolve the unscoped short name.
- **`-p` and `-g` are mutually exclusive** on `nx release` commands — pick per-project or per-group targeting, never both in one call.
- `nx release publish --exclude=tag:jsii` does **not** reliably exclude tagged projects (confirmed: it still selects them) — `--exclude` is accepted by the CLI but never actually consulted by the release/groups project-selection code, unlike `nx show projects --exclude`/`nx run-many --exclude`, which both work correctly.
- A release group whose `projects` pattern matches **zero** projects is a hard `nx.json` config-validation error that breaks every `nx` command in the repo, not just release ones — both `jsii` and `ts` must always have at least one tagged member.
- **Always set `"projectsRelationship": "independent"` explicitly on every group, even though the workspace root already sets it.** Confirmed a real ordering bug in Nx 23.1.0's config resolution (`node_modules/nx/dist/src/command-line/release/config/config.js`): the default `releaseTag.pattern` for a group is computed from `releaseGroup.projectsRelationship` (line ~480) _before_ the root-level inheritance fallback (`releaseGroup.projectsRelationship || GROUP_DEFAULTS.projectsRelationship`, line ~511) has run. Without an explicit per-group override, this silently resolves to the **fixed**-relationship tag pattern (`{releaseGroupName}-v{version}`) instead of the intended independent one (`{projectName}@{version}`) — which would collide the moment two independent projects land in the same group. Verified by testing `nx release version -p <project> --dry-run --first-release` and reading the printed "Unable to resolve the current version from git tags using pattern ..." line before and after adding the explicit override.

## Fast-follow roadmap

- Optional: auto-create a library's `cdkx-<name>-go` repository via the `gh` CLI as part of generation, instead of only warning.
- Optional: migrate `packages/core`'s hand-written `jsii-*` targets to rely purely on this plugin's inference, as a correctness check that it reproduces identical behavior.
