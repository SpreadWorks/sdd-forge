# Feature Specification: 012-default-worktree-path

**Feature Branch**: `feature/012-default-worktree-path`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User request

## Goal
- worktree 作成時のデフォルトパスを `.sdd-forge/worktree/<branch-name>/` にする
- `setup` 時にプロジェクトルートの `.gitignore` へ `.sdd-forge/` を追加する

## Scope
1. `specs/commands/init.js`: `--worktree` にパス引数がない場合、`.sdd-forge/worktree/<branch-name>/` をデフォルトパスとして使用する
2. `flow.js`: `--worktree` フラグをパスなしでも使えるようにする（デフォルトパスの自動生成）
3. `docs/commands/setup.js`: `ensureGitignore()` でプロジェクトルートの `.gitignore` に `.sdd-forge/worktree` を追加する
4. SKILL.md (`sdd-flow-start`): Worktree 選択時のパス質問フローを削除し、デフォルトパスが自動適用される旨に更新する

## Out of Scope
- worktree の削除・クリーンアップ機能
- 既存の明示的パス指定の動作変更（従来通り動作する）

## Clarifications (Q&A)
- Q: `--worktree` にパスが指定された場合の動作は？
  - A: 従来通り指定パスを使用する。デフォルトパスは引数なしの場合のみ。
- Q: `.sdd-forge/worktree` が既に `.gitignore` にある場合は？
  - A: 重複追加しない（`.tmp` と同じロジック）。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-05
- Notes: .sdd-forge/worktree をデフォルトパスに、setup で .gitignore 追加

## Requirements
1. `--worktree` オプションがパス引数なしで指定された場合、`.sdd-forge/worktree/<branch-name>/` をデフォルトパスとして自動生成する
2. `--worktree <path>` で明示的にパスが指定された場合は従来通りそのパスを使用する
3. `setup` 実行時にプロジェクトルートの `.gitignore` に `.sdd-forge/worktree` エントリを追加する（未登録の場合のみ）
4. SKILL.md (`sdd-flow-start`) の Worktree 選択時のパス質問フローを削除し、`--worktree` のみでデフォルトパスが使われる旨に更新する

## Acceptance Criteria
- `sdd-forge spec --title "test" --worktree` (パスなし) で `.sdd-forge/worktree/<branch>/` に worktree が作成される
- `sdd-forge spec --title "test" --worktree /custom/path` で従来通り `/custom/path` に作成される
- `sdd-forge setup` 後にプロジェクトルートの `.gitignore` に `.sdd-forge/worktree` が含まれる
- 既に `.sdd-forge/worktree` が `.gitignore` にある場合、重複追加されない

## Open Questions
- (none)
