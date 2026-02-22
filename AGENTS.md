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

# CDK-X Project Conventions

## GitHub Issues & Pull Requests

### Issue-to-Branch Workflow
- Each GitHub issue corresponds to a single feature branch
- Branch naming: `<type>/<scope>` (e.g., `feat/logger-package`, `fix/version-display`)
- One issue = one branch = one PR
- All issues are tracked in the GitHub Project: https://github.com/orgs/cdk-x/projects/1

### Conventional Commits
All PR titles MUST follow [Conventional Commits](https://www.conventionalcommits.org/) format for automatic semantic versioning:

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat` - New feature (bumps minor version)
- `fix` - Bug fix (bumps patch version)
- `docs` - Documentation only
- `test` - Adding or updating tests
- `refactor` - Code refactoring without feature changes
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes

**Examples:**
- `feat(cli): add version command with styled output`
- `fix(logger): handle undefined log level gracefully`
- `docs(readme): add CLI development guide`
- `test(cli): add integration tests for help command`

**Breaking Changes:**
- Add `!` after type/scope: `feat(api)!: change logger interface`
- Or add `BREAKING CHANGE:` in PR body

### Scope Guidelines
- `cli` - CLI application
- `logger` - Logger package
- `core` - Core shared utilities
- Package names for specific packages (e.g., `constructs`, `engine`)

### PR Requirements
- Title follows conventional commit format
- Description references issue: "Closes #123"
- All tests pass
- Code passes linting
- Update relevant documentation

## Monorepo Structure

### Package Organization
- `apps/*` - Executable applications (CLI, servers, etc.)
- `packages/*` - Shared libraries (publishable to npm)
- All packages use `@cdk-x/` namespace

### Creating New Packages
Always use Nx generators:
```bash
# Publishable library
npx nx g @nx/js:lib --directory=packages/<name> --publishable --importPath=@cdk-x/<name>

# Application
npx nx g @nx/node:app --directory=apps/<name>
```

### Dependencies
- Use workspace references for internal packages (monorepo dependencies)
- Keep shared utilities in `packages/` for reusability
- CLI should depend on shared packages, not vice versa

## Development Workflow

### Building
```bash
# Build single project
npx nx build <project-name>

# Build all projects
npx nx run-many -t build

# Build affected by changes
npx nx affected -t build
```

### Testing
```bash
# Test single project
npx nx test <project-name>

# Test all
npx nx run-many -t test

# Test affected
npx nx affected -t test
```

### Linting
```bash
npx nx lint <project-name>
```

## Code Style

- All code in **English** (comments, variable names, documentation)
- Use TypeScript strict mode
- Follow ESLint configuration
- Write tests for new features
- Document public APIs with JSDoc
