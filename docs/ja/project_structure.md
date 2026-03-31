<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../project_structure.md) | **日本語**
<!-- {{/data}} -->

# プロジェクト構成

<!-- {{data("monorepo.monorepo.apps", {labels: "project_structure", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。主要ディレクトリの数と役割を踏まえること。"})}} -->
<!-- {{/text}} -->

## 内容

### ディレクトリ構成

<!-- {{data("base.structure.tree")}} -->
```
src/    (cli)
src/docs/commands/    (cli)
src/docs/data/    (model)
src/docs/lib/    (lib)
src/docs/lib/lang/    (lib)
src/flow/    (controller, config)
src/flow/commands/    (cli)
src/flow/get/    (lib)
src/flow/run/    (cli, controller)
src/flow/set/    (controller)
src/lib/    (lib, model)
src/presets/base/data/    
src/presets/base/tests/acceptance/    
src/presets/base/tests/acceptance/fixtures/src/    
src/presets/cakephp2/data/    
src/presets/cakephp2/tests/acceptance/    
src/presets/cakephp2/tests/unit/    
src/presets/ci/data/    
src/presets/cli/data/    
src/presets/cli/tests/acceptance/    
src/presets/cli/tests/acceptance/fixtures/src/    
src/presets/cli/tests/acceptance/fixtures/src/commands/    
src/presets/cli/tests/acceptance/fixtures/src/lib/    
src/presets/cli/tests/acceptance/fixtures/src/lib/rules/    
src/presets/database/data/    
src/presets/drizzle/data/    
src/presets/drizzle/tests/unit/    
src/presets/edge/data/    
src/presets/graphql/data/    
src/presets/graphql/tests/unit/    
src/presets/hono/data/    
src/presets/hono/tests/unit/    
src/presets/js-webapp/tests/acceptance/    
src/presets/js-webapp/tests/acceptance/fixtures/src/    
src/presets/laravel/data/    
src/presets/laravel/tests/acceptance/    
src/presets/laravel/tests/e2e/    
src/presets/laravel/tests/unit/    
src/presets/lib/    
src/presets/library/tests/acceptance/    
src/presets/library/tests/acceptance/fixtures/src/    
src/presets/library/tests/acceptance/fixtures/src/rules/    
src/presets/library/tests/acceptance/fixtures/src/utils/    
src/presets/monorepo/data/    
src/presets/nextjs/data/    
src/presets/nextjs/tests/unit/    
src/presets/node-cli/tests/acceptance/    
src/presets/node-cli/tests/acceptance/fixtures/src/    
src/presets/node-cli/tests/acceptance/fixtures/src/commands/    
src/presets/node-cli/tests/acceptance/fixtures/src/lib/    
src/presets/node-cli/tests/acceptance/fixtures/src/lib/rules/    
src/presets/php-webapp/tests/acceptance/    
src/presets/postgres/data/    
src/presets/r2/data/    
src/presets/storage/data/    
src/presets/symfony/data/    
src/presets/symfony/tests/acceptance/    
src/presets/symfony/tests/e2e/    
src/presets/symfony/tests/unit/    
src/presets/webapp/data/    
src/presets/webapp/tests/acceptance/    
src/presets/workers/data/    
src/presets/workers/tests/unit/    
```
<!-- {{/data}} -->

<!-- {{data("base.structure.directories", {header: "### 各ディレクトリの責務\n", labels: "ディレクトリ|ファイル数|役割", ignoreError: true})}} -->
### 各ディレクトリの責務

| ディレクトリ | ファイル数 | 役割 |
| --- | --- | --- |
| src/presets | 122 | — |
| src/docs | 39 | cli, model, lib |
| src/flow | 32 | cli, controller, config, lib |
| src/lib | 20 | lib, model |
| src | 7 | cli |
<!-- {{/data}} -->

### 共通ライブラリ

<!-- {{text({prompt: "共通ライブラリの一覧をクラス名・ファイルパス・責務の表形式で記述してください。"})}} -->
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← 技術スタックと運用](stack_and_ops.md) | [CLI コマンドリファレンス →](cli_commands.md)
<!-- {{/data}} -->
