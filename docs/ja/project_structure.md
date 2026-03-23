<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../project_structure.md) | **日本語**
<!-- {{/data}} -->

# プロジェクト構成

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。主要ディレクトリの数と役割を踏まえること。"})}} -->

本プロジェクトは `src/` 配下に CLI エントリポイント、ドキュメント生成エンジン（`src/docs/`）、共通ユーティリティ（`src/lib/`）、SDD フロー制御（`src/flow/`）、仕様コマンド（`src/spec/`）、および 20 種以上のプリセット（`src/presets/`）を持つ構成です。各プリセットは `data/`（DataSource）・`scan/`（スキャナ）・`tests/`（テスト）のサブディレクトリで構成され、`parent` チェーンにより基底プリセットの機能を継承します。
<!-- {{/text}} -->

## 内容

### ディレクトリ構成

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/docs/commands/    (cli)
src/docs/data/    (model)
src/docs/lib/    (lib)
src/flow/commands/    (cli)
src/lib/    (lib, cli, config)
src/presets/base/data/    (model, lib)
src/presets/cakephp2/data/    (model, lib)
src/presets/cakephp2/scan/    (lib)
src/presets/cakephp2/tests/unit/    (test)
src/presets/ci/data/    (lib)
src/presets/ci/scan/    (lib)
src/presets/cli/data/    (lib)
src/presets/database/data/    (lib)
src/presets/drizzle/data/    (lib)
src/presets/drizzle/scan/    (lib)
src/presets/drizzle/tests/unit/    (test)
src/presets/edge/data/    (lib)
src/presets/graphql/data/    (lib)
src/presets/graphql/scan/    (lib)
src/presets/graphql/tests/unit/    (test)
src/presets/hono/data/    (lib)
src/presets/hono/scan/    (lib)
src/presets/hono/tests/unit/    (test)
src/presets/laravel/data/    (lib)
src/presets/laravel/scan/    (config, lib)
src/presets/laravel/tests/e2e/    (test)
src/presets/laravel/tests/unit/    (test)
src/presets/lib/    (lib)
src/presets/monorepo/data/    (lib)
src/presets/nextjs/data/    (lib)
src/presets/nextjs/scan/    (lib)
src/presets/nextjs/tests/unit/    (test)
src/presets/postgres/data/    (lib)
src/presets/r2/data/    (lib)
src/presets/storage/data/    (lib)
src/presets/symfony/data/    (lib)
src/presets/symfony/scan/    (lib)
src/presets/symfony/tests/e2e/    (test)
src/presets/symfony/tests/unit/    (test)
src/presets/webapp/data/    (lib)
src/presets/workers/data/    (lib)
src/presets/workers/scan/    (lib)
src/presets/workers/tests/unit/    (test)
src/spec/commands/    (cli)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### 各ディレクトリの責務\n", labels: "ディレクトリ|ファイル数|役割", ignoreError: true})}} -->
### 各ディレクトリの責務

| ディレクトリ | ファイル数 | 役割 |
| --- | --- | --- |
| src | 157 | cli, model, lib, config, test |
<!-- {{/data}} -->

### 共通ライブラリ

<!-- {{text({prompt: "共通ライブラリの一覧をクラス名・ファイルパス・責務の表形式で記述してください。"})}} -->

| クラス / モジュール名 | ファイルパス | 責務 |
| --- | --- | --- |
| `runSync()` | `src/lib/process.js` | `spawnSync` ラッパーによる同期コマンド実行 |
| `isDirectRun()`, `runIfDirect()` | `src/lib/entrypoint.js` | モジュール直接実行の検出とガード処理 |
| `loadSddTemplate()` | `src/lib/agents-md.js` | AGENTS.md 用 SDD テンプレートセクションの読み込み |
| `PKG_DIR`, `repoRoot()`, `sourceRoot()` | `src/lib/cli.js` | パッケージディレクトリ解決・ワークスペースルート検出 |
| `Progress` | `src/lib/progress.js` | ビルドパイプライン向けプログレスバーとロガー |
| `loadJsonFile()`, `resolveConcurrency()` | `src/lib/config.js` | 設定ファイル読み込みと並行数のデフォルト解決 |
| `callAgent()` | `src/lib/agent.js` | AI エージェント呼び出し（spawn 経由） |
| `resolveChain()`, `discoverPresets()` | `src/lib/presets.js` | プリセット自動検出と親チェーン解決 |
| `createI18n()`, `translate()` | `src/lib/i18n.js` | ドメイン名前空間付き 3 層 i18n システム |
| `validateConfig()` | `src/lib/types.js` | 型定義とコンフィグバリデーション |
| `deploySkills()` | `src/lib/skills.js` | スキルファイルのデプロイ処理 |
| `derivePhase()`, `FLOW_STEPS` | `src/lib/flow-state.js` | SDD ワークフロー状態の永続化とフェーズ判定 |
| `extractBalancedJson()` | `src/lib/json-parse.js` | AI レスポンスからの括弧均衡 JSON 抽出 |
| `DataSource` | `src/docs/lib/data-source.js` | `{{data}}` ディレクティブ解決の基底クラス |
| `ScanSource`, `Scannable` | `src/docs/lib/scan-source.js` | ソースコード解析の基底クラスとミックスイン |
| `loadDataSources()` | `src/docs/lib/data-source-loader.js` | DataSource の非同期ローダー |
| `parseBlocks()` | `src/docs/lib/directive-parser.js` | `{{data}}`, `{{text}}` テンプレートディレクティブのパーサー |
| `createResolver()` | `src/docs/lib/resolver-factory.js` | DataSource ローダーとオーバーライドキャッシュ |
| `resolveCommandContext()` | `src/docs/lib/command-context.js` | 全コマンド共通のコンテキスト解決（ルート・言語・設定・エージェント） |
| `buildLayers()`, `mergeBlocks()` | `src/docs/lib/template-merger.js` | ボトムアップ方式のテンプレート継承とブロックマージ |
| `mapWithConcurrency()` | `src/docs/lib/concurrency.js` | 並行数制限付きの並列キューワーカー |
| `detectTestEnvironment()` | `src/docs/lib/test-env-detection.js` | analysis.json からのテストフレームワーク自動検出 |
| `summaryToText()` | `src/docs/lib/forge-prompts.js` | analysis.json を AI プロンプトテキストへ変換 |
| `parseComposer()`, `parseEnvFile()` | `src/presets/lib/composer-utils.js` | composer.json パースと .env 変数抽出 |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← 技術スタックと運用](stack_and_ops.md) | [CLI コマンドリファレンス →](cli_commands.md)
<!-- {{/data}} -->
