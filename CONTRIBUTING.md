# Contributing

## Publishing Go bindings

Every jsii-enabled library in this repo that targets Go (`languages` includes `go` when running `@cdk-x/nx:library`) publishes its Go bindings into its **own dedicated GitHub repository**, `github.com/cdk-x/cdkx-<name>-go` — one repo per library, mirroring how Java/Python/.NET each get their own package coordinates.

This repository is **not** created automatically. Before a library's `jsii-publish-go` target can succeed, create the repo once:

```sh
gh repo create cdk-x/cdkx-<name>-go --public
```

If the repo doesn't exist or isn't reachable, `nx run <name>:jsii-publish-go` fails fast with a clear message pointing back here, instead of a confusing raw clone error from `publib-golang`.

### Why per-library repos, not one shared repo

An earlier design considered a single shared Go module (`github.com/cdk-x/cdkx-go`) for the whole family. That was rejected: `publib-golang` publishes by cloning the target repo and replacing its contents with only the current project's packaged output. With multiple libraries sharing one repo, each publish would silently delete every _other_ library's Go code from the repo's default branch (old git tags stay resolvable, but `@latest`/HEAD would only ever contain whichever library published most recently). Per-library repos avoid this entirely, at the cost of one extra manual step per new Go-enabled library.
