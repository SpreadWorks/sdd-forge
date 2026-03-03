# 03. 設定とカスタマイズ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/config.json` を中心とした複数の設定ファイルを読み込み、ドキュメント生成の言語・スタイル・AI プロバイダー・プロジェクト登録などを制御します。テンプレートや AI エージェントのコマンドをカスタマイズすることで、さまざまなプロジェクト環境に合わせた柔軟な運用が可能です。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル名 | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `{プロジェクトルート}/.sdd-forge/config.json` | プロジェクトごとの主設定ファイル。出力言語・ドキュメントスタイル・AI プロバイダー・マージ戦略などを管理します。`sdd-forge setup` 実行時に自動生成されます。 |
| `context.json` | `{プロジェクトルート}/.sdd-forge/context.json` | AI へ渡すプロジェクトの文脈情報を格納します。`config.json` の `textFill.projectContext` より優先されます。 |
| `projects.json` | `~/.sdd-forge/projects.json` | 複数プロジェクトのパスとデフォルト設定を登録するレジストリファイルです。`sdd-forge setup` 実行時に作成・更新されます。 |
| `overrides.json` | `{プロジェクトルート}/.sdd-forge/overrides.json` | スキャンで自動抽出されたエンティティ（テーブル・コントローラー等）に対して、手動で説明文を上書きするためのファイルです。 |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

以下は `.sdd-forge/config.json` の全フィールドです。

| フィールド名 | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `uiLang` | string | `"en"` | CLI の対話プロンプトで使用する言語。`"en"` または `"ja"` を指定します。 |
| `output.languages` | string[] | `["ja"]` | 生成するドキュメントの言語コード一覧（例: `["ja", "en"]`）。 |
| `output.default` | string | `"ja"` | ドキュメント生成時のデフォルト言語。`output.languages` に含まれる値を指定します。 |
| `type` | string | — | プロジェクト種別。`"webapp"`・`"webapp/cakephp2"`・`"webapp/laravel"`・`"webapp/symfony"`・`"cli"`・`"cli/node-cli"`・`"library"` から選択します。 |
| `limits.designTimeoutMs` | number | `900000` | AI 生成処理のタイムアウト（ミリ秒）。デフォルトは 15 分です。 |
| `documentStyle.purpose` | string | `"developer-guide"` | ドキュメントの目的。`"developer-guide"`・`"user-guide"`・`"api-reference"` またはカスタム文字列を指定します。 |
| `documentStyle.tone` | string | `"polite"` | 文体。`"polite"`（です・ます調）・`"formal"`（だ・である調）・`"casual"`（口語体）から選択します。 |
| `documentStyle.customInstruction` | string | `""` | AI 生成時に追加するカスタム指示文です。 |
| `textFill.projectContext` | string | `""` | AI へ渡すプロジェクトの説明文です。`context.json` が存在する場合はそちらが優先されます。 |
| `textFill.preamblePatterns` | object[] | `[]` | AI 出力の冒頭に現れる不要な前置き文を除去するための正規表現パターン一覧です。各要素に `pattern`（文字列）と `flags`（省略可）を指定します。 |
| `flow.merge` | string | `"squash"` | SDD フロー完了時の Git マージ戦略。`"squash"`・`"ff-only"`・`"merge"` から選択します。 |
| `defaultAgent` | string | — | デフォルトで使用する AI エージェント名（例: `"claude"`）。`providers` に定義した名前と対応させます。 |
| `providers` | object | — | AI エージェントのコマンド定義マップ。エージェント名をキーとし、`command`・`args` などを値として設定します。 |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目（プロバイダー・テンプレート・コマンド等）を説明してください。カスタマイズ例を含めること。 -->

**AI プロバイダーの変更**

`config.json` の `providers` フィールドに任意のコマンドを登録することで、使用する AI エージェントを切り替えられます。`{{PROMPT}}` はプロンプト本文に自動置換されます。

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--model", "sonnet", "-p", "{{PROMPT}}"]
    }
  }
}
```

**ドキュメントスタイルの調整**

`documentStyle` で文体・目的・追加指示を設定します。利用者向けガイドをです・ます調で生成する場合の例を示します。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "専門用語には括弧書きで補足説明を添えること。"
  }
}
```

**冒頭前置き文の除去**

AI が出力する「以下に説明します」などの前置き文を自動削除したい場合は `textFill.preamblePatterns` を設定します。

```json
{
  "textFill": {
    "preamblePatterns": [
      { "pattern": "^(以下に|Based on|Here is)", "flags": "i" }
    ]
  }
}
```

**エンティティ説明の上書き**

`overrides.json` を作成して、スキャン結果の自動説明文を手動で上書きできます。

```json
{
  "tables": {
    "users": "ユーザーアカウント管理テーブル"
  },
  "controllers": {
    "AdminController": "管理画面のコントローラー"
  }
}
```

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数名 | 用途 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象のソースコードルートディレクトリのパスです。`sdd-forge.js` がプロジェクトモードで起動した際に自動設定され、各サブコマンドが参照します。 |
| `SDD_WORK_ROOT` | ドキュメント出力先（作業ルート）のパスです。未設定の場合は `process.cwd()` が使用されます。 |
| `CLAUDECODE` | Claude CLI の多重起動を防ぐためのガードフラグです。AI エージェント呼び出し時にこの変数は除去され、ネストした起動を回避します。 |
```
