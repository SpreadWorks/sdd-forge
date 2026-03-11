# 03. 設定とカスタマイズ

## 概要

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

`sdd-forge` は `.sdd-forge/` ディレクトリ配下の複数の設定ファイルを読み込み、ドキュメント生成、AI プロバイダー統合、出力言語、SDD ワークフローの動作を制御します。本章では、すべての設定ファイル、`config.json` で利用可能なすべてのフィールド、およびユーザーが利用できるカスタマイズポイントについて説明します。

<!-- {{/text}} -->

## 目次

### 設定ファイル

<!-- {{text: List all configuration files read by this tool in a table, including the location and role of each. Key files: .sdd-forge/config.json (project settings), .sdd-forge/context.json (project context), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results), .sdd-forge/output/summary.json (lightweight version for AI).}} -->

| ファイル | 役割 |
|---|---|
| `.sdd-forge/config.json` | プロジェクトのメイン設定。出力言語、プロジェクトタイプ、AI プロバイダー、ドキュメントスタイル、マージ戦略などを制御する。 |
| `.sdd-forge/context.json` | AI テキスト生成で使用するプロジェクトコンテキスト文字列を格納する。`config.json` の `textFill.projectContext` より優先される。 |
| `.sdd-forge/projects.json` | 複数プロジェクトのレジストリ。プロジェクト名をソースルートおよびワークルートのパスにマッピングし、デフォルトプロジェクトを指定する。 |
| `.sdd-forge/current-spec` | アクティブな SDD フロー状態を JSON オブジェクトとして追跡する（現在の spec パス、ベースブランチ、フィーチャーブランチ、およびオプションの worktree 詳細）。 |
| `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成したフルのソースコード解析結果。ドキュメント生成の基盤データとして使用される。 |
| `.sdd-forge/output/summary.json` | AI 向けに軽量化した解析結果。存在する場合は `analysis.json` より優先して使用され、存在しない場合は `analysis.json` にフォールバックする。 |
| `.sdd-forge/snapshots/` | `snapshot` コマンドがリグレッション検出のためにベースライン出力を保存するディレクトリ。`manifest.json` とキャプチャされたファイルのコピーを含む。 |

<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text: Describe all fields of .sdd-forge/config.json in a table. Include field name, whether required, type, default value, and description. Key fields: output.languages (output language list), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (projectContext/preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

| フィールド | 必須 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output.languages` | ✅ | `string[]` | — | 生成ドキュメントの出力言語リスト（例: `["en"]`、`["en", "ja"]`）。 |
| `output.default` | ✅ | `string` | — | 主要な出力言語。この言語でドキュメントが直接生成される。 |
| `output.mode` | — | `"translate"` \| `"generate"` | `"translate"` | デフォルト以外の言語の生成方法。`translate` は `translate` コマンドを実行し、`generate` は言語ごとに AI を個別に呼び出す。 |
| `lang` | ✅ | `string` | — | CLI メッセージ、AGENTS.md、スキルプロンプト、spec ファイルに使用する言語（例: `"en"`、`"ja"`）。 |
| `type` | ✅ | `string` | — | プリセットを選択するプロジェクトタイプ（例: `"cli/node-cli"`、`"webapp/cakephp2"`）。適用する章とデータソースを決定する。 |
| `uiLang` | — | `"en"` \| `"ja"` | — | ターミナル UI 出力の言語。インタラクティブメッセージのみ `lang` を上書きする。 |
| `documentStyle.purpose` | — | `string` | — | ドキュメントの目的に関する自由記述。AI へのコンテキストとして渡される。 |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | — | AI 生成テキストセクションの文体。 |
| `documentStyle.customInstruction` | — | `string` | — | すべての AI プロンプトに追記される追加の自由記述指示。プロジェクト固有のライティングルールを設定できる。 |
| `textFill.projectContext` | — | `string` | — | AI に提供するプロジェクトの背景説明。`.sdd-forge/context.json` が存在する場合はそちらで上書きされる。 |
| `textFill.preamblePatterns` | — | `object[]` | — | AI レスポンスから不要なプレアンブルテキスト（例: "以下が生成されたテキストです…"）を除去するためのパターンオブジェクトのリスト。 |
| `defaultAgent` | — | `string` | — | `--agent` フラグが指定されない場合に使用する AI プロバイダーのキー名（`providers` から参照）。 |
| `providers` | — | `object` | — | 名前付き AI プロバイダー定義のマップ。各エントリには `command`、`args`、オプションの `timeoutMs`、`systemPromptFlag` を指定する。 |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDD フロークローズステップでフィーチャーブランチをベースブランチにマージする際の Git マージ戦略。 |
| `limits.concurrency` | — | `number` | `5` | `text` やその他のバッチ処理で並列処理するファイルの最大数。 |
| `limits.designTimeoutMs` | — | `number` | — | ドキュメント生成中の AI 呼び出しのタイムアウト（ミリ秒）。 |

