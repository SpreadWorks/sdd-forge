# 05. 開発・テスト・配布

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。 -->

本章では、ローカル開発環境のセットアップ手順・テスト実行方法・npm パッケージとしてのリリースフローを説明します。sdd-forge 自体を開発対象とし、ソース変更をすぐに確認できる環境と一貫したブランチ・リリース運用を前提としています。

## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- @text: 開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。 -->

`npm link` を実行することで `sdd-forge` コマンドがグローバルに登録され、リポジトリ内のソースを直接参照するようになります。プロジェクトは ES モジュール（`"type": "module"`）を採用しているため、ファイルを保存した時点で変更が即座に反映されます。ビルドや再リンクのステップは不要で、エディタでソースを編集してすぐにターミナルで `sdd-forge <subcommand>` を実行して動作を確認できます。


### ブランチ戦略とコミット規約

<!-- @text: ブランチ運用（main/development の役割・squash merge 方針）とコミットメッセージの形式を説明してください。 -->

`main` ブランチはリリース済みの安定コードを管理するプロダクションブランチです。日常的な開発は `development` ブランチを統合先とし、機能追加・修正は `feature/NNN-name` 形式のブランチで作業します。作業ブランチは `development` へ squash merge し、`development` から `main` へのマージも squash merge を基本とすることでコミット履歴をリリース単位に整理します。コミットメッセージはすべて英語で記述し、sign-off や co-authored-by トレーラーは付与しません。


### SDD ワークフロー

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化 |
| `sdd-forge gate --spec ...` | spec ゲート |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge review` | docs レビュー |

### テスト

<!-- @text: テスト戦略・使用フレームワーク・テストの実行方法を説明してください。フィクスチャの構成も含めること。 -->

Node.js 18 以降に組み込まれたテストランナー（`node:test`）を採用しており、外部テストフレームワークへの依存はありません。テストファイルは `tests/` 配下に `*.test.js` の命名規則で配置し、`npm run test` で全ファイルをまとめて検出・実行します。テストケースごとに必要なファイル・ディレクトリ構造は `tests/fixtures/` 配下に再現し、スキャン・ドキュメント生成の各コマンドをモジュール単位で独立して検証できるようにしています。

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

`development` ブランチの変更を `main` へ squash merge したら、`npm version patch|minor|major` でバージョン番号を更新し、`git push origin main --tags` でタグをリモートに反映します。続いて `npm pack --dry-run` で公開対象ファイルを確認し、機密情報や意図しないファイルが含まれていないことをチェックします。問題がなければ `npm publish --tag alpha` でアルファチャンネルに公開し、動作確認後に `npm dist-tag add sdd-forge@<version> latest` を実行して `latest` タグを更新します。これにより npmjs.com のパッケージページに最新バージョンが反映されます。なお、一度公開したバージョン番号は再利用できないため、publish は慎重に行ってください。


### 技術スタックと依存関係

<!-- @text: 使用言語・ランタイムバージョン要件・npm依存関係の方針（依存ゼロ等）を説明してください。 -->

JavaScript（ES モジュール、`"type": "module"`）で実装されており、Node.js >=18.0.0 を動作要件としています。`node:test`・`node:fs`・`node:path`・`node:child_process` などの Node.js 組み込みモジュールのみを使用し、npm 依存関係はゼロです。外部ライブラリへの依存を排除することで、インストール時のサプライチェーンリスクを最小化し、長期的なメンテナンス負荷を低減しています。
