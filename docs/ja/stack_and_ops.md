<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../stack_and_ops.md) | **日本語**
<!-- {{/data}} -->

# 技術スタックと運用

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。使用言語・フレームワーク・主要ツールのバージョンを踏まえること。"})}} -->

本プロジェクトは Node.js（18.0.0 以上）のみで構成される ES modules ベースの CLI ツールです。外部依存パッケージを持たず、Node.js 組み込みモジュールのみで、CakePHP 2.x アセット解析・GitHub Actions ワークフロー解析・Cloudflare Workers ランタイム解析などのプリセットスキャナーと DataSource を提供します。
<!-- {{/text}} -->

## 内容

### 技術スタック

<!-- {{text({prompt: "技術スタックをカテゴリ・技術名・バージョンの表形式で記述してください。"})}} -->

| カテゴリ | 技術名 | バージョン |
|---|---|---|
| ランタイム | Node.js | >= 18.0.0 |
| モジュールシステム | ES modules | - |
| パッケージ管理 | npm | - |
| CI/CD 解析 | GitHub Actions（YAML パーサー） | - |
| エッジランタイム解析 | Cloudflare Workers（wrangler.toml/json） | - |
| フロントエンド解析 | CakePHP 2.x アセットスキャナー | - |

CI プリセット（`ci/scan/workflows.js`）は正規表現ベースで GitHub Actions ワークフロー YAML を解析し、トリガー・ジョブ・シークレット・環境変数を抽出します。エッジプリセット（`edge/data/runtime.js`）は `wrangler.toml` / `wrangler.json` / `wrangler.jsonc` から TOML または JSON をパースし、エントリポイントやランタイム制約（`compatibility_date`・`compatibility_flags`・`node_compat`）を取得します。
<!-- {{/text}} -->

### 依存パッケージ

<!-- {{text({prompt: "プロジェクトの依存パッケージ管理方法を説明してください。"})}} -->

sdd-forge は外部依存パッケージを一切使用しません。`package.json` の `dependencies` および `devDependencies` は存在せず、すべての機能が Node.js 組み込みモジュール（`fs`、`path`、`child_process` など）のみで実装されています。

この方針により、インストール時の依存解決が不要となり、サプライチェーンリスクを排除しています。YAML パース（`ci/scan/workflows.js`）や TOML パース（`edge/data/runtime.js` が利用する内部ライブラリ）も独自の正規表現ベース実装で処理されます。
<!-- {{/text}} -->

### デプロイフロー

<!-- {{text({prompt: "デプロイの手順とフローを説明してください。"})}} -->

sdd-forge は npm パッケージとして公開されます。バージョン番号は `0.1.0-alpha.N` 形式で、N は `git rev-list --count HEAD` による総コミット数です。

公開手順は以下の 2 ステップで行います。

1. `npm pack --dry-run` で公開対象ファイルを確認し、機密情報が含まれていないことを検証します。`package.json` の `files` フィールドにより `src/` ディレクトリのみが公開対象となります（テストディレクトリ `src/presets/*/tests/` は除外）。
2. `npm publish --tag alpha` で alpha タグ付きで公開した後、`npm dist-tag add sdd-forge@<version> latest` で latest タグを更新します。
<!-- {{/text}} -->

### 運用フロー

<!-- {{text({prompt: "運用手順を説明してください。"})}} -->

CI/CD パイプラインの解析は `ci` プリセットが担当します。`ci/scan/workflows.js` の `scanWorkflows()` が `.github/workflows/` ディレクトリの YAML ファイルを走査し、`ci/data/pipelines.js` の `PipelinesSource` がパイプライン一覧・ジョブ詳細・シークレットと環境変数の 3 種類のデータテーブルを提供します。

エッジランタイム環境の運用情報は `edge` プリセットが担当します。`edge/data/runtime.js` の `EdgeRuntimeSource` が `wrangler.toml` または `wrangler.json` からエントリポイント・ルート設定・互換性制約を抽出し、ドキュメントとして可視化します。

フロントエンドアセットの管理状況は `cakephp2` プリセットの `scan/assets.js` が担当します。`webroot/js` と `webroot/css` を走査し、jQuery・Highcharts・FancyBox 等 8 種類のライブラリパターンでバージョン付きの検出を行い、カスタムファイルと区別して一覧化します。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← ツール概要とアーキテクチャ](overview.md) | [プロジェクト構成 →](project_structure.md)
<!-- {{/data}} -->