<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text: Describe the items users can customize. (1) AI provider settings (providers field, command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include JSON configuration examples for each item.}} -->

**1. AI プロバイダー設定**

`providers` フィールドを使用して、1 つ以上の AI エージェントを登録し、`sdd-forge` がデフォルトで使用するエージェントを選択できます。各プロバイダーエントリでは、システムプロンプトの渡し方を含め、基盤となる CLI ツールの呼び出し方法を指定します。

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

`args` の `{{PROMPT}}` プレースホルダーは実行時に生成されたプロンプトで置き換えられます。`{{PROMPT}}` プレースホルダーが存在しない場合、プロンプトは引数リストの末尾に追加されます。`"systemPromptFlag": "--system-prompt-file"` を使用すると、`sdd-forge` がシステムプロンプトを一時ファイルに書き込み、そのパスを渡します。

**2. ドキュメントスタイル**

`documentStyle` を使用して、すべてのドキュメントセクションにわたる AI 生成テキストの性格を制御します。

```json
{
  "documentStyle": {
    "purpose": "新入エンジニア向けの社内オンボーディングガイド",
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

組み込みタイプには `"cli/node-cli"`、`"webapp/cakephp2"`、`"webapp/laravel"`、`"webapp/symfony"`、および `"webapp"` や `"library"` などのアーキテクチャタイプが含まれます。

**4. マージ戦略**

SDD フローの終了時にフィーチャーブランチをベースブランチにマージする方法を制御します。

```json
{
  "flow": {
    "merge": "squash"
  }
}
```

`"squash"` を選択するとすべてのコミットを 1 つにまとめ、`"ff-only"` は線形履歴を強制し、`"merge"` は通常のマージコミットを作成します。

**5. 並列処理数**

速度と、AI プロバイダーが課すリソース使用量やレート制限のバランスを取るために並列処理を調整します。

```json
{
  "limits": {
    "concurrency": 3,
    "designTimeoutMs": 240000
  }
}
```

AI プロバイダーが厳格な 1 分あたりのリクエスト数制限を設けている場合は、`concurrency` を下げることが有効です。

<!-- {{/text}} -->

### 環境変数

<!-- {{text: List all environment variables referenced by the tool and their purpose in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (work root, location of .sdd-forge/), CLAUDECODE (internal variable removed to prevent Claude CLI hangs).}} -->

| 変数 | 目的 |
|---|---|
| `SDD_SOURCE_ROOT` | ソースコードルートディレクトリの絶対パス。設定された場合、`sdd-forge` はカレントディレクトリや git ルートからの解決ではなく、このパスをスキャンおよび解析の対象として使用する。 |
| `SDD_WORK_ROOT` | ワークルート（`.sdd-forge/` を含むディレクトリ）の絶対パス。設定された場合、すべての設定ファイル、出力成果物、フロー状態がこの場所に対して読み書きされる。git で解決されたリポジトリルートより優先される。 |
| `CLAUDECODE` | Claude CLI が設定する内部環境変数。`sdd-forge` は AI エージェント呼び出しの子プロセスを起動する前に、この変数を子プロセスの環境から削除する。これは `stdin` が閉じられた際に Claude CLI がハングするのを防ぐためである。 |

<!-- {{/text}} -->
