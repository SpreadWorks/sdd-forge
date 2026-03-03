# 05. 開発・テスト・配布

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。ローカル開発環境のセットアップ・テスト戦略・リリースフローを踏まえること。 -->

本章では、`npm link` を用いたビルドレスなローカル開発環境の構築手順から、ブランチ運用・コミット規約・リリースフローまで、sdd-forge の開発に参加するために必要な情報をまとめています。外部依存ライブラリを持たない素の ES Modules 構成により、セットアップは最小限の手順で完了します。


## 内容

### ローカル開発環境のセットアップ

```bash
git clone <repository>
cd <project>
npm link          # グローバルコマンドとして登録
<command> help    # 動作確認
```

<!-- @text: 開発中にツール自身を実行する方法と、変更が即座に反映される仕組みを説明してください。 -->

`npm link` を実行すると、グローバルコマンド `sdd-forge` がリポジトリの `src/sdd-forge.js` へのシンボリックリンクとして登録されます。本パッケージはビルドステップを持たない素の JavaScript（ES Modules）で構成されているため、ソースファイルを編集すると次回のコマンド実行にそのまま反映されます。再インストールやビルドは不要です。

別プロジェクトで開発中のバージョンを試したい場合は、そのプロジェクト側でも `npm link sdd-forge` を実行するか、`package.json` の依存に `"sdd-forge": "file:../sdd-forge"` のようなパスを指定して `npm install` することで、ローカルの変更を即座に確認できます。


### ブランチ戦略とコミット規約

<!-- @text: ブランチ運用（main/development の役割・squash merge 方針）とコミットメッセージの形式を説明してください。 -->

ブランチは `main`（リリース用）と `development`（開発用）の2本立てで運用します。機能追加や改修は `sdd-forge spec` コマンドで作成されるフィーチャーブランチ上で作業し、完了後は `development` へ squash merge します。`development` から `main` へのマージもデフォルトで squash merge が適用されます（`flow.merge` 設定で `"squash"` / `"ff-only"` / `"merge"` から変更可能です）。

コミットメッセージは **Conventional Commits** 形式で英語で記述します。

```
feat: add Laravel 8+ preset and templates for sdd-forge
fix: forge creates resolver before populateFromAnalysis call
docs: add project guidelines and fix sdd-flow-start skill
chore: update dependency versions
```

コミットメッセージに sign-off 行（`Signed-off-by:`）や co-authored-by トレーラーを付加しないでください。


### SDD ワークフロー

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化 |
| `sdd-forge gate --spec ...` | spec ゲート |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge review` | docs レビュー |

### テスト

<!-- @text: テスト戦略・使用フレームワーク・テストの実行方法を説明してください。フィクスチャの構成も含めること。 -->

テストフレームワークは Node.js 組み込みの `node:test` であり、外部依存ゼロのポリシーと一致しています。以下が生成テキストです。

---

テストフレームワークには Node.js 組み込みの `node:test` モジュールを使用しており、外部パッケージへの依存はありません。テストは `tests/` ディレクトリに配置されており、`npm test`（`find tests -name '*.test.js' | xargs node --test`）で一括実行できます。

ユニットテストは `tests/lib/`・`tests/docs/commands/`・`tests/specs/commands/` などコマンド・モジュール単位で分かれており、`node:assert/strict` によるアサーションを使用しています。

フィクスチャ構成は `tests/helpers/` に集約されています。`tmp-dir.js` はテスト用一時ディレクトリの作成・削除・ファイル書き込みを提供し、`mock-project.js` はそれを利用して `.sdd-forge/config.json`・`package.json`・`analysis.json`・`docs/` を含む疑似プロジェクトをオンメモリで構築します。各テストは `afterEach` フックで一時ディレクトリを削除し、テスト間の独立性を保ちます。

`test/check-scripts.test.sh` は Bash スクリプト群の統合テストで、`mktemp -d` で作成したフェイクプロジェクトに対して各チェックスクリプトを実行し、終了コードで合否を判定します。このシェルテストは `npm test` には含まれておらず、直接 `bash test/check-scripts.test.sh` で実行します。


### リリースフロー

```bash
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm publish         # npm レジストリに公開
```

<!-- @text: development → main への squash merge からnpm publish までのリリース手順を説明してください。 -->

`development` ブランチでの開発が完了したら、`main` へ squash merge してリリースを行います。

1. GitHub（または任意のリモート）上で `development` → `main` への Pull Request を作成し、squash merge します。
2. ローカルで `main` ブランチに切り替え、最新の状態を pull します。
3. `npm version patch` または `npm version minor` を実行してバージョンを更新します。このコマンドは `package.json` の `version` フィールドを書き換え、対応するバージョンタグのコミットを自動で作成します。
4. `git push origin main --tags` でバージョンタグをリモートに push します。
5. `npm publish` を実行します。npm レジストリへの公開対象は `package.json` の `"files": ["src/"]` で定義されており、`src/` ディレクトリのみがパッケージに含まれます。


### 技術スタックと依存関係

<!-- @text: 使用言語・ランタイムバージョン要件・npm依存関係の方針（依存ゼロ等）を説明してください。 -->

実装言語は JavaScript（ES Modules）で、Node.js v18.0.0 以上が必要です。

npm の `dependencies` および `devDependencies` はいずれも空であり、外部パッケージへの依存はゼロです。すべての機能は Node.js の組み込みモジュール（`fs`、`path`、`child_process` など）のみで実装されています。これにより、`npm install` 不要でクローン直後から動作し、依存関係の脆弱性リスクや将来的な破壊的変更の影響を受けません。
