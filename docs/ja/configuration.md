# 03. 設定とカスタマイズ

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

本章では、sdd-forge がプロジェクトに合わせた動作を行うために読み込む設定ファイルについて説明します。主要な `.sdd-forge/config.json`（出力言語・プロジェクトタイプ・AIプロバイダー・スキャン設定を管理）を中心に、ドキュメントスタイル・並列処理数・章の順序・SDD フローの動作に関するカスタマイズポイントも解説します。
<!-- {{/text}} -->

## Content

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | 主要設定ファイル。出力言語・プロジェクトタイプ・AIプロバイダー・スキャンパターン・ドキュメントスタイル・フロー設定を定義する。すべてのコマンドが起動時に読み込み・検証する。 |
| `projects.json` | `.sdd-forge/projects.json` | 複数プロジェクトのレジストリ。名前付きプロジェクトエントリーをソースルートおよびワークルートのパスにマッピングし、デフォルトプロジェクトを記録する。`setup`・`default`・トップレベルルーターが参照する。 |
| `preset.json` | `src/presets/{key}/preset.json` | sdd-forge に同梱されたプリセットマニフェスト。各対応プロジェクトタイプのラベル・アーキテクチャ・エイリアス・デフォルトスキャンパターン・章の順序を定義する。ユーザーが直接編集するファイルではない。 |
| `package.json` | `{repoRoot}/package.json` | `name`・`version`・`description` などのパッケージメタデータを取得し、生成ドキュメントに利用するために読み込まれる。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

以下の表は `.sdd-forge/config.json` で認識されるすべてのフィールドを示します。バリデーションは `src/lib/types.js` の `validateConfig()` で行われ、**必須**と記載されたフィールドが存在しないか不正な値の場合はコマンドが中断されます。

| フィールド | 必須 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output` | 必須 | object | — | 出力言語の設定ブロック。非 null のオブジェクトである必要がある。 |
| `output.languages` | 必須 | string[] | — | 生成ドキュメントの言語コードの配列（例: `["ja"]`、`["en", "ja"]`）。空でない配列であること。 |
| `output.default` | 必須 | string | — | 主要出力言語。`output.languages` に含まれる値のいずれかである必要がある。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | `"translate"` | 非デフォルト言語の生成方法。`"translate"` はデフォルト出力を後処理し、`"generate"` は各言語に対して AI を独立して呼び出す。 |
| `lang` | 必須 | string | — | CLI・AGENTS.md・スキルファイル・spec ドキュメントで使用する言語（例: `"ja"`、`"en"`）。 |
| `type` | 必須 | string | — | プロジェクトタイプの識別子（例: `"webapp/cakephp2"`、`"cli"`、`"webapp/laravel"`）。`"cakephp2"` などの短縮エイリアスは `TYPE_ALIASES` を通じて正規パスに解決される。 |
| `limits.agentTimeout` | 任意 | number | — | AI エージェント呼び出しのタイムアウト秒数。プロバイダーのデフォルト値を上書きする。 |
| `limits.concurrency` | 任意 | number | `5` | `scan` および `text` 実行時に並列処理するファイルの最大数。`resolveConcurrency()` で解決される。 |
| `documentStyle.purpose` | 任意 | string | — | 想定読者とドキュメントの目的。`"developer-guide"`・`"user-guide"`・`"api-reference"` または任意の文字列を指定できる。`documentStyle` が存在する場合は必須。 |
| `documentStyle.tone` | 任意 | `"polite"` \| `"formal"` \| `"casual"` | — | AI 生成テキスト全体に適用する文体。`documentStyle` が存在する場合は必須。 |
| `documentStyle.customInstruction` | 任意 | string | — | このプロジェクトのすべての AI プロンプトに追記される自由記述の追加指示。 |
| `chapters` | 任意 | string[] | — | 章ファイル名（`.md` 拡張子なし）の順序付きリスト。このプロジェクトにおいてプリセットのデフォルト章順序を上書きする。 |
| `agentWorkDir` | 任意 | string | — | AI エージェントプロセスに渡す作業ディレクトリ。省略時はリポジトリルートが使用される。 |
| `scan.include` | `scan` が設定されている場合は必須 | string[] | — | ソーススキャン時に対象とするファイルの glob パターン。空でない配列であること。 |
| `scan.exclude` | 任意 | string[] | — | スキャンから除外するファイルの glob パターン。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDD フローがフィーチャーブランチをベースブランチにマージする際のマージ戦略。 |
| `providers` | 任意 | object | — | 名前付き AI エージェントプロバイダーの定義。キーがプロバイダー名で、各エントリーに `command` と `args` が必要。 |
| `providers.{name}.command` | プロバイダーごとに必須 | string | — | この AI プロバイダーに対して呼び出す実行ファイル（例: `"claude"`）。 |
| `providers.{name}.args` | プロバイダーごとに必須 | string[] | — | コマンドに渡す引数。`{{PROMPT}}` を生成プロンプトテキストのプレースホルダーとして使用できる。 |
| `providers.{name}.timeoutMs` | 任意 | number | — | プロバイダーごとのタイムアウト（ミリ秒）。 |
| `providers.{name}.systemPromptFlag` | 任意 | string | — | システムプロンプトを渡すための CLI フラグ（例: `"--system-prompt"`）。 |
| `defaultAgent` | 任意 | string | — | コマンドラインで `--agent` が指定されていない場合にデフォルトで使用するプロバイダーエントリーの名前。 |
| `textFill.projectContext` | 任意 | string | — | プロジェクトの自由記述説明。`{{text}}` プロンプトの先頭に付加され、ソースコードから取得できない文脈を補完する。 |
| `textFill.preamblePatterns` | 任意 | array | — | `{ pattern, flags }` オブジェクトのリスト。一致するプレフィックスは AI 生成テキストがドキュメントに書き込まれる前に除去される。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**AI プロバイダー（agent）**

`providers` に 1 つ以上の AI CLI ツールを登録し、`defaultAgent` でデフォルトを選択できます。`args` 内の `{{PROMPT}}` プレースホルダーは実行時に生成プロンプトに置換されます。

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["-p", "{{PROMPT}}"],
      "timeoutMs": 120000
    }
  }
}
```

