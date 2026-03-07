# Feature Specification: 022-refactor-non-setup-high-priority-items

**Feature Branch**: `feature/022-refactor-non-setup-high-priority-items`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User request

## Goal
- 既存挙動を維持しながら、setup 以外の高優先リファクタリングを実施し、保守性と不具合耐性を改善する。

## Scope
- `src/flow.js` の i18n 参照不整合修正
- `src/lib/agent.js` の同期/非同期呼び出し前処理の重複排除
- `src/docs/commands/text.js` の並列実行キュー重複排除
- `src/docs/commands/text.js` のセクション境界判定ロジック共通化
- `src/docs.js` の `process.argv` 書き換え依存低減
- コマンドエントリの direct-run 判定ボイラープレート共通化

## Out of Scope
- `src/docs/commands/setup.js` の分割・再設計（今回除外）
- 新機能追加や CLI 仕様変更
- preset/template 文言の変更

## Clarifications (Q&A)
- Q: `docs/commands/setup.js` も同時に触るか？
  - A: 触らない（ユーザー指定で除外）。
- Q: 挙動変更を許容するか？
  - A: 原則非許容。内部実装のみ改善し、既存テストを維持する。

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-07
- Notes: Implement all listed refactors except setup.js split (item 2)

## Requirements
-
1. `flow` の gate 失敗時メッセージ出力で未定義変数参照が起きないこと。
2. `agent` の引数解決・system prompt 処理・cleanup 処理の重複を共通関数に統合すること。
3. `text` の並列処理実装を共通ユーティリティに統合し、既存の同時実行数制御とエラーハンドリングを維持すること。
4. `text` の「ディレクティブ直後の既存生成内容をどこまで削除するか」の境界判定を単一ロジックに統一すること。
5. `docs build` 実行時のサブコマンド呼び出しでグローバルな `process.argv` 差し替えに依存しない構造へ寄せること。
6. 各コマンド末尾の direct-run 判定を共通ヘルパへ移し、同一挙動を維持すること。
7. 既存テストを更新し、変更箇所をカバーするテストを追加すること。

## Acceptance Criteria
-
1. `sdd-forge flow --spec ...` 経路で gate 失敗時に例外クラッシュせず、期待する i18n メッセージが出る。
2. `src/lib/agent.js` の同期/非同期処理で systemPrompt の挙動・timeout・stderr/stdout 取り扱いが既存互換である。
3. `src/docs/commands/text.js` のバッチ/ディレクティブ単位モードが既存テストで回帰しない。
4. `src/docs.js build` の挙動（scan/init/data/text/readme/agents と多言語分岐）が既存仕様どおりである。
5. 全テストが成功する（`npm run test`）。

## Open Questions
- [x] 2以外を対象として進める（ユーザー指定）
