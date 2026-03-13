# 03. 設定とカスタマイズ

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

この章では、sdd-forge がプロジェクトに合わせて動作をカスタマイズするために読み込む設定ファイルについて説明します。出力言語・プロジェクト種別・AIプロバイダー・スキャン設定を管理する主設定ファイル `.sdd-forge/config.json`、および複数プロジェクト登録を管理する `projects.json` を取り上げます。また、ドキュメントスタイル・並行処理数・章の順序・SDDフロー動作に関するカスタマイズポイントについても解説します。
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | 主設定ファイル。出力言語・プロジェクト種別・AIプロバイダー・スキャンパターン・ドキュメントスタイル・フロー設定を定義する。すべてのコマンドが起動時に読み込み・バリデーションを実施する。 |
| `projects.json` | `.sdd-forge/projects.json` | 複数プロジェクトのレジストリ。名前付きプロジェクトエントリをソースルートおよびワークルートのパスにマッピングし、デフォルトプロジェクトを記録する。`setup`・`default`・トップレベルルーターが読み込む。 |
| `preset.json` | `src/presets/{key}/preset.json` | sdd-forge に同梱されたプリセットマニフェスト。サポートされる各プロジェクト種別のラベル・アーキテクチャ・エイリアス・デフォルトスキャンパターン・章の順序を定義する。ユーザーが直接編集するものではない。 |
| `package.json` | `{repoRoot}/package.json` | パッケージメタデータ（`name`・`version`・`description` など）を抽出し、生成ドキュメントに使用するために読み込む。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

以下の表は `.sdd-forge/config.json` で認識されるすべてのフィールドを説明したものです。バリデーションは `src/lib/types.js` の `validateConfig()` で実施されます。**必須**と記載されたフィールドが存在しないか無効な場合、コマンドは中断されます。

| フィールド | 必須/任意 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output` | 必須 | object | — | 出力言語設定ブロック。null でないオブジェクトである必要がある。 |
| `output.languages` | 必須 | string[] | — | 生成ドキュメントの言語コードの配列（例: `["ja"]`、`["en", "ja"]`）。空配列は不可。 |
| `output.default` | 必須 | string | — | 主出力言語。`output.languages` に列挙された値のいずれかである必要がある。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | `"translate"` | 非デフォルト言語の生成方法。`"translate"` はデフォルト出力を後処理し、`"generate"` は言語ごとに独立してAIを呼び出す。 |
| `lang` | 必須 | string | — | CLI・AGENTS.md・スキルファイル・specドキュメントの動作言語（例: `"ja"`、`"en"`）。 |
| `type` | 必須 | string | — | プロジェクト種別識別子（例: `"webapp/cakephp2"`、`"cli"`、`"webapp/laravel"`）。`"cakephp2"` などの短縮エイリアスは `TYPE_ALIASES` を通じて正規パスに解決される。 |
| `limits.agentTimeout` | 任意 | number | — | AIエージェント呼び出しのタイムアウト（秒）。プロバイダーのデフォルト値を上書きする。 |
| `limits.concurrency` | 任意 | number | `5` | `scan` および `text` 実行時に並行処理するファイルの最大数。`resolveConcurrency()` で解決される。 |
| `documentStyle.purpose` | 任意 | string | — | 想定読者とドキュメントの目的。受け入れ値は `"developer-guide"`・`"user-guide"`・`"api-reference"`、または任意の自由記述文字列。`documentStyle` が存在する場合は必須。 |
| `documentStyle.tone` | 任意 | `"polite"` \| `"formal"` \| `"casual"` | — | AI生成テキスト全体に適用する文体。`documentStyle` が存在する場合は必須。 |
| `documentStyle.customInstruction` | 任意 | string | — | このプロジェクト向けにすべてのAIプロンプトに追記される自由記述の追加指示。 |
| `chapters` | 任意 | string[] | — | 章ファイル名（`.md` 拡張子なし）の順序付きリスト。このプロジェクトのプリセットのデフォルト章順序を上書きする。 |
| `agentWorkDir` | 任意 | string | — | AIエージェントプロセスに渡す作業ディレクトリ。省略時はリポジトリルートがデフォルトになる。 |
| `scan.include` | `scan` が設定されている場合は必須 | string[] | — | ソーススキャン時に含めるファイルのglobパターン。空配列は不可。 |
| `scan.exclude` | 任意 | string[] | — | スキャンから除外するファイルのglobパターン。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDDフローがフィーチャーブランチをベースブランチにマージする際のマージ戦略。 |
| `providers` | 任意 | object | — | 名前付きAIエージェントプロバイダーの定義。キーがプロバイダー名で、各エントリには `command` と `args` が必要。 |
| `providers.{name}.command` | プロバイダーごとに必須 | string | — | このAIプロバイダーの実行ファイル（例: `"claude"`）。 |
| `providers.{name}.args` | プロバイダーごとに必須 | string[] | — | コマンドに渡す引数。生成されたプロンプトテキストのプレースホルダーとして `{{PROMPT}}` を使用する。 |
| `providers.{name}.timeoutMs` | 任意 | number | — | プロバイダーごとのタイムアウト（ミリ秒）。 |
| `providers.{name}.systemPromptFlag` | 任意 | string | — | システムプロンプトを渡すCLIフラグ（例: `"--system-prompt"`）。 |
| `defaultAgent` | 任意 | string | — | コマンドラインで `--agent` を指定しない場合にデフォルトで使用するプロバイダーエントリの名前。 |
| `textFill.projectContext` | 任意 | string | — | `{{text}}` プロンプトの先頭に付加されるプロジェクトの自由記述説明。ソースコードだけでは取得できない文脈を補うために使用する。 |
| `textFill.preamblePatterns` | 任意 | array | — | `{ pattern, flags }` オブジェクトのリスト。マッチするプレフィックスは、ドキュメントに書き込む前にAI生成テキストから除去される。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**AIプロバイダー（agent）**

`providers` に1つ以上のAI CLIツールを登録し、`defaultAgent` でデフォルトを選択できます。`args` 内の `{{PROMPT}}` プレースホルダーは実行時に生成されたプロンプトに置換されます。

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

`documentStyle` ブロックは、すべてのAI生成テキストセクションに適用する文体と目的を制御します。プロジェクト固有の記述規則には `customInstruction` を追加できます。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "エンドユーザーは常に「オペレーター」と呼ぶこと。"
  }
}
```

