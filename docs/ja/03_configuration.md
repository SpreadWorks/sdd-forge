# 03. 設定とカスタマイズ

## 概要

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

sdd-forge はすべてのプロジェクト設定を `.sdd-forge/` ディレクトリ以下に格納し、少数の JSON ファイルを使って出力言語や AI プロバイダーの選択からドキュメントスタイル・マージ戦略まで一元管理します。本章では各設定ファイルの詳細、利用可能なフィールドの全一覧、そしてプロジェクトのワークフローに合わせてツールをカスタマイズするための主要なカスタマイズポイントについて説明します。

<!-- {{/text}} -->

## 目次

### 設定ファイル

<!-- {{text: List all configuration files read by this tool in a table, including the location and role of each. Key files: .sdd-forge/config.json (project settings), .sdd-forge/context.json (project context), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results), .sdd-forge/output/summary.json (lightweight version for AI).}} -->

| ファイル | 役割 |
|---|---|
| `.sdd-forge/config.json` | プロジェクトのメイン設定。出力言語、プロジェクトタイプ、AI プロバイダー、ドキュメントスタイル、その他のランタイム設定を定義する。ロード時にバリデーションが実行される。 |
| `.sdd-forge/context.json` | AI 生成を補完するためのプロジェクトコンテキスト文字列を保持する。`saveContext()` によって書き込まれ、`resolveProjectContext()` によって読み込まれる。 |
| `.sdd-forge/projects.json` | 複数プロジェクトのレジストリ。`sdd-forge setup` によって生成される。プロジェクト名とそのソースルート・作業ルートのパスをマッピングし、デフォルトプロジェクトを指定する。 |
| `.sdd-forge/current-spec` | アクティブな SDD フローの状態を JSON 形式で追跡する。現在の spec パス、ベースブランチ、フィーチャーブランチ、およびオプションの worktree メタデータを保持する。フロー完了時に削除される。 |
| `.sdd-forge/output/analysis.json` | `sdd-forge scan` によって生成されたフルソース解析結果。インデントなしで保存され、コードベースの権威ある構造表現として機能する。 |
| `.sdd-forge/output/summary.json` | AI 消費向けの軽量版解析データ。存在する場合は `analysis.json` より優先して使用される。存在しない場合は `analysis.json` にフォールバックする。 |
| `.sdd-forge/snapshots/` | `sdd-forge snapshot` によるリグレッション検出に使用されるスナップショットファイルと `manifest.json` を格納するディレクトリ。 |

