# 03. 設定とカスタマイズ

## 概要

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

sdd-forge の設定は、主に単一の JSON ファイル（`.sdd-forge/config.json`）で管理します。出力言語、ドキュメントスタイル、AI エージェントプロバイダー、スキャン範囲、フロー動作などを制御できます。`src/presets/{key}/preset.json` のプリセット定義がアーキテクチャ固有の既定値を提供し、2 つのランタイム環境変数により、マルチプロジェクト構成で作業ディレクトリとソースルートを分離できます。
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | パス | 役割 |
|------|----------|------|
| `config.json` | `.sdd-forge/config.json` | プロジェクトの主要設定ファイル。出力言語、操作言語、プロジェクト種別、ドキュメントスタイル、AI プロバイダー、スキャン範囲、並行処理数の上限、フロー動作を定義します。`sdd-forge setup` で作成され、コマンド実行時に毎回バリデーションされます。 |
| `preset.json` | `src/presets/{key}/preset.json` | 組み込みアーキテクチャ（base、node-cli、cakephp2、laravel、symfony、library）ごとのプリセットマニフェスト。ラベル、エイリアス、既定のスキャンパターン、章の並び順を宣言します。`src/lib/presets.js` により起動時に自動検出されます。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` の生成出力。後続のパイプラインステップ（`enrich`、`data`、`text`）が参照します。手動編集は不要です。 |
| `config.example.json` | `src/templates/config.example.json` | `sdd-forge setup` 実行時にプロジェクトへコピーされる同梱のリファレンステンプレートです。 |
| `review-checklist.md` | `src/templates/review-checklist.md` | `sdd-forge review` で使用される同梱のチェックリストテンプレートです。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

すべてのフィールドは `.sdd-forge/config.json` から読み込まれます。バリデーションは `src/lib/types.js` の `validateConfig()` により、コマンド実行のたびに行われます。

**トップレベルフィールド**

| フィールド | 必須 | 型 | 既定値 | 説明 |
|-------|----------|------|---------|-------------|
| `output` | 必須 | object | — | 出力言語の設定。少なくとも `languages` と `default` を含む必要があります。 |
| `output.languages` | 必須 | string[] | — | ドキュメントを生成する言語の一覧（例: `["en"]`、`["en", "ja"]`）。空にはできません。 |
| `output.default` | 必須 | string | — | 既定の出力言語。`output.languages` のいずれかの値と一致する必要があります。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | — | 既定言語以外の生成方法。`"translate"` は既定言語の出力を後処理で翻訳します。`"generate"` は各言語を独立して生成します。 |
| `lang` | 必須 | string | — | CLI メッセージ、AGENTS.md、スキル、spec ファイルで使用する操作言語（例: `"en"`、`"ja"`）。 |
| `type` | 必須 | string | — | プロジェクトのアーキテクチャ種別。プリセットキー（`"cakephp2"`、`"laravel"`、`"symfony"`）または正規パス（`"webapp/cakephp2"`、`"cli"`、`"library"`）を指定します。エイリアスは `src/lib/types.js` の `TYPE_ALIASES` で解決されます。 |
| `limits` | 任意 | object | — | リソース制限の設定。 |
| `limits.concurrency` | 任意 | number | `5` | AI 補填ステップでの最大並行処理ファイル数。`src/lib/config.js` の `resolveConcurrency()` で解決されます。 |
| `limits.agentTimeout` | 任意 | number | — | エージェント呼び出しごとのタイムアウト（秒）。 |
| `documentStyle` | 任意 | object | — | 生成ドキュメントのトーンと目的を制御します。 |
| `documentStyle.purpose` | `documentStyle` 指定時は必須 | string | — | ドキュメントの用途: `"developer-guide"`、`"user-guide"`、`"api-reference"`、または自由記述の文字列。 |
| `documentStyle.tone` | `documentStyle` 指定時は必須 | string | — | 文体: `"polite"`、`"formal"`、`"casual"`。 |
| `documentStyle.customInstruction` | 任意 | string | — | プロジェクト固有の追加指示。すべての AI プロンプトの末尾に付加されます。 |
| `textFill` | 任意 | object | — | `text` コマンドの AI 補填ステップに関する設定。 |
| `textFill.projectContext` | 任意 | string | — | プロジェクトの概要を記述した短い段落。追加のコンテキストとして AI プロンプトに注入されます。 |
| `textFill.preamblePatterns` | 任意 | object[] | — | AI 出力から不要な前置きテキストを除去する正規表現パターンのリスト（`{ pattern, flags }` 形式）。 |
| `defaultAgent` | 任意 | string | — | コマンドラインで指定がない場合に使用する AI プロバイダーのキー。`providers` 内のキーと一致する必要があります。 |
| `providers` | 任意 | object | — | 名前付き AI エージェント定義のマップ。各キーが選択可能なエージェント名になります。 |
| `providers.{name}.command` | プロバイダーごとに必須 | string | — | 実行する実行ファイル（例: `"claude"`）。 |
| `providers.{name}.args` | プロバイダーごとに必須 | string[] | — | コマンド引数。引数内の `{{PROMPT}}` プレースホルダーは実行時にプロンプトテキストで置換されます。 |
| `providers.{name}.timeoutMs` | 任意 | number | — | 呼び出しごとのタイムアウト（ミリ秒）。このプロバイダーに対して `limits.agentTimeout` を上書きします。 |
| `providers.{name}.systemPromptFlag` | 任意 | string | — | システムプロンプトを渡すためのフラグ名（例: `"--system-prompt"`）。 |
| `chapters` | 任意 | string[] | — | プリセットの既定の `chapters` 配列を上書きする、プロジェクト固有の章の並び順。各エントリは拡張子なしの章ファイル名です。 |
| `agentWorkDir` | 任意 | string | — | エージェントサブプロセス起動時に使用する作業ディレクトリの絶対パス。 |
| `scan` | 任意 | object | — | プリセットの既定スキャン設定を上書きします。 |
| `scan.include` | `scan` 指定時は必須 | string[] | — | スキャン対象のソースファイルを指定する glob パターン。空にはできません。 |
| `scan.exclude` | 任意 | string[] | — | スキャンから除外するソースファイルを指定する glob パターン。 |
| `flow` | 任意 | object | — | `sdd-forge flow` SDD 自動化コマンドの設定。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | spec ブランチのクローズ時に使用する Git マージ戦略。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**出力言語と多言語モード**

`output` ブロックで、ドキュメントを生成する言語を制御します。`output.mode` を `"translate"` に設定すると、まず既定言語で生成してから他の言語を派生させるため、AI のトークン使用量を削減できます。

```json
"output": {
  "languages": ["en", "ja"],
  "default": "en",
  "mode": "translate"
}
```

**ドキュメントスタイル**

`documentStyle` で、AI が生成するすべての段落のトーンと焦点をカスタマイズします。`customInstruction` フィールドは、プロジェクト固有の規約を注入する際に特に便利です。

```json
"documentStyle": {
  "purpose": "user-guide",
  "tone": "polite",
  "customInstruction": "Always include a usage example at the end of each section."
}
```

**AI エージェントプロバイダー**

カスタム AI エージェントは `providers` に登録します。プロンプトを受け取り標準出力に書き出す実行ファイルであれば、何でも使用できます。`args` 内の `{{PROMPT}}` プレースホルダーは、呼び出し時に実際のプロンプトテキストで置換されます。

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

**並行処理数の上限**

`limits.concurrency` は、`text` コマンドや `forge` コマンドで同時に処理するファイル数を制御します。値を小さくすると、大規模プロジェクトでのメモリ消費や API レート制限の負荷を軽減できます。

```json
"limits": {
  "concurrency": 3,
  "agentTimeout": 90
}
```

**章の並び順**

`chapters` 配列で、ドキュメント章の生成順序を定義します。プリセットの既定順序を上書きします。各エントリは拡張子なしの章ファイル名です。

```json
"chapters": ["overview", "configuration", "cli_commands", "data_model", "security"]
```

**スキャン範囲**

プリセットの既定スキャンパターンがプロジェクトのディレクトリ構成に合わない場合、`scan.include` と `scan.exclude` で上書きできます。パターンは標準的な glob 構文に従います。

```json
"scan": {
  "include": ["src/**/*.ts", "lib/**/*.ts"],
  "exclude": ["src/**/*.test.ts", "src/**/__mocks__/**"]
}
```

**フローのマージ戦略**

`flow.merge` は、`sdd-forge flow` で spec をクローズする際のブランチ統合方法を指定します。`"squash"` は単一のクリーンなコミットを生成します。`"ff-only"` はリニアな履歴を要求します。`"merge"` は明示的なマージコミットを作成します。

```json
"flow": {
  "merge": "squash"
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

2 つの環境変数が、sdd-forge の実行時パス解決に影響します。いずれも `src/lib/cli.js` の `repoRoot()` および `sourceRoot()` 関数で読み込まれます。通常は CLI エントリポイント（`src/sdd-forge.js`）が登録済みプロジェクト設定に基づいて自動的に設定しますが、カスタム環境や CI 環境でパス解決を上書きするために手動で設定することもできます。

| 変数 | 関数 | 用途 |
|----------|----------|---------|
| `SDD_WORK_ROOT` | `repoRoot()` | `.sdd-forge/` と `docs/` を含むルートディレクトリ。設定すると、`repoRoot()` は `git rev-parse --show-toplevel` を省略してこのパスを直接返します。sdd-forge の作業ディレクトリが Git リポジトリのルートと異なる場合に使用します。 |
| `SDD_SOURCE_ROOT` | `sourceRoot()` | 解析対象のソースコードのルートディレクトリ。設定すると、`sourceRoot()` は `repoRoot()` へのフォールバックの代わりにこのパスを返します。対象プロジェクトのソースツリーが `.sdd-forge/` の配置ディレクトリと分離されている場合に使用します。 |

**`repoRoot()` の解決順序:**
1. 環境変数 `SDD_WORK_ROOT`（設定されている場合）
2. `git rev-parse --show-toplevel`（Git リポジトリのルート）
3. `process.cwd()`（カレントディレクトリ、最終手段）

**`sourceRoot()` の解決順序:**
1. 環境変数 `SDD_SOURCE_ROOT`（設定されている場合）
2. `repoRoot()`（作業ルートへフォールバック）

もう 1 つ、`src/lib/agent.js` でのエージェント呼び出し時に内部的に処理される環境変数があります。`CLAUDECODE` 変数は、エージェントサブプロセスに渡される環境から明示的に除去されます。これにより、Claude CLI 自身のセッションコンテキストが下位のエージェント呼び出しに漏洩することを防ぎます。この動作は自動的に行われ、ユーザー側での設定は不要です。
<!-- {{/text}} -->
