# AGENTS

Repository-level instructions for coding agents working in `breathe`.

## Workflow

- Check the current git status before editing.
- Do not revert or overwrite unrelated local changes.
- Prefer small, scoped changes that match the active Linear issue.
- Run the smallest relevant test set after changes.

## Git And Linear

- When work belongs to a Linear issue, include the issue ID in the commit message.
- Preferred commit style: `type(scope): short summary BRE-123`.
- Prefer including the same issue ID in branch names and PR titles so Linear auto-links the work.
- If a change closes a Linear issue, attach or reference the final commit or PR in Linear.

## Editing Rules

- Preserve existing product language and design direction unless the task is explicitly a rewrite.
- Keep auth, recruiter UI, runtime, and evaluation changes scoped; avoid mixing unrelated areas in one commit when possible.
- Add or update tests when behavior changes.

## Safety

- Never use destructive git commands like `git reset --hard` or `git checkout --` unless explicitly requested.
- Be careful in dirty worktrees: stage only the files that belong to the task at hand.

