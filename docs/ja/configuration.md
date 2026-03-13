# 03. 設定とカスタマイズ

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

この章では、sdd-forge がプロジェクトに合わせた動作を行うために読み込む設定ファイルについて説明します。主要な `.sdd-forge/config.json`（出力言語・プロジェクトタイプ・AIプロバイダー・スキャン設定を管理）と、複数プロジェクト登録用の `projects.json` が含まれます。また、ドキュメントスタイル・並行処理数・章の順序・SDD フローの動作に関するカスタマイズポイントについても解説します。
<!-- {{/text}} -->

## Content

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | 主要設定ファイル。出力言語・プロジェクトタイプ・AIプロバイダー・スキャンパターン・ドキュメントスタイル・フロー設定を定義する。全コマンドの起動時に読み込まれ、バリデーションが実行される。 |
| `projects.json` | `.sdd-forge/projects.json` | 複数プロジェクト管理レジストリ。プロジェクト名とソースルート・作業ルートのパスをマッピングし、デフォルトプロジェクトを記録する。`setup`・`default`・トップレベルルーターが参照する。 |
| `preset.json` | `src/presets/{key}/preset.json` | sdd-forge に同梱されるプリセットマニフェスト。サポートされる各プロジェクトタイプのラベル・アーキテクチャ・エイリアス・デフォルトスキャンパターン・章の順序を定義する。ユーザーが直接編集するものではない。 |
| `package.json` | `{repoRoot}/package.json` | パッケージメタデータ（`name`・`version`・`description` 等）を抽出し、生成ドキュメントで使用するために読み込まれる。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

以下の表は `.sdd-forge/config.json` で認識される全フィールドを示します。バリデーションは `src/lib/types.js` の `validateConfig()` によって実行されます。**必須** とマークされたフィールドが存在しないか無効な場合、コマンドは中断されます。

