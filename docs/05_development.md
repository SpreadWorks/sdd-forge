# 05. 開発・テスト・配布

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。 -->

本章では、sdd-forge のローカル開発環境のセットアップから、テスト実行、npm レジストリへの公開までの一連のフローを説明します。SDD ワークフローに沿った開発手順も合わせて確認できます。

## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- @text: 開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。 -->

`npm link` を実行すると、グローバルコマンド `sdd-forge` がリポジトリの `src/sdd-forge.js` を直接参照するシンボリックリンクとして登録されます。パッケージのビルド手順はないため、ソースファイルを編集した時点で変更が即座に反映されます。別プロジェクトのディレクトリで `sdd-forge` を実行すれば、ローカルの最新コードで動作を確認できます。


### ブランチ戦略とコミット規約

<!-- @text: ブランチ運用（main/development の役割・squash merge 方針）とコミットメッセージの形式を説明してください。 -->

`main` ブランチはリリース済みの安定バージョンを管理し、`development` ブランチを日常的な開発の統合先として使用します。機能追加・修正は `feature/NNN-<slug>` の形式で feature ブランチを切り、完成後に `development` へ squash merge します。squash merge により、feature ブランチ上の作業コミットを 1 コミットにまとめてから統合することで、履歴を簡潔に保ちます。コミットメッセージはすべて英語で記述し、sign-off 行や co-authored-by トレーラーは付与しません。


### SDD ワークフロー

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化 |
| `sdd-forge gate --spec ...` | spec ゲート |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge review` | docs レビュー |

### テスト

<!-- @text: テスト戦略・使用フレームワーク・テストの実行方法を説明してください。フィクスチャの構成も含めること。 -->

テストには Node.js 組み込みのテストランナー（`node:test`）を使用しており、外部フレームワークへの依存はありません。テストファイルは `tests/` ディレクトリ以下に `*.test.js` の命名規則で配置し、以下のコマンドで全テストを実行します。

```bash
npm test
```

# 内部的に: find tests -name '*.test.js' | xargs node --test
```

フィクスチャは `tests/fixtures/` 配下に配置し、各テストケースが必要とするファイル・ディレクトリ構造を再現できるようにしています。


### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリに公開
```

<!-- @text: development → main への squash merge からnpm publish までのリリース手順を説明してください。 -->

リリース時は、まず `development` ブランチから `main` へ squash merge し、`npm version patch` または `npm version minor` でバージョンを更新します。公開前に `npm pack --dry-run` で含まれるファイルを確認し、機密情報や不要なファイルが含まれていないことを検証してください。問題がなければ `npm publish --tag alpha` でプレリリースとして公開し、続けて `npm dist-tag add sdd-forge@<version> latest` を実行して `latest` タグを更新します。`--tag alpha` のみでは npmjs.com のパッケージページに最新バージョンが反映されないため、必ず 2 ステップで実施してください。なお、npm は一度公開したバージョン番号の再利用を許可しないため、バージョン番号の付け間違いに注意してください。


### 技術スタックと依存関係

<!-- @text: 使用言語・ランタイムバージョン要件・npm依存関係の方針（依存ゼロ等）を説明してください。 -->

実装言語は JavaScript（ES modules）で、`"type": "module"` を指定しています。実行環境として Node.js 18.0.0 以上が必要です。外部 npm パッケージへの依存はゼロを方針としており、ファイル操作・HTTP 通信・CLI 処理などすべてに Node.js 組み込みモジュール（`fs`、`path`、`readline` 等）のみを使用しています。これにより `npm install` なしで即時実行できる軽量な CLI を実現しています。
