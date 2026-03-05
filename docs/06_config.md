# 06. 設定とカスタマイズ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/` ディレクトリ配下の JSON ファイル群によって動作を制御します。プロジェクトの種別・出力言語・AI エージェント・ドキュメントスタイル・SDD フロー設定など、ツールの主要な挙動をすべてこれらのファイルで調整できます。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | メイン設定ファイル。プロジェクト種別・出力言語・AI エージェント・ドキュメントスタイル・フロー設定など全般を管理する |
| `context.json` | `.sdd-forge/context.json` | プロジェクト概要テキスト（`projectContext`）を保持する。`config.json` の `textFill.projectContext` より優先される |
| `projects.json` | `.sdd-forge/projects.json` | 管理対象プロジェクトの登録情報（名前・ソースパス・作業ルート・デフォルト設定）を保持する |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

**config.json**

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `uiLang` | `string` | — | CLI メッセージの表示言語（`"ja"` / `"en"`） |
| `output.languages` | `string[]` | — | ドキュメントの出力言語リスト（例: `["ja"]`） |
| `output.default` | `string` | — | デフォルト出力言語。`output.languages` に含まれている必要がある |
| `lang` | `string` | 必須 | デフォルト出力言語（後方互換フィールド。`output.default` と同値を設定する） |
| `type` | `string` | 必須 | プロジェクト種別（例: `"cli/node-cli"`, `"webapp/cakephp2"`） |
| `limits.designTimeoutMs` | `number` | — | AI 処理のタイムアウト（ミリ秒） |
| `limits.concurrency` | `number` | `5` | ファイル単位の並列処理数 |
| `documentStyle.purpose` | `string` | — | ドキュメントの目的（`"user-guide"` / `"developer-guide"` / `"api-reference"` / 自由文字列） |
| `documentStyle.tone` | `string` | — | 文体（`"polite"` / `"formal"` / `"casual"`） |
| `documentStyle.customInstruction` | `string` | — | AI に渡す追加指示（任意） |
| `textFill.projectContext` | `string` | `""` | `@text` ディレクティブ解決時に AI へ渡すプロジェクト概要テキスト |
| `textFill.preamblePatterns` | `{ pattern, flags }[]` | — | AI 出力の冒頭から除去するパターン（正規表現） |
| `defaultAgent` | `string` | — | デフォルトで使用するエージェント名（`providers` のキーを指定） |
| `providers.<name>.name` | `string` | — | エージェントの表示名 |
| `providers.<name>.command` | `string` | 必須 | 実行コマンド（例: `"claude"`） |
| `providers.<name>.args` | `string[]` | 必須 | コマンド引数。`{{PROMPT}}` プレースホルダーにプロンプトが展開される |
| `providers.<name>.timeoutMs` | `number` | — | エージェント呼び出しのタイムアウト（ミリ秒） |
| `providers.<name>.systemPromptFlag` | `string` | — | システムプロンプトを渡すフラグ（例: `"--system-prompt"`） |
| `flow.merge` | `string` | `"squash"` | SDD フロー完了時のマージ戦略（`"squash"` / `"ff-only"` / `"merge"`） |

**context.json**

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `projectContext` | `string` | — | プロジェクト概要テキスト。`config.json` の同フィールドより優先して参照される |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目を説明してください。カスタマイズ例を含めること。 -->

**AI エージェントの追加・切り替え**

`providers` に任意のエージェントを定義し、`defaultAgent` で既定エージェントを切り替えられます。`{{PROMPT}}` プレースホルダーを引数に含めることで、コマンドへのプロンプト挿入位置を制御できます。

```json
"providers": {
  "my-agent": {
    "name": "my-llm",
    "command": "my-llm-cli",
    "args": ["--input", "{{PROMPT}}"],
    "timeoutMs": 60000
  }
},
"defaultAgent": "my-agent"
```

**ドキュメントスタイルの調整**

`documentStyle` で生成されるドキュメントのトーンや目的を変更できます。`customInstruction` に追加指示を記述することで、プロジェクト固有の表記ルールを AI に伝えられます。

```json
"documentStyle": {
  "purpose": "developer-guide",
  "tone": "formal",
  "customInstruction": "クラス名・メソッド名はコードブロックで表記すること"
}
```

**フローのマージ戦略**

`flow.merge` を変更することで、SDD フロー完了時の git マージ方式を切り替えられます。スカッシュコミットではなく通常マージを使いたい場合は `"merge"` を指定します。

**プリアンブルパターンの除去**

AI が出力する前置き文を自動除去したい場合、`textFill.preamblePatterns` に正規表現パターンを追加します。複数パターンを列挙できます。

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数 | 用途 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象プロジェクトのソースルートパス。`projects.json` に登録されたプロジェクトのパスが自動的にセットされる。手動で設定することで `projects.json` を使わずに動作させることもできる |
| `SDD_WORK_ROOT` | `.sdd-forge/` ディレクトリを配置する作業ルートパス。`projects.json` の `workRoot` が設定されていればその値が、なければ `SDD_SOURCE_ROOT` と同値がセットされる |
