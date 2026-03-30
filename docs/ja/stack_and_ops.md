<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../stack_and_ops.md) | **日本語**
<!-- {{/data}} -->

# 技術スタックと運用

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。使用言語・フレームワーク・主要ツールのバージョンを踏まえること。"})}} -->

本プロジェクトは Node.js（ES Modules）のみで構成された CLI ツールであり、外部依存パッケージを持ちません。CI/CD には GitHub Actions を使用し、Docker 環境のサポートはスタブとして用意されています。
<!-- {{/text}} -->

## 内容

### 技術スタック

<!-- {{text({prompt: "技術スタックをカテゴリ・技術名・バージョンの表形式で記述してください。"})}} -->

| カテゴリ | 技術名 | 備考 |
|---|---|---|
| ランタイム | Node.js | ES Modules（`"type": "module"`） |
| パッケージ管理 | npm | `sdd-forge` として npmjs.com に公開 |
| CI/CD | GitHub Actions | `.github/workflows/*.yml` でワークフローを定義 |
| コンテナ | Docker | CakePHP 2.x プリセット向けにスタブ実装（`CakephpDockerSource`）が存在。実データ提供は未実装 |
<!-- {{/text}} -->

### 依存パッケージ

<!-- {{text({prompt: "プロジェクトの依存パッケージ管理方法を説明してください。"})}} -->

本プロジェクトは外部依存パッケージを一切持たず、Node.js の組み込みモジュールのみを使用します。`package.json` の `files` フィールドは `["src/"]` に設定されており、npm パッケージとして公開されるのは `src/` ディレクトリと `package.json`、`README.md`、`LICENSE` のみです。

バージョン番号は alpha 期間中 `0.1.0-alpha.N` 形式を採用しており、N は `git rev-list --count HEAD`（総コミット数）で決定されます。
<!-- {{/text}} -->

### デプロイフロー

<!-- {{text({prompt: "デプロイの手順とフローを説明してください。"})}} -->

npm への公開は以下の 2 ステップで行います。

1. `npm pack --dry-run` で公開対象ファイルを確認し、機密情報が含まれていないことを検証します。
2. `npm publish --tag alpha` で alpha タグ付きで公開した後、`npm dist-tag add sdd-forge@<version> latest` で latest タグを更新します。

CI/CD パイプラインは GitHub Actions で管理されています。`PipelinesSource` が `.github/workflows/*.yml` を解析し、ワークフロー名・トリガー条件・ジョブ構成・シークレット・環境変数を抽出します。トリガーにはインライン形式・リスト形式・cron スケジュールが対応しています。
<!-- {{/text}} -->

### 運用フロー

<!-- {{text({prompt: "運用手順を説明してください。"})}} -->

GitHub Actions のワークフロー YAML からパイプライン情報が自動的に解析されます。`PipelinesSource` は以下の情報を提供します。

- **パイプライン一覧**（`list()`）: 各ワークフローの名前・プラットフォーム・トリガー条件
- **ジョブ詳細**（`jobs()`）: ジョブ ID・実行環境（runs-on）・ステップ数・uses 依存
- **シークレットと環境変数**（`env()`）: `secrets.*` および `env.*` の参照を正規表現で一括抽出した一覧

Docker 環境については、CakePHP 2.x プリセット向けに `CakephpDockerSource` がスタブとして存在しますが、現時点では常に null を返す実装であり、将来の拡張ポイントとして位置づけられています。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← ツール概要とアーキテクチャ](overview.md) | [プロジェクト構成 →](project_structure.md)
<!-- {{/data}} -->
