# 03. 設定とカスタマイズ

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

sdd-forge は、主に 1 つの JSON ファイル（`.sdd-forge/config.json`）で設定します。このファイルでは、出力言語、ドキュメントの文体、AI エージェントのプロバイダー、スキャン範囲、フローの挙動を制御できます。`src/presets/{key}/preset.json` にあるプリセット定義では、アーキテクチャごとの既定値を提供し、実行時環境変数を 2 つ使うことで、複数プロジェクト構成でも作業ディレクトリとソースルートを分けて扱えます。
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | 場所 | 役割 |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | プロジェクトの主要設定です。出力言語、動作言語、プロジェクト種別、ドキュメントの文体、AI プロバイダー、スキャン範囲、並列数制限、フローの挙動を定義します。`sdd-forge setup` で作成され、すべてのコマンド実行時に検証されます。 |
| `preset.json` | `src/presets/{key}/preset.json` | 各組み込みアーキテクチャ（base、node-cli、cakephp2、laravel、symfony、library）用のプリセットマニフェストです。ラベル、別名、既定のスキャンパターン、章の順序を宣言します。起動時に `src/lib/presets.js` によって自動検出されます。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成する出力です。後続のパイプライン処理（`enrich`、`data`、`text`）で利用されます。手動では編集しません。 |
| `config.example.json` | `src/templates/config.example.json` | `sdd-forge setup` の実行時にプロジェクトへコピーされる、同梱の参照用テンプレートです。 |
| `review-checklist.md` | `src/templates/review-checklist.md` | `sdd-forge review` で使う、同梱のチェックリストテンプレートです。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

すべての項目は `.sdd-forge/config.json` から読み込まれます。検証は各コマンド呼び出し時に `src/lib/types.js` の `validateConfig()` で行われます。

**トップレベル項目**

| 項目 | 必須 | 型 | 既定値 | 説明 |
|-------|----------|------|---------|-------------|
| `output` | 必須 | object | — | 出力言語の設定です。少なくとも `languages` と `default` を含む必要があります。 |
| `output.languages` | 必須 | string[] | — | ドキュメントを生成する言語の一覧です（例: `["en"]`、`["en", "ja"]`）。空にはできません。 |
| `output.default` | 必須 | string | — | 既定の出力言語です。`output.languages` に含まれる値でなければなりません。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | — | 既定言語以外をどう生成するかを指定します。`"translate"` は既定言語の出力を後処理して追加言語を作り、`"generate"` は各言語を個別に生成します。 |
| `lang` | 必須 | string | — | CLI メッセージ、AGENTS.md、skills、spec ファイルに使う動作言語です（例: `"en"`、`"ja"`）。 |
| `type` | 必須 | string | — | プロジェクトのアーキテクチャ種別です。プリセットキー（`"cakephp2"`、`"laravel"`、`"symfony"`）または正規パス（`"webapp/cakephp2"`、`"cli"`、`"library"`）を受け付けます。別名は `src/lib/types.js` の `TYPE_ALIASES` で解決されます。 |
| `limits` | 任意 | object | — | リソース制限の設定です。 |
| `limits.concurrency` | 任意 | number | `5` | AI による埋め込み処理で並列処理するファイル数の上限です。`src/lib/config.js` の `resolveConcurrency()` で解決されます。 |
| `limits.agentTimeout` | 任意 | number | — | エージェント呼び出しごとのタイムアウト秒数です。 |
| `documentStyle` | 任意 | object | — | 生成されるドキュメントの文体と目的を制御します。 |
| `documentStyle.purpose` | `documentStyle` がある場合は必須 | string | — | ドキュメントの用途です。`"developer-guide"`、`"user-guide"`、`"api-reference"`、または任意の文字列を指定できます。 |
| `documentStyle.tone` | `documentStyle` がある場合は必須 | string | — | 文章の調子です。`"polite"`、`"formal"`、`"casual"` を指定できます。 |
| `documentStyle.customInstruction` | 任意 | string | — | このプロジェクト向けに、すべての AI プロンプトへ追加する自由記述の指示です。 |
| `textFill` | 任意 | object | — | `text` コマンドの AI 埋め込み処理に関する設定です。 |
| `textFill.projectContext` | 任意 | string | — | プロジェクトの説明を短い段落で記述する項目です。追加の文脈として AI プロンプトへ注入されます。 |
| `textFill.preamblePatterns` | 任意 | object[] | — | AI 出力から不要な前置き文を取り除くための正規表現パターン一覧（`{ pattern, flags }`）です。 |
| `defaultAgent` | 任意 | string | — | コマンドラインで指定がない場合に使う AI プロバイダーのキーです。`providers` 内のキーと一致している必要があります。 |
| `providers` | 任意 | object | — | 名前付き AI エージェント定義のマップです。各キーが選択可能なエージェント名になります。 |
| `providers.{name}.command` | 各 provider で必須 | string | — | 呼び出す実行ファイルです（例: `"claude"`）。 |
| `providers.{name}.args` | 各 provider で必須 | string[] | — | コマンド引数です。任意の引数中にある `{{PROMPT}}` は、実行時にプロンプト本文へ置き換えられます。 |
| `providers.{name}.timeoutMs` | 各 provider で任意 | number | — | 呼び出しごとのタイムアウト時間（ミリ秒）です。この provider では `limits.agentTimeout` より優先されます。 |
| `providers.{name}.systemPromptFlag` | 各 provider で任意 | string | — | システムプロンプトを渡すときに使うフラグ名です（例: `"--system-prompt"`）。 |
| `chapters` | 任意 | string[] | — | プロジェクト固有の章順です。プリセット既定の `chapters` 配列を上書きします。各要素は拡張子なしの章ファイル名です。 |
| `agentWorkDir` | 任意 | string | — | エージェントの子プロセス起動時に作業ディレクトリとして使う絶対パスです。 |
| `scan` | 任意 | object | — | プリセット既定のスキャン設定を上書きします。 |
| `scan.include` | `scan` がある場合は必須 | string[] | — | スキャン対象に含めるソースファイルの glob パターンです。空にはできません。 |
| `scan.exclude` | 任意 | string[] | — | スキャン対象から除外するソースファイルの glob パターンです。 |
| `flow` | 任意 | object | — | `sdd-forge flow` の SDD 自動化コマンドに関する設定です。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | spec ブランチを閉じるときに使う Git のマージ戦略です。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**出力言語と多言語モード**

