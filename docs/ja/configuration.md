# 03. 設定とカスタマイズ

## 概要

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

sdd-forge の設定は主に単一の JSON ファイル（`.sdd-forge/config.json`）で行い、出力言語、ドキュメントスタイル、AI エージェントプロバイダー、スキャン範囲、フロー動作を制御します。`src/presets/{key}/preset.json` のプリセット定義がアーキテクチャ固有のデフォルト値を提供し、2 つのランタイム環境変数によってマルチプロジェクト構成における作業ディレクトリとソースルートを分離できます。
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | 場所 | 役割 |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | プロジェクトの主設定ファイル。出力言語、操作言語、プロジェクトタイプ、ドキュメントスタイル、AI プロバイダー、スキャン範囲、並行処理数、フロー動作を定義する。`sdd-forge setup` で作成され、コマンド実行のたびにバリデーションされる。 |
| `preset.json` | `src/presets/{key}/preset.json` | 各組み込みアーキテクチャ（base、node-cli、cakephp2、laravel、symfony、library）のプリセットマニフェスト。ラベル、エイリアス、デフォルトのスキャンパターン、章の順序を宣言する。`src/lib/presets.js` により起動時に自動探索される。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` の生成出力。後続のパイプラインステップ（`enrich`、`data`、`text`）で使用される。手動編集は行わない。 |
| `config.example.json` | `src/templates/config.example.json` | `sdd-forge setup` 実行時にプロジェクトにコピーされる、バンドル済みの参照テンプレート。 |
| `review-checklist.md` | `src/templates/review-checklist.md` | `sdd-forge review` で使用される、バンドル済みのチェックリストテンプレート。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

すべてのフィールドは `.sdd-forge/config.json` から読み込まれます。バリデーションはコマンド呼び出しのたびに `src/lib/types.js` の `validateConfig()` で実行されます。

**トップレベルフィールド**

| フィールド | 必須/任意 | 型 | デフォルト | 説明 |
|-------|----------|------|---------|-------------|
| `output` | 必須 | object | — | 出力言語の設定。`languages` と `default` を少なくとも含む必要がある。 |
| `output.languages` | 必須 | string[] | — | ドキュメントを生成する言語のリスト（例: `["en"]`、`["en", "ja"]`）。空でないこと。 |
| `output.default` | 必須 | string | — | デフォルトの出力言語。`output.languages` のいずれかの値と一致する必要がある。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | — | デフォルト言語以外の言語の生成方法。`"translate"` はデフォルト言語の出力を後処理し、`"generate"` は各言語を独立して生成する。 |
| `lang` | 必須 | string | — | CLI メッセージ、AGENTS.md、スキル、スペックファイルの操作言語（例: `"en"`、`"ja"`）。 |
| `type` | 必須 | string | — | プロジェクトのアーキテクチャタイプ。プリセットキー（`"cakephp2"`、`"laravel"`、`"symfony"`）または正規パス（`"webapp/cakephp2"`、`"cli"`、`"library"`）を受け付ける。エイリアスは `src/lib/types.js` の `TYPE_ALIASES` で解決される。 |
| `limits` | 任意 | object | — | リソース制限の設定。 |
| `limits.concurrency` | 任意 | number | `5` | AI 補完ステップでファイルを並行処理する最大数。`src/lib/config.js` の `resolveConcurrency()` で解決される。 |
| `limits.agentTimeout` | 任意 | number | — | エージェント呼び出し 1 回あたりのタイムアウト（秒）。 |
| `documentStyle` | 任意 | object | — | 生成ドキュメントのトーンと目的を制御する。 |
| `documentStyle.purpose` | `documentStyle` がある場合は必須 | string | — | ドキュメントの用途: `"developer-guide"`、`"user-guide"`、`"api-reference"`、またはフリーフォームの文字列。 |
| `documentStyle.tone` | `documentStyle` がある場合は必須 | string | — | 文章のトーン: `"polite"`、`"formal"`、`"casual"`。 |
| `documentStyle.customInstruction` | 任意 | string | — | このプロジェクトのすべての AI プロンプトに追記される追加の自由記述指示。 |
| `textFill` | 任意 | object | — | `text` コマンドの AI 補完ステップの設定。 |
| `textFill.projectContext` | 任意 | string | — | AI プロンプトに追加コンテキストとして注入される、プロジェクトを説明する短い段落。 |
| `textFill.preamblePatterns` | 任意 | object[] | — | AI 出力から不要なプリアンブルテキストを除去するための正規表現パターンのリスト（`{ pattern, flags }`）。 |
| `defaultAgent` | 任意 | string | — | コマンドラインで指定がない場合に使用する AI プロバイダーのキー。`providers` のいずれかのキーと一致する必要がある。 |
| `providers` | 任意 | object | — | 名前付き AI エージェント定義のマップ。各キーが選択可能なエージェント名になる。 |
| `providers.{name}.command` | プロバイダーごとに必須 | string | — | 呼び出す実行ファイル（例: `"claude"`）。 |
| `providers.{name}.args` | プロバイダーごとに必須 | string[] | — | コマンド引数。いずれかの引数内のプレースホルダー `{{PROMPT}}` が実行時に実際のプロンプトテキストに置換される。 |
| `providers.{name}.timeoutMs` | プロバイダーごとに任意 | number | — | このプロバイダーの `limits.agentTimeout` を上書きする、呼び出し 1 回あたりのタイムアウト（ミリ秒）。 |
| `providers.{name}.systemPromptFlag` | プロバイダーごとに任意 | string | — | システムプロンプトを渡すために使用するフラグ名（例: `"--system-prompt"`）。 |
| `chapters` | 任意 | string[] | — | ドキュメント章の生成順序をプロジェクト固有で定義し、プリセットのデフォルト `chapters` 配列を上書きする。各エントリは拡張子なしの章ファイル名。 |
| `agentWorkDir` | 任意 | string | — | エージェントのサブプロセスを起動する際の作業ディレクトリの絶対パス。 |
| `scan` | 任意 | object | — | プリセットのデフォルトスキャン設定を上書きする。 |
| `scan.include` | `scan` がある場合は必須 | string[] | — | スキャン対象のソースファイルの glob パターン。空でないこと。 |
| `scan.exclude` | 任意 | string[] | — | スキャンから除外するソースファイルの glob パターン。 |
| `flow` | 任意 | object | — | `sdd-forge flow` SDD 自動化コマンドの設定。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | スペックブランチをクローズする際に使用する Git マージ戦略。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**出力言語とマルチ言語モード**

`output` ブロックでドキュメントを生成する言語を制御します。`output.mode` を `"translate"` に設定すると、まずデフォルト言語を生成し、それをもとに追加言語を派生させるため、AI トークン使用量を削減できます。

```json
"output": {
  "languages": ["en", "ja"],
  "default": "en",
  "mode": "translate"
}
```

**ドキュメントスタイル**

`documentStyle` は AI が生成するすべての段落のトーンと目的をカスタマイズします。`customInstruction` フィールドはプロジェクト固有の規約を注入するのに特に有用です。

```json
"documentStyle": {
  "purpose": "user-guide",
  "tone": "polite",
  "customInstruction": "Always include a usage example at the end of each section."
}
```

**AI エージェントプロバイダー**

カスタム AI エージェントは `providers` に登録します。プロンプトを受け取り stdout に書き出せる実行ファイルであれば使用できます。`args` 内の `{{PROMPT}}` プレースホルダーは呼び出し時に実際のプロンプトテキストに置換されます。

```json
"defaultAgent": "claude",
"providers": {
  "claude": {
    "command": "claude",
    "args": ["-p", "{{PROMPT}}"],
    "timeoutMs": 120000
  }
}
```

**並行処理数の制限**

`limits.concurrency` は `text` コマンドや `forge` コマンドでファイルを並行処理する数を制御します。値を小さくすると、大規模プロジェクトでのメモリ使用量や API レート制限への負荷を軽減できます。

```json
"limits": {
  "concurrency": 3,
  "agentTimeout": 90
}
```

**章の順序**

`chapters` 配列でドキュメント章の生成順序を定義します。プリセットのデフォルト順序を上書きします。各エントリは拡張子なしの章ファイル名です。

```json
"chapters": ["overview", "configuration", "cli_commands", "data_model", "security"]
```

**スキャン範囲**

プリセットのデフォルトスキャンパターンがプロジェクトのディレクトリ構成に合わない場合、`scan.include` と `scan.exclude` でそれらを上書きできます。パターンは標準的な glob 構文に従います。

```json
"scan": {
  "include": ["src/**/*.ts", "lib/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__mocks__/**"]
}
```

**フローのマージ戦略**

`flow.merge` は `sdd-forge flow` でスペックをクローズする際にスペックブランチをどのように統合するかを決定します。`"squash"` は単一のクリーンなコミットを生成し、`"ff-only"` は線形履歴を要求し、`"merge"` は明示的なマージコミットを作成します。

```json
"flow": {
  "merge": "squash"
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

2 つの環境変数が実行時の sdd-forge のパス解決に影響します。どちらも `src/lib/cli.js` の `repoRoot()` および `sourceRoot()` 関数で読み込まれます。これらは主に登録済みのプロジェクト設定に基づいて CLI エントリポイント（`src/sdd-forge.js`）が自動設定しますが、カスタム環境や CI 環境でパス解決を上書きするために手動で設定することもできます。

| 変数 | 関数 | 目的 |
|----------|----------|---------|
| `SDD_WORK_ROOT` | `repoRoot()` | `.sdd-forge/` と `docs/` を含むルートディレクトリ。設定されると、`repoRoot()` は `git rev-parse --show-toplevel` をバイパスしてこのパスを直接返す。sdd-forge の作業ディレクトリが git リポジトリのルートと異なる場合に使用する。 |
| `SDD_SOURCE_ROOT` | `sourceRoot()` | 解析対象のソースコードのルートディレクトリ。設定されると、`sourceRoot()` は `repoRoot()` へのフォールバックの代わりにこのパスを返す。対象プロジェクトのソースツリーが `.sdd-forge/` を含むディレクトリと分離している場合に使用する。 |

**`repoRoot()` の解決順序:**
1. `SDD_WORK_ROOT` 環境変数（設定されている場合）
2. `git rev-parse --show-toplevel`（git リポジトリのルート）
3. `process.cwd()`（現在の作業ディレクトリ、最終手段）

**`sourceRoot()` の解決順序:**
1. `SDD_SOURCE_ROOT` 環境変数（設定されている場合）
2. `repoRoot()`（作業ルートへのフォールバック）

もう 1 つの環境変数が `src/lib/agent.js` のエージェント呼び出し時に内部的に処理されます。`CLAUDECODE` 変数はエージェントのサブプロセスに渡される環境から明示的に削除され、Claude CLI 自身のセッションコンテキストが下位のエージェント呼び出しに漏れ出すことを防ぎます。この動作は自動的に行われ、ユーザーによる設定は不要です。
<!-- {{/text}} -->
