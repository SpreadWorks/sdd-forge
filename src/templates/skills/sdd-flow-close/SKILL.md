---
name: sdd-flow-close
description: Finalize the SDD workflow after implementation is complete. Use for documentation update, review, commit, merge, and cleanup.
---

# SDD Flow Close

Use this skill when implementation is complete and the user approved finalization.

## CRITICAL: Step 0 — Present Options FIRST

**STOP. Do NOT proceed to any other step. You MUST present the options below and wait for the user's response before doing anything else. Do NOT read files, run commands, or take any action until the user selects an option.**

終了処理の範囲を選んでください:

| # | Label |
|---|---|
| 1 | ドキュメント更新+コミット+マージ+ブランチ削除 |
| 2 | ドキュメント更新 |
| 3 | コミット |
| 4 | コミット+マージ |
| 5 | コミット+マージ+ブランチ削除 |

**After presenting this table, output NOTHING else. Wait for the user to reply with their selection number.**

## Applicable Steps per Option

| Step | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 1. Load context | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2. Check current state | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3. Update documentation | ✓ | ✓ | — | — | — |
| 4. Review documentation | ✓ | ✓ | — | — | — |
| 5. Commit | ✓ | — | ✓ | ✓ | ✓ |
| 6. Merge | ✓ | — | — | ✓ | ✓ |
| 7. Clean up (branch delete) | ✓ | — | — | — | ✓ |
| 8. Final verification | ✓ | ✓ | ✓ | ✓ | ✓ |

## Required Sequence

1. Load context.
   - Read `.sdd-forge/current-spec` to get spec path, base branch, and worktree info.

2. Check current state.
   - `git rev-parse --abbrev-ref HEAD` — confirm on feature branch.
   - `git status --short` — check uncommitted changes.
   - If `worktree: true` in current-spec, confirm working in worktree directory.

3. Update documentation.
   - If `docs/` has no chapter files:
     - Run `sdd-forge build`.
   - If `docs/` already has chapter files:
     - Run `sdd-forge forge --prompt "<change summary>" --spec <spec-path>`.

4. Review documentation.
   - `sdd-forge review`
   - If FAIL, fix issues and re-run. Do not proceed until PASS.

5. Commit all changes on feature branch.
   - Stage relevant files with `git add`.
   - Commit with a clear message describing the changes.

6. Merge into base branch.
   Determine merge strategy based on current-spec state:

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

7. Clean up.
   Determine cleanup strategy based on current-spec state:

   - **Worktree** (`worktree: true`):
     - Ask user: "worktree を削除しますか？"
       1. **削除（推奨）** — `git -C <mainRepoPath> worktree remove <worktreePath>` + verify diff is empty + `git -C <mainRepoPath> branch -D <featureBranch>`
       2. **残す** — Skip deletion.
     - Guide: "メインリポジトリに戻ってください: `cd <mainRepoPath>`"

   - **Branch** (`featureBranch != baseBranch`):
     - Verify diff is empty: `git diff <baseBranch> <featureBranch> --stat` (should produce no output).
     - Delete with `git branch -D <featureBranch>` (`-D` required because squash merge is not detected by `-d`).

   - **Spec-only**:
     - No branch/worktree cleanup needed.

   - Remove `.sdd-forge/current-spec`.

8. Final verification.
   - `git status --short` — confirm tree is clean.
   - Report result to user.

## Hard Stops

- Do not merge if `sdd-forge review` FAIL (when docs update is selected).
- Do not merge if working tree is not clean.
- Do not use destructive git commands (`reset --hard`, `push --force`).

## Commands

```bash
sdd-forge build
sdd-forge forge --prompt "<change summary>" --spec <spec-path>
sdd-forge review
```
