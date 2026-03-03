# 06. 設定とカスタマイズ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/config.json` を中心に動作し、プロジェクトタイプ・出力言語・ドキュメントスタイル・AI エージェントなどを一元管理します。`sdd-forge setup` で初期生成された設定ファイルを直接編集することで、ドキュメント生成の挙動やワークフローのマージ戦略などをカスタマイズできます。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `<work-root>/.sdd-forge/config.json` | プロジェクトタイプ・言語・ドキュメントスタイル・エージェント等を定義するメイン設定ファイル |
| `context.json` | `<work-root>/.sdd-forge/context.json` | AI 向けのプロジェクト概要テキストを保存するファイル。`config.json` の `textFill.projectContext` より優先して参照される。省略可能 |
| `projects.json` | `<sdd-forge 実行ディレクトリ>/.sdd-forge/projects.json` | sdd-forge に登録されたプロジェクト一覧とデフォルトプロジェクトを管理する |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

以下は `config.json` の全フィールドです。

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `uiLang` | string | `"en"` | CLI の表示言語。`"en"` または `"ja"` を指定する |
| `output.languages` | string[] | — | ドキュメントの出力言語リスト（例: `["ja", "en"]`） |
| `output.default` | string | — | デフォルト出力言語。`output.languages` の中から指定する |
| `lang` | string | — | デフォルト出力言語（`output.default` と同値。後方互換用フィールド） |
| `type` | string | — | プロジェクトタイプ。`webapp` / `webapp/cakephp2` / `webapp/laravel` / `webapp/symfony` / `cli` / `cli/node-cli` / `library` から選択 |
| `limits.designTimeoutMs` | number | — | AI 呼び出しのタイムアウト (ms) |
| `documentStyle.purpose` | string | — | ドキュメントの用途。`developer-guide` / `user-guide` / `api-reference` または任意文字列 |
| `documentStyle.tone` | string | — | 文体。`polite` / `formal` / `casual` のいずれか |
| `documentStyle.customInstruction` | string | — | AI への追加指示（省略可） |
| `textFill.projectContext` | string | `""` | AI 生成テキストに渡すプロジェクト概要。`context.json` の値が存在する場合はそちらが優先される |
| `textFill.preamblePatterns[].pattern` | string | — | LLM 出力の前置き文を除去するための正規表現パターン |
| `textFill.preamblePatterns[].flags` | string | — | 正規表現フラグ（省略可。例: `"i"`） |
| `defaultAgent` | string | — | デフォルトで使用するエージェント名。`providers` のキーと一致させる |
| `providers.<name>.name` | string | — | エージェントの表示名 |
| `providers.<name>.command` | string | — | エージェントの実行コマンド |
| `providers.<name>.args` | string[] | — | コマンド引数。`{{PROMPT}}` プレースホルダーを使用できる |
| `providers.<name>.timeoutMs` | number | — | エージェント呼び出しのタイムアウト (ms)（省略可） |
| `flow.merge` | string | `"squash"` | `sdd-forge flow` 実行時のマージ戦略。`squash` / `ff-only` / `merge` から選択 |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目を説明してください。カスタマイズ例を含めること。 -->

**ドキュメントスタイルの変更**

`documentStyle.purpose` と `documentStyle.tone` を変更することで、AI が生成するドキュメントの文体と用途を調整できます。`customInstruction` に任意の指示を追加することも可能です。

```json
"documentStyle": {
  "purpose": "user-guide",
  "tone": "polite",
  "customInstruction": "箇条書きよりも文章形式を優先してください。"
}
```

**カスタムエージェントの追加**

`providers` にエントリを追加することで、任意の CLI エージェントを登録できます。`{{PROMPT}}` はツールが自動的にプロンプト文字列で置換します。

```json
"defaultAgent": "my-llm",
"providers": {
  "my-llm": {
    "name": "my-llm-cli",
    "command": "my-llm",
    "args": ["--prompt", "{{PROMPT}}"],
    "timeoutMs": 120000
  }
}
```

**LLM 出力の前置き除去パターン**

`textFill.preamblePatterns` に正規表現を追加することで、AI 出力の冒頭に付く不要な前置き文を自動除去できます。

```json
"textFill": {
  "preamblePatterns": [
    { "pattern": "^(Here is|以下に|Based on)", "flags": "i" },
    { "pattern": "^Sure,\\s*" }
  ]
}
```

**マージ戦略の変更**

`flow.merge` を変更することで、`sdd-forge flow` が feature ブランチをベースブランチにマージする際の方式を指定できます。デフォルトは `"squash"` です。

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数 | 用途 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象ソースコードのルートディレクトリパス。通常は `projects.json` の登録情報をもとに自動設定される |
| `SDD_WORK_ROOT` | 出力先（`.sdd-forge/`・`docs/`・`specs/` の配置場所）のルートパス。`projects.json` の `workRoot` 設定をもとに自動設定される |
```
