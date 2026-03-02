# 06. 設定とカスタマイズ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/` ディレクトリ配下の JSON ファイルによってプロジェクトの解析・ドキュメント生成・AI連携の挙動を制御します。設定可能な項目は出力言語・ドキュメントスタイル・AIエージェント定義など多岐にわたり、プロジェクトの性質や運用ポリシーに合わせてカスタマイズできます。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `<作業ルート>/.sdd-forge/config.json` | メイン設定ファイル。出力言語・プロジェクトタイプ・ドキュメントスタイル・AIエージェント設定などを記述します。`sdd-forge setup` 実行時に自動生成されます。 |
| `context.json` | `<作業ルート>/.sdd-forge/context.json` | プロジェクトコンテキスト（概要テキスト）を保持します。`config.json` の `textFill.projectContext` より優先して参照されます。 |
| `projects.json` | `<sdd-forge 実行ディレクトリ>/.sdd-forge/projects.json` | 登録済みプロジェクトの一覧と各プロジェクトのソースパス・作業ルートを管理します。複数プロジェクトを管理する場合に使用します。 |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

**config.json**

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `uiLang` | `string` | `"en"` | セットアップウィザードの表示言語。`"en"` または `"ja"` を指定します。 |
| `output.languages` | `string[]` | — | ドキュメントの出力言語リスト（例: `["ja"]`、`["en", "ja"]`）。 |
| `output.default` | `string` | — | デフォルト出力言語。`output.languages` に含まれる値を指定します。 |
| `lang` | `string` | — | 後方互換用フィールド。`output.default` と同値です（必須）。 |
| `type` | `string` | — | プロジェクトタイプ。`"webapp/cakephp2"`・`"cli"`・`"library"` などを指定します（必須）。 |
| `limits.designTimeoutMs` | `number` | — | AI処理のタイムアウト時間（ミリ秒）。省略時はデフォルト値が適用されます。 |
| `documentStyle.purpose` | `string` | — | ドキュメントの目的。`"developer-guide"`・`"user-guide"`・`"api-reference"` または任意の文字列を指定します。 |
| `documentStyle.tone` | `string` | — | AIが生成するテキストの文体。`"polite"`・`"formal"`・`"casual"` のいずれかを指定します。 |
| `documentStyle.customInstruction` | `string` | — | AIへの追加指示。省略可能です。 |
| `textFill.projectContext` | `string` | `""` | AI生成時に渡すプロジェクト概要テキスト。`context.json` の値が存在する場合はそちらが優先されます。 |
| `textFill.preamblePatterns` | `{ pattern: string, flags?: string }[]` | — | LLM出力から除去するプレフィックスの正規表現パターン一覧。 |
| `defaultAgent` | `string` | — | デフォルトで使用するAIエージェント名（`providers` のキーと対応）。 |
| `providers.<name>.name` | `string` | — | エージェントの表示名。 |
| `providers.<name>.command` | `string` | — | 実行するコマンド（必須）。 |
| `providers.<name>.args` | `string[]` | — | コマンド引数。`{{PROMPT}}` プレースホルダーを含めることができます（必須）。 |
| `providers.<name>.timeoutMs` | `number` | — | エージェントごとのタイムアウト時間（ミリ秒）。省略可能です。 |

**context.json**

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `projectContext` | `string` | — | AIがドキュメント生成時に参照するプロジェクト概要テキスト。`config.json` の `textFill.projectContext` より優先されます。 |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目を説明してください。カスタマイズ例を含めること。 -->

**ドキュメントスタイルの調整**

`documentStyle` フィールドでAIが生成するテキストのトーンや目的を制御できます。たとえば、エンドユーザー向けのマニュアルを作成したい場合は次のように設定します。

```json
"documentStyle": {
  "purpose": "user-guide",
  "tone": "polite",
  "customInstruction": "専門用語には括弧内で補足説明を加えること"
}
```

**カスタムAIエージェントの登録**

`providers` にエントリを追加することで、任意のCLIベースのAIエージェントを利用できます。`{{PROMPT}}` はsdd-forgeが実行時にプロンプト文字列で置換します。

```json
"defaultAgent": "my-agent",
"providers": {
  "my-agent": {
    "name": "my-llm-cli",
    "command": "my-llm",
    "args": ["--system", "You are a technical writer.", "--prompt", "{{PROMPT}}"],
    "timeoutMs": 60000
  }
}
```

**LLM出力のクリーニングパターン**

AIが生成したテキストに不要なプレフィックス（「以下に〜」など）が含まれる場合、`textFill.preamblePatterns` に正規表現を追加することで自動除去できます。

```json
"textFill": {
  "preamblePatterns": [
    { "pattern": "^(Here is|以下に|Based on)", "flags": "i" },
    { "pattern": "^Sure,\\s*" }
  ]
}
```

**多言語出力**

`output.languages` に複数の言語コードを指定すると、複数言語でドキュメントを生成できます。

```json
"output": {
  "languages": ["ja", "en"],
  "default": "ja"
}
```

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数 | 用途 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象プロジェクトのソースコードルートディレクトリの絶対パス。`sdd-forge` コマンド実行時にプロジェクト解決の結果として自動的に設定されます。各サブコマンドはこの値を参照してソースコードの場所を特定します。 |
| `SDD_WORK_ROOT` | ドキュメント・spec・設定ファイルの出力先となる作業ルートディレクトリの絶対パス。`sdd-forge` コマンド実行時に自動設定されます。`SDD_SOURCE_ROOT` と同じパスになることもあります（`workRoot` を別途指定しない場合）。 |
```

---

書き込み権限を許可していただければ、ファイルに直接反映します。内容の概要は以下のとおりです。

- **説明**: 設定ファイルの種類とカスタマイズ可能な範囲を1〜2文で紹介
- **設定ファイル**: `config.json`・`context.json`・`projects.json` の3種類を表形式で整理
- **設定項目リファレンス**: `types.js` の型定義と `setup.js` の生成ロジックをもとに全フィールドを網羅
- **カスタマイズポイント**: ドキュメントスタイル・カスタムエージェント・preamblePatterns・多言語出力の4つをコード例付きで説明
- **環境変数**: `SDD_SOURCE_ROOT` と `SDD_WORK_ROOT`（`sdd-forge.js` が自動設定）を記載
