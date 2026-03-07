# Feature Specification: 025-unify-lang-config-abolish-uilang

**Feature Branch**: `feature/025-unify-lang-config-abolish-uilang`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User request

## Goal
- `uiLang` を廃止し `lang` に統合する
- `lang` と `output` を必須設定項目にする
- 言語設定の責務を明確に分離する

## Scope
- `uiLang` の全参照箇所を `lang` に置き換える
- `loadUiLang()` を削除する
- `resolveDocLang()` を削除する（`lang` と `output` が必須のためフォールバック不要）
- `setup.js` の対話フローから `uiLang` プロンプトを削除し、`lang` と `output` を必須入力にする
- `types.js` のバリデーションを更新（`uiLang` 削除、`lang`/`output` 必須化）
- config 読み込み時に `lang` と `output` が未設定の場合はエラーを出す

## Out of Scope
- config.json のマイグレーションツール（alpha 版のため不要）
- `output` の詳細構造変更（既存の `output.default` / `output.languages` はそのまま）

## Clarifications (Q&A)
- Q: `lang` と `output` の責務分離は？
  - A: `lang` = 操作言語（CLI メッセージ、AGENTS.md、skills、spec テンプレート）。`output.default` = docs 生成のデフォルト言語。`output` から `lang` へのフォールバックはしない。
- Q: `uiLang` の既存設定はどうなる？
  - A: alpha 版のため後方互換は不要。`uiLang` が残っていても無視される。
- Q: `lang` 未設定時の挙動は？
  - A: `loadConfig()` 時点でエラーを出す。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-07
- Notes: lang and output both required, uiLang abolished

## Requirements
1. **`uiLang` 廃止**: config から `uiLang` フィールドを削除し、全参照を `lang` に変更
2. **`lang` 必須化**: CLI メッセージ・テンプレート選択・spec 言語に使用。未設定時はエラー
3. **`output` 必須化**: docs 生成言語設定。未設定時はエラー
4. **フォールバック廃止**: `resolveDocLang()` を削除。各コマンドは `config.lang` または `config.output.default` を直接参照
5. **`loadUiLang()` 削除**: `config.lang` を直接使用
6. **setup.js 更新**: `lang` と `output` を必須項目として対話フローに組み込む
7. **types.js 更新**: バリデーションスキーマから `uiLang` を削除し、`lang`/`output` を required に

## Acceptance Criteria
- `uiLang` がコードベースに残っていないこと（config 型定義・バリデーション・参照すべて）
- `loadUiLang()` と `resolveDocLang()` が削除されていること
- `lang` 未設定の config で適切なエラーメッセージが出ること
- `output` 未設定の config で適切なエラーメッセージが出ること
- `npm run test` が全件パスすること
- 各コマンドが `config.lang` を正しく使用していること

## Open Questions
- [x] `lang` と `output` 両方必須で良いか → ユーザー承認済み
