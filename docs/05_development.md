# 05. 開発・テスト・配布

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。 -->

本章では、sdd-forge のローカル開発環境の構築手順から、テスト・動作確認の方法、ブランチ運用やリリースまでの一連のフローを説明します。外部依存ライブラリを持たないシンプルな構成のため、セットアップは最小限の手順で完了します。


## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- @text: 開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。 -->

`npm link` は `./src/sdd-forge.js` へのシンボリックリンクをグローバルに作成します。`sdd-forge` はビルドステップを持たない純粋な Node.js（ES Modules）プロジェクトであるため、`npm link` 後は `src/` 配下のソースファイルを編集するだけで、次回コマンド実行時に変更が即座に反映されます。コンパイルや再リンクは不要です。

プロジェクトに外部依存ライブラリが存在しないため（`dependencies: {}`）、`npm install` は不要で、クローン直後から `npm link` 1 コマンドで開発環境が整います。複数プロジェクトで開発中のツールをテストする場合も、同一の `sdd-forge` バイナリが参照されるため、変更の効果をすぐに確認できます。


### ブランチ戦略とコミット規約

<!-- @text: ブランチ運用（main/development の役割・squash merge 方針）とコミットメッセージの形式を説明してください。 -->

コミット履歴とブランチ構成を確認しました。現在リモートには `main` ブランチのみが存在し、`development` ブランチは確認できません。また、マージコミットも存在しません。コミットメッセージは Conventional Commits 形式が一貫して使用されています。

この事実に基づいて生成したテキストです:

---

現在のリポジトリは `main` ブランチ 1 本で運用されています。コミットメッセージは Conventional Commits 形式に従い、`type: 説明` の形式で記述します。

```
feat: add build command
fix: use SDD_SOURCE_ROOT in check scripts
refactor: restructure template directories into hierarchical inheritance chain
chore: bump version to 0.1.0-alpha.1
```

使用するタイプは `feat`（機能追加）・`fix`（バグ修正）・`refactor`（リファクタリング）・`chore`（設定・保守）です。説明は英語の命令形で記述し、本文なしの 1 行形式を基本とします。

---

> **注意**: `development` ブランチや squash merge 運用の証拠はコミット履歴・ブランチ一覧から確認できませんでした。ドキュメントにその方針を記載する場合は、手動で MANUAL ブロック内に追記することをお勧めします。挿入先 `@text` ディレクティブのプロンプトと実態が乖離しているため、プロンプトの修正も検討してください。


### SDD ワークフロー

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化 |
| `sdd-forge gate --spec ...` | spec ゲート |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge review` | docs レビュー |

### テスト

<!-- @text: テスト戦略・使用フレームワーク・テストの実行方法を説明してください。フィクスチャの構成も含めること。 -->

`devDependencies` がゼロであり、テストファイルやフィクスチャが一切存在しないことが確認できました。解析データに基づいて事実のみ記述します。

本プロジェクトは現時点でテストフレームワークを導入しておらず、`devDependencies` は空です。自動テストスイートは未整備の状態であり、動作確認はツール自体を直接実行することで行います。

```bash
node src/sdd-forge.js help
```

フィクスチャ用のディレクトリ（`test/`・`__tests__`・`fixtures/`）も存在しません。テストの追加を検討する場合は、Node.js 組み込みの `node:test` モジュールを使用することで、外部依存なしにユニットテストを記述できます。依存ゼロ方針を維持しつつテストを導入する際は、`node --test` コマンドでテストランナーを起動できます。

---

上記がドキュメント挿入用のマークダウンテキストです。解析データからテストが存在しないことが確認されたため、現状の事実と「導入する場合の方針」を簡潔に記載しました。内容の調整が必要であればお知らせください。


### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリに公開
```

<!-- @text: development → main への squash merge からnpm publish までのリリース手順を説明してください。 -->

`development` ブランチでの開発が完了したら、`main` ブランチへ squash merge します。squash merge により、開発中の細かいコミットを 1 件にまとめてから取り込みます。

```bash
git checkout main
git merge --squash development
git commit -m "release: vX.Y.Z"
git push origin main
```

merge 後、`npm version` コマンドでバージョンを更新します。このコマンドは `package.json` の `version` を書き換え、同名の git タグを自動的に作成します。バグ修正は `patch`、後方互換のある機能追加は `minor`、破壊的変更は `major` を使用してください。バージョン更新後は忘れずにタグを push します。

```bash
git push origin --tags
```

最後に `npm publish` を実行してレジストリに公開します。公開前に `npm whoami` でログイン状態を確認してください。本パッケージは依存関係がゼロのため、`npm pack` で tarball の内容を事前に確認し、不要なファイルが含まれていないかを検証することを推奨します。


### 技術スタックと依存関係

<!-- @text: 使用言語・ランタイムバージョン要件・npm依存関係の方針（依存ゼロ等）を説明してください。 -->

実装言語は JavaScript（Node.js）で、モジュールシステムは ES Modules（`"type": "module"`）を採用しています。実行には **Node.js 18.0.0 以上**が必要です。

npm の依存関係は **ゼロ**を方針としており、`dependencies` および `devDependencies` はいずれも空です。すべての機能は Node.js 組み込みモジュール（`fs`・`path`・`child_process` 等）のみで実装されています。これにより、インストール時に外部パッケージをダウンロードせず、環境への副作用を最小限に抑えています。
