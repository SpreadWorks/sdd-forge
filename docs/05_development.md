# 05. 開発・テスト・配布

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。}} -->

本章では、ローカル開発環境の構築方法からテストの実行手順、npm レジストリへのリリースまでの一連の開発サイクルを説明します。SDD ワークフローとの連携も含め、品質を維持しながら開発を進めるための手順をまとめています。

## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- {{text: 開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。}} -->

`npm link` を実行すると、グローバルの `sdd-forge` コマンドがリポジトリの `src/sdd-forge.js` へのシンボリックリンクとして登録されます。
そのため、ソースファイルを編集すると追加のビルド手順なしに変更が即座に反映されます。
ES Modules 形式を採用しているため、Node.js が直接ソースファイルを解釈して実行します。実行確認には `sdd-forge help` が最も手軽です。

### ブランチ戦略とコミット規約

<!-- {{text: ブランチ運用（main/development の役割・squash merge 方針）とコミットメッセージの形式を説明してください。}} -->

`main` ブランチをリリースブランチとして管理し、日常的な開発は `development` または `feature/*` ブランチで行います。
機能追加・修正は SDD フローに従い feature ブランチを切って実装し、完了後に `development` へ squash merge します。
squash merge によってコミット履歴を整理し、`main` へのマージ時も同様に squash merge を適用します。
コミットメッセージは英語で記述し、sign-off 行や co-authored-by トレーラーは付与しません。

### SDD ワークフロー

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化 |
| `sdd-forge gate --spec ...` | spec ゲート |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge review` | docs レビュー |

### テスト

<!-- {{text: テスト戦略・使用フレームワーク・テストの実行方法を説明してください。フィクスチャの構成も含めること。}} -->

テストには Node.js 組み込みのテストランナー（`node --test`）を使用しており、外部テストフレームワークへの依存はありません。
テストファイルは `tests/` ディレクトリ以下に `*.test.js` の命名規則で配置します。
サブディレクトリは `tests/lib/`・`tests/docs/`・`tests/specs/`・`tests/presets/` のようにソースコードの構造に対応した形で構成されています。
テストの実行は以下のコマンドで行います。

```bash
npm test
# 内部では: find tests -name '*.test.js' | xargs node --test
```

### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリに公開
```

<!-- {{text: development → main への squash merge からnpm publish までのリリース手順を説明してください。}} -->

`development` ブランチの変更が安定したら `main` へ squash merge します。
公開前に `npm pack --dry-run` で含まれるファイルを確認し、機密情報・意図しないファイルが含まれていないことを検証してください。
Pre-release の公開は `npm publish --tag alpha` で行います。`--tag alpha` のみでは `latest` タグが更新されないため、続けて以下のコマンドで `latest` タグを更新します。

```bash
npm publish --tag alpha
npm dist-tag add sdd-forge@<version> latest
```

npm は一度公開したバージョン番号の再利用を許可しないため、バージョン番号の変更は慎重に行ってください。また、短時間に連続して publish するとレート制限が発生するため、不必要な publish は避けてください。

### 技術スタックと依存関係

<!-- {{text: 使用言語・ランタイムバージョン要件・npm依存関係の方針（依存ゼロ等）を説明してください。}} -->

実装言語は JavaScript（ES Modules）で、ランタイムには Node.js 18.0.0 以上が必要です。
本プロジェクトは外部 npm パッケージへの依存を持たず、Node.js 標準ライブラリのみで実装されています。
これにより、インストール時の依存解決が不要となり、npm パッケージの脆弱性リスクを排除しています。
npm に公開されるファイルは `src/` ディレクトリに限定されており（`package.json` の `files` フィールドで指定）、不要なファイルはパッケージに含まれません。
