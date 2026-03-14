# 03. 設定とカスタマイズ

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

sdd-forge は主に単一の JSON ファイル（`.sdd-forge/config.json`）で設定を管理し、出力言語・ドキュメントスタイル・AI エージェントプロバイダー・スキャン対象・フロー動作を制御します。`src/presets/{key}/preset.json` のプリセット定義がアーキテクチャ固有のデフォルト値を提供し、2 つのランタイム環境変数によりマルチプロジェクト構成で作業ディレクトリとソースルートを分離できます。
<!-- {{/text}} -->

## Content

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | 配置場所 | 役割 |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | プロジェクトのメイン設定ファイル。出力言語・操作言語・プロジェクト種別・ドキュメントスタイル・AI プロバイダー・スキャン対象・並列数上限・フロー動作を定義する。`sdd-forge setup` で作成され、コマンド実行のたびにバリデーションされる。 |
| `preset.json` | `src/presets/{key}/preset.json` | 各組み込みアーキテクチャ（base, node-cli, cakephp2, laravel, symfony, library）向けのプリセットマニフェスト。ラベル・エイリアス・デフォルトスキャンパターン・章の順序を宣言する。起動時に `src/lib/presets.js` が自動探索する。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成する出力ファイル。後続のパイプラインステップ（`enrich`, `data`, `text`）で利用される。手動編集は行わない。 |
| `config.example.json` | `src/templates/config.example.json` | `sdd-forge setup` 実行時にプロジェクトへコピーされる同梱の参照テンプレート。 |
| `review-checklist.md` | `src/templates/review-checklist.md` | `sdd-forge review` で使用される同梱のチェックリストテンプレート。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

すべてのフィールドは `.sdd-forge/config.json` から読み込まれます。バリデーションはコマンド呼び出しのたびに `src/lib/types.js` の `validateConfig()` によって実行されます。

**トップレベルフィールド**

| フィールド | 必須/任意 | 型 | デフォルト | 説明 |
|-------|----------|------|---------|-------------|
| `output` | 必須 | object | — | 出力言語設定。`languages` と `default` を必ず含むこと。 |
| `output.languages` | 必須 | string[] | — | ドキュメントを生成する言語のリスト（例: `["en"]`, `["en", "ja"]`）。空にできない。 |
| `output.default` | 必須 | string | — | デフォルト出力言語。`output.languages` に含まれる値であること。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | — | デフォルト言語以外の言語を生成する方法。`"translate"` はデフォルト言語の出力を変換して派生させる。`"generate"` は各言語を独立して生成する。 |
| `lang` | 必須 | string | — | CLI メッセージ・AGENTS.md・スキル・spec ファイルに使用する操作言語（例: `"en"`, `"ja"`）。 |
| `type` | 必須 | string | — | プロジェクトのアーキテクチャ種別。プリセットキー（`"cakephp2"`, `"laravel"`, `"symfony"`）または正規パス（`"webapp/cakephp2"`, `"cli"`, `"library"`）を受け付ける。エイリアスは `src/lib/types.js` の `TYPE_ALIASES` で解決される。 |
| `limits` | 任意 | object | — | リソース上限設定。 |
| `limits.concurrency` | 任意 | number | `5` | AI 補完ステップで並列処理するファイルの最大数。`src/lib/config.js` の `resolveConcurrency()` で解決される。 |
| `limits.agentTimeout` | 任意 | number | — | エージェント呼び出し 1 回あたりのタイムアウト秒数。 |
| `documentStyle` | 任意 | object | — | 生成ドキュメントのトーンと目的を制御する。 |
| `documentStyle.purpose` | `documentStyle` が存在する場合は必須 | string | — | ドキュメントの用途: `"developer-guide"`, `"user-guide"`, `"api-reference"`、または自由形式の文字列。 |
| `documentStyle.tone` | `documentStyle` が存在する場合は必須 | string | — | 文体のトーン: `"polite"`, `"formal"`, `"casual"`。 |
| `documentStyle.customInstruction` | 任意 | string | — | このプロジェクトのすべての AI プロンプトに追記される追加指示（自由記述）。 |
| `textFill` | 任意 | object | — | `text` コマンドの AI 補完ステップの設定。 |
| `textFill.projectContext` | 任意 | string | — | プロジェクトを説明する短い文章。追加コンテキストとして AI プロンプトに注入される。 |
| `textFill.preamblePatterns` | 任意 | object[] | — | AI 出力から不要な前置き文を除去するための正規表現パターンのリスト（`{ pattern, flags }`）。 |
| `defaultAgent` | 任意 | string | — | コマンドラインで指定がない場合に使用する AI プロバイダーのキー。`providers` に存在するキーであること。 |
| `providers` | 任意 | object | — | 名前付き AI エージェント定義のマップ。各キーが選択可能なエージェント名になる。 |
| `providers.{name}.command` | プロバイダーごとに必須 | string | — | 呼び出す実行ファイル（例: `"claude"`）。 |
| `providers.{name}.args` | プロバイダーごとに必須 | string[] | — | コマンド引数。いずれかの引数に含まれる `{{PROMPT}}` プレースホルダーが実行時にプロンプト本文で置換される。 |
| `providers.{name}.timeoutMs` | プロバイダーごとに任意 | number | — | 呼び出し 1 回あたりのタイムアウト（ミリ秒）。このプロバイダーに対して `limits.agentTimeout` を上書きする。 |
| `providers.{name}.systemPromptFlag` | プロバイダーごとに任意 | string | — | システムプロンプトを渡すためのフラグ名（例: `"--system-prompt"`）。 |
| `chapters` | 任意 | string[] | — | プロジェクト固有の章の順序。プリセットのデフォルト `chapters` 配列を上書きする。各エントリは拡張子なしの章ファイル名。 |
| `agentWorkDir` | 任意 | string | — | エージェントのサブプロセスを起動する際の作業ディレクトリの絶対パス。 |
| `scan` | 任意 | object | — | プリセットのデフォルトスキャン設定を上書きする。 |
| `scan.include` | `scan` が存在する場合は必須 | string[] | — | スキャン対象のソースファイルを指定する glob パターン。空にできない。 |
| `scan.exclude` | 任意 | string[] | — | スキャンから除外するソースファイルを指定する glob パターン。 |
| `flow` | 任意 | object | — | `sdd-forge flow` SDD 自動化コマンドの設定。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | spec ブランチのクローズ時に使用する Git マージ戦略。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**出力言語とマルチ言語モード**

