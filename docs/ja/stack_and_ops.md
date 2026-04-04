<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
**日本語** | [English](../stack_and_ops.md)
<!-- {{/data}} -->

# 技術スタックと運用

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。使用言語・フレームワーク・主要ツールのバージョンを踏まえること。"})}} -->

本プロジェクトは Node.js（18.0.0 以上）上で動作する ES Modules ベースの CLI ツールであり、外部依存パッケージを持たず Node.js ビルトインモジュールのみを使用しています。パッケージマネージャーには pnpm 10.33.0 を採用し、npm レジストリへ `sdd-forge` として公開しています。
<!-- {{/text}} -->

## 内容

### 技術スタック

<!-- {{text({prompt: "技術スタックをカテゴリ・技術名・バージョンの表形式で記述してください。"})}} -->

| カテゴリ | 技術名 | バージョン |
|---|---|---|
| 言語 | JavaScript（ES Modules） | `"type": "module"` |
| ランタイム | Node.js | >= 18.0.0 |
| パッケージマネージャー | pnpm | 10.33.0 |
| パッケージレジストリ | npm | — |
| CLI エントリーポイント | sdd-forge バイナリ | `./src/sdd-forge.js` |
| 外部依存 | なし（Node.js ビルトインのみ） | — |
<!-- {{/text}} -->

### 依存パッケージ

<!-- {{text({prompt: "プロジェクトの依存パッケージ管理方法を説明してください。"})}} -->

本プロジェクトは外部依存パッケージを持たないポリシーを採用しており、`fs`・`path`・`child_process`・`url` など Node.js ビルトインモジュールのみを使用しています。`dependencies` および `devDependencies` フィールドはいずれも空です。

パッケージマネージャーには pnpm 10.33.0 を使用しており、`package.json` の `packageManager` フィールドに SHA512 完全性ハッシュ付きで固定されています。これにより、すべての開発者が同一の再現可能な環境を得られます。ロックファイル（`pnpm-lock.yaml`、フォーマット 9.0）はリポジトリにコミットして管理します。

Dependabot による自動脆弱性監視が `.github/dependabot.yml` で週次スケジュールとして設定されています。
<!-- {{/text}} -->

### デプロイフロー

<!-- {{text({prompt: "デプロイの手順とフローを説明してください。"})}} -->

npm への公開は、ユーザーがリリースの意図を明示した場合にのみ実施します。手順は以下の 2 ステップです。

1. **パッケージ検証** — `npm pack --dry-run` を実行し、公開対象ファイルを確認するとともに、機密情報が含まれていないことを確かめます。
2. **alpha タグで公開** — `npm publish --tag alpha` を実行します。
3. **latest タグへのプロモート** — `npm dist-tag add sdd-forge@<version> latest` を実行します。

`npm publish --tag alpha` のみでは npm レジストリページの `latest` タグが更新されないため、必ず 2 段階で実施してください。バージョン番号は `0.1.0-alpha.N`（N = `git rev-list --count HEAD` の値）形式を使用します。一度公開したバージョン番号は再利用できないため（unpublish 後も 24 時間は不可）、注意が必要です。現時点では自動化された CI/CD パイプラインは構成されていません。
<!-- {{/text}} -->

### 運用フロー

<!-- {{text({prompt: "運用手順を説明してください。"})}} -->

日常的な運用では以下のコマンドを使用します。

- **プロジェクト初期化**: `sdd-forge setup` — 新規プロジェクトのセットアップを行います。
- **スキル・テンプレートの更新**: `sdd-forge upgrade` — `src/templates/` や `src/presets/` の変更をプロジェクトのスキル・設定に反映します。変更があったファイルのみ更新されます。
- **ドキュメント生成**: `sdd-forge build` — scan → enrich → init → data → text → readme の順でドキュメントを生成します。各ステージを個別に実行することも可能です。
- **テスト実行**: `pnpm test`（全テスト）、`pnpm run test:unit`（ユニットテスト）、`pnpm run test:e2e`（E2E テスト）、`pnpm run test:acceptance`（受け入れテスト）。
- **SDD フロー管理**: `sdd-forge flow` サブコマンド群（`start`・`status`・`resume`・`review`・`merge`・`cleanup`）でフロー状態を管理します。

テスト実行など長時間かかるコマンドの結果は `command > /tmp/output.log 2>&1` でファイルに保存し、`grep` や Read ツールで確認します。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← ツール概要とアーキテクチャ](overview.md) | [プロジェクト構成 →](project_structure.md)
<!-- {{/data}} -->
