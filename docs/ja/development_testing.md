# 05. 開発・テスト・配布

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。}} -->

sdd-forge のローカル開発環境の構築方法、テスト戦略と実行方法、および npm レジストリへのリリース手順を説明します。外部依存のないシンプルな構成のため、セットアップからテスト・公開まで最小限の手順で完結します。
<!-- {{/text}} -->

## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- {{text: 開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。}} -->

`npm link` を実行すると、グローバルの `sdd-forge` コマンドがローカルの `src/sdd-forge.js` へのシンボリックリンクとして登録されます。`package.json` の `"bin"` フィールドで `"sdd-forge": "./src/sdd-forge.js"` と定義されているため、ソースコードを編集するとリンク先のファイルがそのまま実行され、変更が即座に反映されます。

ビルドステップは存在しません。ES Modules（`"type": "module"`）として直接実行されるため、`src/` 以下のファイルを編集するだけで動作確認が可能です。
<!-- {{/text}} -->

### ブランチ戦略とコミット規約

<!-- {{text: ブランチ運用とコミットメッセージの形式を説明してください。ソースコードのマージ設定やコミット規約から抽出すること。}} -->

本プロジェクトでは SDD（Spec-Driven Development）フローに基づくブランチ運用を採用しています。機能追加や修正は SDD フロー（`sdd-forge flow`）で専用ブランチを作成し、作業完了後にマージします。

マージ方式は `config.json` の `flow.merge` で `"squash"` が指定されており、フィーチャーブランチの複数コミットは squash merge で1つにまとめられます。

コミットメッセージは英語で記述してください。sign-off 行や co-authored-by トレーラーは付けません。
<!-- {{/text}} -->

### テスト

<!-- {{text[mode=deep]: テスト戦略・使用フレームワーク・テストの実行方法を説明してください。ソースコードのテストディレクトリ構成とテストランナー設定から抽出すること。}} -->

テストフレームワークには Node.js 組み込みのテストランナー（`node:test`）を使用しています。外部依存なしの方針に沿い、Jest や Mocha 等のサードパーティ製フレームワークは導入していません。

テストの実行は以下のコマンドで行います。

```bash
npm test
# 実行されるコマンド: find tests -name '*.test.js' | xargs node --test
```

`tests/` ディレクトリは `src/` のディレクトリ構造に対応した階層で構成されています。

| ディレクトリ | 対象 |
|---|---|
| `tests/lib/` | 共有ユーティリティ（`cli.js`, `config.js`, `i18n.js`, `types.js` 等） |
| `tests/docs/` | ドキュメント生成エンジン（`commands/`, `data/`, `lib/`） |
| `tests/flow/` | SDD フローコマンド |
| `tests/specs/` | spec コマンド |
| `tests/presets/` | プリセット固有ロジック（`laravel/`, `symfony/`） |
| `tests/helpers/` | テスト用ヘルパー |

ルート直下にはディスパッチャーやヘルプなどの統合テスト（`dispatchers.test.js`, `help.test.js`, `flow.test.js`, `package.test.js`）と、機能単位のテスト（`043-configurable-scan.test.js` 等）が配置されています。

テスト環境の自動判定機能として `src/docs/lib/test-env-detection.js` が提供されています。`detectTestEnvironment(analysis)` は `analysis.json` の `devDependencies`（npm）や `requireDev`（Composer）からテストフレームワークを検出し、`scripts.test` からテストコマンドを取得します。Jest・Mocha・Vitest・AVA・TAP・Jasmine・PHPUnit・Pest および `node:test` に対応しています。

テストが失敗した場合は、テストコード側ではなくプロダクトコードを修正してください。テストシナリオの妥当性を先に確認し、妥当であれば実装を修正するのがプロジェクトのルールです。
<!-- {{/text}} -->

### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリに公開
```

<!-- {{text: リリース手順を説明してください。ソースコードの公開設定や npm スクリプトから手順を導出すること。}} -->

npm レジストリへの公開は以下の手順で行います。

1. `npm pack --dry-run` で公開されるファイルを確認します。`package.json` の `"files": ["src/"]` により、`src/` ディレクトリと `package.json`・`README.md`・`LICENSE` のみが含まれます。機密情報が含まれていないことを確認してください。
2. `npm publish --tag alpha` で alpha タグ付きで公開します。
3. `npm dist-tag add sdd-forge@<version> latest` で `latest` タグを更新します。

この2ステップ方式により、`latest` タグの更新を明示的に制御できます。`--tag alpha` のみでは npmjs.com のパッケージページに最新版として反映されないため、必ず `dist-tag add` を実行してください。

なお、npm は一度公開したバージョン番号の再利用を許可しません。unpublish しても24時間は同じバージョンでの再公開はできません。
<!-- {{/text}} -->

### 技術スタックと依存関係

<!-- {{text: 使用言語・ランタイムバージョン要件・依存関係の方針を説明してください。package.json から抽出すること。}} -->

| 項目 | 内容 |
|---|---|
| 言語 | JavaScript（ES Modules） |
| ランタイム | Node.js 18.0.0 以上 |
| モジュール形式 | ESM（`"type": "module"`） |
| 外部依存 | なし |

本プロジェクトは Node.js 組み込みモジュールのみを使用しており、`package.json` に `dependencies` は定義されていません。`devDependencies` も存在せず、テストランナーにも `node:test` を使用しています。外部パッケージの追加は禁止されています。
<!-- {{/text}} -->
