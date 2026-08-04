# Contributing

## Bootstrapping a new library's first release

Every new library needs a real first-release dispatch (`first_release=true` on the `Release` workflow) as its very first CI run — right after scaffolding, before any feature development — not as an afterthought once real code has already piled up. Two reasons:

1. **npm can't pre-configure Trusted Publisher (OIDC) for a package that doesn't exist yet.** PyPI and NuGet can (`PYPI_TRUSTED_PUBLISHER`/`NUGET_TRUSTED_PUBLISHER` are unconditional in `release.yml`), and Maven/Go use static credentials, not OIDC at all — npm is the only registry where this matters. `first_release=true` switches npm auth to a classic `NPM_TOKEN` specifically so the very first publish can succeed and register the package; every publish after that uses OIDC normally.
2. **`first_release=true` unconditionally forces the version to `1.0.0-<phase>.0`.** It can't be used again once a real conventional-commit bump has moved the version past that point, without first deleting the git tag it would collide with (`releaseVersion` hard-errors on a duplicate tag) and resetting `package.json`/`CHANGELOG.md` back to a pre-release state. Bootstrapping late, after real commits have already landed, means doing all of that just to retry - annoying, and easy to get wrong.

**What to do**: right after scaffolding a library (`@cdk-x/nx:library`, or by hand for a plain "ts" package), before writing any real feature code, dispatch the `Release` workflow on `next` with `projects=<name>` and `first_release=true`. This publishes an empty/skeleton `1.0.0-alpha.0`.

For a **jsii-enabled** library, there's no way to bootstrap npm alone: a jsii release always publishes every configured language target (npm, PyPI, Maven, Go, NuGet) in the same run, so bootstrapping means accepting an empty `alpha.0` on all of them at once, not just npm. If the library targets Go, create its dedicated repo first (see below) or `jsii-publish-go` fails before the run gets anywhere near npm.

For a plain **"ts"** library (not jsii), the same bootstrap only touches npm, since that's its only publish target.

## Publishing Go bindings

Every jsii-enabled library in this repo that targets Go (`languages` includes `go` when running `@cdk-x/nx:library`) publishes its Go bindings into its **own dedicated GitHub repository**, `github.com/cdk-x/cdkx-<name>-go` — one repo per library, mirroring how Java/Python/.NET each get their own package coordinates.

This repository is **not** created automatically. Before a library's `jsii-publish-go` target can succeed, create the repo once:

```sh
gh repo create cdk-x/cdkx-<name>-go --public
```

If the repo doesn't exist or isn't reachable, `nx run <name>:jsii-publish-go` fails fast with a clear message pointing back here, instead of a confusing raw clone error from `publib-golang`.

### Why per-library repos, not one shared repo

An earlier design considered a single shared Go module (`github.com/cdk-x/cdkx-go`) for the whole family. That was rejected: `publib-golang` publishes by cloning the target repo and replacing its contents with only the current project's packaged output. With multiple libraries sharing one repo, each publish would silently delete every _other_ library's Go code from the repo's default branch (old git tags stay resolvable, but `@latest`/HEAD would only ever contain whichever library published most recently). Per-library repos avoid this entirely, at the cost of one extra manual step per new Go-enabled library.
