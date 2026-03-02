# 03. 設定とカスタマイズ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/` ディレクトリ配下の JSON ファイル群で動作を制御しており、出力言語・プロジェクト種別・AI プロバイダー・ドキュメントスタイルといった項目を設定できます。プロバイダーのコマンドや引数のカスタマイズ、文体や追加指示の指定を通じて、生成ドキュメントの品質や形式を柔軟に調整できます。


## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

sdd-forge が読み込む設定ファイルの一覧と役割は以下のとおりです。

| ファイルパス | 配置場所 | 役割 |
|---|---|---|
| `.sdd-forge/config.json` | 作業ルート直下 | メイン設定ファイル。プロジェクト種別・出力言語・AI プロバイダー・ドキュメントスタイル等を定義します。 |
| `.sdd-forge/context.json` | 作業ルート直下 | 実行時プロジェクトコンテキスト。`projectContext` フィールドが `config.json` の同名フィールドより優先されます。 |
| `.sdd-forge/projects.json` | 作業ルート直下 | グローバルプロジェクトレジストリ。登録プロジェクトの一覧とデフォルトプロジェクトを管理します。 |
| `.sdd-forge/output/analysis.json` | 作業ルート直下 | `sdd-forge scan` が生成するコード解析データ。`data` / `text` / `forge` 等が参照します。 |
| `.sdd-forge/overrides.json` | 作業ルート直下 | ディレクティブ上書き定義（後方互換のため残存、非推奨）。`init` コマンドのみ参照します。 |


### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

設定ファイルの全フィールドを整理しました。以下が生成テキストです。

---

`.sdd-forge/config.json` のフィールドは以下のとおりです。

| フィールドパス | 型 | 必須 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `lang` | string | 必須 | — | ドキュメントの出力言語（例: `"ja"`, `"en"`） |
| `type` | string | 必須 | — | プロジェクト種別（例: `"webapp/cakephp2"`, `"cli/node-cli"`） |
| `uiLang` | string | 任意 | — | CLI の UI 表示言語（`"ja"` または `"en"`） |
| `output.languages` | string[] | 任意 | — | 出力対象言語の配列（空配列は不可） |
| `output.default` | string | 任意 | — | デフォルト出力言語（`output.languages` のいずれかを指定） |
| `defaultAgent` | string | 任意 | — | `@text` 生成に使用するプロバイダー名（例: `"claude"`） |
| `providers.<name>.command` | string | 必須（プロバイダー定義時） | — | 実行する CLI コマンド（例: `"claude"`） |
| `providers.<name>.args` | string[] | 必須（プロバイダー定義時） | — | コマンド引数。`{{PROMPT}}` でプロンプト挿入位置を指定 |
| `providers.<name>.name` | string | 任意 | — | プロバイダーの表示名 |
| `providers.<name>.timeoutMs` | number | 任意 | — | プロバイダー固有のタイムアウト（ミリ秒） |
| `limits.designTimeoutMs` | number | 任意 | — | ドキュメント生成のタイムアウト（ミリ秒、例: `900000`） |
| `documentStyle.purpose` | string | 任意 | — | ドキュメントの目的（例: `"user-guide"`, `"developer-guide"`, `"api-reference"`） |
| `documentStyle.tone` | string | 任意 | — | 文体（`"polite"` / `"formal"` / `"casual"` のいずれか） |
| `documentStyle.customInstruction` | string | 任意 | — | `@text` 生成時に AI へ追加する指示文 |
| `textFill.projectContext` | string | 任意 | `""` | AI プロンプトに含めるプロジェクト概要テキスト |
| `textFill.preamblePatterns[].pattern` | string | 任意 | — | LLM 出力の前置き除去に使用する正規表現パターン |
| `textFill.preamblePatterns[].flags` | string | 任意 | — | 正規表現フラグ（例: `"i"` で大小文字を区別しない） |

`projectContext` は `.sdd-forge/context.json` の同名フィールドで上書きできます。`context.json` が存在する場合、`config.json` の `textFill.projectContext` より優先されます。


### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目（プロバイダー・テンプレート・コマンド等）を説明してください。カスタマイズ例を含めること。 -->

sdd-forge では、以下の項目をプロジェクトごとにカスタマイズできます。

**AI プロバイダー**: `.sdd-forge/config.json` の `providers` フィールドに、使用する CLI コマンドと引数を定義します。`{{PROMPT}}` プレースホルダーを使うと、任意の位置にプロンプトを挿入できます。

```json
"providers": {
  "claude": {
    "name": "claude-cli",
    "command": "claude",
    "args": ["--model", "opus", "-p", "{{PROMPT}}"]
  }
}
```

**ドキュメントスタイル**: `documentStyle` フィールドで文書の目的・文体・AI への追加指示を制御できます。`customInstruction` にプロジェクト固有の要件（例: 「セキュリティ上の注意事項を必ず含めること」）を記載すると、すべての `@text` 生成に反映されます。

**テンプレート**: `src/templates/locale/<言語>/<タイプ>/` 配下のテンプレートはブロック継承（`@extends` / `@block` / `@parent` ディレクティブ）で上書き可能です。独自のフレームワーク向けプリセットを `src/docs/presets/<type>/<framework>/` に追加することもできます。

**解析データの補足説明**: `.sdd-forge/overrides.json` にテーブル名・コントローラー名などの説明を記載すると、`@data` ディレクティブで生成されるドキュメントに反映されます。

```json
{
  "tables": { "users": "ユーザーアカウント管理テーブル" },
  "controllers": { "UsersController": "ユーザー登録・認証処理" }
}
```


### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

ツールが参照する環境変数は `SDD_WORK_ROOT` と `SDD_SOURCE_ROOT` の2つです。以下が生成テキストです。

---

| 環境変数 | 用途 | 未設定時の挙動 |
|---|---|---|
| `SDD_WORK_ROOT` | 作業ルートディレクトリの絶対パスを指定します。`docs/`・`.sdd-forge/` などの出力先の基点となります。 | `git rev-parse --show-toplevel` でリポジトリルートを取得し、失敗時は `process.cwd()` を使用します。 |
| `SDD_SOURCE_ROOT` | 解析対象ソースコードのルートディレクトリを指定します。`sdd-forge scan` 等のスキャン系コマンドが参照します。 | `SDD_WORK_ROOT` と同じパスを使用します。 |

通常は `sdd-forge` がプロジェクト登録情報（`--project` フラグまたはデフォルトプロジェクト設定）をもとに自動でこれらの環境変数を設定します。複数プロジェクトを管理する場合や CI/CD 環境で明示的にパスを指定したい場合に手動設定が有効です。
