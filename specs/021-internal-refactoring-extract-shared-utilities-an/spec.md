# Feature Specification: 021-internal-refactoring-extract-shared-utilities-an

**Feature Branch**: `feature/021-internal-refactoring-extract-shared-utilities-an`
**Created**: 2026-03-07
**Status**: Draft
**Input**: User request

## Goal
- コードベース全体の重複コード削減・パターン統一により保守性を向上させる

## Scope

### R1: uiLang ロードパターンの共通化
- 12箇所に散在する uiLang ロードスニペットを `lib/config.js` の `loadUiLang(root)` に抽出
- 各コマンドファイルから共通関数を呼び出すよう変更

### R2: `.sdd-forge` パス定数の集約
- `lib/config.js` に `.sdd-forge` 関連のパスヘルパー（`sddDir(root)`, `outputDir(root)` 等）を定義
- 各ファイルのハードコードされたパス文字列をヘルパー呼び出しに置換

### R3: `loadAgentConfig()` の重複解消
- `agents.js` と `text.js` に存在する同一実装を `lib/agent.js` に移動

### R4: `main()` 呼び出しパターンの統一
- `specs/commands/gate.js`, `specs/commands/init.js` を `isDirectRun` ガード + エラーハンドリングのパターンに統一

### R5: SUMMARY_BUILDERS の動的化
- `scan.js` のハードコードされた4カテゴリ（controllers/models/shells/routes）を preset.json から動的に構築
- `node-cli` preset の `modules` カテゴリにも対応

### R6: DataSource ロード処理の統合
- `scan.js:loadScanSources()` と `resolver-factory.js:loadDataSources()` の共通ロジックを共有ユーティリティに抽出

### R7: タイムアウト定数の集約
- 各ファイルに散在するタイムアウト値を `lib/agent.js` に名前付き定数として集約

### R8: 巨大関数の分割
- `text.js`: カテゴリマッピング・プロンプト構築・テンプレート処理を別モジュールに分離
- `setup.js`: readline ヘルパー抽出、main() を機能単位のサブ関数に分割

### R9: dispatcher の PKG_DIR 解決統一
- `sdd-forge.js`, `docs.js`, `spec.js`, `flow.js` の PKG_DIR 解決を共有ユーティリティに抽出

## Out of Scope
- 新機能の追加
- preset 固有ロジックの変更（CakePHP2/Laravel/Symfony アナライザー）
- テストカバレッジの拡充（別 spec で対応）
- 外部 API・CLI インターフェースの変更

## Clarifications (Q&A)
- Q: 既存テストが通ることをどう担保するか？
  - A: 各リファクタリングステップごとに `npm run test` を実行し、全テスト PASS を確認する

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-07
- Notes:

## Requirements
- 全ての変更は振る舞いを変えないリファクタリングであること
- 既存テストが全て PASS すること
- ES modules のインポートパスが正しく解決されること

## Acceptance Criteria
- [x] R1: uiLang ロードが `loadUiLang()` に統一されている
- [x] R2: `.sdd-forge` パス文字列がヘルパー関数経由になっている
- [x] R3: `loadAgentConfig()` が `lib/agent.js` に一元化されている
- [x] R4: 全コマンドの `main()` 呼び出しパターンが統一されている
- [x] R5: SUMMARY_BUILDERS が preset.json から動的に構築されている
- [x] R6: DataSource ロードが共通ユーティリティに統合されている
- [x] R7: タイムアウト定数が `lib/agent.js` に集約されている
- [x] R8: `text.js` と `setup.js` の巨大関数が分割されている
- [x] R9: PKG_DIR 解決が共有ユーティリティに統一されている
- [x] 全既存テストが PASS する

## Open Questions
- [x] R8 の text.js 分割時、新規ファイルの配置先は `src/docs/lib/` でよいか？ → Yes。`forge-prompts.js` 等と同階層に配置する。
