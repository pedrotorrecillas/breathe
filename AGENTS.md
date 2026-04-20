# AGENTS

Repository-level instructions for coding agents working in `breathe`.

## Workflow

- Check the current git status before editing.
- Start each new conversation in a fresh git worktree with its own branch. Do not reuse a dirty worktree from a previous task.
- Create new worktrees from `origin/main`. Treat `main` as the only development base.
- Do not revert or overwrite unrelated local changes.
- Prefer small, scoped changes that match the active Linear issue.
- Run the smallest relevant test set after changes.
- Before editing, confirm which files in the current worktree belong to the task and ignore unrelated dirty files.

## Git And Linear

- When work belongs to a Linear issue, include the issue ID in the commit message.
- Preferred commit style: `type(scope): short summary BRE-123`.
- Prefer including the same issue ID in branch names and PR titles so Linear auto-links the work.
- If a change closes a Linear issue, attach or reference the final commit or PR in Linear.
- Interpret delivery verbs precisely:
  - `commit`: create a local commit only; do not assume it was pushed
  - `push`: push the current feature branch to its remote; do not assume `main`, staging, or production changed
  - `merge to main`: integrate the pushed feature branch into `main` once it is ready
  - `deploy to staging`: deploy the intended commit from `main` to the staging environment; do not assume a push alone updated staging
- Never develop from a staging branch. If a repository still has `origin/staging`, treat it only as a deployment mirror required by tooling, not as a collaboration branch.
- Never claim something is "on staging" just because code was pushed or merged. Confirm the staging release actually completed and is serving the intended commit.
- Preferred flow:
  - work in a fresh feature branch from `origin/main`
  - commit and test there
  - push the feature branch
  - merge the intended commit(s) into `main`
  - when staging is requested, deploy the intended commit from `main`
- After a staging deploy, verify the live staging app is serving the new release before sharing the URL.

## Editing Rules

- Preserve existing product language and design direction unless the task is explicitly a rewrite.
- Keep auth, recruiter UI, runtime, and evaluation changes scoped; avoid mixing unrelated areas in one commit when possible.
- Add or update tests when behavior changes.
- For UI and visual design work, prefer using Ladle to preview and iterate on components or view fragments before or alongside route integration.
- Keep visual prototyping stories in `src/stories` aligned with the current theme and component behavior.

## Safety

- Never use destructive git commands like `git reset --hard` or `git checkout --` unless explicitly requested.
- Be careful in dirty worktrees: stage only the files that belong to the task at hand.
- If a worktree is dirty and the task needs a clean delivery path, create a new worktree instead of trying to clean or reuse the dirty one.
- For deploys, make sure build artifacts and local preview output are ignored so they do not bloat or break staging deploys.
