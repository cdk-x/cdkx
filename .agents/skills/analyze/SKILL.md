---
name: analyze
description: Run a consistency analysis across the spec and plan of a GitHub issue. Detects duplication, ambiguity, underspecification, constitution violations, coverage gaps, and inconsistencies. Shows findings for review before posting as a comment.
---

# /analyze — Consistency Analysis

Reads a spec issue and its plan comment, runs a structured cross-artifact analysis, and posts the findings as a GitHub comment. Acts as a quality gate before running `/prd-to-issues`.

## Steps

1. **Get the spec issue number** from the user or conversation context.

2. **Fetch spec and plan**:
   ```
   gh issue view <number> --json title,body,comments
   ```
   - Spec = issue body (created by `/spec`)
   - Plan = the most recent comment that contains `## 📐 Technical Plan` (created by `/plan`)
   - If no plan comment is found, stop and ask the user to run `/plan` first.

3. **Read `CLAUDE.md`** to load the constitution rules used in the constitution check.

4. **Run 6 detection passes** (limit to 50 findings total across all passes):

   **A. Duplication** — Requirements or user stories that say the same thing in different words. Mark the lower-quality phrasing.

   **B. Ambiguity** — Vague adjectives without measurable criteria ("fast", "scalable", "secure", "easy"). Unresolved placeholders (`TODO`, `TBD`, `???`, `[NEEDS CLARIFICATION]`).

   **C. Underspecification** — Requirements with verbs missing object or outcome. Success criteria without a measurable threshold. User stories with no acceptance criteria alignment.

   **D. Constitution alignment** — Plan decisions that conflict with `CLAUDE.md` MUST rules (e.g., standalone exported functions, use of `any`, ESM modules). Constitution violations are automatically CRITICAL.

   **E. Coverage gaps** — Functional requirements from the spec with no corresponding plan phase. Plan phases that address no spec requirement. Non-functional requirements absent from the plan.

   **F. Inconsistencies** — Terminology drift (same concept named differently across spec and plan). Entities referenced in the plan but absent from the spec. Conflicting requirements.

5. **Assign severity** to each finding:
   - **CRITICAL**: Constitution violation, missing core artifact, requirement with zero coverage that blocks baseline functionality
   - **HIGH**: Duplicate or conflicting requirement, ambiguous security/performance criterion, untestable acceptance criterion
   - **MEDIUM**: Terminology drift, missing non-functional task coverage, underspecified edge case
   - **LOW**: Wording improvements, minor redundancy

6. **Show the full analysis report to the user for review.** Do NOT post the comment yet.

7. **Iterate** if the user wants to adjust the spec or plan before publishing (back to step 4 after changes).

8. **On user approval**, post as a comment:
   ```
   gh issue comment <number> --body "$(cat <<'EOF'
   <analysis content>
   EOF
   )"
   ```

9. **If CRITICAL issues exist**, explicitly recommend resolving them before running `/prd-to-issues`. Suggest which skill to re-run (`/spec` or `/plan`).

---

## Analysis Report Template

```markdown
## 🔍 Consistency Analysis

### Findings

| ID | Category | Severity | Location | Summary | Recommendation |
|----|----------|----------|----------|---------|----------------|
| A1 | Duplication | MEDIUM | REQ-3, REQ-7 | Both state the same upload constraint | Remove REQ-7, merge into REQ-3 |
| D1 | Constitution | CRITICAL | Plan › Modules | Proposes standalone `export function` | Wrap in a static class method |

### Coverage Summary

| Requirement | Has Plan Phase? | Phase | Notes |
|-------------|----------------|-------|-------|
| REQ-1 | ✅ | Phase 1 | |
| REQ-4 | ❌ | — | No phase maps to this requirement |

### Metrics
- Total functional requirements: N
- Requirements with plan coverage: N (N%)
- Critical issues: N
- High issues: N
- Medium issues: N
- Low issues: N

### Verdict
> ✅ Ready for `/prd-to-issues` — no critical issues found.
>
> — or —
>
> ❌ Not ready — N critical issue(s) must be resolved first. Re-run `/plan` to address D1.
```

---

## Rules

- This skill is **read-only with respect to GitHub** until the user approves
- Do not suggest rewriting the spec or plan inline — only report findings and recommendations
- If the user asks to fix an issue found in the analysis, help them update the relevant skill output first, then re-run the affected detection passes
- Constitution violations (`CLAUDE.md` MUST rules) are always CRITICAL — no exceptions
