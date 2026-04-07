# <!--

# SYNC IMPACT REPORT

Version Change: 1.0.0 → 1.0.0 (Initial ratification)
Modified Principles: N/A (initial creation)
Added Sections: All 6 principles + Governance + Architecture Standards + Release Management
Removed Sections: None
Templates Requiring Updates:
✅ .specify/templates/spec-template.md - Aligned with test-first principle
✅ .specify/templates/plan-template.md - Constitution Check section validated
✅ .specify/templates/checklist-template.md - Consistent with documentation requirements
✅ .specify/templates/tasks-template.md - Follows atomic commit convention
⚠ .specify/templates/constitution-template.md - No changes needed (source template)
Follow-up TODOs: None
================================================================================
-->

# cdkx Constitution

## Core Principles

### I. OOP-First Architecture

All code MUST follow Object-Oriented Programming principles. No standalone `export function` declarations are permitted. Every utility, helper, or service MUST be a class with static or instance methods.

**Rationale**: This mirrors the AWS CDK design, keeps the API surface consistent and predictable, and enables better encapsulation and testing. Classes provide clear boundaries for dependencies and state management.

**Compliance**:

- All functions MUST be methods on classes
- Static utility classes are acceptable (e.g., `TypeMapper.mapType()`)
- Factory patterns and dependency injection MUST use classes

---

### II. Strict TypeScript - No `any`

All packages MUST use TypeScript strict mode. The use of `any` type is forbidden everywhere except one intentional escape hatch: `Lazy.any()` returns `any` by design to allow assignment to any typed property without casting.

**Rationale**: Type safety prevents runtime errors, enables better IDE support, and documents the API contract explicitly. Strict mode ensures comprehensive type coverage across the codebase.

**Compliance**:

- Use `unknown` instead of `any` for type-safe operations
- Explicit type annotations for public APIs
- One exception: `Lazy.any()` with mandatory `// eslint-disable-next-line @typescript-eslint/no-explicit-any`

---

### III. CommonJS Throughout

No package SHALL set `"type": "module"` in `package.json`. All packages MUST emit CommonJS. Local imports MUST be extensionless (no `.js` extension).

**Rationale**: Consistent module format across the monorepo simplifies tooling and ensures compatibility. Extensionless imports work correctly with `moduleResolution: node` at both compile time and runtime.

**Compliance**:

- All `package.json` files MUST NOT include `"type": "module"`
- Local imports MUST omit file extensions (e.g., `import { App } from '../app/app'`)
- Node.js built-ins MAY use explicit extensions where required

---

### IV. Test-First Development (NON-NEGOTIABLE)

All functionality MUST be developed with tests written before or alongside implementation. Tests MUST be co-located with source files (`foo/foo.spec.ts` lives next to `foo/foo.ts`).

**Rationale**: Co-located tests ensure visibility, reduce barriers to testing, and keep tests synchronized with source changes. Test-first development catches design flaws early and documents expected behavior.

**Compliance**:

- Every source file SHOULD have a corresponding `.spec.ts` file
- Test helpers MUST be placed in `test/helpers/` and NOT exported from public barrel
- Unit tests MUST use Jest with SWC for fast execution
- Integration tests MUST validate end-to-end workflows

---

### V. Documentation-First

Every package MUST maintain an `AI.md` file at its root documenting: purpose, workspace setup, architecture, class inventory, relationships, release configuration, coding conventions, and file map.

**Rationale**: Comprehensive documentation ensures knowledge persistence, enables AI-assisted development, and reduces onboarding friction. AI.md files capture design decisions that code alone cannot express.

**Compliance**:

- All packages MUST have `AI.md` at package root
- AI.md MUST be updated in the same commit as code changes
- Documentation MUST be written in English
- JSDoc comments MUST explain "what" and "why", not "how"

---

### VI. Monorepo Boundaries

The workspace SHALL be organized as an Nx monorepo with clear package boundaries. Each package MUST have a single responsibility and explicit dependencies.

**Rationale**: Clear boundaries enable independent versioning, prevent circular dependencies, and support scalable development. Nx provides tooling for task orchestration and dependency management.

**Compliance**:

- Packages MUST follow naming convention `@cdk-x/<name>`
- Cross-package dependencies MUST be explicit in `package.json`
- New libraries MUST follow the 11-step checklist in conventions.md
- Release groups MUST be configured in `nx.json`

---

### VII. Atomic Commits

