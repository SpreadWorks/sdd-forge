# 03. 設定とカスタマイズ

## 概要

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

本章では、プロジェクトタイプや出力言語設定から AI プロバイダー定義、ドキュメントスタイルの設定まで、sdd-forge の動作を制御する設定ファイルについて説明します。`.sdd-forge/config.json` の完全なリファレンスと、AI エージェント、プリセット選択、マージ戦略、並列処理動作のカスタマイズ方法を紹介します。
<!-- {{/text}} -->

## 目次

### 設定ファイル

<!-- {{text: List all configuration files loaded by this tool in a table, including their location and role. Key files: .sdd-forge/config.json (project settings), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results, including enriched data).}} -->

以下のファイルは、sdd-forge の通常運用時に作成・読み込まれます。すべてのパスはリポジトリルート（または `workRoot` として渡されたディレクトリ）からの相対パスです。

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクトのメイン設定。必須フィールドはコマンド実行のたびに検証されます。 |
| `projects.json` | `.sdd-forge/projects.json` | `sdd-forge setup` で作成されるマルチプロジェクトレジストリ。プロジェクト名とソース・作業ルートパスのマッピングを管理します。 |
| `current-spec` | `.sdd-forge/current-spec` | アクティブな SDD フロー状態（spec パス、ブランチ名、worktree 情報）を追跡する JSON ファイル。フローのクローズ時に削除されます。 |
| `context.json` | `.sdd-forge/context.json` | オプションのプロジェクトコンテキスト文字列。存在する場合、`config.json` の `textFill.projectContext` より優先されます。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成するソースコード解析の全結果。`sdd-forge enrich` 実行後は各エントリに `summary`、`detail`、`chapter`、`role` フィールドが付与されます。 |
| スナップショット | `.sdd-forge/snapshots/` | `sdd-forge snapshot` によるリグレッション検出用の保存済みドキュメントスナップショット。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Document all fields in .sdd-forge/config.json in a table. Include field name, whether it is required, type, default value, and description. Key fields: output.languages (list of output languages), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

すべてのフィールドは起動時に `src/lib/types.js` の `validateConfig()` によって検証されます。必須フィールドが存在しない場合、コマンドはバリデーションエラーの一覧を表示して終了します。

| フィールド | 必須 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output.languages` | ✅ | `string[]` | — | 生成ドキュメントの出力言語リスト。例: `["en"]` または `["en", "ja"]`。空にはできません。 |
| `output.default` | ✅ | `string` | — | プライマリ出力言語。`output.languages` に含まれる値である必要があります。 |
| `output.mode` | — | `"translate"` \| `"generate"` | `"translate"` | デフォルト以外の言語の生成方法。`translate` はデフォルト言語の出力を AI で翻訳します。`generate` は各言語に対して生成パイプラインを独立して実行します。 |
| `lang` | ✅ | `string` | — | CLI、AGENTS.md、スキルプロンプト、spec ファイルの動作言語。代表的な値: `"en"` または `"ja"`。 |
| `type` | ✅ | `string` | — | プリセットを選択するプロジェクトタイプ。例: `"cli/node-cli"`、`"webapp/cakephp2"`、`"webapp/laravel"`。`"cakephp2"` などの短いエイリアスは `TYPE_ALIASES` を通じて自動解決されます。 |
| `documentStyle.purpose` | — | `string` | — | ドキュメントの対象読者と目的を説明します。例: `"user-guide"`、`"developer-guide"`、`"api-reference"`。 |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | — | AI が生成するすべてのテキストに適用される文体。 |
| `documentStyle.customInstruction` | — | `string` | — | テキスト生成時に AI に渡す追加の自由形式の指示。 |
| `textFill.projectContext` | — | `string` | — | 背景情報として AI に提供するプロジェクトの簡単な説明。`.sdd-forge/context.json` が存在する場合はそちらが優先されます。 |
| `textFill.preamblePatterns` | — | `object[]` | — | `{ pattern, flags }` オブジェクトの配列。マッチするプレフィックスを AI 出力から除去して定型的な書き出しを削除します。 |
| `defaultAgent` | — | `string` | — | コマンドラインで `--agent` が指定されない場合に使用するプロバイダーエントリのキー。 |
| `providers.<key>.command` | — | `string` | — | 指定の AI プロバイダーを呼び出す実行ファイル。例: `"claude"`。 |
| `providers.<key>.args` | — | `string[]` | — | プロバイダーコマンドの引数リスト。`{{PROMPT}}` をプレースホルダーとして使用します。省略した場合、プロンプトは自動的に末尾に追加されます。 |
| `providers.<key>.timeoutMs` | — | `number` | `120000` | 呼び出しごとのタイムアウト（ミリ秒）。 |
| `providers.<key>.systemPromptFlag` | — | `string` | — | システムプロンプトの渡し方を指定するフラグ。例: `"--system-prompt"`。 |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDD フローがフィーチャーブランチをクローズする際に使用する Git マージ戦略。 |
| `limits.concurrency` | — | `number` | `5` | `text`、`data`、`enrich` コマンド実行時に並列処理するファイルの最大数。 |
| `limits.designTimeoutMs` | — | `number` | — | 長時間かかるデザインフェーズのエージェント呼び出し全体のタイムアウト（ミリ秒）。 |
| `chapters` | — | `string[]` | — | `preset.json` で定義された章の順序を上書きします。ここに記載されたファイル名（パスなし）のみが指定順で生成されます。 |
| `agentWorkDir` | — | `string` | — | `-C <dir>` で AI エージェントに渡す作業ディレクトリ。エージェントが特定の場所から相対インポートを解決する必要がある場合に有用です。 |
| `uiLang` | — | `"en"` \| `"ja"` | — | インタラクティブな CLI プロンプトおよび進捗メッセージの言語。デフォルトは `lang` の値。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Explain the items users can customize. (1) AI provider settings (providers field: command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include a JSON configuration example for each item.}} -->

#### 1. AI プロバイダー設定

`providers` マップを使用して 1 つ以上の AI エージェントを登録し、`--agent` で切り替えることができます。`args` 内の `{{PROMPT}}` プレースホルダーは生成されたプロンプトの挿入位置を示します。プレースホルダーが存在しない場合、プロンプトは末尾に追加されます。

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--model", "sonnet", "-p", "{{PROMPT}}"],
      "timeoutMs": 180000,
      "systemPromptFlag": "--system-prompt"
    }
  }
}
```