**ドキュメントスタイル**

`documentStyle` ブロックで、すべての AI 生成テキストセクションに適用する文体と目的を制御します。プロジェクト固有の文章規則には `customInstruction` を使用できます。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "エンドユーザーは常に「オペレーター」と呼称すること。"
  }
}
```

**出力言語**

複数の出力言語を設定し、非デフォルト言語の生成方法を選択します。`"generate"` モードは言語ごとに AI を独立して呼び出し、`"translate"` はデフォルト出力を後処理します。

```json
{
  "output": {
    "languages": ["en", "ja"],
    "default": "en",
    "mode": "translate"
  }
}
```

**章の順序**

章ファイル名（`.md` なし）を任意の順序でリストすることで、プリセットのデフォルト章順序を上書きできます。

```json
{
  "chapters": ["overview", "configuration", "cli_commands", "architecture", "data_model"]
}
```

**スキャンパターン**

glob ベースの `include`・`exclude` リストを使用して、`sdd-forge scan` が解析するソースファイルを絞り込んだり拡張したりできます。

```json
{
  "scan": {
    "include": ["src/**/*.js", "src/**/*.ts"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**並列処理数とタイムアウト**

`limits` でファイルの並列処理数と AI 呼び出しのタイムアウトを調整し、実行環境のリソースに合わせることができます。

```json
{
  "limits": {
    "concurrency": 3,
    "agentTimeout": 90
  }
}
```

**SDD フローのマージ戦略**

各 SDD フローサイクルの終了時にフィーチャーブランチをベースブランチにマージする方法を選択できます。

```json
{
  "flow": {
    "merge": "squash"
  }
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

sdd-forge は実行時に 2 つの環境変数を参照します。どちらもマルチプロジェクトモードでは トップレベルルーター（`src/sdd-forge.js`）によって自動的に設定されますが、`projects.json` エントリーなしで特定のプロジェクトを対象にする場合は手動で設定することも可能です。

| 変数 | 設定元 | 目的 |
|---|---|---|
| `SDD_SOURCE_ROOT` | `sdd-forge.js`（マルチプロジェクトモード） | 対象プロジェクトのソースコードルートの絶対パス。設定されている場合、`src/lib/cli.js` の `sourceRoot()` は git リポジトリルートや `process.cwd()` へのフォールバックを行わず、この値を直接返す。 |
| `SDD_WORK_ROOT` | `sdd-forge.js`（マルチプロジェクトモード） | 対象プロジェクトの作業出力ルート（`.sdd-forge/`・`docs/`・`specs/` が配置される場所）の絶対パス。設定されている場合、`src/lib/cli.js` の `repoRoot()` は git から導出されたルートを上書きしてこの値を返す。`projects.json` の対応エントリーの `workRoot` フィールドから取得され、`workRoot` が設定されていない場合はプロジェクトの `path` にフォールバックする。 |

どちらの変数も設定されていない場合、`repoRoot()` と `sourceRoot()` はどちらも `git rev-parse --show-toplevel` でリポジトリルートを解決し、git が利用できない場合は `process.cwd()` にフォールバックします。
<!-- {{/text}} -->
