# Feature Specification: 070-init-lang-fallback-tests

**Feature Branch**: `feature/070-init-lang-fallback-tests`
**Created**: 2026-03-18
**Status**: Draft
**Input**: init の言語フォールバック・章選別テスト不足を解消する

## Goal

init コマンドの言語フォールバック動作と章選別ロジックのテストカバレッジを確保する。
spec #069 acceptance テストで発見されたテスト不足（`.tmp/next-test-improvements.md` #1）を解消する。

## Scope

1. e2e テスト3件を `tests/e2e/docs/commands/init.test.js` に追加
2. ユニットテスト1件を `tests/unit/docs/commands/init.test.js` に新規作成
3. `aiFilterChapters` を init.js から export（テスト可能にするため）

## Out of Scope

- en テンプレートの作成（#4 で別途対応）
- lang 層合成テスト（#2 で別途対応）
- symfony regex バグ修正（#3 で別途対応）
- 既存テストの変更

## Clarifications (Q&A)

- Q: aiFilterChapters の export 追加は破壊的変更か？
  - A: いいえ。named export の追加のみで既存動作に影響なし。

## User Confirmation

- [x] User approved this spec
- Confirmed at: 2026-03-18
- Notes: 5件の要件で合意

## Requirements

1. **e2e: フォールバック動作** — `languages: ["en", "ja"]`, `defaultLanguage: "en"`, `type: "webapp"` で init 実行 → webapp 全10章が `docs/` に生成されること
2. **e2e: 単一言語テンプレなし** — `languages: ["en"]`, `defaultLanguage: "en"`, `type: "webapp"` で init 実行 → base の en テンプレートのみ（4章）が生成されること
3. **e2e: config.chapters 明示指定** — `chapters: ["overview.md", "development.md"]` を config に指定して init 実行 → 指定した2章のみ生成、AI agent が呼ばれないこと
4. **unit: aiFilterChapters** — AI 応答のモックで章選別ロジックを検証（正常JSON/無効JSON/空配列/例外/purpose ルール）
5. **export 追加** — `src/docs/commands/init.js` の `aiFilterChapters` を named export する

## Acceptance Criteria

- [ ] `npm test` で全テスト PASS
- [ ] 新規テスト4件（e2e 3件 + unit 1件）が追加されている
- [ ] 既存テストが変更されていない
- [ ] `aiFilterChapters` が init.js から export されている

## Open Questions

（なし）
