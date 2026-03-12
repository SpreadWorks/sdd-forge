# 03. 設定とカスタマイズ

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

本章では、sdd-forge がプロジェクトに合わせた動作を行うために読み込む設定ファイルについて説明します。主となる `.sdd-forge/config.json`（出力言語・プロジェクトタイプ・AI プロバイダー・スキャン設定を定義）および複数プロジェクト登録用の `projects.json` を取り上げます。また、ドキュメントスタイル・並行処理数・章の順序・SDD フローの動作に関するカスタマイズポイントについても説明します。
<!-- {{/text}} -->

## Content

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | 主設定ファイル。出力言語・プロジェクトタイプ・AI プロバイダー・スキャンパターン・ドキュメントスタイル・フロー設定を定義する。すべてのコマンドが起動時に読み込み、バリデーションを行う。 |
| `projects.json` | `.sdd-forge/projects.json` | 複数プロジェクト登録リスト。プロジェクト名をキーに、ソースルートとワークルートのパス、およびデフォルトプロジェクトを記録する。`setup`・`default`・トップレベルルーターが参照する。 |
| `preset.json` | `src/presets/{key}/preset.json` | sdd-forge に同梱されたプリセットマニフェスト。サポート対象プロジェクトタイプごとに、ラベル・アーキテクチャ・エイリアス・デフォルトスキャンパターン・章の順序を定義する。ユーザーが直接編集するものではない。 |
| `package.json` | `{repoRoot}/package.json` | パッケージメタデータ（`name`・`version`・`description` など）を抽出し、生成ドキュメントに利用する。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

以下の表は `.sdd-forge/config.json` で認識されるすべてのフィールドを示します。バリデーションは `src/lib/types.js` の `validateConfig()` で実施されます。**必須**と記載されたフィールドが存在しないか無効な場合、コマンドは中断されます。

