# 03. 設定とカスタマイズ

## 概要

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

本章では、sdd-forge が使用するすべての設定ファイル、`.sdd-forge/config.json` で利用可能な設定オプションの全範囲、および AI プロバイダー・ドキュメントスタイル・プロジェクトタイプ・ワークフロー動作のカスタマイズポイントを説明します。これらの設定を理解することで、ドキュメント生成・AI エージェント統合・SDD ワークフローをプロジェクトの要件に合わせて調整できます。
<!-- {{/text}} -->

## 目次

### 設定ファイル

<!-- {{text: List all configuration files read by this tool in a table, including the location and role of each. Key files: .sdd-forge/config.json (project settings), .sdd-forge/context.json (project context), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results), .sdd-forge/output/summary.json (lightweight version for AI).}} -->

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクトのメイン設定ファイル。出力言語・プロジェクトタイプ・AI エージェント設定・ドキュメントスタイル・ワークフロー動作を定義します。ほとんどのコマンドで必須です。 |
| `context.json` | `.sdd-forge/context.json` | AI 生成ドキュメントの補助情報として使用される、自由記述のプロジェクトコンテキスト文字列を保存します。`saveContext()` によって作成・更新されます。 |
| `projects.json` | `.sdd-forge/projects.json` | sdd-forge で使用する複数プロジェクトを登録します。`setup` コマンドで生成されます。ソースパス・作業ルート・デフォルトプロジェクトの指定が含まれます。 |
| `current-spec` | `.sdd-forge/current-spec` | アクティブな SDD フローの状態を JSON で追跡します。現在の spec パス・ベースブランチ・フィーチャーブランチ・worktree の詳細を記録します。フロー完了時に削除されます。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成するソースコード解析結果のフルデータです。インデントなしで保存されます。ドキュメント生成の権威あるデータソースとして使用されます。 |
| `summary.json` | `.sdd-forge/output/summary.json` | AI 消費向けに最適化された `analysis.json` の軽量版です。AI エージェントを呼び出すコマンドはこのファイルを優先し、存在しない場合は `analysis.json` にフォールバックします。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text: Describe all fields of .sdd-forge/config.json in a table. Include field name, whether required, type, default value, and description. Key fields: output.languages (output language list), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (projectContext/preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

| フィールド | 必須 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output.languages` | ✅ | `string[]` | — | 生成ドキュメントの出力言語リスト（例: `["ja"]`、`["en", "ja"]`）。 |
| `output.default` | ✅ | `string` | — | プライマリ出力言語。ドキュメントはまずこの言語で生成されます。 |
| `output.mode` | — | `"translate"` \| `"generate"` | `"translate"` | デフォルト以外の言語を生成する方法。`translate` は翻訳パイプラインを実行し、`generate` は各言語について独立して AI を呼び出します。 |
| `lang` | ✅ | `string` | — | CLI・AGENTS.md・スキル・spec ファイルの動作言語。 |
| `type` | ✅ | `string` | — | 適用するプリセットを決定するプロジェクトタイプ識別子（例: `"cli/node-cli"`、`"webapp/cakephp2"`）。 |
| `uiLang` | — | `"en"` \| `"ja"` | — | オペレーターに表示する UI メッセージの表示言語。 |
| `documentStyle.purpose` | — | `string` | — | 生成ドキュメントの想定読者と目的を記述します。AI 出力のガイドとして使用されます。 |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | — | AI 生成テキストセクションに適用する文体を設定します。 |
| `documentStyle.customInstruction` | — | `string` | — | テキスト生成時に AI へ渡す追加の自由記述指示。 |
| `textFill.projectContext` | — | `string` | — | AI 生成のコンテキストとして注入するプロジェクト概要文字列。`context.json` が存在する場合はそちらが優先されます。 |
| `textFill.preamblePatterns` | — | `object[]` | — | LLM 出力から不要なプレフィックスを除去するためのパターンリスト。 |
| `defaultAgent` | — | `string` | — | コマンドラインでエージェントが明示されていない場合に使用する AI エージェント名。`providers` のキーと一致する必要があります。 |
| `providers` | — | `object` | — | 名前付き AI エージェント定義のマップ。各エントリに `command`・`args`・オプションの `timeoutMs`・`systemPromptFlag` を指定します。 |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDD フロー終了時にフィーチャーブランチをベースブランチにマージする際の Git マージ戦略。 |
| `limits.concurrency` | — | `number` | `5` | ドキュメント生成中に並列処理するファイル数。 |
| `limits.designTimeoutMs` | — | `number` | — | ドキュメント生成中に 1 回の AI エージェント呼び出しに許容する最大時間（ミリ秒）。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text: Describe the items users can customize. (1) AI provider settings (providers field, command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include JSON configuration examples for each item.}} -->

**1. AI プロバイダー設定**

`providers` フィールドは名前付き AI エージェントの設定を定義します。各プロバイダーには、呼び出すコマンド・引数・オプションのタイムアウト・システムプロンプトの渡し方を指定します。`defaultAgent` フィールドで、デフォルトで使用するプロバイダーを選択します。

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--model", "claude-opus-4-5", "{{PROMPT}}"],
      "timeoutMs": 120000,
      "systemPromptFlag": "--system-prompt"
    }
  }
}
```

`args` 内の `{{PROMPT}}` プレースホルダーは、生成されたプロンプトを注入する位置を示します。省略した場合、プロンプトは引数リストの末尾に追加されます。エージェントがシステムプロンプトを一時ファイルとして受け取る仕様の場合は、`systemPromptFlag` を `"--system-prompt-file"` に設定してください。

**2. ドキュメントスタイル**

`documentStyle` ブロックは、AI 生成テキストセクションの記述方法を制御します。目的と想定読者・全体的なトーン・追加の自由記述指示を指定できます。

```json
{
  "documentStyle": {
    "purpose": "オンボーディングエンジニア向けの内部リファレンス",
    "tone": "formal",
    "customInstruction": "可能な限り具体的なコード例を使用すること。"
  }
}
```

**3. プリセット選択**

`type` フィールドはプロジェクトに適用するプリセットを選択します。スキャン対象のソースファイルと使用するドキュメントテンプレートが決まります。

```json
{
  "type": "cli/node-cli"
}
```

指定可能な値には `"webapp/cakephp2"`・`"webapp/laravel"`・`"webapp/symfony"`・`"cli/node-cli"` などがあります。`lib/types.js` で定義された型エイリアスも使用可能です（例: `"webapp/cakephp2"` のエイリアスとして `"php-mvc"`）。

**4. マージ戦略**

`flow.merge` フィールドは、SDD ワークフロー終了時にフィーチャーブランチをベースブランチにマージする方法を制御します。

```json
{
  "flow": {
    "merge": "squash"
  }
}
```

すべてのフィーチャーコミットを 1 つのコミットにまとめるには `"squash"` を、fast-forward マージを強制するには `"ff-only"` を、明示的なマージコミットを作成するには `"merge"` を使用します。

**5. 並列処理数**

`limits.concurrency` フィールドは、ドキュメント生成中に並列処理するファイル数を設定します。値を下げるとメモリと API 使用量が削減され、値を上げると大規模コードベースでの生成速度が向上します。

```json
{
  "limits": {
    "concurrency": 3
  }
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text: List all environment variables referenced by the tool and their purpose in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (work root, location of .sdd-forge/), CLAUDECODE (internal variable removed to prevent Claude CLI hangs).}} -->

| 変数 | 目的 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象ソースコードのルートへの絶対パス。設定されている場合、`sourceRoot()` はリポジトリルートへのフォールバックを行わずこの値を直接使用します。`sdd-forge.js` のプロジェクトコンテキスト解決ロジックによって自動的に設定されます。 |
| `SDD_WORK_ROOT` | 作業ルートディレクトリ（`.sdd-forge/` を含むディレクトリ）への絶対パス。設定されている場合、`repoRoot()` は `git rev-parse` を実行せずこの値を使用します。プロジェクトコンテキスト解決時に自動的に設定されます。 |
| `CLAUDECODE` | AI エージェントのサブプロセスを生成する前に積極的に削除される内部環境変数です。この変数が存在すると Claude CLI が入力待ちでハングすることがあるため、子プロセスの環境から削除することでこの問題を防止します。 |
<!-- {{/text}} -->
