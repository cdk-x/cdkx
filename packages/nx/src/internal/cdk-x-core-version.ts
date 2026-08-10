/**
 * The published `@cdk-x/core` version pin used whenever a generator adds it
 * as a dependency — every generated L1 Resource extends `Resource` and takes
 * a `constructs.Construct` scope, and every generated app's `main.ts`
 * constructs an `App`/`Stack`, so both the `provider` and `app` generators
 * need this pin.
 *
 * A real, jsii-parseable semver range on purpose - NOT the pnpm `workspace:`
 * protocol used elsewhere in this repo. jsii's own dependency resolver reads
 * package.json's `dependencies` directly and throws on anything starting
 * with "workspace:" ("Invalid comparator"), so a real range is required for
 * jsii-compile to succeed. For the TypeScript/npm side this still resolves
 * to local packages/core source at install time via pnpm-workspace.yaml's
 * `linkWorkspacePackages: true` - no registry fetch.
 *
 * Bump this to core's current published version whenever scaffolding a new
 * provider or app; nx.json's `preserveMatchingDependencyRanges: false` keeps
 * it in sync automatically on every subsequent coordinated release.
 */
export const CDK_X_CORE_VERSION = '^1.0.0-alpha.3';

/**
 * jsii's own linter (JSII6) wants an exact-pinned devDependency matching
 * whatever a peerDependency declares - only relevant for jsii-published
 * projects (`provider`), not plain apps, which have no peerDependencies.
 */
export const CDK_X_CORE_DEV_VERSION = '1.0.0-alpha.3';
