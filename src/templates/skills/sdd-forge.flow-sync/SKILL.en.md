---
name: sdd-forge.flow-sync
description: Sync documentation with code after merge. Use for PR merge, branch cleanup, docs generation, and commit on base branch.
---

# SDD Flow Sync

Sync documentation with code after merge.
Use after flow-finalize is complete, or when manual documentation sync is needed.

## Flow Progress Tracking

**MUST: Update the archived flow.json of the target spec upon completion of each step.**

Available step IDs (this skill): `pr-merge`, `sync-cleanup`, `docs-update`, `docs-review`, `docs-commit`
Available status values: `pending`, `in_progress`, `done`, `skipped`

Update method: Read/write the archived flow.json directly (do not use `sdd-forge flow status` as it targets the active flow.json).

## Choice Format

Present choices in the following format:
```
──────────────────────────────────────────────────────────
  Description (question or situation)
──────────────────────────────────────────────────────────

  [1] Label
  [2] Label
  [3] Other

```
- Do not combine the description and choices into one sentence. Description goes inside the lines, choices go outside.
- Add blank lines before and after the choices.

## Required Sequence

1. Discover pending specs.
   - Scan `specs/*/flow.json` for archived flow states.
   - Filter: specs where `docs-update` step is not `done` are considered "pending sync".
   - List found specs to the user:
     ```
     ──────────────────────────────────────────────────────────
       Found specs with pending documentation sync.
       Select a spec to sync.
     ──────────────────────────────────────────────────────────

       [1] specs/NNN-xxx (PR #M / squash merged)
       [2] specs/NNN-yyy (PR #M / squash merged)
       [3] All
       [4] Cancel

     ```
   - If no pending specs found, inform user and stop.

2. Determine scenario from archived flow.json.
   - Read `mergeStrategy` field from the selected spec's flow.json.
   - **PR route** (`mergeStrategy: "pr"`):
     - Check if PR is already merged: `gh pr view <featureBranch> --json state`
     - If not merged, offer to merge:
       ```
       ──────────────────────────────────────────────────────────
         PR has not been merged yet.
       ──────────────────────────────────────────────────────────

         [1] Merge PR (gh pr merge)
         [2] Skip (already merged manually or merge later)
         [3] Other

       ```
       - 1 → `gh pr merge <featureBranch> --squash --delete-branch`
       - Update step: `pr-merge` → `done`
     - If already merged → `pr-merge` → `skipped`
   - **Squash merge route** (`mergeStrategy: "squash"`):
     - `pr-merge` → `skipped`

3. Branch/worktree cleanup (PR route only).
   - If PR route and branch/worktree still exists:
     ```
     ──────────────────────────────────────────────────────────
       Removing feature branch/worktree.
     ──────────────────────────────────────────────────────────

       [1] Remove
       [2] Keep
       [3] Other

     ```
     - 1 → Delete local branch and/or worktree.
     - Update step: `sync-cleanup` → `done`
   - If not applicable → `sync-cleanup` → `skipped`

4. Ensure on base branch.
   - `git checkout <baseBranch>` if not already on it.
   - `git pull` to get latest changes (including merged PR).

5. Generate documentation.
   - Update step: `docs-update` → `in_progress`
   - If `docs/` has no chapter files:
     - Run `sdd-forge build`.
   - If `docs/` already has chapter files:
     - Run `sdd-forge forge --prompt "<change summary from spec>" --spec <spec-path>`.
   - Update step: `docs-update` → `done`

6. Review documentation.
   - Update step: `docs-review` → `in_progress`
   - `sdd-forge review`
   - If FAIL, fix issues and re-run. Do not proceed until PASS.
   - Update step: `docs-review` → `done`

7. Commit docs changes.
   - Update step: `docs-commit` → `in_progress`
   - `git add docs/ AGENTS.md CLAUDE.md` (and other generated files).
   - `git commit -m "docs: sync documentation for #NNN-xxx"`
   - Update step: `docs-commit` → `done`

8. Save updated flow.json.
   - Write the updated steps back to the archived `specs/NNN-xxx/flow.json`.
   - Report result to user.

## Config Dependencies

- `commands.gh`: PR merge requires the `gh` command. Only offer PR operations when `"enable"` and `gh` is available.
- `flow.push.remote`: Not used for PR merge fallback (PR merge is `gh`-only).

## Hard Stops

- Do not generate docs if base branch is not up to date.
- Do not commit if `sdd-forge review` FAIL.
- Do not proceed to next step without user confirmation.

## Commands

```bash
sdd-forge build
sdd-forge forge --prompt "<change summary>" --spec <spec-path>
sdd-forge review
gh pr view <branch> --json state
gh pr merge <branch> --squash --delete-branch
```
