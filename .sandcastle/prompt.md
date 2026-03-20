# ISSUES

Issues JSON is provided at start of context. Parse it to get open issues with their bodies and comments.

You've also been passed the last 10 RALPH commits (SHA, date, full message). Review these to understand what work has been done.

# TASK SELECTION

Pick the next task. Prioritize tasks in this order:

1. Critical bugfixes
2. Tracer bullets for new features

Tracer bullets comes from the Pragmatic Programmer. When building systems, you want to write code that gets you feedback as quickly as possible. Tracer bullets are small slices of functionality that go through all layers of the system, allowing you to test and validate your approach early. This helps in identifying potential issues and ensures that the overall architecture is sound before investing significant time in development.

TL;DR - build a tiny, end-to-end slice of the feature first, then expand it out.

3. Polish and quick wins
4. Refactors

If all tasks are complete, output <promise>COMPLETE</promise>.

# EXPLORATION

Explore the repo and fill your context window with relevant information that will allow you to complete the task.

# EXECUTION

Complete the task.

# COMMIT

Make a git commit directly using `git add` and `git commit`. Do NOT use interactive skills or ask for confirmation — commit autonomously.

The commit message must follow this format exactly:

```
type(scope): short description

Body with:
- Task completed + PRD reference
- Key decisions made
- Files changed
- Blockers or notes for next iteration

Agent: ralph
```

Rules:
1. `type` is one of: feat, fix, chore, refactor, test, docs
2. `scope` is the package name (e.g. engine, core, hetzner-runtime, cli)
3. If multiple scopes, use the most relevant one
4. `Agent: ralph` must be the last line of the commit body
5. Stage only the files relevant to the task (`git add <specific files>`)
6. Then push: `git push`

Keep it concise.

# THE ISSUE

If the task is complete, close the original GitHub issue.

If the task is not complete, leave a comment on the GitHub issue with what was done.

# FINAL RULES

ONLY WORK ON A SINGLE TASK.
