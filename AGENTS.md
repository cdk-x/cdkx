<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## Session conventions

- **Commits are never made automatically.** Do not include commit steps in plans or task lists. Only create a commit when the user explicitly asks for it.
- **Format + test before committing.** When the user asks to commit, run the formatter and tests first (unless already done in the same session step).
- **English only.** All documentation (markdown files), JSDoc comments, and inline code comments must be written in English.

## New library checklist

When the user asks to create a new library, follow these steps in order:

1. **Generate with Nx** — always invoke the `nx-generate` skill first. Use `--useProjectJson` so the library gets its own `project.json`. Preferred command pattern:

   ```bash
   yarn nx g @nx/js:library packages/<name> \
     --name=<name> \
     --importPath=@cdk-x/<name> \
     --bundler=tsc \
     --publishable \
     --unitTestRunner=jest \
     --linter=eslint \
     --minimal \
     --useProjectJson \
     --no-interactive
   ```

   Always dry-run first (`--dry-run`) to verify file placement.

2. **Align `project.json`** — replace the generated targets with the workspace standard:
   - `build` using `@nx/js:tsc` (outputPath, main, tsConfig, rootDir)
   - `format` and `format:check` using `nx:run-commands` + prettier (same pattern as `@cdk-x/core`)

3. **Align `package.json`** — match `@cdk-x/core` conventions:
   - `"version": "0.1.0"`
   - Remove `"type": "module"` — all packages are CommonJS
   - `exports` must use `"require"` (not `"import"`)
   - Add `"publishConfig": { "access": "public" }`
   - Use `"tslib": "^2.8.1"` in dependencies

4. **Align `tsconfig.lib.json`** — match `@cdk-x/core`:
   - Remove `"module": "nodenext"` and `"moduleResolution": "nodenext"` — use base defaults (`commonjs` / `node`)
   - Add `"declaration": true` and `"declarationMap": true`
   - Add `"test/**/*"` to the `exclude` list

5. **Align `tsconfig.spec.json`** — match `@cdk-x/core`:
   - Remove `"module": "nodenext"` and `"moduleResolution": "nodenext"`
   - Add `"test/**/*.ts"` to `include`

6. **Align `jest.config.cts`** — set `displayName` to the full package name (e.g. `'@cdk-x/engine'`), remove the `/* eslint-disable */` header comment.

7. **Clean up generated stubs** — delete `src/lib/<name>.ts` and `src/lib/<name>.spec.ts`. Replace `src/index.ts` content with a simple comment placeholder (`// @cdk-x/<name> public API`).

8. **Add to `nx.json` release group** — add the new package to the appropriate release group's `projects` array. New packages typically join the `core` group unless they are standalone tools or CLI packages.

9. **Add scope to `.vscode/settings.json`** — add the package name (e.g. `"engine"`) to the `"conventionalCommits.scopes"` array if not already present.

10. **Create `CONTEXT.md`** — add a `CONTEXT.md` at the package root documenting:
    - What the package does and its role in the system
    - Workspace setup (build tool, test runner, Nx targets)
    - Architecture and class inventory (filled in as code is added)
    - Relationship with other packages
    - Release configuration
    - Coding conventions
    - File map
