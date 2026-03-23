# 開発・テスト・配布

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。"})}} -->

sdd-forge のローカル開発環境のセットアップ手順、ユニット・E2E・受け入れテストの実行方法、および npm レジストリへのリリースフローについて説明します。外部依存パッケージを持たない設計のため、クローン後すぐに開発を開始できます。

<!-- {{/text}} -->

## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- {{text({prompt: "開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。"})}} -->

`npm link` を実行すると、グローバルの `sdd-forge` コマンドがローカルの `src/sdd-forge.js` へのシンボリックリンクとして登録されます。`package.json` の `bin` フィールドで `"sdd-forge": "./src/sdd-forge.js"` が指定されているため、ソースコードを編集すると次回のコマンド実行から即座に変更が反映されます。ビルドステップやトランスパイルは不要です。

開発中は `node src/sdd-forge.js <subcommand>` のように直接実行することも可能です。

<!-- {{/text}} -->

### ブランチ戦略とコミット規約

<!-- {{text({prompt: "ブランチ運用とコミットメッセージの形式を説明してください。ソースコードのマージ設定やコミット規約から抽出すること。"})}} -->

機能追加・修正は SDD フロー（Spec-Driven Development）に沿って作業ブランチで行います。`/sdd-forge.flow-plan` でプランニングを開始し、実装完了後に `/sdd-forge.flow-merge` でマージまたは PR を作成します。

コミットメッセージは英語で記述します。sign-off 行や co-authored-by トレーラーは付けません。変更の「なぜ」を簡潔に記述し、1〜2 文に収めることが推奨されます。

<!-- {{/text}} -->

### テスト

<!-- {{text({prompt: "テスト戦略・使用フレームワーク・テストの実行方法を説明してください。ソースコードのテストディレクトリ構成とテストランナー設定から抽出すること。", mode: "deep"})}} -->

テストフレームワークには Node.js 組み込みの `node:test` を使用しています。外部依存なしの方針に従い、サードパーティのテストランナーは導入していません。

テストは以下の 3 階層に分類されます。

| スコープ | ディレクトリ | 内容 |
|---|---|---|
| ユニットテスト | `tests/unit/`, `src/presets/*/tests/unit/` | 各モジュール・scan パーサーの入出力検証 |
| E2E テスト | `tests/e2e/`, `src/presets/*/tests/e2e/` | CLI コマンドの統合実行検証 |
| 受け入れテスト | `tests/acceptance/` | プリセットごとのエンドツーエンド検証 |

テストの実行コマンドは以下のとおりです。

```bash
npm test                          # 全テスト実行
npm run test:unit                 # ユニットテストのみ
npm run test:e2e                  # E2E テストのみ
npm run test:acceptance           # 受け入れテストのみ
```

テストランナー `tests/run.js` は `--scope` オプションでスコープ指定、`--preset` オプションで特定プリセットのテストに絞り込めます。各プリセット（cakephp2, laravel, symfony, nextjs, hono, drizzle, graphql, workers など）は `src/presets/<name>/tests/` 配下に独自のユニットテスト・E2E テストを持ちます。

テストでは `tests/helpers/tmp-dir.js` が提供する `createTmpDir()` / `removeTmpDir()` / `writeFile()` / `writeJson()` ヘルパーを使い、一時ディレクトリにフィクスチャを作成してテスト後にクリーンアップします。テスト失敗時はテストコードではなくプロダクトコードを修正する方針です。

<!-- {{/text}} -->

### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリに公開
```

<!-- {{text({prompt: "リリース手順を説明してください。ソースコードの公開設定や npm スクリプトから手順を導出すること。"})}} -->

現在 alpha 期間中のため、バージョン番号は `0.1.0-alpha.N` 形式を使用します。N は `git rev-list --count HEAD` による総コミット数です。

npm への公開は以下の 2 ステップで行います。

1. `npm publish --tag alpha` — alpha タグ付きで公開します
2. `npm dist-tag add sdd-forge@<version> latest` — latest タグを更新します

公開前には `npm pack --dry-run` を実行し、`files` フィールド（`src/`）に基づいて含まれるファイルに機密情報がないことを確認してください。なお、`src/presets/*/tests/` は `files` の除外指定により npm パッケージには含まれません。

リリースはユーザーが明示的に公開の意図を示した場合にのみ実行します。バージョン上げやコミットの指示はリリース指示とは見なしません。

<!-- {{/text}} -->

### 技術スタックと依存関係

<!-- {{text({prompt: "使用言語・ランタイムバージョン要件・依存関係の方針を説明してください。package.json から抽出すること。"})}} -->

| 項目 | 内容 |
|---|---|
| 言語 | JavaScript（ES Modules） |
| ランタイム | Node.js 18.0.0 以上 |
| モジュールシステム | `"type": "module"` |
| 外部依存 | なし（Node.js 組み込みモジュールのみ使用） |

`package.json` に `dependencies` / `devDependencies` は定義されていません。`fs`, `path`, `child_process`, `os`, `node:test`, `node:assert` など Node.js 標準モジュールのみで動作します。外部パッケージの追加は設計方針として禁止されています。

<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← 内部設計](internal_design.md)
<!-- {{/data}} -->
