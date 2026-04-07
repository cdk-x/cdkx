---
name: cdkx-conventional-commits
description: Guide for making atomic commits using Conventional Commits with strict scope separation. Use when preparing to commit changes to ensure proper commit message format, atomic commits, and correct scope assignment. Supports filtering by specific scope(s) or processing all scopes.
license: MIT
compatibility: opencode
metadata:
  scope: cdkx-monorepo
  convention: conventional-commits
  paradigm: atomic-commits
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
| `core`         | `@cdk-x/core`         | `packages/core/**`                                                                     | Core package changes                |
| `cli`          | `@cdk-x/cli`          | `packages/cli/**`                                                                      | CLI package changes                 |
| `engine`       | `@cdk-x/engine`       | `packages/engine/**`                                                                   | Engine package changes              |
| `testing`      | `@cdk-x/testing`      | `packages/testing/**`                                                                  | Testing package changes             |
| `hetzner`      | `@cdk-x/hetzner`      | `packages/providers/hetzner/**`                                                        | Hetzner provider changes            |
| `spec-to-cdkx` | `@cdk-x/spec-to-cdkx` | `packages/tools/spec-to-cdkx/**`                                                       | Spec-to-cdkx tool changes           |

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

## Body Rules (Optional)

- Explain **what** and **why**, not how
- Use bullet points (`-`) to list multiple changes
- Leave a blank line between subject and body

## Atomic Commits

**CRITICAL:** Each commit must represent **a single logical change**.

Benefits:

- PRs are easier to review
- Git history is more readable and traceable
- Surgical rollbacks if something breaks
- More effective `git bisect` for finding bugs
- More precise semantic releases and changelogs

**Golden rule:** If you use "and" in the subject, you probably need 2 commits.

## Commit Workflow

### Step 1: Detect Mode and Scopes

Parse user input to determine:

- **Mode:** All scopes OR Specific scope(s)
- **Target Scopes:** List of scopes to process (or all if Mode = All)

**Examples:**

```
Input: "quiero commitear"
→ Mode: ALL
→ Scopes: [cdkx, core, cli, engine, testing, hetzner, spec-to-cdkx]

Input: "quiero hacer los commits de engine"
→ Mode: SPECIFIC
→ Scopes: [engine]

Input: "hacer commits de engine y cli"
→ Mode: SPECIFIC
→ Scopes: [engine, cli]
```

### Step 2: Analyze Changes

Run analysis commands:

```bash
git status          # Get all modified files
git diff --stat     # Get statistics
git diff            # Get full diff
```

**Filter by scopes (if Mode = SPECIFIC):**

- Only keep files matching the target scope patterns
- Completely ignore files from other scopes
- Show summary: "Analyzing X scopes: engine, cli (ignoring: core, testing...)"

### Step 3: Group Changes

**For each target scope, group by type:**

**Mode ALL:**

```
Scope: core
  ├─ fix: PropertyValue now includes IResolvable
  └─ docs: document implicit dependency resolution

Scope: engine
  ├─ fix: resolve token resolution bug
  └─ feat: add persistent state manager

Scope: cli
  └─ feat: add deploy command
```

**Mode SPECIFIC (single scope):**

```
Scope: engine (Mode: SPECIFIC)
  ├─ fix: resolve token resolution bug
  ├─ feat: add persistent state manager
  └─ test: add state persistence tests

(Ignored scopes: core, cli, hetzner, testing, spec-to-cdkx, cdkx)
```

**Mode SPECIFIC (multiple scopes):**

```
Scope: engine
  ├─ fix: resolve token resolution bug
  └─ feat: add persistent state manager

Scope: cli
  └─ feat: add deploy command

(Ignored scopes: core, hetzner, testing, spec-to-cdkx, cdkx)
```

### Step 4: Propose Plan to User

**Mode ALL:**

