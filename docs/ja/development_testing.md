# 開発・テスト・配布

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。"})}} -->

sdd-forge のローカル開発環境の構築方法、ユニットテスト・E2E テスト・受け入れテストによる多層テスト戦略、および npm レジストリへのリリース手順について説明します。
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

`npm link` を実行すると、グローバルの `sdd-forge` コマンドがローカルの `src/sdd-forge.js` へのシンボリックリンクとして登録されます。`package.json` の `bin` フィールドで `"sdd-forge": "./src/sdd-forge.js"` と定義されているため、ソースコードを直接編集するだけで変更が即座にコマンド実行に反映されます。ビルドステップやトランスパイルは不要です。

プロジェクトは ES modules（`"type": "module"`）を採用しており、外部依存パッケージは一切使用しません。Node.js 組み込みモジュールのみで動作するため、`npm install` による依存解決も不要です。
<!-- {{/text}} -->

### ブランチ戦略とコミット規約

<!-- {{text({prompt: "ブランチ運用とコミットメッセージの形式を説明してください。ソースコードのマージ設定やコミット規約から抽出すること。"})}} -->

SDD フロー（Spec-Driven Development）を採用しており、機能追加・修正時は専用のフローブランチを作成して作業します。実装完了後はメインブランチへのマージまたはプルリクエストの作成を行います。

コミットメッセージは英語で記述します。sign-off 行や co-authored-by トレーラーは付与しません。変更内容の「なぜ」に焦点を当てた簡潔なメッセージを推奨します。
<!-- {{/text}} -->

### テスト

<!-- {{text({prompt: "テスト戦略・使用フレームワーク・テストの実行方法を説明してください。ソースコードのテストディレクトリ構成とテストランナー設定から抽出すること。", mode: "deep"})}} -->

テストフレームワークには Node.js 組み込みの `node:test` モジュールを使用しています。外部依存なしの方針に従い、テストランナーもカスタム実装（`tests/run.js`）で構成されています。

テストは以下の 3 層に分かれています。

- **ユニットテスト**（`tests/unit/` および `src/presets/*/tests/unit/`）: 個々の関数・クラスの入出力を検証します。各プリセット（CakePHP2、Laravel、Symfony、Next.js、Hono、Drizzle、GraphQL、Cloudflare Workers）の scan パーサーに対するテストが含まれます。一時ディレクトリにフィクスチャを作成し、解析結果を `assert` で検証するパターンが共通です。
- **E2E テスト**（`tests/e2e/` および `src/presets/*/tests/e2e/`）: CLI コマンドの実行パイプライン全体を検証します。`scan --stdout` の出力 JSON の構造確認や、preset.json の scan 設定の妥当性検証などが含まれます。
- **受け入れテスト**（`tests/acceptance/`）: プリセットごとの統合的な動作を検証します。

テストの実行コマンドは以下のとおりです。

```bash
npm test                    # 全テスト実行
npm run test:unit           # ユニットテストのみ
npm run test:e2e            # E2E テストのみ
npm run test:acceptance     # 受け入れテストのみ
```

`--scope` オプションでスコープを指定でき、`--preset` オプションで特定プリセットのテストのみを実行することも可能です。テストヘルパーとして `tests/helpers/tmp-dir.js` が提供されており、`createTmpDir()`・`removeTmpDir()`・`writeFile()`・`writeJson()` で一時ディレクトリの作成・削除とフィクスチャファイルの配置を行います。

テスト失敗時は、テストコードではなくプロダクトコードを修正する方針です。
<!-- {{/text}} -->

### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリに公開
```

<!-- {{text({prompt: "リリース手順を説明してください。ソースコードの公開設定や npm スクリプトから手順を導出すること。"})}} -->

npm パッケージとして公開される範囲は `package.json` の `files` フィールドで `["src/"]` と定義されています。`src/presets/*/tests/` は除外パターンにより公開対象から外されます。公開前に `npm pack --dry-run` を実行し、含まれるファイルに機密情報がないことを確認してください。

現在は alpha 版のため、リリースは 2 ステップで行います。

```bash
npm publish --tag alpha                          # alpha タグで公開
npm dist-tag add sdd-forge@<version> latest      # latest タグを更新
```

`--tag alpha` のみでは `latest` タグが更新されず、npmjs.com のパッケージページに最新版として反映されません。npm は一度公開したバージョン番号の再利用ができないため、バージョン番号の設定は慎重に行ってください。
<!-- {{/text}} -->

### 技術スタックと依存関係

<!-- {{text({prompt: "使用言語・ランタイムバージョン要件・依存関係の方針を説明してください。package.json から抽出すること。"})}} -->

- **言語**: JavaScript（ES modules）
- **ランタイム**: Node.js 18.0.0 以上（`package.json` の `engines` フィールドで指定）
- **モジュールシステム**: ESM（`"type": "module"`）
- **外部依存**: なし。`dependencies` および `devDependencies` は定義されておらず、Node.js 組み込みモジュール（`fs`、`path`、`child_process`、`node:test`、`node:assert` 等）のみを使用します。

外部パッケージの追加は禁止されています。この方針により、インストール時の依存解決が不要となり、セキュリティリスクの低減と環境間の再現性が保証されます。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← 内部設計](internal_design.md)
<!-- {{/data}} -->
