# Feature Specification: 020-gate-phase-and-flow-close

**Created**: 2026-03-07
**Status**: Draft

## Goal

1. `sdd-forge gate` にフェーズ概念を導入し、実装前チェックと実装後チェックを分離する
2. sdd-flow-close スキル用に終了処理の選択肢を提供する

## Scope

### 1. Gate フェーズ

`--phase` オプションを追加:

| Phase | 対象 | 無視 |
|---|---|---|
| `pre` (デフォルト) | セクション存在、User Confirmation、TBD/TODO/FIXME、Open Questions の未チェック | Status の未チェックタスク、Acceptance Criteria の未チェックタスク |
| `post` | 全ての未チェック項目（現在の動作） | なし |

`pre` フェーズでは、Acceptance Criteria セクション内と Status セクション内の `- [ ]` 行をスキップする。

### 2. sdd-flow-close

CLAUDE.md の手動手順を改善するスキル相当のフロー:

1. FlowState (`current-spec`) を読み込み、spec / baseBranch / featureBranch を特定
2. ユーザーに選択肢を提示:
   - **commit+merge**: feature ブランチでコミット → base ブランチにマージ → current-spec 削除
   - **docs+commit+merge**: forge + review → feature ブランチでコミット → base ブランチにマージ → current-spec 削除
3. マージ戦略は `config.flow.merge` に従う（デフォルト: "squash"）
4. マージ先は FlowState の `baseBranch`

## Out of Scope

- flow.js の自動化フロー変更
- worktree のクリーンアップ自動化

## Clarifications (Q&A)

- Q: flow.js 内の gate 呼び出しも `--phase pre` にするか？
  - A: はい。flow.js は実装前に gate を呼ぶので `--phase pre` がデフォルトで適切

## User Confirmation

- [x] User approved this spec

## Requirements

1. `checkSpecText()` に `phase` パラメータを追加
2. `--phase pre` 時に Status / Acceptance Criteria 内の `- [ ]` を無視するロジック
3. 既存テストの維持 + 新規テスト追加
4. flow-close 処理の実装

## Acceptance Criteria

- [x] `sdd-forge gate --phase pre` で Acceptance Criteria の未チェックがエラーにならない
- [x] `sdd-forge gate --phase post` で全未チェックがエラーになる（現行動作）
- [x] `sdd-forge gate` (phase 省略) がデフォルトで `pre` として動作する
- [x] flow.js の gate 呼び出しが正しく動作する
- [x] 既存テストが全て PASS する

## Open Questions

None.
