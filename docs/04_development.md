# 04. 開発ガイド

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。開発環境セットアップ、テスト構成を踏まえること。 -->

本章では、sdd-forge の開発に参加するためのローカル環境セットアップ手順と、シェルスクリプトベースのテスト構成について説明します。Node.js のみで動作するシンプルな構成のため、外部ツールの追加インストールは不要です。

## 内容

### 環境セットアップ

<!-- @text: ローカル開発環境のセットアップ手順を記述してください。 -->

以下の手順でローカル開発環境を構築します。

1. リポジトリをクローンします。

   ```bash
   git clone <repository-url>
   cd sdd-forge
   ```

2. `npm link` でパッケージをグローバルコマンドとして登録します。これにより、`sdd-forge` コマンドが `src/sdd-forge.js` を直接参照するようになります。

   ```bash
   npm link
   ```

3. 動作確認をします。

   ```bash
   sdd-forge help
   ```

Node.js のバージョンは 18.0.0 以上が必要です。外部依存パッケージはないため、`npm install` は不要です。`npm link` 後はソースファイルの変更が即座にコマンドに反映されます。

### ローカル開発手順

<!-- @text: ローカル開発の手順（起動→コーディング→テスト→確認）を記述してください。 -->

ローカル開発は以下のサイクルで進めます。

1. **起動確認**: `sdd-forge help` を実行してコマンドが正常に動作することを確認します。

2. **コーディング**: `src/` 以下のソースファイルを編集します。`npm link` 済みの環境では保存後すぐに変更が反映されるため、再インストールは不要です。

3. **テスト実行**: `test/check-scripts.test.sh` を実行して既存の動作が壊れていないか確認します。

   ```bash
   bash test/check-scripts.test.sh
   ```

4. **動作確認**: テスト対象となるプロジェクトのディレクトリで実際に `sdd-forge` コマンドを実行し、期待する出力が得られるか手動で確認します。

5. **SDD フロー**: 機能追加・改修を行う際は、CLAUDE.md に記載された SDD フロー（spec → gate → 実装 → forge → review）に従って進めます。

### SDD ツール

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化（feature ブランチ + spec.md 作成） |
| `sdd-forge gate --spec ...` | spec ゲート（未解決事項チェック） |
| `sdd-forge init` | docs 初期化（テンプレートから docs/ を生成） |
| `sdd-forge review` | docs レビュー（構造・内容・網羅性チェック） |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge flow --request "..."` | SDD フロー自動実行 |

### テスト構成

<!-- @text: テストフレームワークとテスト実行方法を説明してください。 -->

テストはサードパーティのフレームワークを使用せず、シェルスクリプトで記述されています。

**テストファイル**: `test/check-scripts.test.sh`

テスト対象は `src/templates/checks/` 以下のシェルスクリプト群です。テストスクリプト内では `run_test`・`run_test_expect_fail`・`run_test_output_contains` の3つのヘルパー関数を使い、一時的なフェイクプロジェクトディレクトリを作成してスクリプトの入出力を検証します。

テストの実行コマンドは以下の通りです。

```bash
bash test/check-scripts.test.sh
```

実行後、`Results: N/M passed, F failed` 形式のサマリが表示されます。失敗が1件でもあれば終了コード 1 で終了します。
```
