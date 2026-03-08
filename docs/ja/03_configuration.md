# 03. 設定とカスタマイズ

## Description

<!-- {{text: Describe the overview of this chapter in 1-2 sentences. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

本章では、sdd-forge が使用するすべての設定ファイル、`.sdd-forge/config.json` で利用可能なオプションの全範囲、および AI プロバイダー・ドキュメントスタイル・プロジェクトタイプ・マージ戦略・並列処理数のカスタマイズポイントについて説明します。

## Contents

### 設定ファイル

<!-- {{text: List all configuration files loaded by this tool in a table, including their locations and roles. Main files: .sdd-forge/config.json (project settings), .sdd-forge/context.json (project context), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results), .sdd-forge/output/summary.json (lightweight version for AI).}} -->

すべての設定ファイルおよびステートファイルは、プロジェクトの作業ルート直下にある `.sdd-forge/` ディレクトリに格納されます。

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクトの主設定ファイル。出力言語・プロジェクトタイプ・AI エージェント設定・ドキュメントスタイル・ワークフローオプションを定義します。ロード時にバリデーションが実行されます。 |
| `context.json` | `.sdd-forge/context.json` | テキスト生成時に AI へ渡す自由形式のプロジェクトコンテキスト文字列。`config.json` の `textFill.projectContext` より優先されます。 |
| `projects.json` | `.sdd-forge/projects.json` | 複数プロジェクトのレジストリ。プロジェクト名をソースルートおよび作業ルートのパスにマッピングします。`sdd-forge setup` で生成されます。 |
| `current-spec` | `.sdd-forge/current-spec` | アクティブな SDD フローの状態（spec パス・ベースブランチ・フィーチャーブランチ・worktree 情報）を追跡する JSON ファイル。フロー完了時に削除されます。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成するソースコード解析結果のフルデータ。インデントなしのコンパクト形式で保存されます。 |
| `summary.json` | `.sdd-forge/output/summary.json` | AI 向けに最適化した `analysis.json` の軽量版。利用可能な場合は `analysis.json` より優先して使用されます。 |

### 設定リファレンス

<!-- {{text: Describe all fields in .sdd-forge/config.json in a table format. Include field name, whether required, type, default value, and description. Main fields: output.languages (output language list), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (projectContext/preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

以下の表は `.sdd-forge/config.json` でサポートされるすべてのフィールドを説明します。

| フィールド | 必須 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output.languages` | ✅ | `string[]` | — | 生成ドキュメントの出力言語リスト（例: `["ja"]`、`["en", "ja"]`）。 |
| `output.default` | ✅ | `string` | — | ドキュメント生成時に使用するメインの出力言語。 |
| `output.mode` | — | `"translate"` \| `"generate"` | `"translate"` | 非デフォルト言語の生成方法。`translate` はデフォルト出力を元に翻訳し、`generate` は AI を独立して呼び出します。 |
| `lang` | ✅ | `string` | — | CLI・AGENTS.md・スキルプロンプト・spec ファイルの動作言語。 |
| `type` | ✅ | `string` | — | 使用するプリセットを選択するプロジェクトタイプ（例: `"cli/node-cli"`、`"webapp/cakephp2"`）。 |
| `uiLang` | — | `"en"` \| `"ja"` | — | sdd-forge 自身の UI メッセージの表示言語。 |
| `documentStyle.purpose` | — | `string` | — | ドキュメントの対象読者や目的を示す短い説明。AI 生成時に渡されます。 |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | — | AI 生成テキストセクションに適用する文体。 |
| `documentStyle.customInstruction` | — | `string` | — | すべてのテキスト生成タスクで AI プロンプトに追記される自由形式の追加指示。 |
| `textFill.projectContext` | — | `string` | — | AI に渡すプロジェクト概要テキスト。`context.json` が存在する場合はそちらが優先されます。 |
| `textFill.preamblePatterns` | — | `object[]` | — | AI レスポンスから docs に挿入する前に LLM 生成のプレアンブルテキストを除去するためのパターン。 |
| `defaultAgent` | — | `string` | — | 明示的にエージェントを指定しない場合に使用する AI プロバイダーのエントリ名（`providers` で定義）。 |
| `providers` | — | `object` | — | 名前付き AI エージェント定義のマップ。各エントリは `command`・`args`・オプションの `timeoutMs`・`systemPromptFlag` を指定します。 |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDD フロー完了時にフィーチャーブランチをベースブランチにマージする際の Git マージ戦略。 |
| `limits.concurrency` | — | `number` | `5` | ドキュメント生成中にファイルを並列処理する最大数。 |
| `limits.designTimeoutMs` | — | `number` | — | ドキュメント生成中の AI エージェント呼び出しに対するタイムアウト（ミリ秒）。 |

### カスタマイズポイント

<!-- {{text: Explain the items users can customize. (1) AI provider settings (providers field, command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include a JSON configuration example for each item.}} -->

**1. AI プロバイダー設定**

`providers` フィールドでは、名前付きの AI エージェントを 1 つ以上定義します。各エントリには実行コマンド・引数リスト・オプションのタイムアウト・システムプロンプトの渡し方を指定します。`defaultAgent` でデフォルトで使用するプロバイダーを選択します。

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

`args` 内の `{{PROMPT}}` プレースホルダーは、生成されたプロンプトを注入する位置を示します。省略した場合、プロンプトは引数リストの末尾に追加されます。エージェントがインライン文字列ではなくファイルパスを期待する場合は、`systemPromptFlag` を `"--system-prompt-file"` に設定してください。

**2. ドキュメントスタイル**

`documentStyle` フィールドは AI 生成ドキュメントのトーンと目的を制御します。プロジェクト固有の記述規約を適用するには `customInstruction` を使用してください。

```json
{
  "documentStyle": {
    "purpose": "バックエンドエンジニア向けの内部リファレンス",
    "tone": "formal",
    "customInstruction": "各 API メソッドには必ずコード例を含めること。"
  }
}
```

**3. プリセット選択**

`type` フィールドでは、スキャン対象のソースファイルや生成するドキュメントの章を決定するプリセットを選択します。プロジェクトのアーキテクチャに最も合致する値を選択してください。

```json
{
  "type": "cli/node-cli"
}
```

組み込みの値としては `"cli/node-cli"`・`"webapp/cakephp2"`・`"webapp/laravel"`・`"webapp/symfony"` などがあります。サポートされるエイリアスの完全なセットはプリセット一覧を参照してください。

**4. マージ戦略**

`flow.merge` フィールドは、SDD フロー終了時にフィーチャーブランチをベースブランチにマージする方法を制御します。

```json
{
  "flow": {
    "merge": "squash"
  }
}
```

すべてのフィーチャーコミットを 1 つにまとめるには `"squash"`、マージコミットを作らずリニアな履歴にするには `"ff-only"`、通常のマージコミットを作成するには `"merge"` を使用してください。

**5. 並列処理数**

`limits.concurrency` を調整することで、ドキュメント生成中にファイルを並列処理する数を制御できます。AI のレート制限に達している場合はこの値を下げ、大規模なコードベースで生成を高速化したい場合は上げてください。

```json
{
  "limits": {
    "concurrency": 3,
    "designTimeoutMs": 240000
  }
}
```

### 環境変数

<!-- {{text: List the environment variables referenced by the tool and their purposes in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (working root, location of .sdd-forge/), CLAUDECODE (internal variable removed to prevent Claude CLI hangs).}} -->

| 変数 | 目的 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象のソースコードルートの絶対パス。設定されている場合、`git rev-parse` やカレントディレクトリから解決されるパスを上書きします。 |
| `SDD_WORK_ROOT` | 作業ルート（`.sdd-forge/` を含むディレクトリ）の絶対パス。設定されている場合、git で解決されたルートより優先されます。 |
| `CLAUDECODE` | sdd-forge が AI エージェントプロセスを起動する前に環境から積極的に削除する内部変数。子プロセスとして起動した際に Claude CLI がハングするのを防ぎます。 |
