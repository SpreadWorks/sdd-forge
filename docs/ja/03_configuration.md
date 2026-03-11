# 03. 設定とカスタマイズ

## 概要

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

`sdd-forge` は `.sdd-forge/` ディレクトリ以下にある複数の設定ファイルを読み込み、ドキュメント生成・AIプロバイダー連携・出力言語・SDDワークフローの動作を制御します。本章では、すべての設定ファイル、`config.json` の利用可能なフィールド、およびユーザーが利用できるカスタマイズポイントを説明します。

<!-- {{/text}} -->

## 目次

### 設定ファイル

<!-- {{text: List all configuration files read by this tool in a table, including the location and role of each. Key files: .sdd-forge/config.json (project settings), .sdd-forge/context.json (project context), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results), .sdd-forge/output/summary.json (lightweight version for AI).}} -->

| ファイル | 役割 |
|---|---|
| `.sdd-forge/config.json` | プロジェクトの主要設定ファイル。出力言語・プロジェクトタイプ・AIプロバイダー・ドキュメントスタイル・マージ戦略などを制御する。 |
| `.sdd-forge/context.json` | AIテキスト生成で使用するプロジェクトコンテキスト文字列を格納する。`config.json` の `textFill.projectContext` より優先される。 |
| `.sdd-forge/projects.json` | 複数プロジェクトの登録情報。プロジェクト名をソースルートおよびワークルートのパスにマッピングし、デフォルトプロジェクトを指定する。 |
| `.sdd-forge/current-spec` | アクティブなSDDフローの状態をJSONオブジェクトとして追跡する（現在のspecパス・ベースブランチ・featureブランチ・オプションのworktree詳細）。 |
| `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成するソースコード解析結果のフル版。ドキュメント生成の正本として使用される。 |
| `.sdd-forge/output/summary.json` | AI消費向けの軽量版解析結果。存在する場合は `analysis.json` より優先して使用され、存在しない場合は `analysis.json` にフォールバックする。 |
| `.sdd-forge/snapshots/` | `snapshot` コマンドがリグレッション検出用のベースライン出力を保存するディレクトリ。`manifest.json` とキャプチャされたファイルのコピーを含む。 |

<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text: Describe all fields of .sdd-forge/config.json in a table. Include field name, whether required, type, default value, and description. Key fields: output.languages (output language list), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (projectContext/preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

| フィールド | 必須 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output.languages` | ✅ | `string[]` | — | 生成ドキュメントの出力言語リスト（例: `["en"]`、`["en", "ja"]`）。 |
| `output.default` | ✅ | `string` | — | 主要出力言語。ドキュメントはこの言語で直接生成される。 |
| `output.mode` | — | `"translate"` \| `"generate"` | `"translate"` | デフォルト以外の言語の生成方法。`translate` は `translate` コマンドを実行し、`generate` は言語ごとに独立してAIを呼び出す。 |
| `lang` | ✅ | `string` | — | CLIメッセージ・AGENTS.md・スキルプロンプト・specファイルで使用する言語（例: `"en"`、`"ja"`）。 |
| `type` | ✅ | `string` | — | プリセットを選択するプロジェクトタイプ（例: `"cli/node-cli"`、`"webapp/cakephp2"`）。適用される章とデータソースを決定する。 |
| `uiLang` | — | `"en"` \| `"ja"` | — | ターミナルUI出力の言語。インタラクティブメッセージにのみ `lang` を上書きする。 |
| `documentStyle.purpose` | — | `string` | — | ドキュメントの目的を自由記述で説明するテキスト。AIにコンテキストとして渡される。 |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | — | AI生成テキストセクションの文体。 |
| `documentStyle.customInstruction` | — | `string` | — | すべてのAIプロンプトに追記される追加の自由形式指示。プロジェクト固有の記述ルールを指定できる。 |
| `textFill.projectContext` | — | `string` | — | AIに提供するプロジェクトの背景説明。`.sdd-forge/context.json` が存在する場合はそちらが優先される。 |
| `textFill.preamblePatterns` | — | `object[]` | — | AIレスポンスから不要なプレアンブルテキスト（例: "以下に生成したテキストを示します…"）を除去するパターンオブジェクトのリスト。 |
| `defaultAgent` | — | `string` | — | `--agent` フラグが指定されない場合に使用するAIプロバイダーのキー名（`providers` 内のキー）。 |
| `providers` | — | `object` | — | 名前付きAIプロバイダー定義のマップ。各エントリは `command`・`args`・オプションの `timeoutMs`・`systemPromptFlag` を指定する。 |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDDフロークローズ時にfeatureブランチをベースブランチにマージする際のgitマージ戦略。 |
| `limits.concurrency` | — | `number` | `5` | `text` などのバッチ処理で並列処理するファイルの最大数。 |
| `limits.designTimeoutMs` | — | `number` | — | ドキュメント生成中のAI呼び出しのタイムアウト（ミリ秒）。 |