| フィールド | 必須/任意 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output` | 必須 | object | — | 出力言語の設定ブロック。非 null のオブジェクトである必要がある。 |
| `output.languages` | 必須 | string[] | — | 生成ドキュメントの言語コードの配列（例: `["ja"]`、`["en", "ja"]`）。空でないこと。 |
| `output.default` | 必須 | string | — | 主要出力言語。`output.languages` に列挙されたいずれかの値である必要がある。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | `"translate"` | 非デフォルト言語の生成方法。`"translate"` はデフォルト出力を後処理する。`"generate"` は各言語に対して AI を独立して呼び出す。 |
| `lang` | 必須 | string | — | CLI・AGENTS.md・スキルファイル・spec ドキュメントの動作言語（例: `"ja"`、`"en"`）。 |
| `type` | 必須 | string | — | プロジェクトタイプ識別子（例: `"webapp/cakephp2"`、`"cli"`、`"webapp/laravel"`）。`"cakephp2"` などの短縮エイリアスは `TYPE_ALIASES` で正規パスに解決される。 |
| `limits.agentTimeout` | 任意 | number | — | AI エージェント呼び出しのタイムアウト秒数。プロバイダーのデフォルト値を上書きする。 |
| `limits.concurrency` | 任意 | number | `5` | `scan` および `text` 実行中に並行処理するファイルの最大数。`resolveConcurrency()` で解決される。 |
| `documentStyle.purpose` | 任意 | string | — | 対象読者とドキュメントの目的。`"developer-guide"`・`"user-guide"`・`"api-reference"` または任意の文字列を指定できる。`documentStyle` が存在する場合は必須。 |
| `documentStyle.tone` | 任意 | `"polite"` \| `"formal"` \| `"casual"` | — | AI 生成テキスト全体に適用する文体。`documentStyle` が存在する場合は必須。 |
| `documentStyle.customInstruction` | 任意 | string | — | このプロジェクトの全 AI プロンプトに追加される自由形式の補足指示。 |
| `chapters` | 任意 | string[] | — | 章ファイル名（`.md` 拡張子なし）の順序付きリスト。プリセットのデフォルト章順をこのプロジェクト用に上書きする。 |
| `agentWorkDir` | 任意 | string | — | AI エージェントプロセスに渡す作業ディレクトリ。省略時はリポジトリルートがデフォルトになる。 |
| `scan.include` | `scan` 設定時は必須 | string[] | — | ソーススキャン時に対象とするファイルの glob パターン。空でない配列である必要がある。 |
| `scan.exclude` | 任意 | string[] | — | スキャンから除外するファイルの glob パターン。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDD フローでフィーチャーブランチをベースブランチにマージする際のマージ戦略。 |
| `providers` | 任意 | object | — | AI エージェントプロバイダーの定義。キーはプロバイダー名。各エントリには `command` と `args` が必要。 |
| `providers.{name}.command` | プロバイダーごとに必須 | string | — | この AI プロバイダーを呼び出す実行ファイル（例: `"claude"`）。 |
| `providers.{name}.args` | プロバイダーごとに必須 | string[] | — | コマンドに渡す引数。生成されたプロンプトテキストのプレースホルダーとして `{{PROMPT}}` を使用する。 |
| `providers.{name}.timeoutMs` | 任意 | number | — | プロバイダーごとのタイムアウト（ミリ秒）。 |
| `providers.{name}.systemPromptFlag` | 任意 | string | — | システムプロンプトを渡す際に使用する CLI フラグ（例: `"--system-prompt"`）。 |
| `defaultAgent` | 任意 | string | — | コマンドラインで `--agent` が指定されない場合にデフォルトで使用するプロバイダー名。 |
| `textFill.projectContext` | 任意 | string | — | プロジェクトの自由記述説明。ソースコードだけでは得られないコンテキストを補うため `{{text}}` プロンプトの先頭に付加される。 |
| `textFill.preamblePatterns` | 任意 | array | — | `{ pattern, flags }` オブジェクトのリスト。一致するプレフィックスは AI 生成テキストをドキュメントに書き込む前に除去される。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**AI プロバイダー（エージェント）**

`providers` に1つ以上の AI CLI ツールを登録し、`defaultAgent` でデフォルトを指定できます。`args` 内の `{{PROMPT}}` プレースホルダーは実行時に生成されたプロンプトに置換されます。

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

`documentStyle` ブロックで、AI 生成テキスト全体に適用する文体と目的を制御します。プロジェクト固有の表記規則には `customInstruction` を追加できます。

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

複数の出力言語を設定し、非デフォルト言語の生成方法を選択できます。`"generate"` モードは言語ごとに AI を独立して呼び出し、`"translate"` はデフォルト出力を後処理します。

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

章ファイル名（`.md` 拡張子なし）を任意の順序で列挙することで、プリセットのデフォルト章順を上書きできます。

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

**並行処理数とタイムアウト**

`limits` で並行ファイル処理数と AI 呼び出しタイムアウトを調整し、環境のリソースに合わせて最適化できます。

```json
{
  "limits": {
    "concurrency": 3,
    "agentTimeout": 90
  }
}
```

**SDD フローのマージ戦略**

各 SDD フローサイクル終了時にフィーチャーブランチをベースブランチへマージする方法を選択できます。

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

sdd-forge は実行時に2つの環境変数を参照します。どちらも複数プロジェクトモードで動作する際にトップレベルルーター（`src/sdd-forge.js`）によって自動的に設定されますが、`projects.json` エントリなしで特定のプロジェクトを指定するために手動で設定することもできます。

| 変数 | 設定元 | 目的 |
|---|---|---|
| `SDD_SOURCE_ROOT` | `sdd-forge.js`（複数プロジェクトモード） | 対象プロジェクトのソースコードルートへの絶対パス。設定されている場合、`src/lib/cli.js` の `sourceRoot()` は git リポジトリルートや `process.cwd()` へのフォールバックの代わりにこの値を直接返す。 |
| `SDD_WORK_ROOT` | `sdd-forge.js`（複数プロジェクトモード） | 対象プロジェクトの作業出力ルート（`.sdd-forge/`・`docs/`・`specs/` が置かれる場所）への絶対パス。設定されている場合、`src/lib/cli.js` の `repoRoot()` は git から導出されたルートを上書きしてこの値を返す。`projects.json` の該当エントリの `workRoot` フィールドから取得され、`workRoot` が未設定の場合はプロジェクトの `path` にフォールバックする。 |

どちらの変数も設定されていない場合、`repoRoot()` と `sourceRoot()` はともに `git rev-parse --show-toplevel` でリポジトリルートを解決し、git が利用できない場合は `process.cwd()` にフォールバックします。
<!-- {{/text}} -->
