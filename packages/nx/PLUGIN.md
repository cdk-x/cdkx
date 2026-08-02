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

| Option        | Default                                                 | Description                                                                                                                                     |
| ------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | _(required)_                                            | Kebab-case library name. Creates `packages/<name>`, npm package `@cdk-x/<name>`.                                                                |
| `description` | `"<ClassName> construct library for the cdk-x family."` | One-line npm package description.                                                                                                               |
| `languages`   | `python,java,dotnet,go`                                 | Additional jsii target languages. npm/JS bindings are always implicit and not a choice.                                                         |
| `phase`       | `alpha`                                                 | Release phase recorded as a `"phase-<phase>"` tag in `project.json` (read by `tools/validate-release-phase.mjs` / `tools/release-version.mjs`). |

What it does:

1. Scaffolds the base project via `@nx/js`'s `libraryGenerator` (`publishable: true`, `bundler: tsc`, `unitTestRunner: jest`, `linter: eslint`).
2. Replaces the default flat `src/lib/<name>.ts` with `src/lib/<name>/<name>.ts` + co-located spec, per this workspace's module-layout convention.
3. Patches `package.json` with an ESM `exports` map (matching `packages/core`'s `@cdk-x/cdkx` custom-condition shape) and an inline `jsii` block scoped to the requested languages.
4. Tags `project.json` with `"jsii"` and `"phase-<phase>"` — no `jsii-*` targets are written; those come from this plugin's inference once registered in `nx.json`.
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

| Target                                     | Executor                                 | `dependsOn`                                                  | Present when                          |
| ------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------- |
| `jsii-compile`                             | `@cdk-x/nx:jsii-compile`                 | `^jsii-compile`                                              | always                                |
| `jsii-docs`                                | `@cdk-x/nx:jsii-docs`                    | `jsii-compile`                                               | always                                |
| `jsii-package-npm`                         | `@cdk-x/nx:jsii-package`                 | `jsii-compile`                                               | always                                |
| `jsii-package-{python,java,dotnet,go}`     | `@cdk-x/nx:jsii-package`                 | `jsii-compile` (+ `^jsii-package-<lang>` for java/dotnet/go) | language present under `jsii.targets` |
| `jsii-package-all`                         | `nx:noop`                                | every `jsii-package-*` + `jsii-docs`                         | always                                |
| `jsii-publish-{npm,python,java,dotnet,go}` | `@cdk-x/nx:jsii-publish`                 | matching `jsii-package-<lang>`                               | matching package target present       |
| `nx-release-publish`                       | _(augments Nx's own synthesized target)_ | `^nx-release-publish`, `jsii-compile`                        | always                                |

The `java`/`dotnet`/`go` package targets additionally depend on their upstream `^jsii-package-<lang>` because those toolchains benefit from local caches (`~/.m2`, a local NuGet feed, the Go module cache) being populated by dependency libraries first — `python`/`npm` don't carry that dependency, matching `packages/core`'s existing hand-written targets exactly.

## Executors

- **`jsii-compile`** — `{ tsconfigFileName?: string }` (default `tsconfig.jsii.json`). Runs `jsii --generate-tsconfig <file>`.
- **`jsii-docs`** — `{ languages?: string[], output?: string }` (defaults: all five jsii-docgen languages, `dist-jsii/docs/API`). Runs `jsii-docgen`.
- **`jsii-package`** — `{ target: 'npm'|'python'|'java'|'dotnet'|'go', outdir?: string }`. Runs `jsii-pacmak -t <mapped-target> --outdir <outdir> .` (`npm` maps to pacmak's `js` target).
- **`jsii-publish`** — `{ target: same enum, dir?: string }`. Runs the matching `publib-*` binary. For `target: 'go'`, first checks the library's `github.com/cdk-x/cdkx-<name>-go` repository is reachable (`git ls-remote`), failing with a clear message instead of a confusing `publib-golang` clone error if it isn't.

## Known limitations

- **Go publishing requires a pre-created, per-library GitHub repository.** The generator only warns; it does not create `github.com/cdk-x/cdkx-<name>-go` for you. See [CONTRIBUTING.md](../../CONTRIBUTING.md#publishing-go-bindings).
- **No family-specific generators yet.** This package only produces generic jsii libraries. cdk8s/cdktf/aws-cdk-specific scaffolding (base classes, doc sites, etc.) is expected to live in separate, future `@cdk-x/nx-*` packages built on top of this one.

## Publishing @cdk-x/nx itself

This package is a plain npm package (not jsii-compiled), so it publishes via Nx's standard `nx-release-publish` target instead of the `jsii-publish-*` pipeline above. Routing is done via **`nx.json`'s `release.groups`**: a `jsii` group (`{ "projects": ["tag:jsii"], "projectsRelationship": "independent" }`) and a `plain` group (same shape, tag `plain`). Every jsii-enabled project (`packages/core`, and any library `@cdk-x/nx:library` generates) is tagged `"jsii"` in its `project.json`; every plain publishable project (currently just `packages/nx` itself) is tagged `"plain"` by hand. **Every publishable project needs exactly one of these two tags** — once any `release.groups` are defined, Nx's implicit "release everything publishable" default group no longer applies, so an untagged project silently falls out of release automation entirely.

Given `-g plain`/`-g jsii` reliably select their whole group in one call, the local and CI paths need almost no custom scripting for the plain side:

- Root `project.json`'s `release-local` target inlines two plain `nx` commands directly (`nx run-many -t build -p tag:plain` then `nx release publish -g plain --registry=... --first-release`) — no wrapper script, mirroring how the jsii side is just `"nx run-many -t jsii-publish-npm"`.
- `tools/list-plain-release-projects.mjs` still exists, but only because `.github/workflows/release.yml`'s `publish-plain-npm` job fans out via a matrix (per-package GitHub `environment:` for OIDC + per-package npm dist-tag), which needs concrete `{project, name, root, phase}` data per member — something neither `-g` nor `-p tag:plain` alone provides. If that per-package isolation ever stops being needed, this script (and the matrix) can go too, in favor of a single non-matrix `nx release publish -g plain` step.

Not every script was worth collapsing this way — some solve a problem orthogonal to jsii-vs-plain routing that groups don't touch:

- **`tools/release-version.mjs`** (needed): loops over the four possible phases (not projects), not because groups can't batch multiple independent projects in one call (they can — confirmed empirically, e.g. `nx release version -p "a,b" --preid=alpha --dry-run --first-release` computes each project's own bump correctly), but because different projects can be on _different_ phases needing different `--preid`, and a single CLI invocation only accepts one `--preid`. Batching by phase (≤4 `nx` invocations) rather than by project (N invocations) is what actually scales as the library count grows.
- **`tools/release-changelog.mjs`** (needed, unchanged): `nx release changelog` refuses to run without an explicit version argument ("An explicit target version must be specified when using the changelog command directly"), and each independent project can be on its own version — so it fundamentally cannot be batched into fewer calls than one per project.
- **`tools/validate-release-phase.mjs`** (needed, simplified): pure custom business rule (branch name → allowed phase) with no Nx-native equivalent, but now resolved via two native tag-pattern `nx show projects` calls instead of a per-project loop.
- **`tools/list-release-projects.mjs`** (needed, unchanged filter): the jsii-side equivalent of `list-plain-release-projects.mjs`. Deliberately still filters by `--with-target jsii-publish-npm` rather than `tag:jsii` — the inferred target is a more trustworthy signal (derived straight from `package.json`'s real jsii config) than a tag, which is a separate, manually-set signal that could in principle drift out of sync.

Phase itself is tracked as a `"phase-<phase>"` tag (`tools/release-phases.mjs` exports the fixed `PHASES` list and a `phaseOf()` reader), not a custom `release.phase` JSON field — this is what lets `release-version.mjs`/`validate-release-phase.mjs` use native tag-pattern filtering instead of walking every project's config in JS.

Nx CLI gotchas worth knowing if you touch these scripts:

- `nx release publish -p`/`-g` require the **full** scoped project/group identifiers as configured — `-p` needs the full scoped project name (`@cdk-x/nx`), unlike `nx build`/`nx run`, which also resolve the unscoped short name (`nx`).
- **`-p` and `-g` are mutually exclusive** on `nx release` commands — pick per-project or per-group targeting, never both in one call.
- `nx release publish --exclude=tag:jsii` does **not** reliably exclude tagged projects (confirmed: it still selects them) — `--exclude` is accepted by the CLI but never actually consulted by the release/groups project-selection code, unlike `nx show projects --exclude`/`nx run-many --exclude`, which both work correctly. This is exactly why release group config (`-g`, an exact-name lookup) replaced the earlier tag+`--exclude` workaround here.
- A release group whose `projects` pattern matches **zero** projects is a hard `nx.json` config-validation error that breaks every `nx` command in the repo, not just release ones — both `jsii` and `plain` must always have at least one tagged member.
- **Always set `"projectsRelationship": "independent"` explicitly on every group, even though the workspace root already sets it.** Confirmed a real ordering bug in Nx 23.1.0's config resolution (`node_modules/nx/dist/src/command-line/release/config/config.js`): the default `releaseTag.pattern` for a group is computed from `releaseGroup.projectsRelationship` (line ~480) _before_ the root-level inheritance fallback (`releaseGroup.projectsRelationship || GROUP_DEFAULTS.projectsRelationship`, line ~511) has run. Without an explicit per-group override, this silently resolves to the **fixed**-relationship tag pattern (`{releaseGroupName}-v{version}`) instead of the intended independent one (`{projectName}@{version}`) — which would collide the moment two independent projects land in the same group. Verified by testing `nx release version -p <project> --dry-run --first-release` and reading the printed "Unable to resolve the current version from git tags using pattern ..." line before and after adding the explicit override.

## Fast-follow roadmap

- Migrate the repo's `tools/*.mjs` release-orchestration scripts (phase-aware version bump, per-project changelog, CI-matrix listing, local Verdaccio dry-run cycle) into plugin executors/CLI, keeping repo-specific bits (branch-naming policy) configurable or repo-side.
- Optional: auto-create a library's `cdkx-<name>-go` repository via the `gh` CLI as part of generation, instead of only warning.
- Optional: migrate `packages/core`'s hand-written `jsii-*` targets to rely purely on this plugin's inference, as a correctness check that it reproduces identical behavior.
