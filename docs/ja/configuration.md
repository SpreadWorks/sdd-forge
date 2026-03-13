# 03. 設定とカスタマイズ

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

本章では、sdd-forge が動作をプロジェクトに合わせて調整するために読み込む設定ファイルを解説します。主要な `.sdd-forge/config.json`（出力言語・プロジェクト種別・AI プロバイダー・スキャン設定を管理）と、マルチプロジェクト登録用の `projects.json` について説明します。また、ドキュメントスタイル・並行処理数・章の順序・SDD フロー動作といったカスタマイズポイントについても解説します。
<!-- {{/text}} -->

## Content

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プライマリ設定ファイル。出力言語・プロジェクト種別・AI プロバイダー・スキャンパターン・ドキュメントスタイル・フロー設定を定義する。全コマンドの起動時に読み込まれ、バリデーションが実行される。 |
| `projects.json` | `.sdd-forge/projects.json` | マルチプロジェクトレジストリ。名前付きプロジェクトエントリをソースルートおよびワークルートパスにマッピングし、デフォルトプロジェクトを記録する。`setup`、`default`、およびトップレベルルーターが参照する。 |
| `preset.json` | `src/presets/{key}/preset.json` | sdd-forge に同梱されたプリセットマニフェスト。各対応プロジェクト種別のラベル・アーキテクチャ・エイリアス・デフォルトスキャンパターン・章の順序を定義する。ユーザーが直接編集するものではない。 |
| `package.json` | `{repoRoot}/package.json` | `name`・`version`・`description` などのパッケージメタデータを抽出し、生成ドキュメントに使用するために読み込まれる。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

以下の表は `.sdd-forge/config.json` で認識される全フィールドを説明します。バリデーションは `src/lib/types.js` の `validateConfig()` によって実行されます。**必須**と記載されたフィールドが欠落または無効な場合、コマンドは中断されます。

| フィールド | 必須/任意 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output` | 必須 | object | — | 出力言語設定ブロック。null でないオブジェクトである必要がある。 |
| `output.languages` | 必須 | string[] | — | 生成ドキュメントの言語コードの配列（例: `["ja"]`、`["en", "ja"]`）。空でないこと。 |
| `output.default` | 必須 | string | — | 主要な出力言語。`output.languages` に列挙されたいずれかの値でなければならない。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | `"translate"` | デフォルト以外の言語を生成する方法。`"translate"` はデフォルト出力を後処理する。`"generate"` は言語ごとに AI を独立して呼び出す。 |
| `lang` | 必須 | string | — | CLI・AGENTS.md・スキルファイル・spec ドキュメントの操作言語（例: `"ja"`、`"en"`）。 |
| `type` | 必須 | string | — | プロジェクト種別の識別子（例: `"webapp/cakephp2"`、`"cli"`、`"webapp/laravel"`）。`"cakephp2"` などの短縮エイリアスは `TYPE_ALIASES` を通じて正規パスに解決される。 |
| `limits.agentTimeout` | 任意 | number | — | AI エージェント呼び出しのタイムアウト（秒）。プロバイダーのデフォルト値を上書きする。 |
| `limits.concurrency` | 任意 | number | `5` | `scan` および `text` 実行時に並行処理するファイルの最大数。`resolveConcurrency()` によって解決される。 |
| `documentStyle.purpose` | 任意 | string | — | 想定読者とドキュメントの目的。`"developer-guide"`・`"user-guide"`・`"api-reference"` または任意の自由形式文字列を指定できる。`documentStyle` が存在する場合は必須。 |
| `documentStyle.tone` | 任意 | `"polite"` \| `"formal"` \| `"casual"` | — | AI 生成テキスト全体に適用される文体。`documentStyle` が存在する場合は必須。 |
| `documentStyle.customInstruction` | 任意 | string | — | このプロジェクトのすべての AI プロンプトに追加される自由形式の指示。 |
| `chapters` | 任意 | string[] | — | 章ファイル名の順序リスト（拡張子 `.md` は除く）。このプロジェクトにおけるプリセットのデフォルト章順を上書きする。 |
| `agentWorkDir` | 任意 | string | — | AI エージェントプロセスに渡す作業ディレクトリ。省略時はリポジトリルートがデフォルトとなる。 |
| `scan.include` | `scan` 設定時は必須 | string[] | — | ソーススキャン時に含めるファイルの glob パターン。空でない配列でなければならない。 |
| `scan.exclude` | 任意 | string[] | — | スキャンから除外するファイルの glob パターン。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDD フローでフィーチャーブランチをベースブランチにマージする際の戦略。 |
| `providers` | 任意 | object | — | AI エージェントプロバイダーの名前付き定義。キーはプロバイダー名で、各エントリには `command` と `args` が必要。 |
| `providers.{name}.command` | プロバイダーごとに必須 | string | — | この AI プロバイダーで呼び出す実行ファイル（例: `"claude"`）。 |
| `providers.{name}.args` | プロバイダーごとに必須 | string[] | — | コマンドに渡す引数。生成されたプロンプトテキストのプレースホルダーとして `{{PROMPT}}` を使用する。 |
| `providers.{name}.timeoutMs` | 任意 | number | — | プロバイダーごとのタイムアウト（ミリ秒）。 |
| `providers.{name}.systemPromptFlag` | 任意 | string | — | システムプロンプトを渡すための CLI フラグ（例: `"--system-prompt"`）。 |
| `defaultAgent` | 任意 | string | — | コマンドラインで `--agent` が指定されない場合にデフォルトで使用するプロバイダーエントリ名。 |
| `textFill.projectContext` | 任意 | string | — | プロジェクトの自由形式説明。ソースコードだけでは導出できないコンテキストを補うために `{{text}}` プロンプトの先頭に追加される。 |
| `textFill.preamblePatterns` | 任意 | array | — | `{ pattern, flags }` オブジェクトのリスト。一致するプレフィックスは AI 生成テキストをドキュメントに書き込む前に除去される。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**AI プロバイダー（agent）**

`providers` に 1 つ以上の AI CLI ツールを登録し、`defaultAgent` でデフォルトを指定できます。`args` 内の `{{PROMPT}}` プレースホルダーは実行時に生成されたプロンプトに置き換えられます。

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

`documentStyle` ブロックで、AI 生成テキスト全セクションに適用するトーンと目的を制御します。プロジェクト固有の執筆規約には `customInstruction` を追加できます。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "Always refer to the end user as 'operator'."
  }
}
```

