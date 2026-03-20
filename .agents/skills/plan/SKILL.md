---
name: plan
description: Generate a technical plan for a spec issue and post it as a GitHub comment. Reads the spec from the GitHub issue, explores the codebase, resolves unknowns interactively, then shows a draft for review before publishing.
---

# /plan — Technical Plan

Reads an existing spec issue (created by `/spec`), explores the codebase, and produces a technical plan posted as a comment on that issue.

## Steps

1. **Get the spec issue number** from the user or conversation context.

2. **Fetch the spec**:
   ```
   gh issue view <number> --json title,body
   ```

3. **Explore the codebase** to understand:
   - Which packages and modules are affected
   - Existing patterns to follow or extend
   - Current data structures and interfaces relevant to the feature

4. **Read `CLAUDE.md`** (project constitution) — pay attention to:
   - Architecture section (package map, construct tree, deployment engine)
   - Design rules (OOP-first, no `any`, CommonJS, structured logging, etc.)
   - Coding conventions

5. **Resolve unknowns before drafting**. If exploration reveals genuine technical unknowns:
   - Ask the user clarifying questions inline — max 3, one at a time
   - Wait for each answer before asking the next
   - Incorporate answers into the plan
   - The final draft must contain no open questions

6. **Generate the plan draft** (see template below). All unknowns from step 5 are already resolved.

7. **Validate the constitution check** against `CLAUDE.md` design rules. Flag any deviations with justification.

8. **Show the full plan draft to the user for review.** Do NOT post the comment yet.

9. **Iterate** based on user feedback (back to step 6) until the user approves.

10. **On user approval**, post as a comment:
    ```
    gh issue comment <number> --body "$(cat <<'EOF'
    <plan content>
    EOF
    )"
    ```

11. **Report** the issue URL. The user can now run `/analyze <number>`.

---

## Plan Template

```markdown
## 📐 Technical Plan

### Architecture
[Key architectural decisions for this feature. Which patterns are used? Any new abstractions introduced?]

### Modules to build/modify
| Module | Action | Notes |
|--------|--------|-------|
| `packages/foo` | modify | [what changes and why] |
| `packages/bar` | create | [what it will contain] |

### Data Model
[Entities, relationships, and schema changes. Only if data structures are affected.]

### Interface contracts
[Public APIs, CLI schemas, events, or cross-package interfaces introduced or modified. Omit if not applicable.]

### Phases
- **Phase 1** (tracer bullet): [Thin end-to-end slice — demoable, validates architecture]
- **Phase 2**: [Expansion of the happy path]
- **Phase N**: [Polish, edge cases, non-functional requirements]

### Constitution check (CLAUDE.md)
- [x] OOP-first — no standalone exported functions
- [x] No `any` — strict TypeScript throughout
- [x] CommonJS — no `"type": "module"`, extensionless local imports
- [x] Co-located specs — `foo.spec.ts` next to `foo.ts`
- [x] Structured logging — string event key + context object
- [ ] [Any deviation with explicit justification]
```

---

## Rules

- Phases must map to the user stories in the spec issue
- Phase 1 is always a tracer bullet: a thin vertical slice that is end-to-end, demoable, and validates the architecture early
- No implementation detail is too small if it affects interface contracts or package boundaries
- If a module does not exist yet, say "create" and describe what it will contain
- If the spec has no data model implications, omit that section
