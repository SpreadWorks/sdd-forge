# 06. 設定とカスタマイズ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/` ディレクトリ配下の JSON ファイル群によって動作を制御します。ドキュメント出力言語・AI エージェント・ドキュメントスタイル・git マージ戦略など、プロジェクト固有の挙動を一元的にカスタマイズできます。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル | 配置場所 | 役割 | 生成方法 |
|---|---|---|---|
| `config.json` | `.sdd-forge/config.json` | メイン設定。出力言語・プロジェクト型・エージェント・ドキュメントスタイルなどを管理します | `sdd-forge setup` |
| `context.json` | `.sdd-forge/context.json` | プロジェクト概要テキストを保持します。`config.json` の `textFill.projectContext` よりも優先されます | 実行時に自動保存 |
| `projects.json` | `.sdd-forge/projects.json` | 複数プロジェクトのパスとデフォルト設定を管理します | `sdd-forge setup` |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成するソースコード解析の詳細結果です | `sdd-forge scan` |
| `summary.json` | `.sdd-forge/output/summary.json` | AI への入力用に最適化されたスキャン結果の軽量版です | `sdd-forge scan` |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

以下は `.sdd-forge/config.json` の全フィールドです。

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `uiLang` | string | — | CLI メッセージの表示言語。`"ja"` または `"en"` を指定します |
| `lang` | string | — | ドキュメントのデフォルト出力言語（後方互換フィールド、必須） |
| `output.languages` | string[] | — | ドキュメントを生成する言語のリスト（必須） |
| `output.default` | string | — | デフォルト出力言語。`output.languages` に含まれる必要があります（必須） |
| `type` | string | — | プロジェクト型。スキャン設定とテンプレート選択に使用します（必須）。例: `"cli/node-cli"`, `"webapp/cakephp2"` |
| `limits.designTimeoutMs` | number | — | AI 呼び出しのタイムアウト時間（ミリ秒） |
| `limits.concurrency` | number | `5` | ファイル単位の並行処理数 |
| `documentStyle.purpose` | string | — | ドキュメントの目的。AI への指示に使用されます。例: `"developer-guide"`, `"user-guide"`, `"api-reference"` |
| `documentStyle.tone` | string | — | 執筆トーン。`"polite"` / `"formal"` / `"casual"` のいずれか |
| `documentStyle.customInstruction` | string | — | AI へのカスタム執筆指示（自由文字列） |
| `textFill.projectContext` | string | — | AI 向けのプロジェクト概要テキスト。`context.json` が存在する場合はそちらが優先されます |
| `textFill.preamblePatterns` | object[] | — | LLM 出力から除去する接頭辞パターン（正規表現）。`pattern` と `flags` で構成されます |
| `defaultAgent` | string | — | デフォルトで使用するエージェント名。`providers` のキーを指定します |
| `providers.<name>.name` | string | — | エージェントの表示名 |
| `providers.<name>.command` | string | — | 実行コマンド（必須） |
| `providers.<name>.args` | string[] | — | コマンド引数。`{{PROMPT}}` プレースホルダーが使用できます（必須） |
| `providers.<name>.timeoutMs` | number | — | このエージェント固有のタイムアウト（ミリ秒） |
| `providers.<name>.systemPromptFlag` | string | — | システムプロンプトを渡すフラグ名。例: `"--system-prompt"` |
| `flow.merge` | string | `"squash"` | SDD フローで使用する git マージ戦略。`"squash"` / `"ff-only"` / `"merge"` のいずれか |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目を説明してください。カスタマイズ例を含めること。 -->

**ドキュメントスタイルの調整**

`documentStyle` フィールドで、生成されるドキュメントの目的・文体・AI への追加指示を制御できます。運用手順書として利用する場合は `purpose` に `"user-guide"`、コード解説向けには `"developer-guide"` を指定します。`customInstruction` を使うと、AI に対して「箇条書きを使わずに記述すること」などのプロジェクト固有ルールを追加できます。

```json
"documentStyle": {
  "purpose": "user-guide",
  "tone": "polite",
  "customInstruction": "専門用語には初出時に英語表記を併記すること。"
}
```

**AI エージェントの差し替え**

`providers` に任意のコマンドを登録し、`defaultAgent` で切り替えることができます。Claude CLI 以外のエージェントも `command` と `args` を設定するだけで利用できます。

```json
"defaultAgent": "codex",
"providers": {
  "codex": {
    "name": "OpenAI Codex",
    "command": "openai",
    "args": ["api", "completions.create", "-p", "{{PROMPT}}"]
  }
}
```

**LLM 出力の前置き除去**

モデルによっては「以下に生成します」のような前置き文が出力に含まれる場合があります。`textFill.preamblePatterns` に正規表現を登録すると、これらを自動的に除去できます。

```json
"textFill": {
  "preamblePatterns": [
    { "pattern": "^(以下に|Here is|Based on)", "flags": "i" }
  ]
}
```

**マージ戦略の変更**

`flow.merge` を変更することで、SDD フロー完了時の feature ブランチマージ方式を制御できます。コミット履歴を一本化したい場合は `"squash"`（デフォルト）、ファストフォワードのみ許可する場合は `"ff-only"` を指定します。

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数 | 用途 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象のソースコードルートディレクトリを指定します。`sdd-forge` がマルチプロジェクト設定を解決した際に自動的に設定されます。手動設定も可能です |
| `SDD_WORK_ROOT` | `.sdd-forge/`・`docs/`・`specs/` を含む作業ルートディレクトリを指定します。`projects.json` の `workRoot` フィールドをもとに設定されます。未設定時はリポジトリルートにフォールバックします |
