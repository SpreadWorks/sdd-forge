# 03. 設定とカスタマイズ

## 説明

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

本章では、出力言語や AI プロバイダー設定からプロジェクトタイプ・ドキュメントスタイルまで、`sdd-forge` の動作を制御する設定ファイルについて説明します。中央集権的な JSON 設定ファイルと少数の環境変数を通じて、プロジェクトのニーズに合わせてツールをカスタマイズできます。

## 目次

### 設定ファイル

<!-- {{text: List all configuration files loaded by this tool in a table, including the location and role of each.}} -->

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクトのメイン設定。出力言語、プロジェクトタイプ、AI プロバイダー、ドキュメントスタイルを定義する。ロード時にバリデーションが実行される。 |
| `context.json` | `.sdd-forge/context.json` | AI 生成を補完するために使用される、解決済みのプロジェクトコンテキスト文字列を保存する。`sdd-forge` が自動的に書き込むが、手動で編集することも可能。 |
| `projects.json` | `.sdd-forge/projects.json` | `sdd-forge` を別の作業ディレクトリから実行する場合に、1 つ以上のソースプロジェクトを登録する。`sdd-forge setup` によって生成される。 |
| `current-spec` | `.sdd-forge/current-spec` | アクティブな SDD フローの状態（現在の spec パス、ブランチ名、worktree 情報）を追跡する。フロー開始時に作成され、フロー終了時に削除される。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` によって生成されるソースコード解析結果のフル版。`summary.json` が存在しない場合のフォールバックとして使用される。 |
| `summary.json` | `.sdd-forge/output/summary.json` | `analysis.json` の軽量版。AI エージェントにデータを渡す際に優先して使用される。`scan` の実行中に自動生成される。 |

### 設定リファレンス

<!-- {{text: Describe all fields in the configuration file in a table. Include field name, type, default value, and description.}} -->

以下のフィールドはすべて `.sdd-forge/config.json` に属する。**必須**とマークされたフィールドは必ず存在しなければならない。省略可能なフィールドは記載のデフォルト値にフォールバックする。

| フィールド | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `output.languages` | `string[]` | ✅ | — | 出力言語コードのリスト（例: `["ja"]`, `["en", "ja"]`）。 |
| `output.default` | `string` | ✅ | — | デフォルト出力言語。`output.languages` のいずれかの値でなければならない。 |
| `output.mode` | `"translate"` \| `"generate"` | — | `"translate"` | デフォルト以外の言語ドキュメントの生成方法。`translate` はデフォルト出力を再利用し、`generate` は AI 生成を独立して実行する。 |
| `lang` | `string` | ✅ | — | CLI メッセージ、`AGENTS.md`、スキル、spec ファイルに使用される言語。 |
| `type` | `string` | ✅ | — | プロジェクトタイプ識別子（例: `"webapp/cakephp2"`, `"cli/node-cli"`）。適用するプリセットとスキャンルールを決定する。 |
| `uiLang` | `"en"` \| `"ja"` | — | `"en"` | `sdd-forge` UI（プロンプトおよびステータスメッセージ）の言語。 |
| `documentStyle.purpose` | `string` | — | — | 生成されたドキュメントの意図する用途（例: `"developer-guide"`）。AI へのコンテキストとして渡される。 |
| `documentStyle.tone` | `"polite"` \| `"formal"` \| `"casual"` | — | — | AI 生成テキストに適用される文体。 |
| `documentStyle.customInstruction` | `string` | — | — | すべての AI テキスト生成プロンプトに追記される自由形式の追加指示。 |
| `textFill.projectContext` | `string` | — | — | `context.json` が存在しない場合に AI 生成を補完するために使用される、プロジェクトの簡単な概要。 |
| `textFill.preamblePatterns` | `object[]` | — | — | AI 出力から不要なプレフィックスを除去するために使用される正規表現パターン（`pattern`, `flags`）のリスト。 |
| `defaultAgent` | `string` | — | — | `--agent` フラグが指定されない場合に使用する AI プロバイダー名。`providers` のキーと一致しなければならない。 |
| `providers` | `object` | — | — | 名前付き AI エージェント定義のマップ。各エントリには `command`、`args`、省略可能な `timeoutMs`、省略可能な `systemPromptFlag` を指定する。 |
| `flow.merge` | `"squash"` \| `"ff-only"` \| `"merge"` | — | `"squash"` | SDD フロー終了時に使用される Git マージ戦略。 |
| `limits.concurrency` | `number` | — | `5` | `text` および `forge` コマンドの実行中に並列処理するファイルの最大数。 |
| `limits.designTimeoutMs` | `number` | — | — | AI エージェント呼び出しのタイムアウト（ミリ秒）。コマンドごとの組み込みデフォルト値を上書きする。 |

### カスタマイズポイント

<!-- {{text: Explain the items users can customize (providers, templates, commands, etc.). Include customization examples.}} -->

**AI プロバイダー**

`providers` キーにコマンドライン AI エージェントを登録し、実行ごとに `--agent <name>` で選択できる。`args` 内の `{{PROMPT}}` プレースホルダーはプロンプトを注入する位置を示す。省略した場合、プロンプトは自動的に末尾に追加される。

```json
"providers": {
  "claude": {
    "command": "claude",
    "args": ["--model", "claude-opus-4-5", "-p", "{{PROMPT}}"],
    "timeoutMs": 180000,
    "systemPromptFlag": "--system-prompt"
  }
},
"defaultAgent": "claude"
```

**ドキュメントスタイル**

個々のテンプレートに触れることなく、AI 生成ドキュメント全体のトーンと目的を調整できる。

```json
"documentStyle": {
  "purpose": "onboarding-guide",
  "tone": "casual",
  "customInstruction": "Always include a concrete code example for each concept."
}
```

**プロジェクトタイプとプリセット**

`type` を設定することで対応するプリセットが選択され、スキャン対象のディレクトリ、実行するアナライザー、使用するドキュメントテンプレートが決定される。組み込みオプションには `webapp/cakephp2`、`webapp/laravel`、`webapp/symfony`、`cli/node-cli` がある。これは `sdd-forge` を異なる技術スタックに対応させるための主要なスイッチである。

**出力言語**

複数言語でドキュメントを生成するには、`output.languages` にすべての対象言語コードを列挙し、追加言語を AI で生成する（`generate`）かデフォルトから翻訳する（`translate`）かを選択する。

```json
"output": {
  "languages": ["ja", "en"],
  "default": "ja",
  "mode": "translate"
}
```

**プレアンブル除去**

AI エージェントが出力の先頭に不要なフレーズを常に付加する場合、それらを自動的に除去するパターンを定義できる。

```json
"textFill": {
  "preamblePatterns": [
    { "pattern": "^(Sure|Certainly|Of course)[,!]?\\s*", "flags": "i" }
  ]
}
```

### 環境変数

<!-- {{text: List the environment variables referenced by the tool and their purposes in a table.}} -->

| 変数 | 説明 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象のソースプロジェクトへの絶対パス。設定されている場合、`projects.json` または現在の作業ディレクトリから解決されたパスを上書きする。 |
| `SDD_WORK_ROOT` | 作業リポジトリ（`.sdd-forge/` と `docs/` が存在する場所）への絶対パス。設定されている場合、`git rev-parse` によって解決されたパスを上書きする。 |
| `CLAUDECODE` | 環境に存在する場合、`sdd-forge` は AI エージェントを起動する前にこの変数を削除し、Claude CLI がインタラクティブな入力待ちでハングするのを防ぐ。 |
