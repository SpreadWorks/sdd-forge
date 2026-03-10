# Feature Specification: 035-deprecate-project-context-forge-enriched

**Feature Branch**: `feature/035-deprecate-project-context-forge-enriched`
**Created**: 2026-03-10
**Status**: Draft
**Input**: Architecture discussion (specs/architecture-discussion-2026-03-09.md Part 4)

## Goal

projectContext を廃止し、forge コマンドを enriched analysis 対応にする。

enriched analysis の summary/detail が projectContext の役割を吸収するため、context.json および textFill.projectContext は不要になる。また、forge コマンドのプロンプトに enriched analysis のコンテキストを追加し、より正確なドキュメント改善を実現する。

## Scope

1. **projectContext 廃止**
   - `resolveProjectContext()` を削除
   - `context.json` の読み書き（`loadContext`, `saveContext`）を削除
   - `config.json` の `textFill.projectContext` フィールドを無視
   - setup コマンドから `--project-context` オプションを削除
   - forge コマンドの `maybeUpdateContext()` / `--auto-update-context` を削除
   - text-prompts.js の `buildTextSystemPrompt()` から projectContext パラメータを削除
   - agents.js の buildRefinePrompt() から projectContext 参照を削除

2. **forge コマンドの enriched analysis 対応**
   - `summaryToText()` を enriched analysis 対応に拡張（enrichedAt があれば summary/detail を使用）
   - forge プロンプトの `[SOURCE_ANALYSIS]` セクションに enriched データを含める

3. **テスト・ドキュメント更新**

## Out of Scope

- `textFill.preamblePatterns` の変更（そのまま維持）
- `textFill` フィールド自体の廃止（preamblePatterns が残るため）
- DataSource / `{{data}}` ディレクティブの再設計

## Clarifications (Q&A)

- Q: context.json ファイル自体はどうする？
  - A: 読み込みコードを削除する。既存のファイルは放置（ユーザーが手動で削除可能）。

- Q: setup の --project-context はどうする？
  - A: オプションを削除。setup では projectContext の入力を求めない。

- Q: forge --auto-update-context はどうする？
  - A: オプションと maybeUpdateContext() を削除。

- Q: enriched analysis がない場合の forge の動作は？
  - A: 従来通り summaryToText() のフォールバック（controllers/models/shells/routes のサマリー）を使用。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-10
- Notes: projectContext 廃止 + forge enriched 対応

## Requirements

### R1: projectContext 関連コードの削除

- `src/lib/config.js`: `loadContext()`, `saveContext()`, `resolveProjectContext()` を削除
- `src/lib/types.js`: `SddContext` typedef、`validateContext()` を削除
- `src/docs/commands/setup.js`: `--project-context` オプション、context.json 書き込みを削除
- `src/docs/commands/forge.js`: `maybeUpdateContext()` 関数、`--auto-update-context` オプション、`saveContext` import を削除
- `src/docs/commands/agents.js`: `resolveProjectContext` の参照を削除
- `src/docs/commands/text.js`: `resolveProjectContext` の import と使用を削除
- `src/docs/lib/text-prompts.js`: `buildTextSystemPrompt()` から projectContext パラメータを削除
- `src/docs/lib/forge-prompts.js`: `buildContextUpdatePrompt()` を削除
- locale ファイル: projectContext 関連のメッセージを削除
- テンプレート: `config.example.json` から `textFill.projectContext` を削除

### R2: forge の enriched analysis 対応

- `summaryToText()` を拡張: `enrichedAt` がある場合、全カテゴリの enriched entries から summary を収集してテキスト化
- enriched がない場合は既存の controllers/models/shells/routes サマリーをフォールバック
- forge プロンプトの `[SOURCE_ANALYSIS]` にこの拡張されたテキストが反映される

### R3: テスト更新

- `tests/lib/config.test.js`: `resolveProjectContext` テストを削除
- `tests/helpers/mock-project.js`: `textFill.projectContext` をデフォルト設定から削除
- forge-prompts テスト: enriched summaryToText のテストを追加

## Acceptance Criteria

- [ ] `resolveProjectContext()`, `loadContext()`, `saveContext()` が削除されている
- [ ] `sdd-forge setup` で projectContext の入力を求めない
- [ ] `sdd-forge forge --auto-update-context` がエラーになる（オプション削除）
- [ ] text コマンドが projectContext なしで正常動作する
- [ ] enriched analysis がある場合、forge プロンプトに enriched summary が含まれる
- [ ] enriched analysis がない場合、従来のサマリーにフォールバックする
- [ ] テストが全てパスする

## Open Questions

- (なし)