<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text: Describe the items users can customize. (1) AI provider settings (providers field, command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include JSON configuration examples for each item.}} -->

**1. AIプロバイダー設定**

`providers` フィールドでは、1つ以上のAIエージェントを登録し、`sdd-forge` がデフォルトで使用するエージェントを選択できます。各プロバイダーエントリは、システムプロンプトの渡し方を含む、基盤となるCLIツールの呼び出し方法を指定します。

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--model", "claude-opus-4-5", "{{PROMPT}}"],
      "timeoutMs": 180000,
      "systemPromptFlag": "--system-prompt"
    }
  }
}
```

`args` 内の `{{PROMPT}}` プレースホルダーは、実行時に生成されたプロンプトに置き換えられます。`{{PROMPT}}` プレースホルダーがない場合、プロンプトは引数リストの末尾に追加されます。`"systemPromptFlag": "--system-prompt-file"` を使用すると、`sdd-forge` がシステムプロンプトを一時ファイルに書き込み、そのパスを渡します。

**2. ドキュメントスタイル**

`documentStyle` を使用して、すべてのドキュメントセクションにわたるAI生成テキストの性格を制御します。

```json
{
  "documentStyle": {
    "purpose": "新入社員向け内部オンボーディングガイド",
    "tone": "casual",
    "customInstruction": "各概念には必ず具体的な例を含めること。"
  }
}
```

**3. プリセット選択**

`type` フィールドは、生成するドキュメントの章とスキャンするソースコードのカテゴリを決定するプリセットを選択します。

```json
{
  "type": "cli/node-cli"
}
```

利用可能な組み込みタイプには、`"cli/node-cli"`・`"webapp/cakephp2"`・`"webapp/laravel"`・`"webapp/symfony"`、および `"webapp"` や `"library"` などのアーキテクチャタイプがあります。

**4. マージ戦略**

SDDフローの終了時にfeatureブランチをベースブランチにマージする方法を制御します。

```json
{
  "flow": {
    "merge": "squash"
  }
}
```

`"squash"` はすべてのコミットを1つにまとめ、`"ff-only"` は線形履歴を強制し、`"merge"` は標準のマージコミットを作成します。

**5. 並列処理数**

速度とリソース使用量またはAIプロバイダーのレート制限のバランスを取るために並列処理を調整します。

```json
{
  "limits": {
    "concurrency": 3,
    "designTimeoutMs": 240000
  }
}
```

AIプロバイダーが厳格なリクエスト/分の制限を課している場合、`concurrency` を下げることが有効です。

<!-- {{/text}} -->

### 環境変数

<!-- {{text: List all environment variables referenced by the tool and their purpose in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (work root, location of .sdd-forge/), CLAUDECODE (internal variable removed to prevent Claude CLI hangs).}} -->

| 変数 | 目的 |
|---|---|
| `SDD_SOURCE_ROOT` | ソースコードルートディレクトリの絶対パス。設定されている場合、`sdd-forge` はカレントディレクトリやgitルートからの解決ではなく、このパスをスキャン・解析の対象として使用する。 |
| `SDD_WORK_ROOT` | ワークルート（`.sdd-forge/` を含むディレクトリ）の絶対パス。設定されている場合、すべての設定ファイル・出力成果物・フロー状態はこの場所から読み書きされる。gitで解決されるリポジトリルートより優先される。 |
| `CLAUDECODE` | Claude CLIが設定する内部環境変数。`sdd-forge` は `stdin` が閉じられたときにClaude CLIがハングするのを防ぐため、AIエージェント呼び出しの子プロセスを生成する前にこの変数を子プロセスの環境から削除する。 |

<!-- {{/text}} -->
