# cdkx Monorepo — Development Context

Transversal context for the cdkx monorepo. This file is auto-loaded in every
OpenCode session from the workspace root.

> **Maintenance rule:** update this file whenever global monorepo conventions
> change (commits, releases, package structure, etc.).

---

## Git Commit Conventions

### Format — Conventional Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]
```

### Scopes

The scope is **always required** — every commit must have one.
**Never mix more than one scope in the same commit.**

| Scope     | When to use                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `cdkx`    | Repo-level changes not tied to a specific package (root configs, `nx.json`, `.github/`, `opencode.json`, `AGENTS.md`, etc.) |
| `core`    | `@cdk-x/core`                                                                                                               |
| `cli`     | `@cdk-x/cli`                                                                                                                |
| `testing` | `@cdk-x/testing`                                                                                                            |
| `hetzner` | `@cdk-x/hetzner`                                                                                                            |
| `engine`  | `@cdk-x/engine` (future)                                                                                                    |

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

3. feat(hetzner): add subnetId getter and IResolvable support to NtvHetznerSubnet
   git add packages/providers/hetzner/src/lib/networking/ntv-hetzner-subnet.ts

...

Does this look right?
```

### 4. Execute the commits

Use `git add` **file by file** — **never `git add .` or `git add -A`**
when there are changes across multiple scopes or functionalities.

```bash
# Commit 1
git add packages/core/src/lib/constants.ts
git commit -m "fix(core): include IResolvable in PropertyValue type"

# Commit 2
git add packages/providers/hetzner/src/lib/networking/ntc-hetzner-network.ts
git commit -m "feat(hetzner): add networkId attribute getter to NtvHetznerNetwork"

# etc.
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

If a refactor touches N files but is **a single logical operation**
(e.g. renaming a class and updating all its imports), it is **one commit**:

```bash
git add packages/core/src/lib/foo.ts
git add packages/core/src/lib/bar.ts
git add packages/core/src/lib/baz.ts
git commit -m "refactor(core): rename Foo to Bar"
```

### Feat + test + docs (same scope)

These are **three separate commits**, in this order:

```bash
# 1. The feature
git add packages/hetzner/src/lib/networking/ntv-hetzner-subnet.ts
git commit -m "feat(hetzner): add subnetId getter to NtvHetznerSubnet"

# 2. The tests
git add packages/hetzner/src/lib/networking/ntv-hetzner-subnet.spec.ts
git add packages/hetzner/src/lib/networking/__snapshots__/ntv-hetzner-subnet.spec.ts.snap
git commit -m "test(hetzner): add cross-resource reference tests for subnet"

# 3. The docs
git add packages/hetzner/CONTEXT.md
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

---

## Release configuration

See `packages/core/CONTEXT.md` for details on `nx release` and release groups.

## Package context files

Each package has its own `CONTEXT.md` with architecture, coding conventions,
and design decisions:

- `packages/core/CONTEXT.md`
- `packages/cli/CONTEXT.md`
- `packages/testing/CONTEXT.md`
- `packages/providers/hetzner/CONTEXT.md`
