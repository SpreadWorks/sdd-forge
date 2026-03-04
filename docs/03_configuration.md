# 03. 設定とカスタマイズ

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/config.json` を中心に、出力言語・AIプロバイダー・ドキュメントスタイル・フロー動作などを設定できます。テンプレートのブロック上書きやプリセット選択によって、プロジェクト固有のカスタマイズにも対応しています。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクト全体の設定ファイル。出力言語・プロジェクトタイプ・AIプロバイダー・ドキュメントスタイル等を定義します。`sdd-forge setup` で雛形が生成されます。 |
| `context.json` | `.sdd-forge/context.json` | プロジェクトの概要テキストを保持する補助ファイル。`sdd-forge setup` 実行時に自動生成され、`config.json` の `textFill.projectContext` より優先されます。 |
| `current-spec` | `.sdd-forge/current-spec` | SDDフロー実行中の状態ファイル。現在のspec・ブランチ・worktree情報を保持します。`sdd-forge spec` で作成され、`sdd-flow-close` で削除されます。 |
| `projects.json` | `~/.sdd-forge/projects.json` | 複数プロジェクトの登録情報を管理するファイル。`sdd-forge setup` でエントリーが追加されます。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成するソースコード解析結果。`@data` ディレクティブの解決に使用されます。 |
| `summary.json` | `.sdd-forge/output/summary.json` | `sdd-forge scan` が生成する `analysis.json` の軽量版。AIへの入力コスト削減のため、`forge`・`agents`・`init` コマンドが優先的に参照します。 |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

以下は `.sdd-forge/config.json` の全フィールドです。

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `uiLang` | `string` | `"ja"` | CLIメッセージの表示言語。`"en"` または `"ja"` を指定します。 |
| `lang` | `string` | `"ja"` | ドキュメントの出力言語（後方互換フィールド）。`output.default` と同じ値を設定してください。 |
| `output.languages` | `string[]` | `["ja"]` | 生成するドキュメントの対応言語リスト。 |
| `output.default` | `string` | `"ja"` | デフォルトの出力言語。`output.languages` に含まれる値である必要があります。 |
| `type` | `string` | —（必須） | プロジェクトタイプ。`"webapp/cakephp2"`・`"webapp/laravel"`・`"webapp/symfony"`・`"cli/node-cli"` などを指定します。エイリアス（`"cakephp2"`・`"node-cli"` 等）も使用できます。 |
| `limits.designTimeoutMs` | `number` | `900000` | AIエージェント呼び出しのタイムアウト（ミリ秒）。 |
| `limits.concurrency` | `number` | `5` | ファイルごとのAI並列処理数。 |
| `documentStyle.purpose` | `string` | `"developer-guide"` | ドキュメントの目的。`"developer-guide"`・`"user-guide"`・`"api-reference"` から選択します。 |
| `documentStyle.tone` | `string` | `"polite"` | 文体。`"polite"`・`"formal"`・`"casual"` から選択します。 |
| `documentStyle.customInstruction` | `string` | `""` | AIへの追加指示。文体・用語統一など任意の指示を自由記述できます。 |
| `textFill.projectContext` | `string` | `""` | プロジェクト概要テキスト。`context.json` が存在する場合はそちらが優先されます。 |
| `textFill.preamblePatterns` | `object[]` | `[{ "pattern": "^(Here is|以下に|Based on)", "flags": "i" }]` | AIの出力から除去するパターンのリスト。`pattern`（正規表現）と `flags` を指定します。 |
| `defaultAgent` | `string` | `"claude"` | デフォルトで使用するAIエージェント名。`providers` のキーと対応します。 |
| `providers.<name>.name` | `string` | —（必須） | エージェントの表示名（例: `"claude-cli"`）。 |
| `providers.<name>.command` | `string` | —（必須） | 実行コマンド（例: `"claude"`）。 |
| `providers.<name>.args` | `string[]` | —（必須） | コマンドへの引数リスト。プロンプト挿入位置に `{{PROMPT}}` を記述します。 |
| `providers.<name>.timeoutMs` | `number` | `120000` | エージェントごとのタイムアウト（ミリ秒）。 |
| `providers.<name>.systemPromptFlag` | `string` | —（省略可） | システムプロンプトを渡すフラグ。`"--system-prompt"` または `"--system-prompt-file"` を指定します。省略するとユーザープロンプトに連結されます。 |
| `flow.merge` | `string` | `"squash"` | SDDフロー終了時のマージ方式。`"squash"`・`"ff-only"`・`"merge"` から選択します。 |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目（プロバイダー・テンプレート・コマンド等）を説明してください。カスタマイズ例を含めること。 -->

**AIプロバイダーの変更**

`config.json` の `providers` セクションを編集することで、使用するAIエージェントを差し替えられます。`{{PROMPT}}` はプロンプトの挿入位置を示すプレースホルダーです。

```json
"providers": {
  "claude": {
    "name": "claude-cli",
    "command": "claude",
    "args": ["--model", "opus", "-p", "{{PROMPT}}"],
    "systemPromptFlag": "--system-prompt"
  }
}
```

**テンプレートのブロック上書き**

`.sdd-forge/custom/` ディレクトリに、`src/templates/locale/` と同じディレクトリ構造でテンプレートファイルを配置することで、特定ブロックを上書きできます。`<!-- @block: name -->` と `<!-- @endblock -->` でブロックを囲んで記述します。`sdd-forge init` 実行時に、バンドル済みテンプレートよりもカスタムテンプレートが優先されます。

**ドキュメントスタイルの調整**

`documentStyle.customInstruction` に自由テキストを設定することで、AIによるテキスト生成の方向性を細かく制御できます。例えば `"専門用語は英語表記を維持し、初心者向けの補足を各セクションに追加すること"` のように記述します。

**プロジェクトタイプの選択**

`type` フィールドにプリセットを指定することで、スキャン対象ディレクトリやリゾルバーが自動的に切り替わります。現在利用可能なプリセットは `webapp/cakephp2`・`webapp/laravel`・`webapp/symfony`・`cli/node-cli` です。`"cakephp2"` などのエイリアスも使用できます。

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数 | 用途 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象プロジェクトのソースコードルートパス。`sdd-forge.js` がプロジェクトコンテキスト解決時にセットし、各コマンドがソースコードの読み取りパスとして参照します。 |
| `SDD_WORK_ROOT` | 作業ディレクトリのルートパス。`.sdd-forge/`・`docs/`・`specs/` の基点となります。`sdd-forge.js` がセットし、設定ファイルや出力ファイルの読み書き先として参照します。 |
| `CLAUDECODE` | Claude Code環境での多重起動防止フラグ。子プロセス実行時に環境変数から除去することで、Claude CLIがClaude Code内から再起動されるのを防ぎます。sdd-forge が内部的に制御するため、ユーザーが設定する必要はありません。 |
| `HOME` / `USERPROFILE` | `~/.sdd-forge/projects.json` のパス解決に使用します。OS標準の環境変数をそのまま参照します。 |
