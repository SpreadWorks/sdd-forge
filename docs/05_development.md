# 05. 開発・テスト・配布

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。 -->

本章では、ローカル開発環境のセットアップから Node.js 組み込みテストランナーを用いたテスト実行方法、および npm パッケージとしての公開手順まで、sdd-forge の開発に必要な作業フローを説明します。

## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- @text: 開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。 -->

`npm link` を実行すると、グローバルコマンド `sdd-forge` がリポジトリ内の `src/sdd-forge.js` に直接リンクされます。本プロジェクトはビルドステップを持たない純粋な Node.js スクリプト構成のため、ソースファイルを編集した内容は次回コマンド実行時に即座に反映されます。特定のファイルを直接実行したい場合は `node src/sdd-forge.js <subcommand>` でも動作確認が可能です。


### ブランチ戦略とコミット規約

<!-- @text: ブランチ運用（main/development の役割・squash merge 方針）とコミットメッセージの形式を説明してください。 -->

`main` ブランチをリリース済みの安定版、`development` ブランチを開発統合用のベースとして運用します。機能追加・修正は `feature/NNN-xxx` 形式のブランチを切って作業し、完了後に `development` へ squash merge します。リリース時は `development` の内容を `main` へ squash merge します。コミットメッセージはすべて英語で記述し、sign-off 行や co-authored-by トレーラーは付与しません。


### SDD ワークフロー

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化 |
| `sdd-forge gate --spec ...` | spec ゲート |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge review` | docs レビュー |

### テスト

<!-- @text: テスト戦略・使用フレームワーク・テストの実行方法を説明してください。フィクスチャの構成も含めること。 -->

Node.js 18 以降に標準搭載されているテストランナー（`node --test`）を使用しており、外部テストフレームワークへの依存はありません。テストファイルは `tests/` ディレクトリ配下に `*.test.js` の命名規則で配置し、`npm test` で一括実行できます。フィクスチャは `tests/fixtures/` 配下に配置し、各テストケースが必要とするファイル・ディレクトリ構造を再現できるよう整理しています。

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

`development` ブランチの変更内容を `main` へ squash merge した後、`npm version patch/minor/major` でバージョンを更新します。公開前に `npm pack --dry-run` で含まれるファイルを確認し、機密情報がないことをチェックします。その後 `npm publish --tag alpha` でアルファ版として公開し、続けて `npm dist-tag add sdd-forge@<version> latest` を実行して `latest` タグを更新します。npm は一度公開したバージョン番号の再利用を許可しないため、バージョン番号の管理には注意が必要です。


### 技術スタックと依存関係

<!-- @text: 使用言語・ランタイムバージョン要件・npm依存関係の方針（依存ゼロ等）を説明してください。 -->

JavaScript（ES modules）で実装されており、実行には Node.js 18.0.0 以上が必要です。本パッケージは外部 npm 依存関係を持たず、`fs`・`path`・`child_process` などの Node.js 組み込みモジュールのみで構成されています。依存ゼロの方針により、インストール時のパッケージサイズを最小化し、依存パッケージに起因するセキュリティリスクや互換性問題を排除しています。