All changes MUST be committed as atomic units - one logical change per commit. Conventional Commits format is mandatory: `<type>(<scope>): <subject>`.

**Rationale**: Atomic commits enable precise code review, surgical rollbacks, and effective `git bisect`. Conventional Commits enable automated changelog generation and semantic versioning.

**Compliance**:

- NEVER mix multiple scopes in one commit
- Type MUST be one of: feat, fix, docs, style, refactor, test, chore, ci, wip
- Subject MUST be imperative mood, lowercase, max 72 chars
- Body MUST explain "what" and "why", not "how"

---

### VIII. Code Quality Automation

All code MUST pass automated quality gates: Prettier formatting, ESLint rules, and TypeScript strict mode.

**Rationale**: Automated quality enforcement ensures consistency, reduces cognitive load in reviews, and prevents style debates. Prettier (singleQuote, trailingComma: all, printWidth: 80) ensures uniform formatting.

**Compliance**:

- Run `yarn nx run <package>:format` after modifying any `.ts` file
- ESLint MUST pass with zero warnings
- TypeScript MUST compile with strict mode
- All tests MUST pass before committing

---

## Architecture Standards

### Construct Tree Pattern

The application architecture follows the CDK pattern:

```
App (root construct)
 └── Stack (one per provider / deployment unit)
      └── ProviderResource (one per infrastructure resource)
```

**Rules**:

- `App` is the root of the construct tree (scope: undefined)
- `Stack` targets exactly one `Provider` (required prop, immutable)
- `ProviderResource` represents a single infrastructure resource with `logicalId`
- Circular dependencies MUST use lazy `require()` inside function bodies

### Synthesis & Deployment Pipeline

Two-phase workflow:

1. **Synthesis** (`cdkx synth`): User TypeScript app builds construct tree, calls `app.synth()`, produces cloud assembly (manifest.json + per-stack JSON templates)
2. **Deployment** (`cdkx deploy`): Engine reads cloud assembly, resolves tokens, builds dependency graph, calls provider APIs in topological order

### Layered Constructs

| Layer       | Naming   | Description                                                                   |
| ----------- | -------- | ----------------------------------------------------------------------------- |
| L1 (Native) | `NtvXxx` | Thin typed wrapper over `ProviderResource`. Auto-generated by `spec-to-cdkx`. |
| L2          | `Xxx`    | Higher-level abstractions (typed props, convenience methods). Future work.    |

---

## Release Management

### Versioning Strategy

All packages follow Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes to public APIs or governance principles
- **MINOR**: New features, principles, or sections added
- **PATCH**: Clarifications, wording fixes, non-semantic refinements

### Release Groups

| Group   | Packages                                                                   | Tag Pattern        | Versioning        |
| ------- | -------------------------------------------------------------------------- | ------------------ | ----------------- |
| `core`  | `@cdk-x/core`, `@cdk-x/engine`, `@cdk-x/testing`, `@cdk-x/hetzner` | `core-v{version}`  | Lock-step (fixed) |
| `cli`   | `@cdk-x/cli`                                                             | `cli-v{version}`   | Independent       |
| `tools` | `@cdk-x/spec-to-cdkx`                                                    | `tools-v{version}` | Independent       |

**Rules**:

- `updateDependents: "never"` - releasing core does not auto-bump CLI
- `adjustSemverBumpsForZeroMajorVersion: true` - on 0.x, feat bumps minor
- Conventional Commits drive version bumps automatically

---

## Governance

### Amendment Procedure

1. **Proposal**: Create a PR proposing constitutional changes with rationale
2. **Review**: All maintainers MUST review and approve
3. **Impact Analysis**: Update dependent templates and documentation
4. **Version Bump**: Increment constitution version per semantic rules
5. **Ratification**: Merge to main with conventional commit: `docs(cdkx): amend constitution to vX.Y.Z`

### Compliance Verification

All PRs MUST verify compliance with this constitution:

- OOP principles respected (no standalone functions)
- TypeScript strict mode enabled
- Tests co-located and comprehensive
- Documentation (AI.md) updated
- Atomic commits with conventional format
- Code formatted with Prettier

### Runtime Guidance

For day-to-day development guidance, refer to:

- `.opencode/rules/conventions.md` - Coding conventions and library checklist
- `.opencode/rules/architecture.md` - Cross-cutting architecture decisions

---

**Version**: 1.0.0 | **Ratified**: 2025-03-18 | **Last Amended**: 2025-03-18
