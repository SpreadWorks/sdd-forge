# 03. 設定とカスタマイズ

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->

本章では、sdd-forge が読み込む設定ファイルと、プロジェクトの動作を調整するために利用可能なすべてのオプションについて説明する。設定可能な項目には、出力言語、ドキュメントスタイル、AI エージェントプロバイダー、並列処理数の上限、SDD フロー設定などが含まれる。
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクトのメイン設定。`loadConfig()` を通じてすべてのコマンド実行時に読み込まれ、バリデーションされる。ほとんどの sdd-forge コマンドを実行する前に必須。 |
| `projects.json` | `.sdd-forge/projects.json` | マルチプロジェクトレジストリ。プロジェクト名をソースパスおよびオプションのワークルートにマッピングする。`resolveProject()` によって読み込まれ、アクティブなプロジェクトを特定する。`sdd-forge setup` によって作成・更新される。 |
| `package.json` | `<repo-root>/package.json` | `loadPackageField()` を通じてパッケージメタデータ（プロジェクト名やバージョンなど）を読み込む。sdd-forge による変更はない。 |
| `preset.json` | `src/presets/<key>/preset.json` | sdd-forge にバンドルされたプリセットマニフェスト。起動時に自動探索され、`config.json` の `type` フィールドの解決に使用される。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->

以下の表は `.sdd-forge/config.json` で受け付けるすべてのフィールドを網羅している。**必須**と記載されたフィールドは必ず指定すること。値が欠損または不正な場合、`validateConfig()` はすべての違反箇所をまとめたエラーメッセージをスローする。