| フィールド | 必須/任意 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output` | 必須 | object | — | 出力言語設定ブロック。null でないオブジェクトであること。 |
| `output.languages` | 必須 | string[] | — | 生成ドキュメントの言語コードを指定する空でない配列（例: `["ja"]`、`["en", "ja"]`）。 |
| `output.default` | 必須 | string | — | 主出力言語。`output.languages` に含まれる値のいずれかを指定する。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | `"translate"` | 非デフォルト言語の生成方法。`"translate"` はデフォルト出力を後処理し、`"generate"` は言語ごとに AI を独立して呼び出す。 |
| `lang` | 必須 | string | — | CLI・AGENTS.md・スキルファイル・spec ドキュメントの動作言語（例: `"ja"`、`"en"`）。 |
| `type` | 必須 | string | — | プロジェクトタイプ識別子（例: `"webapp/cakephp2"`、`"cli"`、`"webapp/laravel"`）。`"cakephp2"` などの短縮エイリアスは `TYPE_ALIASES` を介して正規パスに解決される。 |
| `limits.agentTimeout` | 任意 | number | — | AI エージェント呼び出しのタイムアウト（秒）。プロバイダーのデフォルト値を上書きする。 |
| `limits.concurrency` | 任意 | number | `5` | `scan` および `text` 実行時に並行処理するファイルの最大数。`resolveConcurrency()` で解決される。 |
| `documentStyle.purpose` | 任意 | string | — | 対象読者とドキュメントの目的。`"developer-guide"`・`"user-guide"`・`"api-reference"` または任意の文字列を指定できる。`documentStyle` を設定する場合は必須。 |
| `documentStyle.tone` | 任意 | `"polite"` \| `"formal"` \| `"casual"` | — | AI 生成テキスト全体に適用する文体。`documentStyle` を設定する場合は必須。 |
| `documentStyle.customInstruction` | 任意 | string | — | このプロジェクトのすべての AI プロンプトに追記される自由記述の補足指示。 |
| `chapters` | 任意 | string[] | — | 章ファイル名（`.md` 拡張子なし）の順序付きリスト。プリセットのデフォルト章順序をプロジェクト単位で上書きする。 |
| `agentWorkDir` | 任意 | string | — | AI エージェントプロセスに渡す作業ディレクトリ。省略時はリポジトリルートがデフォルトになる。 |
| `scan.include` | `scan` 設定時は必須 | string[] | — | ソーススキャン時に含めるファイルのグロブパターン。空でない配列であること。 |
| `scan.exclude` | 任意 | string[] | — | スキャンから除外するファイルのグロブパターン。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDD フローがフィーチャーブランチをベースブランチにマージする際のマージ戦略。 |
| `providers` | 任意 | object | — | AI エージェントプロバイダーの定義。キーはプロバイダー名で、各エントリーに `command` と `args` が必要。 |
| `providers.{name}.command` | プロバイダーごとに必須 | string | — | この AI プロバイダーを呼び出す実行ファイル（例: `"claude"`）。 |
| `providers.{name}.args` | プロバイダーごとに必須 | string[] | — | コマンドに渡す引数。生成されたプロンプトのプレースホルダーとして `{{PROMPT}}` を使用する。 |
| `providers.{name}.timeoutMs` | 任意 | number | — | プロバイダーごとのタイムアウト（ミリ秒）。 |
| `providers.{name}.systemPromptFlag` | 任意 | string | — | システムプロンプトを渡す CLI フラグ（例: `"--system-prompt"`）。 |
| `defaultAgent` | 任意 | string | — | コマンドラインで `--agent` を指定しない場合にデフォルトで使用するプロバイダー名。 |
| `textFill.projectContext` | 任意 | string | — | プロジェクトの自由記述説明。`{{text}}` プロンプトの先頭に追記され、ソースコードだけでは得られない文脈を補完する。 |
| `textFill.preamblePatterns` | 任意 | array | — | `{ pattern, flags }` オブジェクトのリスト。マッチしたプレフィックスは AI 生成テキストをドキュメントに書き込む前に除去される。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**AI プロバイダー（agent）**

`providers` に1つ以上の AI CLI ツールを登録し、`defaultAgent` でデフォルトを指定できます。`args` 内の `{{PROMPT}}` プレースホルダーは実行時に生成されたプロンプトで置換されます。

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

`documentStyle` ブロックで、すべての AI 生成テキストセクションに適用する文体と目的を制御します。プロジェクト固有の記述規則がある場合は `customInstruction` で追記できます。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "エンドユーザーは常に「オペレーター」と表記すること。"
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

章ファイル名（`.md` なし）を希望する順序でリストすることで、プリセットのデフォルト章順序を上書きできます。

```json
{
  "chapters": ["overview", "configuration", "cli_commands", "architecture", "data_model"]
}
```

**スキャンパターン**

グロブベースの `include`・`exclude` リストを使用して、`sdd-forge scan` が解析するソースファイルを絞り込んだり拡張したりできます。

```json
{
  "scan": {
    "include": ["src/**/*.js", "src/**/*.ts"],
    "exclude": ["src/**/*.test.js", "src/fixtures/**"]
  }
}
```

**並行処理数とタイムアウト**

環境のリソースに合わせて、`limits` でファイルの並行処理数と AI 呼び出しのタイムアウトを調整できます。

```json
{
  "limits": {
    "concurrency": 3,
    "agentTimeout": 90
  }
}
```

**SDD フローのマージ戦略**

各 SDD フローサイクルの終了時にフィーチャーブランチをベースブランチへマージする方法を選択できます。

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

sdd-forge は実行時に2つの環境変数を参照します。どちらも複数プロジェクトモードでは トップレベルルーター（`src/sdd-forge.js`）が自動的に設定します。`projects.json` エントリーなしで特定のプロジェクトをターゲットにする場合は手動で設定することもできます。

| 変数 | 設定元 | 目的 |
|---|---|---|
| `SDD_SOURCE_ROOT` | `sdd-forge.js`（複数プロジェクトモード） | 対象プロジェクトのソースコードルートへの絶対パス。設定されている場合、`src/lib/cli.js` の `sourceRoot()` は git リポジトリルートや `process.cwd()` へのフォールバックを行わず、この値を直接返す。 |
| `SDD_WORK_ROOT` | `sdd-forge.js`（複数プロジェクトモード） | 対象プロジェクトのワーク出力ルート（`.sdd-forge/`・`docs/`・`specs/` が配置される場所）への絶対パス。設定されている場合、`src/lib/cli.js` の `repoRoot()` は git で導出したルートの代わりにこの値を返す。`projects.json` エントリーの `workRoot` フィールドから導出され、`workRoot` が未設定の場合はプロジェクトの `path` にフォールバックする。 |

どちらの変数も設定されていない場合、`repoRoot()` と `sourceRoot()` の両方が `git rev-parse --show-toplevel` でリポジトリルートを解決し、git が利用できない場合は `process.cwd()` にフォールバックします。
<!-- {{/text}} -->