<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text: Describe all fields of .sdd-forge/config.json in a table. Include field name, whether required, type, default value, and description. Key fields: output.languages (output language list), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (projectContext/preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

| フィールド | 必須 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output.languages` | ✅ | `string[]` | — | 生成ドキュメントの出力言語リスト（例: `["ja"]`、`["en", "ja"]`）。 |
| `output.default` | ✅ | `string` | — | 主要な出力言語。この言語のドキュメントは直接生成され、他の言語は `output.mode` に従う。 |
| `output.mode` | — | `"translate"` \| `"generate"` | `"translate"` | デフォルト以外の言語の生成方法。`translate` は `translate` コマンドを実行し、`generate` はターゲット言語でフルテキストパスを実行する。 |
| `lang` | ✅ | `string` | — | CLI、AGENTS.md、スキル、および spec ファイルの動作言語（例: `"ja"`、`"en"`）。 |
| `type` | ✅ | `string` | — | プリセットを選択するプロジェクトタイプ（例: `"cli/node-cli"`、`"webapp/cakephp2"`）。使用するアナライザー、テンプレート、データソースを制御する。 |
| `uiLang` | — | `"en"` \| `"ja"` | — | CLI UI メッセージの言語。省略時はシステムロケールがデフォルトになる。 |
| `documentStyle.purpose` | — | `string` | — | ドキュメントの対象読者と目的を説明する自由記述。テキスト生成時に AI へのコンテキストとして渡される。 |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | — | AI 生成テキスト全体に適用される文体。 |
| `documentStyle.customInstruction` | — | `string` | — | テキスト生成時のすべての AI プロンプトに追加される自由記述の補足指示。 |
| `textFill.projectContext` | — | `string` | — | AI テキスト生成のための補足プロジェクト説明。`context.json` が存在する場合はそちらが優先される。 |
| `textFill.preamblePatterns` | — | `object[]` | — | LLM 出力から不要なプレフィックスを除去するための正規表現パターンリスト（例: "Certainly! Here is…"）。 |
| `defaultAgent` | — | `string` | — | `providers` マップにおけるデフォルト AI プロバイダー名。`--agent` フラグが指定されていない場合に使用される。 |
| `providers` | — | `object` | — | 名前付き AI エージェント定義のマップ。各エントリは `command`、`args`、オプションの `timeoutMs`、`systemPromptFlag` を指定する。 |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDD フロークローズ時にフィーチャーブランチをベースブランチにマージする際の Git マージ戦略。 |
| `limits.concurrency` | — | `number` | `5` | `data` および `text` コマンド実行中に並列処理するファイルの最大数。 |
| `limits.designTimeoutMs` | — | `number` | — | ドキュメント生成中の AI 呼び出しに適用されるタイムアウト（ミリ秒）。設定した場合、組み込みのデフォルト値を上書きする。 |

<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text: Describe the items users can customize. (1) AI provider settings (providers field, command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include JSON configuration examples for each item.}} -->

**1. AI プロバイダー設定**

`providers` フィールドはプロバイダー名をエージェント定義にマッピングします。各エントリは sdd-forge が AI CLI を呼び出す方法を記述します。`args` に `{{PROMPT}}` を使用してプロンプトを注入する位置を制御できます。省略した場合は末尾に自動追加されます。

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--print", "{{PROMPT}}"],
      "timeoutMs": 180000,
      "systemPromptFlag": "--system-prompt"
    }
  }
}
```

**2. ドキュメントスタイル**

`documentStyle` を使用して、AI 生成ドキュメント全体のトーンと目的を設定します。`customInstruction` では、すべてのテキスト生成プロンプトに追加されるプロジェクト固有の制約を記述できます。

```json
{
  "documentStyle": {
    "purpose": "オンボーディングエンジニア向けの社内開発者リファレンス",
    "tone": "formal",
    "customInstruction": "必ずコード例を含めること。マーケティング的な表現は避けること。"
  }
}
```

**3. プリセット選択**

`type` フィールドでプロジェクトに適用するアナライザー、テンプレート、データソースを決定するプリセットを選択します。

```json
{
  "type": "cli/node-cli"
}
```

組み込みタイプには `"webapp/cakephp2"`、`"webapp/laravel"`、`"webapp/symfony"`、`"cli/node-cli"` などがあります。完全な一覧は `sdd-forge presets` を参照してください。

**4. マージ戦略**

SDD フロークローズ時のフィーチャーブランチの統合方法を制御します。

```json
{
  "flow": {
    "merge": "squash"
  }
}
```

`squash` はすべてのフィーチャーコミットを 1 つにまとめます。`ff-only` は線形履歴を要求します。`merge` は標準のマージコミットを作成します。

**5. 並列処理数**

`limits.concurrency` を調整して、`data` および `text` のバッチ実行時の速度とシステム負荷のバランスを取ります。

```json
{
  "limits": {
    "concurrency": 3
  }
}
```

値を小さくすると大規模プロジェクトでのメモリ使用量を抑えられます。CPU コアが多いマシンでは値を大きくすることで生成速度を向上させられます。

<!-- {{/text}} -->

### 環境変数

<!-- {{text: List all environment variables referenced by the tool and their purpose in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (work root, location of .sdd-forge/), CLAUDECODE (internal variable removed to prevent Claude CLI hangs).}} -->

| 変数 | 目的 |
|---|---|
| `SDD_SOURCE_ROOT` | sdd-forge がスキャン・解析するソースコードルートへの絶対パス。設定された場合、`sourceRoot()` が解決したパスより優先される。プロジェクトコンテキストが解決される際に、トップレベルディスパッチャーによって自動的に注入されることが多い。 |
| `SDD_WORK_ROOT` | 作業ルート（`.sdd-forge/` を含むディレクトリ）への絶対パス。設定された場合、`repoRoot()` が解決したパスより優先される。マルチプロジェクト構成でよく見られる、作業ディレクトリとソースディレクトリが異なる場合に有用。 |
| `CLAUDECODE` | Claude Code が子プロセスに注入する内部環境変数。sdd-forge は AI エージェントのサブプロセスを起動する前にこの変数を明示的に削除し、予期しない stdin の挙動による Claude CLI のハングを防止する。この変数を手動で設定・管理する必要はない。 |

<!-- {{/text}} -->