| フィールド | 必須/任意 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output` | 必須 | object | — | 出力設定のトップレベルブロック。 |
| `output.languages` | 必須 | string[] | — | 出力言語の空でないリスト（例: `["ja"]` や `["en", "ja"]`）。 |
| `output.default` | 必須 | string | — | メインの出力言語。`output.languages` のいずれかの値でなければならない。 |
| `output.mode` | 任意 | `"translate"` \| `"generate"` | `"translate"` | デフォルト以外の言語ドキュメントの生成方法。`"translate"` は翻訳ステップに委譲し、`"generate"` は各言語ごとに独立して AI 生成を実行する。 |
| `lang` | 必須 | string | `"en"` | CLI メッセージ、AGENTS.md、スキルファイル、spec ドキュメントの動作言語。ファイルが存在しないか解析不能な場合は `"en"` にフォールバックする（`loadLang()` で使用）。 |
| `type` | 必須 | string | — | プロジェクトタイプの識別子。正規パス（例: `"webapp/cakephp2"`）または登録済みエイリアス（例: `"cakephp2"`）を受け付ける。`buildTypeAliases()` の `TYPE_ALIASES` によって解決される。 |
| `limits.agentTimeout` | 任意 | number | — | 単一の AI エージェント呼び出しを中止するまでの最大待機時間（**秒**単位）。 |
| `limits.concurrency` | 任意 | number | `5` | スキャンおよびテキスト補完フェーズで並列処理するファイル数。`resolveConcurrency()` によって解決され、`DEFAULT_CONCURRENCY = 5` にフォールバックする。 |
| `documentStyle.purpose` | 任意 | string | — | 生成されるドキュメントの対象読者とスタイル。受け付ける値は `"developer-guide"`、`"user-guide"`、`"api-reference"` またはカスタム文字列。 |
| `documentStyle.tone` | 任意 | string | — | AI 生成テキストに適用する文体。`"polite"`、`"formal"`、`"casual"` のいずれかでなければならない。 |
| `documentStyle.customInstruction` | 任意 | string | — | `text` および `forge` フェーズで AI プロンプトに追記される自由形式の追加指示。 |
| `defaultAgent` | 任意 | string | — | `--agent` フラグが指定されていない場合に使用する `providers` 内のプロバイダー名キー。 |
| `providers.<key>.command` | 条件付き必須 | string | — | このエージェントプロバイダーに対して実行するコマンド（例: `"claude"`）。`providers` ブロックが存在する場合は必須。 |
| `providers.<key>.args` | 条件付き必須 | string[] | — | プロバイダーコマンドに渡す引数。`{{PROMPT}}` プレースホルダーは実行時に実際のプロンプトに置換される。 |
| `providers.<key>.timeoutMs` | 任意 | number | — | プロバイダーごとのタイムアウト（ミリ秒単位）。このプロバイダーに対しては `limits.agentTimeout` より優先される。 |
| `providers.<key>.systemPromptFlag` | 任意 | string | — | システムプロンプトをプロバイダー CLI に渡すためのフラグ（例: `"--system-prompt"`）。 |
| `flow.merge` | 任意 | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | `sdd-flow-close` がフィーチャーブランチをベースにマージする際の Git マージ戦略。 |
| `chapters` | 任意 | string[] | — | `docs/` の章ファイル順序をプロジェクトレベルで上書きする設定。エントリは拡張子なしの章ファイル名。プリセットの `preset.json` で定義された順序を上書きする。 |
| `agentWorkDir` | 任意 | string | — | エージェントサブプロセス実行時に設定するワーキングディレクトリ。エージェント CLI を特定のパスから実行する必要がある場合に有用。 |
| `textFill.projectContext` | 任意 | string | — | `text` および `forge` フェーズで AI プロンプトに追加コンテキストとして注入される自由形式のプロジェクト説明。 |
| `textFill.preamblePatterns` | 任意 | object[] | — | AI 生成出力から不要なプレフィックスを除去するために使用する正規表現パターンのリスト（各エントリに `pattern` とオプションの `flags` フィールドを持つ）。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->

**ドキュメントスタイル**

`documentStyle` を使用して、すべての AI 生成ドキュメントのトーンとフォーカスを制御する。`purpose` フィールドは各章のフレーミングを方向付け、`tone` は文体の格式を調整し、`customInstruction` はすべての AI 呼び出しに任意のガイダンスを追記する。

```json
"documentStyle": {
  "purpose": "developer-guide",
  "tone": "formal",
  "customInstruction": "Always include concrete code examples where relevant."
}
```

**AI エージェントプロバイダー**

sdd-forge はすべての LLM 呼び出しを外部 CLI コマンドに委譲する。`providers` 以下に 1 つ以上のプロバイダーを定義し、`defaultAgent` でデフォルトを選択する。`args` の `{{PROMPT}}` プレースホルダーは実行時に生成されたプロンプトに置換される。

```json
"defaultAgent": "claude",
"providers": {
  "claude": {
    "command": "claude",
    "args": ["--print", "{{PROMPT}}"],
    "timeoutMs": 120000
  }
}
```

**出力言語**

ドキュメントを生成するすべての言語を宣言する。`output.default` でメイン言語を設定する。`output.mode` が `"translate"` の場合はデフォルト言語のドキュメントが翻訳され、`"generate"` の場合は各言語ごとに独立して AI 生成が実行される。

```json
"output": {
  "languages": ["en", "ja"],
  "default": "en",
  "mode": "translate"
}
```

**章の順序**

`chapters` 配列に章ファイル名（拡張子なし）を列挙することで、プリセットの章の並び順を上書きできる。列挙した章のみが、指定した順序で出力に含まれる。

```json
"chapters": ["overview", "architecture", "cli_commands", "configuration", "development"]
```

**並列処理数とタイムアウト**

`limits` 以下で並列処理やエージェント呼び出しの上限を調整する。`concurrency` を下げると大規模なコードベースでのメモリ消費を抑えられ、`agentTimeout` を上げると応答の遅いプロバイダーに対応できる。

```json
"limits": {
  "concurrency": 3,
  "agentTimeout": 180
}
```

**SDD フローのマージ戦略**

SDD フロー終了時にフィーチャーブランチをベースブランチにマージする方法を選択する。デフォルトの `"squash"` は、フィーチャーブランチの履歴を単一のコミットにまとめる。

```json
"flow": {
  "merge": "squash"
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->

以下の環境変数は sdd-forge が実行時に読み込むまたは管理するものである。ユーザーが `.env` ファイルで設定するものではなく、トップレベルのディスパッチャーとサブコマンド実装の間でコンテキストを受け渡すために内部的に使用される。

| 変数 | 設定元 | 参照元 | 目的 |
|---|---|---|---|
| `SDD_SOURCE_ROOT` | `src/sdd-forge.js` | `src/lib/cli.js` | 解析対象プロジェクトのソースコードルートの絶対パス。`projects.json` からプロジェクトが解決された際に自動的に設定される。存在する場合、サブコマンドのデフォルトパス検出を上書きする。 |
| `SDD_WORK_ROOT` | `src/sdd-forge.js` | `src/lib/cli.js` | ワーキングディレクトリ（`.sdd-forge/` と `docs/` を含むディレクトリ）の絶対パス。プロジェクトモードでは `SDD_SOURCE_ROOT` と同時に設定される。存在する場合、git ベースのリポジトリルート検出を上書きする。 |
| `CLAUDECODE` | — | `src/lib/agent.js` | AI エージェントのサブプロセスを起動する前に、子プロセスの環境から明示的に**削除**される。これにより、Claude CLI 自身のセッション状態がエージェント呼び出しに漏れ込むことを防ぐ。 |

単一プロジェクト構成（`projects.json` なし）では、`SDD_SOURCE_ROOT` と `SDD_WORK_ROOT` は設定されず、sdd-forge は git ルート検出を使用してカレントワーキングディレクトリからパスを解決する。
<!-- {{/text}} -->
