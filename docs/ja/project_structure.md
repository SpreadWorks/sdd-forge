<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../project_structure.md) | **日本語**
<!-- {{/data}} -->

# プロジェクト構成

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。主要ディレクトリの数と役割を踏まえること。"})}} -->

このプロジェクトは、CLI 本体を担う `src`、ドキュメント生成を担う `src/docs`、Spec-Driven Development の実行系を担う `src/flow`、共通ライブラリを置く `src/lib`、各種プリセットを集約した `src/presets`、Spec 関連コマンドを持つ `src/spec` の6つの主要ディレクトリで構成されています。特に `src/presets` は 122 ファイルを持ち、分析用 DataSource やテストを含む中核領域です。
<!-- {{/text}} -->

## 内容

### ディレクトリ構成

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/docs/commands/    (cli)
src/docs/data/    (lib)
src/docs/lib/    (lib)
src/flow/    (cli, config)
src/flow/commands/    (cli)
src/flow/get/    (lib)
src/flow/run/    (lib)
src/flow/set/    (cli)
src/lib/    (lib)
src/presets/base/data/    (lib)
src/presets/base/tests/acceptance/    (test)
src/presets/base/tests/acceptance/fixtures/src/    (test)
src/presets/cakephp2/data/    (lib, model, view)
src/presets/cakephp2/tests/acceptance/    (test)
src/presets/cakephp2/tests/unit/    (test)
src/presets/ci/data/    (lib)
src/presets/cli/data/    (lib)
src/presets/cli/tests/acceptance/    (test)
src/presets/cli/tests/acceptance/fixtures/src/    (test)
src/presets/cli/tests/acceptance/fixtures/src/commands/    (test)
src/presets/cli/tests/acceptance/fixtures/src/lib/    (test)
src/presets/cli/tests/acceptance/fixtures/src/lib/rules/    (test)
src/presets/database/data/    (lib)
src/presets/drizzle/data/    (lib)
src/presets/drizzle/tests/unit/    (test)
src/presets/edge/data/    (lib)
src/presets/graphql/data/    (lib)
src/presets/graphql/tests/unit/    (test)
src/presets/hono/data/    (lib)
src/presets/hono/tests/unit/    (test)
src/presets/js-webapp/tests/acceptance/    (test)
src/presets/js-webapp/tests/acceptance/fixtures/src/    (config, lib, other)
src/presets/laravel/data/    (lib)
src/presets/laravel/tests/acceptance/    (test)
src/presets/laravel/tests/e2e/    (test)
src/presets/laravel/tests/unit/    (test)
src/presets/lib/    (lib)
src/presets/library/tests/acceptance/    (test)
src/presets/library/tests/acceptance/fixtures/src/    (test)
src/presets/library/tests/acceptance/fixtures/src/rules/    (test)
src/presets/library/tests/acceptance/fixtures/src/utils/    (test)
src/presets/monorepo/data/    (config)
src/presets/nextjs/data/    (lib)
src/presets/nextjs/tests/unit/    (test)
src/presets/node-cli/tests/acceptance/    (test)
src/presets/node-cli/tests/acceptance/fixtures/src/    (cli, config)
src/presets/node-cli/tests/acceptance/fixtures/src/commands/    (cli)
src/presets/node-cli/tests/acceptance/fixtures/src/lib/    (lib)
src/presets/node-cli/tests/acceptance/fixtures/src/lib/rules/    (lib)
src/presets/php-webapp/tests/acceptance/    (test)
src/presets/postgres/data/    (lib)
src/presets/r2/data/    (lib)
src/presets/storage/data/    (lib)
src/presets/symfony/data/    (lib)
src/presets/symfony/tests/acceptance/    (test)
src/presets/symfony/tests/e2e/    (test)
src/presets/symfony/tests/unit/    (test)
src/presets/webapp/data/    (lib)
src/presets/webapp/tests/acceptance/    (test)
src/presets/workers/data/    (lib)
src/presets/workers/tests/unit/    (test)
src/spec/commands/    (cli)
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### 各ディレクトリの責務\n", labels: "ディレクトリ|ファイル数|役割", ignoreError: true})}} -->
### 各ディレクトリの責務

| ディレクトリ | ファイル数 | 役割 |
| --- | --- | --- |
| src/presets | 122 | lib, test, model, view, config, other, cli |
| src/docs | 32 | cli, lib |
| src/flow | 30 | cli, config, lib |
| src/lib | 17 | lib |
| src | 8 | cli |
| src/spec | 4 | cli |
<!-- {{/data}} -->

### 共通ライブラリ

<!-- {{text({prompt: "共通ライブラリの一覧をクラス名・ファイルパス・責務の表形式で記述してください。"})}} -->

| クラス名 | ファイルパス | 責務 |
| --- | --- | --- |
| `PackageSource` | `src/presets/base/data/package.js` | `package.json` または `composer.json` を解析し、依存関係とスクリプト情報を抽出します。 |
| `StructureSource` | `src/presets/base/data/structure.js` | enriched analysis を基に、ディレクトリツリーとロール別のディレクトリ集計テーブルを生成します。 |
| `CakephpControllersSource` | `src/presets/cakephp2/data/controllers.js` | CakePHP 2.x のコントローラを解析し、アクション、利用コンポーネント、CSV 対応、権限関連情報を集計します。 |
| `MonorepoSource` | `src/presets/monorepo/data/monorepo.js` | monorepo 構成向けに、章ごとの対象アプリ情報をバッジ形式テキストとして出力します。 |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← 技術スタックと運用](stack_and_ops.md) | [CLI コマンドリファレンス →](cli_commands.md)
<!-- {{/data}} -->