**出力言語**

複数の出力言語を設定し、デフォルト以外の言語の生成方法を選択できます。`"generate"` モードは言語ごとに AI を独立して呼び出し、`"translate"` はデフォルト出力を後処理します。

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

章ファイル名（拡張子 `.md` なし）を任意の順序で列挙することで、プリセットのデフォルト章順を上書きできます。

```json
{
  "chapters": ["overview", "configuration", "cli_commands", "architecture", "data_model"]
}
```

**スキャンパターン**

glob ベースの `include` および `exclude` リストを使用して、`sdd-forge scan` が解析するソースファイルを絞り込んだり拡張したりできます。

```json
{
  "scan": {
    "include": ["src/**/*.js", "src/**/*.ts"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**並行処理数とタイムアウト**

`limits` でファイルの並行処理数と AI 呼び出しタイムアウトを調整し、環境リソースに合わせた設定が可能です。

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

sdd-forge は実行時に 2 つの環境変数を参照します。どちらもマルチプロジェクトモードで動作する際にトップレベルルーター（`src/sdd-forge.js`）が自動的に設定しますが、`projects.json` エントリなしで特定のプロジェクトを対象にする場合は手動で設定することもできます。

| 変数 | 設定元 | 目的 |
|---|---|---|
| `SDD_SOURCE_ROOT` | `sdd-forge.js`（マルチプロジェクトモード） | 対象プロジェクトのソースコードルートの絶対パス。設定されている場合、`src/lib/cli.js` の `sourceRoot()` は git リポジトリルートや `process.cwd()` へのフォールバックを行わず、この値を直接返す。 |
| `SDD_WORK_ROOT` | `sdd-forge.js`（マルチプロジェクトモード） | 対象プロジェクトのワーク出力ルート（`.sdd-forge/`・`docs/`・`specs/` が配置される場所）の絶対パス。設定されている場合、`src/lib/cli.js` の `repoRoot()` は git 由来のルートを上書きしてこの値を返す。`projects.json` の該当エントリの `workRoot` フィールドから導出され、`workRoot` が未設定の場合はプロジェクトの `path` にフォールバックする。 |

どちらの変数も設定されていない場合、`repoRoot()` と `sourceRoot()` はいずれも `git rev-parse --show-toplevel` を通じてリポジトリルートを解決し、git が利用できない場合は `process.cwd()` にフォールバックします。
<!-- {{/text}} -->
