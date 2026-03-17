---
name: sdd-forge.flow-merge
description: Finalize the SDD workflow after implementation is complete. Use for documentation update, review, commit, merge, and cleanup.
---

# SDD Flow Merge

Use this skill when implementation is complete and the user approved finalization.

## Flow Progress Tracking

**MUST: Run `sdd-forge flow status --step <id> --status <val>` upon completion of each step to record flow progress.**

Available step IDs (this skill): `docs-update`, `docs-review`, `commit`, `merge`, `branch-cleanup`, `archive`
Available status values: `pending`, `in_progress`, `done`, `skipped`

## Context Recording (Compaction Resilience)

**MUST: Record key decisions for compaction recovery.**

- After each user choice, record: `sdd-forge flow status --note "<step>: <choice summary>"`

## Choice Format

Present choices in the following format:
```
──────────────────────────────────────────────────────────
  説明文（質問や状況の説明）
──────────────────────────────────────────────────────────

  [1] ラベル
  [2] ラベル
  [3] その他

```
- Do not combine the description and choices into one sentence. Description goes inside the lines, choices go outside.
- Add blank lines before and after the choices.

## CRITICAL: Step 0 — Present Options FIRST

**STOP. Do NOT proceed to any other step. You MUST present the options below and wait for the user's response before doing anything else. Do NOT read files, run commands, or take any action until the user selects an option.**

```
──────────────────────────────────────────────────────────
  終了処理の範囲を選択してください。
──────────────────────────────────────────────────────────

  [1] すべて実行
  [2] 個別に選択する

```

**After presenting this choice, output NOTHING else. Wait for the user to reply with their selection number.**

## Behavior per Option

- **Option 1 (すべて実行)**: Execute steps 1–8 in order without asking for each step.
- **Option 2 (個別に選択する)**: Before each of steps 3–7, present:
  ```
  ──────────────────────────────────────────────────────────
    このステップを実行しますか？
  ──────────────────────────────────────────────────────────

    [1] はい
    [2] スキップ
    [3] その他

  ```
  If 2, skip that step.

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
   Determine merge strategy based on flow.json state:

   - **Worktree** (`worktree: true`, `worktreePath` set):
     - Commit all changes in the worktree.
     - `git -C <mainRepoPath> merge --squash <featureBranch>`
     - `git -C <mainRepoPath> commit`

   - **Branch** (`featureBranch != baseBranch`, no worktree):
     - `git checkout <base-branch>`
     - `git merge --squash <feature-branch>`
     - `git commit`

   - **Spec-only** (`featureBranch == baseBranch`):
     - Just commit, skip merge (already on the correct branch).

   - **On complete**: `sdd-forge flow status --step merge --status done`
   - **If skipped**: `sdd-forge flow status --step merge --status skipped`

7. Clean up.
   - **On start**: `sdd-forge flow status --step branch-cleanup --status in_progress`
   Determine cleanup strategy based on flow.json state:

   - **Worktree** (`worktree: true`):
     - Present:
       ```
       ──────────────────────────────────────────────────────────
         worktree を削除します。
       ──────────────────────────────────────────────────────────

         [1] 削除する
         [2] 残す
         [3] その他

       ```
       - 1 → `git -C <mainRepoPath> worktree remove <worktreePath>` + verify diff is empty + `git -C <mainRepoPath> branch -D <featureBranch>`
       - 2 → Skip deletion.
     - Guide: "メインリポジトリに戻ってください: `cd <mainRepoPath>`"

   - **Branch** (`featureBranch != baseBranch`):
     - Verify diff is empty: `git diff <baseBranch> <featureBranch> --stat` (should produce no output).
     - Delete with `git branch -D <featureBranch>` (`-D` required because squash merge is not detected by `-d`).

   - **Spec-only**:
     - No branch/worktree cleanup needed.

   - **On complete**: `sdd-forge flow status --step branch-cleanup --status done`
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
sdd-forge flow status --note "<text>"
sdd-forge flow status --archive
```
