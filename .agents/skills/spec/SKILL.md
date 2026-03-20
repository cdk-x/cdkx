---
name: spec
description: Create a feature specification as a GitHub issue. Use after /grill-me to formalize the feature into a structured spec with problem statement, user stories, functional requirements, and success criteria. Shows draft for review before publishing.
---

# /spec — Feature Specification

Converts a feature description (ideally already stress-tested with `/grill-me`) into a structured specification published as a GitHub issue with label `spec`.

## Steps

1. **Extract key concepts** from the feature description provided by the user:
   - Actors (who uses this?)
   - Actions (what do they do?)
   - Data (what entities are involved?)
   - Constraints (what limits or rules apply?)

2. **Fill the spec template** (see below). Rules:
   - All requirements must be testable (avoid vague verbs like "support", "handle", "manage")
   - All success criteria must be measurable and tech-agnostic
   - Mark genuine unknowns as `[NEEDS CLARIFICATION: <specific question>]` — max 3 total
   - Remove optional sections that do not apply

3. **If `[NEEDS CLARIFICATION]` markers remain**, extract them and ask the user now (before showing the draft). Max 3 questions, prioritised by impact. Wait for answers and incorporate them. The final draft must have zero unresolved markers.

4. **Show the full spec draft to the user for review.** Do NOT create the GitHub issue yet.

5. **Iterate** based on user feedback (back to step 2) until the user approves.

6. **On user approval**, create the GitHub issue:
   ```
   gh issue create --title "<feature title>" --label spec --body "$(cat <<'EOF'
   <spec content>
   EOF
   )"
   ```

7. **Report** the created issue number and URL. The user will reference this number in `/plan` and `/analyze`.

---

## Spec Template

```markdown
## Problem Statement
[What problem does this solve, from the user's perspective? Why does it matter?]

## Solution
[What are we building to solve it? High-level description, no implementation details.]

## User Stories
1. As a <actor>, I want <feature>, so that <benefit>.
2. ...

## Functional Requirements
- [ ] REQ-1: [Testable requirement — use "must", "shall", clear pass/fail criteria]
- [ ] REQ-2: ...

## Success Criteria
- [ ] SC-1: [Measurable, tech-agnostic, user-focused, verifiable]
- [ ] SC-2: ...

## Key Entities
[Only if data is involved. List main entities and their relationships.]

## Assumptions
[Explicit assumptions made. If an assumption turns out wrong, the spec may need revision.]

## Edge Cases
[Identified edge cases and how the system should behave.]

## Out of Scope
[What is explicitly NOT being built in this feature.]
```

---

## Rules

- Focus on **what** and **why**, never **how** (no languages, frameworks, file paths, or implementation details)
- Written for any team member to understand, not just engineers
- Keep it concise — every line must earn its place
- If the codebase needs exploring to validate assumptions, do it before drafting
