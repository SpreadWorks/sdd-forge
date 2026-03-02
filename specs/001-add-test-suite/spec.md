# Feature Specification: 001-add-test-suite

**Feature Branch**: `feature/001-add-test-suite`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User request

## Goal
- sdd-forge の全コマンド・ライブラリに対するテストスイートを構築し、安全なリファクタリングと機能追加を可能にする

## Scope
- テストフレームワーク: `node:test` + `node:assert` (外部依存ゼロ維持)
- テスト対象:
  - **lib/**: cli.js, config.js, types.js, i18n.js, process.js, agent.js, projects.js
  - **docs/commands/**: scan, init, data, text, readme, forge, review, changelog, agents, setup, default-project
  - **specs/commands/**: init (spec), gate
  - **トップレベル**: flow.js, help.js, sdd-forge.js (dispatcher), docs.js, spec.js
- テストファイル配置: `tests/` ディレクトリ (src/ と同階層)
- package.json に `test` スクリプト追加
- コマンドファイルのテスタビリティ改善 (isDirectRun ガード + main export)

## Out of Scope
- 外部 AI エージェント呼び出しの実際の結合テスト (mock で対応)
- CakePHP2 プリセットのテスト (presets/ 配下)
- CI/CD パイプラインの構築
- カバレッジレポートツール導入

## Clarifications (Q&A)
- Q: テスト実行時に実ファイルシステムを操作してよいか？
  - A: テスト用の一時ディレクトリ (os.tmpdir) を使用し、テスト後にクリーンアップする

## User Confirmation
- [x] User approved this spec
- Confirmed at: 2026-03-02
- Notes: tests/ ディレクトリに配置

## Requirements

### 1. テストインフラ
- `tests/` ディレクトリを作成
- package.json に `"test": "node --test tests/**/*.test.js"` スクリプトを追加
- テストヘルパー (`tests/helpers/`) を作成:
  - `tmp-dir.js`: 一時ディレクトリ作成・クリーンアップユーティリティ
  - `mock-project.js`: テスト用プロジェクト構造の雛形生成

### 2. コマンドのテスタビリティ改善
- 各コマンドファイルに `isDirectRun` ガードを追加 (未対応ファイル)
- `main()` を named export する
- 既存の動作 (CLI 直接実行) を壊さない

### 3. lib/ ユニットテスト
- `tests/lib/cli.test.js`: parseArgs のパース検証、repoRoot/sourceRoot の環境変数分岐
- `tests/lib/config.test.js`: loadJsonFile, loadConfig, loadContext, saveContext, resolveProjectContext
- `tests/lib/types.test.js`: validateConfig, validateContext, resolveType, TYPE_ALIASES
- `tests/lib/i18n.test.js`: createI18n, t(), t.raw(), 言語切替
- `tests/lib/process.test.js`: runSync のラッパー動作
- `tests/lib/agent.test.js`: callAgent, resolveAgent (execFileSync を mock)
- `tests/lib/projects.test.js`: loadProjects, addProject, setDefault, resolveProject (FS を一時ディレクトリで)

### 4. コマンドテスト
- 各コマンドの main() を import してテスト
- ファイルシステム操作は一時ディレクトリで実施
- 外部プロセス (git, AI agent) は mock / stub
- process.exit を mock して終了コード検証
- テストファイル配置:
  - `tests/docs/commands/*.test.js`
  - `tests/specs/commands/*.test.js`
  - `tests/flow.test.js`
  - `tests/help.test.js`

### 5. ディスパッチャーテスト
- `tests/dispatchers.test.js`: sdd-forge.js, docs.js, spec.js のルーティング検証
- サブプロセスとして起動し、exit code と stdout を検証

## Acceptance Criteria
- `npm test` で全テストが実行・パスする
- 各コマンドに最低 1 つの正常系テストと 1 つの異常系テストがある
- lib/ の各関数に境界値・エラーケースのテストがある
- テスト実行が外部サービス (AI agent) に依存しない
- テスト実行後にファイルシステムにゴミが残らない
- 既存の CLI 動作が変わらない

## Open Questions
- (none)
