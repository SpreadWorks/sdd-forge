# 05. 開発・テスト・配布

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。 -->

本章では、sdd-forge のローカル開発環境の構築方法からテストの実行、npm レジストリへの公開までの一連の手順を説明します。機能追加・修正の際は SDD ワークフローに従い、spec 作成→ゲートチェック→実装→ドキュメント更新の順で作業を進めてください。

## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- @text: 開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。 -->

`npm link` を実行すると、グローバルの `sdd-forge` コマンドがリポジトリの `src/sdd-forge.js` を直接参照するシンボリックリンクとして登録されます。そのため、ソースコードを編集した後にビルドや再インストールは不要で、変更内容が即座にコマンド実行に反映されます。開発中は `sdd-forge help` や `sdd-forge scan` などを実際に呼び出して動作を確認しながら進めることができます。`node src/sdd-forge.js <subcommand>` のように直接 Node.js で実行することも可能です。


### ブランチ戦略とコミット規約

<!-- @text: ブランチ運用（main/development の役割・squash merge 方針）とコミットメッセージの形式を説明してください。 -->

`main` ブランチは公開済みリリースと対応する安定ブランチです。日常的な開発は `development` ブランチをベースとして行い、機能追加・修正は `feature/NNN-<name>` の形式で feature ブランチを切って作業します。feature ブランチは作業完了後に `development` へ squash merge し、コミット履歴をひとつにまとめます。リリース時は `development` を `main` へ squash merge します。

コミットメッセージはすべて英語で記述し、件名は命令形の動詞で始めてください（例: `Add spec gate command`、`Fix resolver fallback logic`）。sign-off 行（`Signed-off-by:`）や `Co-authored-by:` トレーラーは付加しないでください。


### SDD ワークフロー

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化 |
| `sdd-forge gate --spec ...` | spec ゲート |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge review` | docs レビュー |

### テスト

<!-- @text: テスト戦略・使用フレームワーク・テストの実行方法を説明してください。フィクスチャの構成も含めること。 -->

テストには Node.js 組み込みのテストランナー（`node --test`）を使用しており、外部テストフレームワークへの依存はありません。テストファイルは `tests/` ディレクトリ配下に `*.test.js` の命名で配置します。以下のコマンドですべてのテストを実行できます。

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

リリースの手順は以下のとおりです。まず `development` ブランチを `main` へ squash merge します。次に `npm version patch`（または `minor` / `major`）でバージョンを更新すると、`package.json` の書き換えとバージョンタグのコミットが自動的に行われます。公開前に `npm pack --dry-run` を実行して同梱ファイルを確認し、機密情報が含まれていないことをチェックしてください。問題がなければ以下の2ステップで公開します。

```bash
npm publish --tag alpha          # alpha タグで公開（latest は更新されない）
npm dist-tag add sdd-forge@<version> latest   # latest タグを更新
```

`--tag alpha` のみでは npmjs.com のパッケージページに新バージョンが表示されないため、`dist-tag add` による `latest` タグの更新が必須です。npm は一度公開したバージョン番号の再利用を許可しないため、バージョン番号は慎重に決定してください。


### 技術スタックと依存関係

<!-- @text: 使用言語・ランタイムバージョン要件・npm依存関係の方針（依存ゼロ等）を説明してください。 -->

実装言語は JavaScript（ES modules）で、パッケージ全体に `"type": "module"` を設定しています。動作には Node.js 18.0.0 以上が必要です。sdd-forge は **外部 npm パッケージへの依存をゼロ**とする方針を採用しており、ファイル操作・HTTP 通信・テスト実行をすべて Node.js 組み込みモジュール（`fs`、`path`、`node:test` など）のみで実現しています。これにより、インストール時の依存解決や脆弱性リスクを排除し、CLI ツールとしての起動速度と信頼性を確保しています。npm に公開されるファイルは `src/` ディレクトリ配下のみで、`files` フィールドで明示的に制限しています。
