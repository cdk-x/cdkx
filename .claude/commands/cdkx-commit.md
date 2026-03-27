---
description: Guide for making atomic commits using Conventional Commits with strict scope separation. Use when preparing to commit changes to ensure proper commit message format, atomic commits, and correct scope assignment. Supports filtering by specific scope(s) or processing all scopes.
---

# cdkx Conventional Commits

Guide for making atomic commits using Conventional Commits with strict scope separation in the cdkx monorepo.

## When to Use This Skill

Use this skill when:

### All Scopes (Default Mode)

- User says "quiero commitear" or "I want to commit"
- User says "hacer commit" or "make a commit"
- Preparing to commit all changes

### Specific Scope(s) Mode

- User says "quiero hacer los commits de **engine**"
- User says "I want to commit scope **engine**"
- User says "hacer commits de **engine y cli**"
- User says "commit only **core and testing** changes"
- User says "quiero commitear **hetzner**"
- User says "commits for **engine, cli, core**"

### General Cases

- Reviewing changes before committing
- Analyzing scope of modifications
- Planning commit strategy for multiple changes

## Scope Selection Modes

The skill supports three modes based on user input:

### Mode 1: All Scopes (Default)

**Trigger:** No specific scope mentioned

**Behavior:**

- Analyze ALL modified files across ALL scopes
- Propose commits for every scope with changes
- Process scopes in order: cdkx → core → cli → engine → testing → hetzner → spec-to-cdkx

### Mode 2: Single Scope

**Trigger:** "quiero hacer los commits de engine"

**Behavior:**

- Filter to ONLY specified scope
- Ignore all other scopes completely
- Process only files matching the scope directory pattern

### Mode 3: Multiple Scopes

**Trigger:** "quiero hacer los commits de engine y cli" or "commit core, testing, and cli"

**Behavior:**

- Filter to ONLY specified scopes
- Ignore all other scopes
- Process scopes in specified order
- Group commits by scope

### Scope Parsing Algorithm

1. **Extract scope keywords from user input:**
   - Look for scope names: cdkx, core, cli, engine, testing, hetzner, spec-to-cdkx
   - Support separators: "y", "and", "e", ",", "&"

2. **Examples of valid inputs:**
   - "engine" → [engine]
   - "engine y cli" → [engine, cli]
   - "core, testing and cli" → [core, testing, cli]
   - "core & engine" → [core, engine]
   - "commits de hetzner e engine" → [hetzner, engine]

3. **If no scopes detected → Mode 1 (All Scopes)**

## Scopes

**CRITICAL:** The scope is **always required** — every commit must have one.
**Never mix more than one scope in the same commit.**

| Scope          | Package                 | Directory Pattern                                                                      | When to use                         |
| -------------- | ----------------------- | -------------------------------------------------------------------------------------- | ----------------------------------- |
| `cdkx`         | Repo-level              | Root configs (`opencode.json`, `nx.json`, `.github/`, `.vscode/`, root `package.json`) | Root configs and repo-level changes |
| `core`         | `@cdkx-io/core`         | `packages/core/**`                                                                     | Core package changes                |
| `cli`          | `@cdkx-io/cli`          | `packages/cli/**`                                                                      | CLI package changes                 |
| `engine`       | `@cdkx-io/engine`       | `packages/engine/**`                                                                   | Engine package changes              |
| `testing`      | `@cdkx-io/testing`      | `packages/testing/**`                                                                  | Testing package changes             |
| `hetzner`      | `@cdkx-io/hetzner`      | `packages/providers/hetzner/**`                                                        | Hetzner provider changes            |
| `spec-to-cdkx` | `@cdkx-io/spec-to-cdkx` | `packages/tools/spec-to-cdkx/**`                                                       | Spec-to-cdkx tool changes           |

**Rule:** If changes affect multiple packages → **one commit per scope**.

### File-to-Scope Detection

Examples of how to detect scope from file paths:

```
packages/core/src/lib/app.ts → core
packages/cli/src/commands/deploy.ts → cli
packages/engine/src/lib/state.ts → engine
packages/providers/hetzner/hetzner/src/lib/adapter.ts → hetzner
packages/tools/spec-to-cdkx/src/lib/generator.ts → spec-to-cdkx
opencode.json → cdkx
.github/workflows/test.yml → cdkx
```

## Types

| Type       | When to use                                                        |
| ---------- | ------------------------------------------------------------------ |
| `feat`     | New functionality                                                  |
| `fix`      | Bug fixes                                                          |
| `docs`     | Documentation-only changes (AI.md, README, JSDoc)                  |
| `style`    | Formatting changes (prettier, whitespace) without affecting logic  |
| `refactor` | Code changes that neither add features nor fix bugs                |
| `test`     | Adding or modifying tests (specs, snapshots)                       |
| `chore`    | Build, configs, dependencies, nx.json, etc.                        |
| `ci`       | CI/CD pipeline changes (GitHub Actions, workflows, Nx Cloud, etc.) |
| `wip`      | Work in progress — temporary commits not intended for release      |

## Subject Rules

- **Maximum 72 characters**
- **Lowercase**, no trailing period
- Use the **imperative** ("add", not "added" or "adds")
- Be specific but concise

## Atomic Commits

**CRITICAL:** Each commit must represent **a single logical change**.

**Golden rule:** If you use "and" in the subject, you probably need 2 commits.

## Commit Workflow

### Step 1: Detect Mode and Scopes

Parse user input to determine:

- **Mode:** All scopes OR Specific scope(s)
- **Target Scopes:** List of scopes to process (or all if Mode = All)

### Step 2: Analyze Changes

```bash
git status          # Get all modified files
git diff --stat     # Get statistics
git diff            # Get full diff
```

**Filter by scopes (if Mode = SPECIFIC):**

- Only keep files matching the target scope patterns
- Completely ignore files from other scopes

### Step 3: Group Changes by Scope and Type

For each target scope, group by type (feat/fix/docs/etc.)

### Step 4: Propose Plan to User

Present commit plan with exact `git add` commands for each commit. Ask for confirmation before executing.

### Step 5: Execute Commits

Use `git add` **file by file** — **never `git add .` or `git add -A`** when there are changes across multiple scopes or functionalities.

```bash
git add packages/core/src/lib/constants.ts
git commit -m "fix(core): include IResolvable in PropertyValue type"
```

Use `git add -p` (patch mode) only when a single file contains changes of different nature.

### Step 6: Verify After Each Commit

```bash
git log -1 --stat   # verify the commit
git status          # see what is left
```

## Special Cases

### Feat + Test + Docs (Same Scope)

These are **three separate commits**, in this order:

```bash
git commit -m "feat(hetzner): add subnetId getter to NtvHetznerSubnet"
git commit -m "test(hetzner): add cross-resource reference tests for subnet"
git commit -m "docs(hetzner): document cross-resource reference pattern"
```

## Common Mistakes to Avoid

1. **Mixing scopes in one commit** — split into one commit per scope
2. **Using "and" in subject** — split into two commits
3. **Using `git add .` without analysis** — always review first
4. **Wrong type** — don't use `feat` for bug fixes or `chore` for features
5. **Non-imperative mood** — "add" not "added"
6. **Subject too long** — keep under 72 characters
7. **Adding Claude Code as co-author** — NEVER add `Co-Authored-By: Claude` or any Claude Code trailer to commits or PR descriptions
