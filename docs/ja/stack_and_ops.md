# 技術スタックと運用

<!-- {{data("monorepo.monorepo.apps", {labels: "stack_and_ops", ignoreError: true})}} -->
<!-- {{/data}} -->

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。使用言語・フレームワーク・主要ツールのバージョンを踏まえること。"})}} -->

sdd-forge は Node.js 18 以上で動作する JavaScript（ES modules）製の CLI ツールであり、外部依存パッケージを一切持たないゼロ依存設計を採用しています。本章では、ランタイム環境・依存管理ポリシー・npm を通じたリリース手順・ドキュメント生成パイプラインによる運用フローについて説明します。

<!-- {{/text}} -->

## 内容

### 技術スタック

<!-- {{text({prompt: "技術スタックをカテゴリ・技術名・バージョンの表形式で記述してください。"})}} -->

| カテゴリ | 技術名 | バージョン・詳細 |
|---|---|---|
| 言語 | JavaScript（ES modules） | package.json に `"type": "module"` を指定 |
| ランタイム | Node.js | >= 18.0.0 |
| パッケージマネージャ | npm | Node.js 標準ツールチェーン |
| 外部依存 | なし | Node.js 組み込みモジュールのみ使用 |
| 配布先 | npmjs.com | パブリックパッケージ `sdd-forge` |
| バージョン管理 | Git | alpha 期間中は `0.1.0-alpha.N`（N = 総コミット数） |
| テンプレートエンジン | 独自ディレクティブシステム | `{{data}}`、`{{text}}`、`{%block%}`、`{%extends%}` |
| AI 連携 | Claude CLI / Codex | `child_process.spawn()` 経由で呼び出し |
| CI/CD 解析 | GitHub Actions パーサー | 正規表現ベースの YAML パーサー（`src/presets/ci/scan/workflows.js`） |
| エッジランタイム解析 | Cloudflare Workers パーサー | wrangler.toml / wrangler.json 対応（`src/presets/edge/data/runtime.js`） |
| アセット解析 | CakePHP 2.x アセットパーサー | JS/CSS ライブラリ検出（8 パターン対応、`src/presets/cakephp2/scan/assets.js`） |
| テスト | 独自テストランナー | `tests/run.js`（unit / e2e / acceptance の 3 スコープ） |

<!-- {{/text}} -->

### 依存パッケージ

<!-- {{text({prompt: "プロジェクトの依存パッケージ管理方法を説明してください。"})}} -->

sdd-forge は外部依存パッケージを一切持たないゼロ依存ポリシーを採用しています。`package.json` の `dependencies` および `devDependencies` にはパッケージが登録されておらず、`fs`、`path`、`child_process`、`crypto` などの Node.js 組み込みモジュールのみを使用します。

通常であれば外部ライブラリが必要になる機能も、内部で独自に実装しています。たとえば GitHub Actions ワークフローの YAML パース（`src/presets/ci/scan/workflows.js`）は正規表現ベースのパーサーで処理し、Cloudflare Workers の wrangler.toml パース（`src/presets/edge/data/runtime.js`）には内部 TOML パーサーを使用しています。

npm パッケージとして公開される範囲は `package.json` の `files` フィールドで `src/`（プリセットのテストディレクトリを除く）に限定されており、`package.json`、`README.md`、`LICENSE` とともに配布されます。

<!-- {{/text}} -->

### デプロイフロー

<!-- {{text({prompt: "デプロイの手順とフローを説明してください。"})}} -->

sdd-forge はパブリックパッケージとして npmjs.com に公開されます。自動化された CI/CD パイプラインはなく、すべてのリリースはメンテナーが手動で実行します。alpha 期間中のバージョン番号は `0.1.0-alpha.N` 形式で、`N` は `git rev-list --count HEAD` で取得する総コミット数です。

リリース手順は以下の通りです。

1. **公開前の確認** — `npm pack --dry-run` を実行し、パッケージに含まれるファイル（`src/`、`package.json`、`README.md`、`LICENSE`）を確認します。機密情報が含まれていないことを検証します。
2. **alpha タグで公開** — `npm publish --tag alpha` を実行し、npm レジストリに `alpha` dist-tag でアップロードします。
3. **latest タグの更新** — `npm dist-tag add sdd-forge@<version> latest` を実行し、`latest` タグを新バージョンに向けます。この手順を省略すると npmjs.com のパッケージページに更新が反映されません。

npm では一度公開したバージョン番号の再利用はできません。`unpublish` を行った場合でも 24 時間は同じバージョンを再公開できない点に注意してください。

<!-- {{/text}} -->

### 運用フロー

<!-- {{text({prompt: "運用手順を説明してください。"})}} -->

sdd-forge の中核となる運用フローは、ソースコードを段階的に処理するドキュメント生成パイプラインです。

```
scan → enrich → init → data → text → readme → agents
```

- **scan** — プロジェクトのソースコードを解析し、`.sdd-forge/output/` に `analysis.json` を生成します。
- **enrich** — AI エージェントに解析結果全体を渡し、各エントリに役割・概要・章分類を一括で付与します。
- **init** — プリセットのテンプレートから章ごとの Markdown ファイルを生成し、ドキュメント構造を構築します。
- **data** — `{{data}}` ディレクティブを解決し、DataSource クラスが解析データから構造化テーブルを生成します。
- **text** — `{{text}}` ディレクティブを AI 生成の文章で埋めます。light モード（enriched analysis からの文章化）と deep モード（ソース再読による詳細記述）の 2 種類があります。
- **readme** — 最終的なドキュメント出力を組み立てます。
- **agents** — `AGENTS.md` を生成・更新し、AI エージェントにプロジェクトコンテキストを提供します。

差分更新では `git diff` で変更ファイルを検出し、影響のあるエントリのみ再スキャン・再 enrich を行い、該当する章だけを再生成します。`sdd-forge build` コマンドでパイプライン全体を一括実行できるほか、各ステージを個別に実行することも可能です。

<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← ツール概要とアーキテクチャ](overview.md) | [プロジェクト構成 →](project_structure.md)
<!-- {{/data}} -->
