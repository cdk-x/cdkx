# cdkx — Development Conventions

Transversal conventions for the cdkx monorepo. Loaded in every OpenCode session.

> **Maintenance rule:** update this file whenever global conventions change —
> commits, releases, coding standards, workflows, or package structure.

---

## Session conventions

- **Commits are never made automatically.** Do not include commit steps in plans
  or task lists. Only create a commit when the user explicitly asks for it.
- **Format + test before committing.** When the user asks to commit, run the
  formatter and tests first (unless already done in the same session step).
- **English only.** All documentation (markdown files), JSDoc comments, and
  inline code comments must be written in English.

---

## Coding conventions

| Rule                           | Detail                                                                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Everything OOP                 | No standalone `export function`. All utilities are static methods on classes.                                                                                                                                                              |
| No `any`                       | Use `unknown` everywhere. The one exception is `Lazy.any()` return type — intentional escape hatch, gets `eslint-disable` comment.                                                                                                         |
| CJS imports                    | All local imports use **no file extension** (extensionless). `moduleResolution: node` resolves them correctly at both compile time and runtime.                                                                                            |
| Unused params in class methods | ESLint's `argsIgnorePattern: "^_"` does NOT suppress warnings for class method params. Fix: **omit the parameter entirely** from the method signature. TypeScript allows implementing an interface method with fewer params than declared. |
| Prettier                       | Run `yarn nx run <package>:format` after writing or modifying any `.ts` file. Config: `singleQuote`, `trailingComma: all`, `printWidth: 80`, `tabWidth: 2`, `semi: true`.                                                                  |
| Specs co-located               | `foo/foo.spec.ts` lives next to `foo/foo.ts`.                                                                                                                                                                                              |
| Test helpers                   | `test/helpers/` — not exported from the public barrel (`src/index.ts`).                                                                                                                                                                    |
| Module format                  | CommonJS throughout — no `"type": "module"` in any `package.json`.                                                                                                                                                                         |

---

## New library checklist

When the user asks to create a new library, follow these steps in order:

1. **Generate with Nx** — always invoke the `nx-generate` skill first. Use
   `--useProjectJson` so the library gets its own `project.json`. Preferred
   command pattern:

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

2. **Align `project.json`** — replace the generated targets with the workspace
   standard:
   - `build` using `@nx/js:tsc` (outputPath, main, tsConfig, rootDir)
   - `format` and `format:check` using `nx:run-commands` + prettier (same
     pattern as `@cdk-x/core`)
   - `test` with `passWithNoTests: true`

3. **Align `package.json`** — match `@cdk-x/core` conventions:
   - `"version": "0.1.0"`
   - Remove `"type": "module"` — all packages are CommonJS
   - `exports` must use `"require"` (not `"import"`)
   - Add `"publishConfig": { "access": "public" }`
   - Use `"tslib": "^2.8.1"` in dependencies

4. **Align `tsconfig.lib.json`** — match `@cdk-x/core`:
   - Remove `"module": "nodenext"` and `"moduleResolution": "nodenext"` — use
     base defaults (`commonjs` / `node`)
   - Add `"declaration": true` and `"declarationMap": true`
   - Add `"test/**/*"` to the `exclude` list

5. **Align `tsconfig.spec.json`** — match `@cdk-x/core`:
   - Remove `"module": "nodenext"` and `"moduleResolution": "nodenext"`
   - Add `"test/**/*.ts"` to `include`

6. **Align `jest.config.cts`** — set `displayName` to the full package name
   (e.g. `'@cdk-x/engine'`), remove the `/* eslint-disable */` header comment.

7. **Clean up generated stubs** — delete `src/lib/<name>.ts` and
   `src/lib/<name>.spec.ts`. Replace `src/index.ts` content with a simple
   comment placeholder (`// @cdk-x/<name> public API`).

8. **Add to `nx.json` release group** — add the new package to the appropriate
   release group's `projects` array. New packages typically join the `core`
   group unless they are standalone tools or CLI packages.

9. **Add scope to `.vscode/settings.json`** — add the package name (e.g.
   `"engine"`) to the `"conventionalCommits.scopes"` array if not already
   present.

10. **Create `CONTEXT.md`** — add a `CONTEXT.md` at the package root
    documenting:
    - What the package does and its role in the system
    - Workspace setup (build tool, test runner, Nx targets)
    - Architecture and class inventory (filled in as code is added)
    - Relationship with other packages
    - Release configuration
    - Coding conventions
    - File map

11. **Add to `opencode.json` instructions** — add the new package's
    `packages/<name>/CONTEXT.md` to the `instructions` array in `opencode.json`
    so it is auto-loaded in every session.

---

## Git commit conventions