`output` ブロックでは、どの言語でドキュメントを生成するかを制御します。`output.mode` を `"translate"` にすると、まず既定言語を生成し、それをもとに追加言語を作るため、AI トークンの使用量を抑えられます。

```json
"output": {
  "languages": ["en", "ja"],
  "default": "en",
  "mode": "translate"
}
```

**ドキュメントの文体**

`documentStyle` では、AI が生成する各段落の文体や重点を調整できます。特に `customInstruction` は、プロジェクト固有の規約を差し込む用途に有効です。

```json
"documentStyle": {
  "purpose": "user-guide",
  "tone": "polite",
  "customInstruction": "Always include a usage example at the end of each section."
}
```

**AI エージェントプロバイダー**

カスタム AI エージェントは `providers` に登録します。プロンプトを受け取り、標準出力へ書き出せる実行ファイルであれば利用できます。`args` 内の `{{PROMPT}}` は、呼び出し時に実際のプロンプト本文へ置き換えられます。

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

**並列数制限**

`limits.concurrency` は、`text` および `forge` コマンドで並列処理するファイル数を制御します。大規模なプロジェクトでは、この値を下げるとメモリ使用量や API のレート制限への負荷を抑えられます。

```json
"limits": {
  "concurrency": 3,
  "agentTimeout": 90
}
```

**章の並び順**

`chapters` 配列では、ドキュメントの章を生成する順序を定義します。プリセットの既定順を上書きします。各要素には、拡張子なしの章ファイル名を指定します。

```json
"chapters": ["overview", "configuration", "cli_commands", "data_model", "security"]
```

**スキャン範囲**

プリセット既定のスキャンパターンがプロジェクトのディレクトリ構成に合わない場合は、`scan.include` と `scan.exclude` を設定して上書きできます。パターンは標準的な glob 構文に従います。

```json
"scan": {
  "include": ["src/**/*.ts", "lib/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__mocks__/**"]
}
```

**フローのマージ戦略**

`flow.merge` は、`sdd-forge flow` が spec を閉じるときに、spec ブランチをどう統合するかを決めます。`"squash"` はきれいな 1 つのコミットにまとめ、`"ff-only"` は直線的な履歴を要求し、`"merge"` は明示的なマージコミットを作成します。

```json
"flow": {
  "merge": "squash"
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

sdd-forge が実行時に作業パスをどう解決するかには、2 つの環境変数が影響します。どちらも `src/lib/cli.js` の `repoRoot()` と `sourceRoot()` で読み取られます。主に CLI エントリポイント（`src/sdd-forge.js`）が登録済みプロジェクト設定にもとづいて自動設定しますが、独自環境や CI 環境でパス解決を上書きしたい場合は手動でも設定できます。

| 変数 | 関数 | 目的 |
|----------|----------|---------|
| `SDD_WORK_ROOT` | `repoRoot()` | `.sdd-forge/` と `docs/` を含むルートディレクトリです。設定されている場合、`repoRoot()` は `git rev-parse --show-toplevel` を使わず、このパスをそのまま返します。sdd-forge の作業ディレクトリが Git リポジトリのルートと一致しない場合に使います。 |
| `SDD_SOURCE_ROOT` | `sourceRoot()` | 解析対象のソースコードのルートディレクトリです。設定されている場合、`sourceRoot()` は `repoRoot()` にフォールバックせず、このパスを返します。対象プロジェクトのソースツリーが `.sdd-forge/` を含むディレクトリと別にある場合に使います。 |

**`repoRoot()` の解決順序:**
1. `SDD_WORK_ROOT` 環境変数（設定されている場合）
2. `git rev-parse --show-toplevel`（Git リポジトリのルート）
3. `process.cwd()`（現在の作業ディレクトリ、最後の手段）

**`sourceRoot()` の解決順序:**
1. `SDD_SOURCE_ROOT` 環境変数（設定されている場合）
2. `repoRoot()`（作業ルートへフォールバック）

さらに、`src/lib/agent.js` のエージェント呼び出し内部では、追加で 1 つの環境変数を扱っています。`CLAUDECODE` 変数は、エージェント子プロセスへ渡す環境から明示的に削除され、Claude CLI 自身のセッションコンテキストが下位のエージェント呼び出しへ漏れないようにしています。この挙動は自動で行われ、ユーザー側の設定は不要です。
<!-- {{/text}} -->
