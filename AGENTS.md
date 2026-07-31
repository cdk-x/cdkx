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

## Development Guide

- **Module layout**: each class/module in a library lives in its own folder under `src/lib/<module-name>/`, containing the implementation file and its co-located `*.spec.ts` side by side (e.g. `src/lib/resolvable/resolvable.ts` + `src/lib/resolvable/resolvable.spec.ts`). This is more maintainable than flat files directly under `src/`.
- **OOP-first**: the codebase follows strict OOP — no loose exported functions from a module; any utility is a static method on a class (e.g. `Stack.of()`, `App.of()`, `Resource.of()`, `Resolvable.isResolvable()`). Non-instantiable utility classes use a private constructor.
- **JSDoc for jsii**: this package will later be compiled through jsii to generate multi-language bindings (Python, Java, .NET, Go), which derive their docs directly from these comments — there is no separate documentation source. Every exported class, interface, and public/static method needs a full doc comment: a summary of intent, `@param` for each parameter, `@returns` describing the value (call out type-predicate narrowing where relevant), and an `@example` whenever a usage snippet clarifies the call site. Fields/methods with no parameters (e.g. `IResolvable.resolve()`) don't need `@param`/`@example` — a summary is enough until a concrete implementation exists to illustrate.
