# 技術スタックと運用

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。使用言語・フレームワーク・主要ツールのバージョンを踏まえること。"})}} -->

sdd-forge は Node.js（>= 18.0.0）上で動作する ES Modules ベースの CLI ツールであり、外部 npm パッケージへの依存を一切持たず、Node.js 組み込みモジュールのみで構築されています。本章では、使用している技術スタック、依存管理のポリシー、npm パッケージとしてのリリース手順、および日常の運用フローについて説明します。
<!-- {{/text}} -->

## 内容

### 技術スタック

<!-- {{text({prompt: "技術スタックをカテゴリ・技術名・バージョンの表形式で記述してください。"})}} -->

| カテゴリ | 技術名 | バージョン / 備考 |
|---|---|---|
| ランタイム | Node.js | >= 18.0.0 |
| モジュールシステム | ES Modules | `"type": "module"` |
| 言語 | JavaScript | Node.js ネイティブ |
| パッケージマネージャ | npm | 標準 CLI |
| テストフレームワーク | 独自テストランナー | 外部フレームワーク不使用 |
| AI エージェント連携 | Claude CLI | `spawn()` 経由で呼び出し |
| YAML パース | 独自正規表現パーサー | GitHub Actions ワークフロー解析用 |
| TOML パース | 内部ライブラリ | wrangler.toml 解析用 |

各プリセット（CakePHP 2、CI/CD、Edge Runtime 等）は独自のパーサーを内蔵しており、外部パッケージに依存しません。
<!-- {{/text}} -->

### 依存パッケージ

<!-- {{text({prompt: "プロジェクトの依存パッケージ管理方法を説明してください。"})}} -->

sdd-forge は **外部依存ゼロ** のポリシーを採用しています。`package.json` の `dependencies` および `devDependencies` は空であり、すべての機能を Node.js 組み込みモジュール（`fs`、`path`、`child_process`、`url`、`readline` 等）のみで実装しています。

このポリシーにより、以下の利点を得ています。

- サプライチェーン攻撃のリスクを排除
- インストール時間の最小化
- バージョン競合やロックファイルの問題が発生しない

YAML や TOML などの構造化データのパースが必要な箇所では、正規表現ベースやインデントベースの独自パーサーを実装しています。たとえば、GitHub Actions ワークフローの解析（`src/presets/ci/scan/workflows.js`）は正規表現でトリガー・ジョブ・シークレット参照を抽出し、Cloudflare Workers の設定解析（`src/presets/edge/data/runtime.js`）は内部 TOML パーサーを使用しています。
<!-- {{/text}} -->

### デプロイフロー

<!-- {{text({prompt: "デプロイの手順とフローを説明してください。"})}} -->

sdd-forge は npm パッケージとして公開されており、リリースは手動で行います。CI/CD パイプラインによる自動デプロイは導入していません。

**リリース手順:**

1. `package.json` のバージョンフィールドを更新します
2. 変更をコミットします
3. `npm pack --dry-run` を実行し、公開対象ファイルに機密情報が含まれていないことを確認します
4. `npm publish --tag alpha` でプレリリースとして公開します
5. `npm dist-tag add sdd-forge@<version> latest` で `latest` タグに昇格させます

`npm publish --tag alpha` だけでは npmjs.com のパッケージページに最新版として反映されないため、必ず `dist-tag` の付け替えが必要です。npm は一度公開したバージョン番号の再利用を許可しないため、バージョン番号の管理には注意が必要です。

公開対象は `src/` ディレクトリ、`package.json`、`README.md`、`LICENSE` に限定されており、プリセットのテストディレクトリ（`src/presets/*/tests/`）は除外されます。
<!-- {{/text}} -->

### 運用フロー

<!-- {{text({prompt: "運用手順を説明してください。"})}} -->

**ドキュメント生成パイプライン:**

対象プロジェクトのドキュメント生成は、以下の順序で実行します。

```
scan → enrich → init → data → text → readme → agents
```

`sdd-forge build` コマンドで上記パイプライン全体を一括実行できます。差分更新では、git diff から変更ファイルを特定し、影響する章のみを再生成します。

**テストの実行:**

- `npm test` — 全テスト（unit + e2e + acceptance）を実行します
- `npm run test:unit` — ユニットテストのみ実行します
- `npm run test:e2e` — E2E テストのみ実行します
- `npm run test:acceptance` — アクセプタンステストを実行します
- `npm test -- --preset <name>` — 特定プリセットのテストのみ実行します

**テンプレート変更時の運用:**

`src/templates/` や `src/presets/` のテンプレートを変更した場合は、`sdd-forge upgrade` を実行して利用プロジェクト側のスキル・設定ファイルに変更を反映します。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← ツール概要とアーキテクチャ](overview.md) | [project_structure →](project_structure.md)
<!-- {{/data}} -->
