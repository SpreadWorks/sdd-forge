# 03. 設定とカスタマイズ

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

sdd-forge は主に単一の JSON ファイル（`.sdd-forge/config.json`）によって設定され、出力言語、ドキュメントスタイル、AI エージェントプロバイダー、スキャン範囲、フロー動作を制御します。`src/presets/{key}/preset.json` のプリセット定義がアーキテクチャ固有のデフォルト値を提供し、2つのランタイム環境変数により、マルチプロジェクト構成で作業ディレクトリとソースルートを分離できます。
<!-- {{/text}} -->

## Content

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | 場所 | 役割 |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | プロジェクトの主要設定。出力言語、操作言語、プロジェクトタイプ、ドキュメントスタイル、AI プロバイダー、スキャン範囲、並行処理制限、フロー動作を定義する。`sdd-forge setup` で作成され、コマンド実行時に毎回バリデーションされる。 |
| `preset.json` | `src/presets/{key}/preset.json` | 各組み込みアーキテクチャ（base、node-cli、cakephp2、laravel、symfony、library）のプリセットマニフェスト。ラベル、エイリアス、デフォルトスキャンパターン、章の順序を宣言する。`src/lib/presets.js` により起動時に自動検出される。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` の生成出力。後続のパイプラインステップ（`enrich`、`data`、`text`）で消費される。手動編集は不要。 |
| `config.example.json` | `src/templates/config.example.json` | `sdd-forge setup` 時にプロジェクトにコピーされる同梱リファレンステンプレート。 |
| `review-checklist.md` | `src/templates/review-checklist.md` | `sdd-forge review` で使用される同梱チェックリストテンプレート。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

すべてのフィールドは `.sdd-forge/config.json` から読み込まれます。バリデーションは `src/lib/types.js` の `validateConfig()` によりコマンド実行時に毎回行われます。

**トップレベルフィールド**

| フィールド | 必須 | 型 | デフォルト | 説明 |
|-------|----------|------|---------|-------------|
| `output` | 必須 | object | — | 出力言語設定。少なくとも `languages` と `default` を含む必要がある。 |
| `output.languages` | 必須 | string[] | — | ドキュメントを生成する言語のリスト（例: `["en"]`、`["en", "ja"]`）。空であってはならない。 |
| `output.default` | 必須 | string | — | デフォルトの出力言語。`output.languages` の値のいずれかでなければならない。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | — | デフォルト以外の言語の生成方法。`"translate"` はデフォルト言語の出力を後処理する。`"generate"` は各言語を独立して生成する。 |
| `lang` | 必須 | string | — | CLI メッセージ、AGENTS.md、スキル、spec ファイルの操作言語（例: `"en"`、`"ja"`）。 |
| `type` | 必須 | string | — | プロジェクトのアーキテクチャタイプ。プリセットキー（`"cakephp2"`、`"laravel"`、`"symfony"`）または正規パス（`"webapp/cakephp2"`、`"cli"`、`"library"`）を受け付ける。エイリアスは `src/lib/types.js` の `TYPE_ALIASES` で解決される。 |
| `limits` | 任意 | object | — | リソース制限設定。 |
| `limits.concurrency` | 任意 | number | `5` | AI 充填ステップで並列処理されるファイルの最大数。`src/lib/config.js` の `resolveConcurrency()` で解決される。 |
| `limits.agentTimeout` | 任意 | number | — | エージェント呼び出しごとのタイムアウト（秒）。 |
| `documentStyle` | 任意 | object | — | 生成されるドキュメントのトーンと目的を制御する。 |
| `documentStyle.purpose` | `documentStyle` がある場合は必須 | string | — | ドキュメントの用途: `"developer-guide"`、`"user-guide"`、`"api-reference"`、または自由形式の文字列。 |
| `documentStyle.tone` | `documentStyle` がある場合は必須 | string | — | 文体: `"polite"`、`"formal"`、`"casual"`。 |
| `documentStyle.customInstruction` | 任意 | string | — | このプロジェクトのすべての AI プロンプトに追加される自由テキスト指示。 |
| `textFill` | 任意 | object | — | `text` コマンドの AI 充填ステップの設定。 |
| `textFill.projectContext` | 任意 | string | — | プロジェクトを説明する短い段落。追加コンテキストとして AI プロンプトに注入される。 |
| `textFill.preamblePatterns` | 任意 | object[] | — | AI 出力から不要な前文テキストを除去するための正規表現パターンリスト（`{ pattern, flags }`）。 |
| `defaultAgent` | 任意 | string | — | コマンドラインで指定がない場合に使用する AI プロバイダーのキー。`providers` のキーと一致する必要がある。 |
| `providers` | 任意 | object | — | 名前付き AI エージェント定義のマップ。各キーが選択可能なエージェント名となる。 |
| `providers.{name}.command` | プロバイダーごとに必須 | string | — | 実行するコマンド（例: `"claude"`）。 |
| `providers.{name}.args` | プロバイダーごとに必須 | string[] | — | コマンド引数。引数内のプレースホルダー `{{PROMPT}}` は実行時にプロンプトテキストに置換される。 |
| `providers.{name}.timeoutMs` | プロバイダーごとに任意 | number | — | 呼び出しごとのタイムアウト（ミリ秒）。このプロバイダーについて `limits.agentTimeout` を上書きする。 |
| `providers.{name}.systemPromptFlag` | プロバイダーごとに任意 | string | — | システムプロンプトを渡すために使用するフラグ名（例: `"--system-prompt"`）。 |
| `chapters` | 任意 | string[] | — | プロジェクト固有の章順序。プリセットのデフォルト `chapters` 配列を上書きする。各エントリは拡張子なしの章ファイル名。 |
| `agentWorkDir` | 任意 | string | — | エージェントサブプロセスを起動する際の作業ディレクトリの絶対パス。 |
| `scan` | 任意 | object | — | プリセットのデフォルトスキャン設定を上書きする。 |
| `scan.include` | `scan` がある場合は必須 | string[] | — | スキャン対象のソースファイルの glob パターン。空であってはならない。 |
| `scan.exclude` | 任意 | string[] | — | スキャンから除外するソースファイルの glob パターン。 |
| `flow` | 任意 | object | — | `sdd-forge flow` SDD 自動化コマンドの設定。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | spec ブランチをクローズする際に使用する Git マージ戦略。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**出力言語と多言語モード**

`output` ブロックはドキュメントを生成する言語を制御します。`output.mode` を `"translate"` に設定すると、まずデフォルト言語で生成してから他の言語を派生させるため、AI トークンの使用量を削減できます。

```json
"output": {
  "languages": ["en", "ja"],
  "default": "en",
  "mode": "translate"
}
```

**ドキュメントスタイル**

`documentStyle` は AI が生成するすべての段落のトーンとフォーカスをカスタマイズします。`customInstruction` フィールドは、プロジェクト固有の規約を注入するのに特に便利です。

```json
"documentStyle": {
  "purpose": "user-guide",
  "tone": "polite",
  "customInstruction": "Always include a usage example at the end of each section."
}
```

**AI エージェントプロバイダー**

カスタム AI エージェントは `providers` に登録します。プロンプトを受け取り stdout に出力する任意の実行可能ファイルを使用できます。`args` 内の `{{PROMPT}}` プレースホルダーは呼び出し時に実際のプロンプトテキストに置換されます。

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

**並行処理制限**

`limits.concurrency` は `text` および `forge` コマンド実行時に並列処理されるファイル数を制御します。値を下げることで、大規模プロジェクトでのメモリ使用量と API レート制限の負荷を軽減できます。

```json
"limits": {
  "concurrency": 3,
  "agentTimeout": 90
}
```

**章の順序**

`chapters` 配列はドキュメントの章が生成される順序を定義します。プリセットのデフォルト順序を上書きします。各エントリは拡張子なしの章ファイル名です。

```json
"chapters": ["overview", "configuration", "cli_commands", "data_model", "security"]
```

**スキャン範囲**

プリセットのデフォルトスキャンパターンがプロジェクトのディレクトリ構成に合わない場合、`scan.include` と `scan.exclude` で上書きできます。パターンは標準的な glob 構文に従います。

```json
"scan": {
  "include": ["src/**/*.ts", "lib/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__mocks__/**"]
}
```

**フローマージ戦略**

`flow.merge` は `sdd-forge flow` が spec をクローズする際のブランチ統合方法を決定します。`"squash"` は単一のクリーンなコミットを生成し、`"ff-only"` はリニアな履歴を要求し、`"merge"` は明示的なマージコミットを作成します。

```json
"flow": {
  "merge": "squash"
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

2つの環境変数が sdd-forge の実行時パス解決に影響します。いずれも `src/lib/cli.js` の `repoRoot()` および `sourceRoot()` 関数で読み込まれます。これらは主に CLI エントリポイント（`src/sdd-forge.js`）が登録済みプロジェクト設定に基づいて自動設定しますが、カスタム環境や CI 環境でパス解決を上書きするために手動で設定することもできます。

| 変数 | 関数 | 用途 |
|----------|----------|---------|
| `SDD_WORK_ROOT` | `repoRoot()` | `.sdd-forge/` と `docs/` を含むルートディレクトリ。設定されている場合、`repoRoot()` は `git rev-parse --show-toplevel` をバイパスしてこのパスを直接返す。sdd-forge の作業ディレクトリが git リポジトリルートと異なる場合に使用する。 |
| `SDD_SOURCE_ROOT` | `sourceRoot()` | 解析対象のソースコードのルートディレクトリ。設定されている場合、`sourceRoot()` は `repoRoot()` へのフォールバックの代わりにこのパスを返す。対象プロジェクトのソースツリーが `.sdd-forge/` を含むディレクトリと異なる場合に使用する。 |

**`repoRoot()` の解決順序:**
1. `SDD_WORK_ROOT` 環境変数（設定されている場合）
2. `git rev-parse --show-toplevel`（git リポジトリルート）
3. `process.cwd()`（カレントディレクトリ、最終手段）

**`sourceRoot()` の解決順序:**
1. `SDD_SOURCE_ROOT` 環境変数（設定されている場合）
2. `repoRoot()`（作業ルートにフォールバック）

もう1つの環境変数が `src/lib/agent.js` のエージェント呼び出し時に内部的に処理されます。`CLAUDECODE` 変数はエージェントサブプロセスに渡される環境から明示的に除去され、Claude CLI 自体のセッションコンテキストが下位エージェント呼び出しに漏洩するのを防ぎます。この動作は自動的に行われ、ユーザー側の設定は不要です。
<!-- {{/text}} -->
