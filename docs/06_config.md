# 06. 設定とカスタマイズ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/` ディレクトリ以下に配置する JSON ファイルで動作を制御します。プロジェクトタイプ・出力言語・AI エージェント・ドキュメントスタイルなど、解析からテキスト生成・SDD フローに至るまでの主要な挙動をカスタマイズできます。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | メイン設定。プロジェクトタイプ・言語・AI エージェント・ドキュメントスタイルなどを定義します |
| `context.json` | `.sdd-forge/context.json` | プロジェクトコンテキスト情報。`projectContext` フィールドで AI テキスト生成への補足説明を保持します |
| `projects.json` | `.sdd-forge/projects.json` | 登録プロジェクトの一覧とデフォルトプロジェクト名。`sdd-forge setup` で生成・更新されます |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

**config.json**

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `lang` | string | （必須） | ドキュメント出力のデフォルト言語（例: `"ja"`, `"en"`） |
| `type` | string | （必須） | プロジェクトタイプ（例: `"webapp/cakephp2"`, `"cli/node-cli"`） |
| `uiLang` | string | — | CLI メッセージの表示言語（`"en"` \| `"ja"`） |
| `output.languages` | string[] | — | 出力する言語のリスト（例: `["ja", "en"]`） |
| `output.default` | string | — | 出力言語のデフォルト値。`output.languages` に含まれている必要があります |
| `limits.designTimeoutMs` | number | — | AI 呼び出しのタイムアウト（ミリ秒） |
| `limits.concurrency` | number | `5` | ファイル単位の並列処理数 |
| `documentStyle.purpose` | string | — | ドキュメントの目的（`"developer-guide"` \| `"user-guide"` \| `"api-reference"` \| 任意文字列） |
| `documentStyle.tone` | string | — | ドキュメントの文体（`"polite"` \| `"formal"` \| `"casual"`） |
| `documentStyle.customInstruction` | string | — | AI テキスト生成に追加する任意指示 |
| `textFill.projectContext` | string | — | プロジェクト概要の補足テキスト。AI 生成時のコンテキストとして使用されます |
| `textFill.preamblePatterns` | array | — | AI 出力の冒頭から除去する正規表現パターンの一覧（`pattern` / `flags` を持つオブジェクト形式） |
| `defaultAgent` | string | — | `providers` に定義したエージェントのデフォルト名 |
| `providers.<name>.name` | string | — | エージェントの表示名 |
| `providers.<name>.command` | string | （必須） | 実行コマンド（例: `"claude"`） |
| `providers.<name>.args` | string[] | （必須） | コマンド引数。`{{PROMPT}}` はプロンプト文字列に置換されます |
| `providers.<name>.timeoutMs` | number | — | エージェントのタイムアウト（ミリ秒） |
| `providers.<name>.systemPromptFlag` | string | — | システムプロンプトを渡すフラグ（例: `"--system-prompt"`） |
| `flow.merge` | string | `"squash"` | SDD フローのマージ戦略（`"squash"` \| `"ff-only"` \| `"merge"`） |

**context.json**

| フィールド | 型 | デフォルト | 説明 |
|---|---|---|---|
| `projectContext` | string | — | プロジェクト概要テキスト。`config.json` の `textFill.projectContext` より優先して使用されます |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目を説明してください。カスタマイズ例を含めること。 -->

**ドキュメントスタイルの調整**

`documentStyle` でドキュメントの目的と文体を指定すると、AI が生成するテキストのトーンが変化します。利用者向けのガイドを丁寧な文体で生成したい場合は以下のように設定します。

```json
"documentStyle": {
  "purpose": "user-guide",
  "tone": "polite",
  "customInstruction": "専門用語には補足説明を付けること"
}
```

**AI エージェントの切り替え**

`providers` に複数のエージェントを定義し、`defaultAgent` で使用するエージェントを切り替えられます。コマンド実行時に `--agent` オプションを指定すれば、一時的に変更することも可能です。

```json
"defaultAgent": "gemini",
"providers": {
  "gemini": {
    "name": "gemini-cli",
    "command": "gemini",
    "args": ["-p", "{{PROMPT}}"]
  }
}
```

**前置き除去パターンの追加**

AI 出力に不要な前置き文が含まれる場合、`textFill.preamblePatterns` に正規表現を追加することで自動的に除去できます。

```json
"textFill": {
  "preamblePatterns": [
    { "pattern": "^(Here is|以下に|Based on)", "flags": "i" },
    { "pattern": "^Sure,\\s*" }
  ]
}
```

**マージ戦略の変更**

SDD フローで feature ブランチをマージする際の戦略を変更できます。履歴をきれいに保ちたい場合は `"squash"`（デフォルト）、コミット履歴を保持したい場合は `"merge"` を指定します。

```json
"flow": {
  "merge": "merge"
}
```

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数 | 用途 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象プロジェクトのソースコードルートパス。`projects.json` のプロジェクト登録内容から自動設定されますが、直接指定することも可能です |
| `SDD_WORK_ROOT` | 作業ルート（`.sdd-forge/` や `docs/` の出力先）のパス。`projects.json` に `workRoot` が指定されている場合はその値、なければ `SDD_SOURCE_ROOT` と同じ値が設定されます |