> **注意:** `--system-prompt-file` フラグは Claude CLI に存在しないため使用してはなりません。プロンプトが 100,000 バイトを超える場合、`sdd-forge` は OS の `ARG_MAX` 制限を回避するために自動的に stdin 経由での渡し方に切り替えます。

#### 2. ドキュメントスタイル

`documentStyle` オブジェクトは、AI が生成するすべての章の文体と目的を制御します。`customInstruction` には任意の自由形式の指示を記述でき、すべての生成プロンプトに追加されます。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "専門用語を避け、抽象的な説明よりも具体的な例を使用してください。"
  }
}
```

`tone` に指定できる値は `"polite"`、`"formal"`、`"casual"` です。

#### 3. プリセット選択

`type` フィールドはスキャンとドキュメント生成を駆動するプリセットを選択します。短いエイリアスは自動解決されるため、`"cakephp2"` と `"webapp/cakephp2"` は同等です。

```json
{
  "type": "cli/node-cli"
}
```

利用可能な組み込みタイプには `"cli/node-cli"`、`"webapp/cakephp2"`、`"webapp/laravel"`、`"webapp/symfony"` などがあります。全リストを確認するには `sdd-forge presets` を実行してください。

#### 4. マージ戦略

`flow.merge` フィールドは、SDD フローのクローズ時にフィーチャーブランチを統合する方法を決定します。

```json
{
  "flow": {
    "merge": "squash"
  }
}
```

| 値 | 動作 |
|---|---|
| `"squash"` | フィーチャーブランチのすべてのコミットをベースブランチの 1 つのコミットにまとめます（デフォルト）。 |
| `"ff-only"` | Fast-forward のみ。ベースブランチが分岐している場合は失敗します。 |
| `"merge"` | ブランチの全履歴を保持する標準マージコミット。 |

#### 5. 並列処理数

`limits.concurrency` は `text`、`data`、`enrich` コマンド実行時に同時処理するファイル数の上限を設定します。CPU コアが多いマシンでは増やし、AI のレート制限が問題になる場合は減らしてください。

```json
{
  "limits": {
    "concurrency": 10
  }
}
```

デフォルト値は `5` です。`1` に設定するとすべての AI 呼び出しが直列化されます。
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purpose in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (work root, location of .sdd-forge/), CLAUDECODE (internal variable removed to prevent Claude CLI hang).}} -->

sdd-forge は起動時に以下の環境変数を参照します。これらはリポジトリから解決されたパスより優先されるため、ソースコードと `.sdd-forge/` ディレクトリが異なる場所に存在する CI パイプラインやモノレポ構成で有用です。

| 変数 | 使用箇所 | 説明 |
|---|---|---|
| `SDD_SOURCE_ROOT` | `src/lib/cli.js` → `sourceRoot()` | sdd-forge がスキャンおよびドキュメント生成を行うソースコードの絶対パス。設定されている場合、`git rev-parse` で検出されたリポジトリルートを上書きします。 |
| `SDD_WORK_ROOT` | `src/lib/cli.js` → `repoRoot()` | 作業ルート（`.sdd-forge/` を含むディレクトリ）の絶対パス。設定されている場合、`git rev-parse` と `process.cwd()` の両方を上書きします。設定ファイルと出力ファイルをソースツリー外に置く場合に使用します。 |
| `CLAUDECODE` | `src/lib/agent.js` → `callAgentAsync()` | Claude CLI を spawn する前に子プロセスの環境から検出・**削除**されます。この変数が設定されたままだと Claude CLI が入力待ちでハングするため、削除することで問題を防ぎます。手動で設定・管理する必要はありません。 |

`SDD_SOURCE_ROOT` も `SDD_WORK_ROOT` も設定されていない場合、`repoRoot()` は `git rev-parse --show-toplevel` にフォールバックし、さらに `process.cwd()` にフォールバックします。そのため、標準的な単一リポジトリ構成では環境変数の設定は不要です。
<!-- {{/text}} -->
