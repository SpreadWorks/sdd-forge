<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../project_structure.md) | **日本語**
<!-- {{/data}} -->

# プロジェクト構成

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。主要ディレクトリの数と役割を踏まえること。"})}} -->

このプロジェクトは、CLI 本体を置く `src`、共通処理をまとめた `src/lib`、ワークフロー実行を担う `src/flow`、ドキュメント生成関連を扱う `src/docs`、各種プリセットとそのテストを集約した `src/presets` の 5 つの主要ディレクトリで構成されています。
特に `src/presets` は 122 ファイルを持つ最大の領域で、設定、共通ライブラリ、コントローラー、ルート、モデル、テストなど複数の役割をまとめて提供しています。
<!-- {{/text}} -->

## 内容

### ディレクトリ構成

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/docs/commands/    (cli)
src/docs/data/    (other)
src/docs/lib/    (lib)
src/flow/    (cli, config)
src/flow/commands/    (cli)
src/flow/get/    (cli)
src/flow/run/    (cli)
src/flow/set/    (cli)
src/lib/    (lib, config, model)
src/presets/base/data/    (other)
src/presets/base/tests/acceptance/    (test)
src/presets/base/tests/acceptance/fixtures/src/    (config, lib, controller)
src/presets/cakephp2/data/    (other, controller, lib)
src/presets/cakephp2/tests/acceptance/    (test)
src/presets/cakephp2/tests/unit/    (test)
src/presets/ci/data/    (lib)
src/presets/cli/data/    (lib)
src/presets/cli/tests/acceptance/    (test)
src/presets/cli/tests/acceptance/fixtures/src/    (cli, config)
src/presets/cli/tests/acceptance/fixtures/src/commands/    (cli)
src/presets/cli/tests/acceptance/fixtures/src/lib/    (lib)
src/presets/cli/tests/acceptance/fixtures/src/lib/rules/    (lib)
src/presets/database/data/    (lib)
src/presets/drizzle/data/    (lib)
src/presets/drizzle/tests/unit/    (test)
src/presets/edge/data/    (config)
src/presets/graphql/data/    (lib)
src/presets/graphql/tests/unit/    (test)
src/presets/hono/data/    (middleware)
src/presets/hono/tests/unit/    (test)
src/presets/js-webapp/tests/acceptance/    (test)
src/presets/js-webapp/tests/acceptance/fixtures/src/    (config, lib, other)
src/presets/laravel/data/    (cli, config, controller, model, route, migration)
src/presets/laravel/tests/acceptance/    (test)
src/presets/laravel/tests/e2e/    (test)
src/presets/laravel/tests/unit/    (test)
src/presets/lib/    (lib)
src/presets/library/tests/acceptance/    (test)
src/presets/library/tests/acceptance/fixtures/src/    (lib)
src/presets/library/tests/acceptance/fixtures/src/rules/    (lib)
src/presets/library/tests/acceptance/fixtures/src/utils/    (lib)
src/presets/monorepo/data/    (lib)
src/presets/nextjs/data/    (lib)
src/presets/nextjs/tests/unit/    (test)
src/presets/node-cli/tests/acceptance/    (test)
src/presets/node-cli/tests/acceptance/fixtures/src/    (cli, config)
src/presets/node-cli/tests/acceptance/fixtures/src/commands/    (cli)
src/presets/node-cli/tests/acceptance/fixtures/src/lib/    (lib)
src/presets/node-cli/tests/acceptance/fixtures/src/lib/rules/    (lib)
src/presets/php-webapp/tests/acceptance/    (test)
src/presets/postgres/data/    (config)
src/presets/r2/data/    (config)
src/presets/storage/data/    (config)
src/presets/symfony/data/    (config, lib, model, route)
src/presets/symfony/tests/acceptance/    (test)
src/presets/symfony/tests/e2e/    (test)
src/presets/symfony/tests/unit/    (test)
src/presets/webapp/data/    (cli, controller, model, route, lib)
src/presets/webapp/tests/acceptance/    (test)
src/presets/workers/data/    (config)
src/presets/workers/tests/unit/    (test)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### 各ディレクトリの責務\n", labels: "ディレクトリ|ファイル数|役割", ignoreError: true})}} -->
### 各ディレクトリの責務

| ディレクトリ | ファイル数 | 役割 |
| --- | --- | --- |
| src/presets | 122 | other, config, lib, controller, test, cli, middleware, model, route, migration |
| src/docs | 33 | cli, other, lib |
| src/flow | 30 | cli, config |
| src/lib | 19 | lib, config, model |
| src | 7 | cli |
<!-- {{/data}} -->

### 共通ライブラリ

<!-- {{text({prompt: "共通ライブラリの一覧をクラス名・ファイルパス・責務の表形式で記述してください。"})}} -->

| クラス名 | ファイルパス | 責務 |
| --- | --- | --- |
| なし（`loadSddTemplate` をエクスポート） | `src/lib/agents-md.js` | `AGENTS.md` 生成に使う SDD セクションテンプレートを読み込み、要求言語と英語の順でフォールバックして返します。 |
| なし（プリセット解決用関数群をエクスポート） | `src/lib/presets.js` | プリセット定義の探索、親子継承チェーンの解決、複数プリセット指定時の重複整理、安全なフォールバック解決を一元化します。 |
| `ModulesSource` | `src/presets/cli/data/modules.js` | CLI 向けソースファイルを走査し、クラス名とメソッド情報を抽出してモジュール一覧表を生成します。 |
| `MonorepoSource` | `src/presets/monorepo/data/monorepo.js` | モノレポ設定または解析結果から対象アプリ名を収集し、章ごとのターゲット表示を生成します。 |
| `NextjsComponentsSource` | `src/presets/nextjs/data/components.js` | Next.js のコンポーネントファイルを走査し、サーバー・クライアント・共有の種別ごとに一覧化します。 |
| `RoutesSource` | `src/presets/nextjs/data/routes.js` | Next.js の App Router / Pages Router を解析し、ルート種別、動的セグメント、ハンドラー情報を抽出して一覧化します。 |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← 技術スタックと運用](stack_and_ops.md) | [CLI コマンドリファレンス →](cli_commands.md)
<!-- {{/data}} -->
