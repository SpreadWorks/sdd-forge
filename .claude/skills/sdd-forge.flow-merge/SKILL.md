---
name: sdd-forge.flow-merge
description: Finalize the SDD workflow after implementation is complete. Use for documentation update, review, commit, merge, and cleanup.
---

# SDD Flow Merge

Use this skill when implementation is complete and the user approved finalization.

## Flow Progress Tracking

**MUST: 各ステップの完了時に `sdd-forge flow status --step <id> --status <val>` を実行してフロー進捗を記録する。**

Available step IDs (this skill): `docs-update`, `docs-review`, `commit`, `merge`, `branch-cleanup`, `archive`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## CRITICAL: Step 0 — Present Options FIRST

**STOP. Do NOT proceed to any other step. You MUST present the options below and wait for the user's response before doing anything else. Do NOT read files, run commands, or take any action until the user selects an option.**

終了処理:

| # | Label |
|---|---|
| 1 | すべて実行 |
| 2 | 個別に選択する |

**After presenting this table, output NOTHING else. Wait for the user to reply with their selection number.**

## Behavior per Option

- **Option 1 (すべて実行)**: Execute steps 1–8 in order without asking for each step.
- **Option 2 (個別に選択する)**: Before each of steps 3–7, ask "実行しますか？ (y/n)" and skip if the user answers no.

## Required Sequence

1. Load context.
   - Read `.sdd-forge/flow.json` to get spec path, base branch, worktree info, and progress.
   - Run `sdd-forge flow status` to display current state.

2. Check current state.
   - `git rev-parse --abbrev-ref HEAD` — confirm on feature branch.
   - `git status --short` — check uncommitted changes.
   - If `worktree: true` in flow.json, confirm working in worktree directory.

3. Update documentation.
   - **On start**: `sdd-forge flow status --step docs-update --status in_progress`
   - If `docs/` has no chapter files:
     - Run `sdd-forge build`.
   - If `docs/` already has chapter files:
     - Run `sdd-forge forge --prompt "<change summary>" --spec <spec-path>`.
   - **On complete**: `sdd-forge flow status --step docs-update --status done`
   - **If skipped**: `sdd-forge flow status --step docs-update --status skipped`

4. Review documentation.
   - **On start**: `sdd-forge flow status --step docs-review --status in_progress`
   - `sdd-forge review`
   - If FAIL, fix issues and re-run. Do not proceed until PASS.
   - **On complete**: `sdd-forge flow status --step docs-review --status done`
   - **If skipped**: `sdd-forge flow status --step docs-review --status skipped`

5. Commit all changes on feature branch.
   - **On start**: `sdd-forge flow status --step commit --status in_progress`
   - Stage relevant files with `git add`.
   - Commit with a clear message describing the changes.
   - **On complete**: `sdd-forge flow status --step commit --status done`
   - **If skipped**: `sdd-forge flow status --step commit --status skipped`

6. Merge into base branch.
   - **On start**: `sdd-forge flow status --step merge --status in_progress`
   - Run `sdd-forge flow merge` to execute squash merge (strategy is auto-detected from flow.json).
   - Use `sdd-forge flow merge --dry-run` first if the user wants to preview.
   - **On complete**: Step status is updated by the merge command.
   - **If skipped**: `sdd-forge flow status --step merge --status skipped`

7. Clean up.
   - **On start**: `sdd-forge flow status --step branch-cleanup --status in_progress`
   - Run `sdd-forge flow cleanup` to delete branch/worktree (strategy is auto-detected from flow.json).
   - Use `sdd-forge flow cleanup --dry-run` first if the user wants to preview.
   - For worktree mode, guide user: "メインリポジトリに戻ってください: `cd <mainRepoPath>`"
   - **On complete**: Step status is updated by the cleanup command.
   - **If skipped**: `sdd-forge flow status --step branch-cleanup --status skipped`

8. Archive flow.json & final verification.
   - **On start**: `sdd-forge flow status --step archive --status in_progress`
   - **Archive flow.json**: Run `sdd-forge flow status --archive` to move `.sdd-forge/flow.json` to the spec directory for historical record.
   - `git status --short` — confirm tree is clean.
   - Report result to user.
   - **On complete**: Step is marked done by `--archive` command.

## Hard Stops

- Do not merge if `sdd-forge review` FAIL (when docs update is selected).
- Do not merge if working tree is not clean.
- Do not use destructive git commands (`reset --hard`, `push --force`).

## Commands

```bash
sdd-forge build
sdd-forge forge --prompt "<change summary>" --spec <spec-path>
sdd-forge review
sdd-forge flow status
sdd-forge flow status --step <id> --status <val>
sdd-forge flow status --archive
sdd-forge flow merge [--dry-run]
sdd-forge flow cleanup [--dry-run]
```