```
I propose the following commits across all scopes:

Scope: core
1. fix(core): include IResolvable in PropertyValue type
   git add packages/core/src/lib/constants.ts
2. docs(core): document implicit dependency resolution
   git add packages/core/src/lib/resolvables/resolver-pipeline.ts

Scope: engine
1. fix(engine): resolve token resolution bug
   git add packages/engine/src/lib/deployment-engine.ts
2. feat(engine): add persistent state manager
   git add packages/engine/src/lib/state-persistence.ts

Does this look right?
```

**Mode SPECIFIC (single):**

```
Filtering for scope: engine

I propose 3 commits for engine:

1. fix(engine): resolve token resolution bug
   git add packages/engine/src/lib/deployment-engine.ts

2. feat(engine): add persistent state manager
   git add packages/engine/src/lib/state-persistence.ts

3. test(engine): add state persistence tests
   git add packages/engine/src/lib/event-bus.spec.ts

(Ignoring changes in: core, cli, hetzner, testing, spec-to-cdkx, cdkx)
Does this look right?
```

**Mode SPECIFIC (multiple):**

```
Filtering for scopes: engine, cli

I propose the following commits:

Scope: engine
1. fix(engine): resolve token resolution bug
   git add packages/engine/src/lib/deployment-engine.ts

Scope: cli
1. feat(cli): add deploy command
   git add packages/cli/src/commands/deploy.ts

(Ignoring changes in: core, hetzner, testing, spec-to-cdkx, cdkx)
Does this look right?
```

### Step 5: Execute Commits

**Mode ALL:** Process all scopes in order
**Mode SPECIFIC:** Process only target scope(s)

Use `git add` **file by file** — **never `git add .` or `git add -A`** when there are changes across multiple scopes or functionalities.

```bash
# Commit 1
git add packages/core/src/lib/constants.ts
git commit -m "fix(core): include IResolvable in PropertyValue type"

# Commit 2
git add packages/providers/hetzner/src/lib/networking/ntc-hetzner-network.ts
git commit -m "feat(hetzner): add networkId attribute getter to NtvHetznerNetwork"
```

Use `git add -p` (patch mode) only when a single file contains changes of different nature that must go into separate commits.

### Step 6: Verify After Each Commit

```bash
git log -1 --stat   # verify the commit
git status          # see what is left to commit (filtered by target scopes)
```

## Validations

### Invalid Scope Handling

If user specifies non-existent scope(s):

- Show error with list of valid scopes
- Offer to process all scopes or specify valid ones

```
Error: Scope 'invalido' not recognized.

Valid scopes are:
- cdkx, core, cli, engine, testing, hetzner, spec-to-cdkx

Would you like to:
1. Process all scopes?
2. Specify valid scope(s)?
```

### No Changes in Target Scope(s)

If specified scope(s) have no changes:

- Show message with available scopes that DO have changes
- Offer alternatives

```
No changes detected for scope: engine

Changes found in other scopes:
- core: 2 files
- cli: 1 file

Would you like to:
1. Check a different scope?
2. Process all scopes?
3. Cancel
```

### Mixed Valid and Invalid Scopes

If "engine y invalido":

- Option 1: Process only valid scope (engine) + warn about invalid
- Option 2: Ask for clarification before proceeding

## Special Cases

### Automatic Formatting (Prettier)

If prettier reformats files on save, mixing formatting with logic:

1. **Commit 1:** The logic changes (`git add -p` if needed)
2. **Commit 2:** `style(<scope>): format with prettier`

Best practice: Run `yarn nx run <scope>:format` **before** writing code to separate formatting noise from the actual change.

### Refactor Touching Multiple Files

If a refactor touches N files but is **a single logical operation** (e.g., renaming a class and updating all its imports), it is **one commit**:

```bash
git add packages/core/src/lib/foo.ts
git add packages/core/src/lib/bar.ts
git commit -m "refactor(core): rename Foo to Bar"
```

### Feat + Test + Docs (Same Scope)

These are **three separate commits**, in this order:

```bash
# 1. The feature
git commit -m "feat(hetzner): add subnetId getter to NtvHetznerSubnet"

# 2. The tests
git commit -m "test(hetzner): add cross-resource reference tests for subnet"

# 3. The docs
git commit -m "docs(hetzner): document cross-resource reference pattern"
```

## Examples

### Example 1: All Scopes (Default Mode)

**User:** "quiero commitear"

**Analysis:**

```
Found changes in 3 scopes:
- core: 2 files
- engine: 2 files
- cli: 1 file

(Ignoring: no scopes - processing all)
```

### Example 2: Single Scope

**User:** "quiero hacer los commits de engine"

**Analysis:**

```
Filtering for scope: engine

Found changes in engine:
- src/lib/deployment-engine.ts
- src/lib/state-persistence.ts
- src/lib/event-bus.spec.ts

(Ignoring changes in: core, cli, hetzner, testing, spec-to-cdkx, cdkx)
```

### Example 3: Multiple Scopes

**User:** "hacer commits de engine y cli"

**Analysis:**

```
Filtering for scopes: engine, cli

Found changes:
- engine: 2 files
- cli: 1 file

(Ignoring changes in: core, hetzner, testing, spec-to-cdkx, cdkx)
```

### Example 4: Invalid Scope

**User:** "quiero commitear invalido"

**Response:**

```
Error: Scope 'invalido' not recognized.

Valid scopes are:
- cdkx, core, cli, engine, testing, hetzner, spec-to-cdkx

Would you like to:
1. Process all scopes?
2. Specify a valid scope?
```

### Example 5: No Changes in Specified Scope

**User:** "quiero hacer los commits de engine" (but no engine changes)

**Response:**

```
No changes detected for scope: engine

Changes found in other scopes:
- core: 2 files
- cli: 1 file

Would you like to:
1. Check a different scope?
2. Process all scopes?
3. Cancel
```

## Well-formed Commit Examples

### Fix with Explanatory Body

```bash
git commit -m "fix(core): include IResolvable in PropertyValue type

PropertyValue now accepts IResolvable tokens (Lazy, ResourceAttribute, etc.)
that are resolved by the ResolverPipeline at synthesis time. Fixes type errors
when passing attribute getters as resource props."
```

### Simple Feature

```bash
git commit -m "feat(hetzner): add networkId attribute getter to NtvHetznerNetwork"
```

### Documentation

```bash
git commit -m "docs(core): document implicit dependency resolution pattern"
```

### Chore

```bash
git commit -m "chore(hetzner): configure jest in verbose mode"
```

### Style (Formatting Only)

```bash
git commit -m "style(core): format with prettier"
```

### Test

```bash
git commit -m "test(engine): add state machine transition tests"
```

### CI

```bash
git commit -m "ci: add GitHub Actions workflow for automated testing"
```

## Common Mistakes to Avoid

1. **Mixing scopes in one commit**
   - ❌ `git commit -m "fix(core,cli): resolve bugs"`
   - ✅ Split into: `fix(core): ...` and `fix(cli): ...`

2. **Using "and" in subject**
   - ❌ `git commit -m "feat(hetzner): add getter and fix bug"`
   - ✅ Split into two commits

3. **Using `git add .` without analysis**
   - Always review changes first with `git status` and `git diff`

4. **Wrong type for the change**
   - ❌ Using `feat` for a bug fix
   - ❌ Using `chore` for new functionality

5. **Non-imperative mood**
   - ❌ `git commit -m "feat(core): added new method"`
   - ✅ `git commit -m "feat(core): add new method"`

6. **Subject too long**
   - Keep it under 72 characters
   - Use body for detailed explanation

## Output Format

When analyzing commits, use this format:

```text
file:line - [scope/type] Description
```

Example:

```text
packages/core/src/lib/constants.ts:15 - [core/fix] Include IResolvable in PropertyValue type
packages/hetzner/src/lib/network.ts:42 - [hetzner/feat] Add networkId getter
```
