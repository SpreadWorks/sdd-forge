# Feature Specification: 045-flow-state-step-tracking

**Feature Branch**: `feature/045-flow-state-step-tracking`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User request

## Goal
SDD フローの進捗状態を永続化し、会話が途切れても現在のステップと実装項目の状況を復帰できるようにする。

## Scope
- `flow-state.js`: `current-spec` → `flow.json` にリネーム、steps / requirements フィールド追加
- `flow.js`: DIRECT_COMMAND → サブコマンドディスパッチャー化（`start` / `status`）
- `status` サブコマンド: 表示・ステップ更新・requirements 管理
- スキル（SKILL.md）3ファイルの更新
- `specs/commands/init.js`: `flow.json` への書き込み形式変更（steps 初期化含む）

## Out of Scope
- フロー状態の自動復元（AI が自動的に途中から再開する仕組み）
- Web UI やダッシュボード
- 複数フローの並行管理

## Clarifications (Q&A)
- Q: ステップ粒度は？
  - A: sdd-flow-start の全10ステップ（approach, branch, spec, draft, fill-spec, approval, gate, test, implement, finalize）
- Q: サマリーの形式は？
  - A: spec.md の Requirements から抽出した項目リスト。各項目に status を持たせる
- Q: ステータスの値は？
  - A: steps: pending / in_progress / done / skipped。requirements: pending / in_progress / done
- Q: ステータス更新の責務は？
  - A: スキル（SKILL.md）に指示を追加し、AI が CLI を呼び出して更新
- Q: ファイル名は？
  - A: `current-spec` → `flow.json`。close 時に spec フォルダに移動して履歴保存
- Q: コマンド体系は？
  - A: `sdd-forge flow start "<要望>"` / `sdd-forge flow status [options]`

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-13
- Notes: Draft phase completed, all requirements confirmed via Q&A

## Requirements
1. `flow-state.js` を更新: ファイル名を `flow.json` に変更、`steps` 配列と `requirements` 配列を FlowState に追加
2. `flow.js` をサブコマンドディスパッチャーに変更: `start` と `status` を分岐
3. `flow start` サブコマンド: 旧 `flow --request` の機能を移植
4. `flow status` サブコマンド（表示）: 引数なしでステップ進捗 + requirements 進捗を表示
5. `flow status` サブコマンド（更新）: `--step <id> --status <val>` でステップ更新、`--req <index> --status <val>` で requirement 更新、`--summary '<JSON>'` で requirements リスト一括保存
6. `specs/commands/init.js` 更新: `flow.json` に steps の初期状態を含めて保存
7. `sdd-flow-start/SKILL.md` 更新: 各ステップ完了時に `sdd-forge flow status --step ... --status done` を呼ぶ指示を追加
8. `sdd-flow-close/SKILL.md` 更新: close 時に `flow.json` を spec フォルダに移動する指示を追加
9. `sdd-flow-status/SKILL.md` 更新: ステップ進捗 + requirements 進捗を表示する手順に拡充

## Acceptance Criteria
- `sdd-forge flow status` でステップ一覧と各 status が表示される
- `sdd-forge flow status --step gate --status done` でステップが更新される
- `sdd-forge flow status --req 0 --status done` で requirement 項目が更新される
- `sdd-forge flow start "..."` で従来の flow 機能が動作する
- close 後に `specs/NNN-xxx/flow.json` に履歴が残る
- 既存テストが壊れない

## Open Questions
- [x] requirements の `--summary` で渡す JSON 形式 → strings の配列。CLI 側で `{ desc, status: "pending" }` に変換する