### Format — Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]
```

### Scopes

The scope is **always required** — every commit must have one.
**Never mix more than one scope in the same commit.**

| Scope          | When to use                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `cdkx`         | Repo-level changes not tied to a specific package (root configs, `nx.json`, `.github/`, `opencode.json`, `AGENTS.md`, etc.) |
| `core`         | `@cdk-x/core`                                                                                                               |
| `cli`          | `@cdk-x/cli`                                                                                                                |
| `engine`       | `@cdk-x/engine`                                                                                                             |
| `testing`      | `@cdk-x/testing`                                                                                                            |
| `hetzner`      | `@cdk-x/hetzner`                                                                                                            |
| `spec-to-cdkx` | `@cdk-x/spec-to-cdkx`                                                                                                       |

If changes affect multiple packages → **one commit per scope**.

### Types

| Type       | When to use                                                        |
| ---------- | ------------------------------------------------------------------ |
| `feat`     | New functionality                                                  |
| `fix`      | Bug fixes                                                          |
| `docs`     | Documentation-only changes (CONTEXT.md, README, JSDoc)             |
| `style`    | Formatting changes (prettier, whitespace) without affecting logic  |
| `refactor` | Code changes that neither add features nor fix bugs                |
| `test`     | Adding or modifying tests (specs, snapshots)                       |
| `chore`    | Build, configs, dependencies, nx.json, etc.                        |
| `ci`       | CI/CD pipeline changes (GitHub Actions, workflows, Nx Cloud, etc.) |
| `wip`      | Work in progress — temporary commits not intended for release      |

### Subject

- **Maximum 72 characters**
- **Lowercase**, no trailing period
- Use the **imperative** ("add", not "added" or "adds")
- Be specific but concise

### Body (optional)

- Explain **what** and **why**, not how
- Use bullet points (`-`) to list multiple changes
- Leave a blank line between subject and body

### Small, atomic commits

**CRITICAL:** Each commit must represent **a single logical change**.

- PRs are easier to review
- Git history is more readable and traceable
- Surgical rollbacks if something breaks
- More effective `git bisect` for finding bugs
- More precise semantic releases and changelogs

**Golden rule:** if you use "and" in the subject, you probably need 2 commits.

---

## Workflow for analysing and committing changes

### 1. Analyse the scope

```bash
git status          # modified files
git diff --stat     # summary
git diff            # full diff
```

### 2. Group changes

Group by **scope** (affected package), then sub-group by **type and
functionality**:

```
Scope: core
  ├─ fix:  PropertyValue now includes IResolvable
  └─ docs: document implicit dependency resolution

Scope: hetzner
  ├─ feat: networkId getter on NtvHetznerNetwork
  ├─ feat: subnetId getter on NtvHetznerSubnet
  ├─ test: cross-resource reference tests
  └─ docs: document cross-resource reference pattern
```

### 3. Propose the plan to the user

**Before making any commit**, present the ordered list:

```
I propose splitting the changes into N commits:

1. fix(core): include IResolvable in PropertyValue type
   git add packages/core/src/lib/constants.ts

2. feat(hetzner): add networkId attribute getter to NtvHetznerNetwork
   git add packages/providers/hetzner/src/lib/networking/ntc-hetzner-network.ts

...

Does this look right?
```

### 4. Execute the commits

Use `git add` **file by file** — **never `git add .` or `git add -A`** when
there are changes across multiple scopes or functionalities.

```bash
# Commit 1
git add packages/core/src/lib/constants.ts
git commit -m "fix(core): include IResolvable in PropertyValue type"

# Commit 2
git add packages/providers/hetzner/src/lib/networking/ntc-hetzner-network.ts
git commit -m "feat(hetzner): add networkId attribute getter to NtvHetznerNetwork"
```

Use `git add -p` (patch mode) only when a single file contains changes of
different nature that must go into separate commits.

### 5. Verify after each commit

```bash
git log -1 --stat   # verify the commit
git status          # see what is left to commit
```

---

## Special cases

### Automatic formatting (prettier)

If prettier reformats files on save, mixing formatting with logic:

1. **Commit 1:** the logic changes (`git add -p` if needed)
2. **Commit 2:** `style(<scope>): format with prettier`

Best practice: run `yarn nx run <scope>:format` **before** writing code to
separate formatting noise from the actual change.

### Refactor touching multiple files in the same scope

If a refactor touches N files but is **a single logical operation** (e.g.
renaming a class and updating all its imports), it is **one commit**:

```bash
git add packages/core/src/lib/foo.ts
git add packages/core/src/lib/bar.ts
git commit -m "refactor(core): rename Foo to Bar"
```

### Feat + test + docs (same scope)

These are **three separate commits**, in this order:

```bash
# 1. The feature
git commit -m "feat(hetzner): add subnetId getter to NtvHetznerSubnet"

# 2. The tests
git commit -m "test(hetzner): add cross-resource reference tests for subnet"

# 3. The docs
git commit -m "docs(hetzner): document cross-resource reference pattern"
```

---

## Well-formed commit examples

```bash
# Fix with explanatory body
git commit -m "fix(core): include IResolvable in PropertyValue type

PropertyValue now accepts IResolvable tokens (Lazy, ResourceAttribute, etc.)
that are resolved by the ResolverPipeline at synthesis time. Fixes type errors
when passing attribute getters as resource props."

# Simple feature
git commit -m "feat(hetzner): add networkId attribute getter to NtvHetznerNetwork"

# Docs
git commit -m "docs(core): document implicit dependency resolution pattern"

# Chore
git commit -m "chore(hetzner): configure jest in verbose mode"
```
