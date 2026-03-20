---
name: sdd-forge.flow-sync
description: Sync documentation with code after merge. Use for PR merge, branch cleanup, docs generation, and commit on base branch.
---

# SDD Flow Sync

コードのマージ後にドキュメントをコードに追従させるスキル。
flow-finalize 完了後、またはドキュメントの手動同期が必要な場合に使用する。

## Flow Progress Tracking

**MUST: 各ステップの完了時に、対象 spec のアーカイブ済み flow.json を更新する。**

Available step IDs (this skill): `pr-merge`, `sync-cleanup`, `docs-update`, `docs-review`, `docs-commit`
Available status values: `pending`, `in_progress`, `done`, `skipped`

更新方法: アーカイブ済み flow.json はスキルが直接読み書きする（`sdd-forge flow status` は active flow.json 用のため使用しない）。

## Choice Format

選択肢は以下の形式で表示すること:
```
──────────────────────────────────────────────────────────
  説明文（質問や状況の説明）
──────────────────────────────────────────────────────────

  [1] ラベル
  [2] ラベル
  [3] その他

```
- 説明文と選択肢を一文にまとめない。説明文は罫線の中、選択肢は罫線の外。
- 選択肢の前後に空行を入れる。

## Required Sequence

1. Discover pending specs.
   - Scan `specs/*/flow.json` for archived flow states.
   - Filter: `docs-update` step が `done` でないものを「未同期」とする。
   - List found specs to the user:
     ```
     ──────────────────────────────────────────────────────────
       ドキュメント未同期の spec が見つかりました。
       同期する spec を選択してください。
     ──────────────────────────────────────────────────────────

       [1] specs/NNN-xxx (PR #M / squash merged)
       [2] specs/NNN-yyy (PR #M / squash merged)
       [3] すべて
       [4] キャンセル

     ```
   - If no pending specs found, inform user and stop.

2. Determine scenario from archived flow.json.
   - Read `mergeStrategy` field from the selected spec's flow.json.
   - **PR route** (`mergeStrategy: "pr"`):
     - Check if PR is already merged: `gh pr view <featureBranch> --json state`
     - If not merged, offer to merge:
       ```
       ──────────────────────────────────────────────────────────
         PR がまだマージされていません。
       ──────────────────────────────────────────────────────────

         [1] PR をマージする（gh pr merge）
         [2] スキップ（手動でマージ済み or 後でマージ）
         [3] その他

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
       feature ブランチ/worktree を削除します。
     ──────────────────────────────────────────────────────────

       [1] 削除する
       [2] 残す
       [3] その他

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

- `commands.gh`: PR マージに `gh` コマンドが必要。`"enable"` かつ `gh` 利用可能時のみ PR 操作を提供。
- `flow.push.remote`: `gh` がない場合のフォールバックには使わない（PR マージは `gh` 経由のみ）。

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