`output` ブロックでドキュメントを生成する言語を制御します。`output.mode` を `"translate"` に設定すると、まずデフォルト言語を生成し、そこから追加言語を派生させるため、AI トークン消費を抑えられます。

```json
"output": {
  "languages": ["en", "ja"],
  "default": "en",
  "mode": "translate"
}
```

**ドキュメントスタイル**

`documentStyle` は AI が生成するすべての段落のトーンと焦点をカスタマイズします。`customInstruction` フィールドはプロジェクト固有の規約を注入するのに特に有効です。

```json
"documentStyle": {
  "purpose": "user-guide",
  "tone": "polite",
  "customInstruction": "Always include a usage example at the end of each section."
}
```

**AI エージェントプロバイダー**

カスタム AI エージェントは `providers` に登録します。プロンプトを受け取り stdout に書き出す実行ファイルであれば何でも使用できます。`args` 内の `{{PROMPT}}` プレースホルダーは呼び出し時に実際のプロンプト本文で置換されます。

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

**並列数上限**

`limits.concurrency` は `text` コマンドおよび `forge` コマンドで並列処理するファイル数を制御します。値を小さくすると、大規模プロジェクトでのメモリ消費と API レート制限の問題を軽減できます。

```json
"limits": {
  "concurrency": 3,
  "agentTimeout": 90
}
```

**章の順序**

`chapters` 配列でドキュメントの章を生成する順序を定義します。プリセットのデフォルト順序を上書きします。各エントリは拡張子なしの章ファイル名です。

```json
"chapters": ["overview", "configuration", "cli_commands", "data_model", "security"]
```

**スキャン対象**

プリセットのデフォルトスキャンパターンがプロジェクトのディレクトリ構成に合わない場合、`scan.include` と `scan.exclude` で上書きできます。パターンは標準 glob 構文に従います。

```json
"scan": {
  "include": ["src/**/*.ts", "lib/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__mocks__/**"]
}
```

**フローのマージ戦略**

`flow.merge` は `sdd-forge flow` が spec をクローズする際に spec ブランチをどのように統合するかを決定します。`"squash"` は 1 つのきれいなコミットを生成し、`"ff-only"` は線形履歴を要求し、`"merge"` は明示的なマージコミットを作成します。

```json
"flow": {
  "merge": "squash"
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

sdd-forge が実行時に作業パスを解決する際に影響を与える環境変数が 2 つあります。いずれも `src/lib/cli.js` の `repoRoot()` 関数および `sourceRoot()` 関数で読み込まれます。通常は登録済みプロジェクト設定に基づいて CLI エントリポイント（`src/sdd-forge.js`）が自動的に設定しますが、カスタム環境や CI 環境でパス解決を上書きしたい場合は手動で設定することもできます。

| 変数 | 参照関数 | 目的 |
|----------|----------|---------|
| `SDD_WORK_ROOT` | `repoRoot()` | `.sdd-forge/` と `docs/` を含むルートディレクトリ。設定されている場合、`repoRoot()` は `git rev-parse --show-toplevel` を実行せずにこのパスを直接返す。sdd-forge の作業ディレクトリが git リポジトリのルートと異なる場合に使用する。 |
| `SDD_SOURCE_ROOT` | `sourceRoot()` | 解析対象のソースコードのルートディレクトリ。設定されている場合、`sourceRoot()` は `repoRoot()` へのフォールバックの代わりにこのパスを返す。対象プロジェクトのソースツリーが `.sdd-forge/` を含むディレクトリと分離している場合に使用する。 |

**`repoRoot()` の解決順序:**
1. `SDD_WORK_ROOT` 環境変数（設定されている場合）
2. `git rev-parse --show-toplevel`（git リポジトリのルート）
3. `process.cwd()`（カレントワーキングディレクトリ、最終フォールバック）

**`sourceRoot()` の解決順序:**
1. `SDD_SOURCE_ROOT` 環境変数（設定されている場合）
2. `repoRoot()`（作業ルートへのフォールバック）

`src/lib/agent.js` のエージェント呼び出し内部では追加の環境変数が処理されます。`CLAUDECODE` 変数はエージェントのサブプロセスに渡す環境から明示的に除去され、Claude CLI 自身のセッションコンテキストが下位のエージェント呼び出しに漏れるのを防ぎます。この動作は自動的に行われ、ユーザーによる設定は不要です。
<!-- {{/text}} -->