**出力言語**

複数の出力言語を設定し、非デフォルト言語の生成方法を選択できます。`"generate"` モードは言語ごとに独立してAIを呼び出し、`"translate"` はデフォルト出力を後処理します。

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

章ファイル名（`.md` なし）を任意の順序でリストアップすることで、プリセットのデフォルト章順序を上書きできます。

```json
{
  "chapters": ["overview", "configuration", "cli_commands", "architecture", "data_model"]
}
```

**スキャンパターン**

globベースの `include` および `exclude` リストを使用して、`sdd-forge scan` が解析するソースファイルを絞り込んだり拡張したりできます。

```json
{
  "scan": {
    "include": ["src/**/*.js", "src/**/*.ts"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**並行処理数とタイムアウト**

`limits` 以下で並行ファイル処理数やAI呼び出しのタイムアウトを調整し、環境のリソースに合わせた設定が可能です。

```json
{
  "limits": {
    "concurrency": 3,
    "agentTimeout": 90
  }
}
```

**SDDフローのマージ戦略**

各SDDフローサイクルの終了時に、フィーチャーブランチをベースブランチにマージする方法を選択できます。

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

sdd-forge は実行時に2つの環境変数を読み込みます。どちらも複数プロジェクトモードで動作する際にトップレベルルーター（`src/sdd-forge.js`）によって自動的に設定されますが、`projects.json` エントリなしで特定のプロジェクトを対象にする場合は手動で設定することも可能です。

| 変数 | 設定者 | 目的 |
|---|---|---|
| `SDD_SOURCE_ROOT` | `sdd-forge.js`（複数プロジェクトモード） | 対象プロジェクトのソースコードルートへの絶対パス。設定されている場合、`src/lib/cli.js` の `sourceRoot()` はgitリポジトリルートや `process.cwd()` へのフォールバックを行わず、この値を直接返す。 |
| `SDD_WORK_ROOT` | `sdd-forge.js`（複数プロジェクトモード） | 対象プロジェクトのワーク出力ルート（`.sdd-forge/`・`docs/`・`specs/` が存在する場所）への絶対パス。設定されている場合、`src/lib/cli.js` の `repoRoot()` はgit由来のルートを上書きしてこの値を返す。対応する `projects.json` エントリの `workRoot` フィールドから取得し、`workRoot` が設定されていない場合はプロジェクトの `path` にフォールバックする。 |

どちらの変数も設定されていない場合、`repoRoot()` と `sourceRoot()` はともに `git rev-parse --show-toplevel` でリポジトリルートを解決し、gitが利用できない場合は `process.cwd()` にフォールバックします。
<!-- {{/text}} -->
