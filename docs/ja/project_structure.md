# プロジェクト構成

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。主要ディレクトリの数と役割を踏まえること。"})}} -->

本プロジェクトの `src/` は 6 つの主要ディレクトリ（`docs/`・`spec/`・`flow/`・`lib/`・`presets/`・`templates/`）で構成されており、ドキュメント生成パイプライン、SDD ワークフロー管理、共通ライブラリ、プリセットテンプレート群をそれぞれ担当しています。`presets/` 配下には 20 以上のプロジェクトタイプ別プリセットがあり、`parent` チェーンによる継承構造でテンプレートを管理しています。
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
| src | 156 | cli, model, lib, config, test |
<!-- {{/data}} -->

### 共通ライブラリ

<!-- {{text({prompt: "共通ライブラリの一覧をクラス名・ファイルパス・責務の表形式で記述してください。"})}} -->

`src/lib/` にはプロジェクト全体で共有されるユーティリティが配置されています。

| クラス・関数名 | ファイルパス | 責務 |
| --- | --- | --- |
| `callAgent()` | `src/lib/agent.js` | AI エージェント呼び出しの共通インターフェース。プロンプト構築・タイムアウト管理を担当します |
| `PKG_DIR`, `repoRoot()`, `parseArgs()` | `src/lib/cli.js` | パッケージルート・リポジトリルートの解決、コマンドライン引数のパース処理を提供します |
| `loadConfig()`, `loadAnalysis()`, `sddDir()` | `src/lib/config.js` | `.sdd-forge/config.json` の読み込みと検証、各種パスの解決を行います |
| `isDirectRun()`, `runIfDirect()` | `src/lib/entrypoint.js` | モジュールが直接実行されたかインポートされたかを判定するガード処理です |
| `loadFlow()`, `saveFlow()`, `FLOW_STEPS` | `src/lib/flow-state.js` | SDD フローの状態を `flow.json` で永続化し、ステップ進行を管理します |
| `translate()`, `createI18n()` | `src/lib/i18n.js` | ドメインネームスペース付きの 3 層国際化処理を提供します |
| `selectOne()`, `selectMulti()` | `src/lib/multi-select.js` | ターミナル上での対話的な選択ウィジェットを提供します |
| `discoverPresets()`, `resolveChainSafe()` | `src/lib/presets.js` | プリセットの自動検出と `parent` チェーンによる継承解決を行います |
| `Progress`, `createLogger()` | `src/lib/progress.js` | ビルドパイプライン向けのプログレスバーとロガーを提供します |
| `deploySkill()`, `resolveSkillFile()` | `src/lib/skills.js` | スキルファイルの解決・シンボリックリンク作成によるデプロイ処理を行います |
| `validateConfig()`, `validateAgent()` | `src/lib/types.js` | JSDoc 型定義とコンフィグ・コンテキストのバリデーション処理です |

`src/docs/lib/` にはドキュメント生成エンジンの中核ライブラリが配置されています。

| クラス・関数名 | ファイルパス | 責務 |
| --- | --- | --- |
| `DataSource`, `Scannable()` | `src/docs/lib/data-source.js` | `{{data}}` ディレクティブ用リゾルバの基底クラスとスキャン機能ミキシンです |
| `createResolver()` | `src/docs/lib/resolver-factory.js` | プリセットチェーンに基づき DataSource インスタンスを生成するファクトリです |
| `parseDirectives()` | `src/docs/lib/directive-parser.js` | マークダウンコメント内の `{{data}}`・`{{text}}`・`{%block%}` ディレクティブを解析します |
| `resolveTemplateChain()`, `mergeLayers()` | `src/docs/lib/template-merger.js` | プロジェクトローカル → リーフ → ベースの順にテンプレートをマージするエンジンです |
| `buildTextPrompt()` | `src/docs/lib/text-prompts.js` | `{{text}}` ディレクティブ用の AI プロンプトを構築します |
| `mapWithConcurrency()` | `src/docs/lib/concurrency.js` | 並列度を制御しながら非同期タスクを実行するキューユーティリティです |
| `glob()`, `findAllMatches()`, `contentHash()` | `src/docs/lib/scanner.js` | ファイル探索・行数カウント・ハッシュ計算など汎用のソース解析ユーティリティです |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← 技術スタックと運用](stack_and_ops.md) | [CLI コマンドリファレンス →](cli_commands.md)
<!-- {{/data}} -->
