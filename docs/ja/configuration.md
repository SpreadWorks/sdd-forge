# 03. 設定とカスタマイズ

## 概要

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the types of configuration files, the range of configurable options, and customization points.}} -->

本章では、sdd-forge の動作を制御する設定ファイル、各ファイルで利用可能なすべての設定オプション、および AI プロバイダー・ドキュメントスタイル・プロジェクトタイプ・パイプライン設定に関する主要なカスタマイズポイントについて説明します。これらのファイルを理解することで、ドキュメントの生成方法、複数プロジェクトの管理方法、および SDD フローの動作を細かく制御できます。

<!-- {{/text}} -->

## 目次

### 設定ファイル

<!-- {{text: List all configuration files loaded by this tool in a table, including their locations and roles. Key files: .sdd-forge/config.json (project settings), .sdd-forge/projects.json (multi-project management), .sdd-forge/current-spec (SDD flow state), .sdd-forge/output/analysis.json (analysis results including enriched data).}} -->

以下のファイルは、sdd-forge の通常動作中に読み書きされます。すべてのパスは、プロジェクトの作業ルート（`.sdd-forge/` を含むディレクトリ）からの相対パスです。

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プライマリプロジェクト設定。出力言語、プロジェクトタイプ、AI プロバイダー、ドキュメントスタイル、パイプライン制限を定義します。すべてのドキュメント生成コマンドに必須です。 |
| `projects.json` | `.sdd-forge/projects.json` | マルチプロジェクトレジストリ。`sdd-forge setup` によって作成されます。名前付きプロジェクトをソースパスと作業ルートパスにマッピングし、デフォルトプロジェクトを管理します。 |
| `current-spec` | `.sdd-forge/current-spec` | SDD フロー状態。仕様駆動開発フローの進行中に、アクティブな spec パス・ベース/フィーチャーブランチ名・worktree の場所を保存します。フロー完了時に削除されます。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成したソースコード解析の全体結果。`sdd-forge enrich` 実行後、各エントリには `summary`・`detail`・`chapter`・`role` フィールドが付与され、後続のドキュメント生成ステップで使用されます。 |
| `context.json` | `.sdd-forge/context.json` | AI プロンプトを補完するためのオプションのプロジェクトコンテキスト文字列。`saveContext()` によって書き込まれ、`resolveProjectContext()` によって読み込まれます。 |

<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all fields in .sdd-forge/config.json in a table. Include field name, whether it is required, type, default value, and description. Key fields: output.languages (list of output languages), output.default (default language), output.mode (translate/generate), lang (CLI operating language), type (project type), documentStyle (purpose/tone/customInstruction), textFill (preamblePatterns), defaultAgent, providers (AI agent definitions), flow.merge (squash/ff-only/merge), limits (concurrency/designTimeoutMs).}} -->

以下の表は、`.sdd-forge/config.json` で受け付けるすべてのフィールドを網羅しています。**必須**と記載されたフィールドを省略したり無効な値を設定したりすると、バリデーションエラーが発生してコマンドが中断されます。

| フィールド | 必須 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output.languages` | ✅ | `string[]` | — | 生成ドキュメントの出力言語リスト（例: `["en"]`、`["ja", "en"]`）。空でない値が必要です。 |
| `output.default` | ✅ | `string` | — | 主要な出力言語。`output.languages` に含まれる値である必要があります。 |
| `output.mode` | — | `"translate"` \| `"generate"` | `"translate"` | デフォルト言語以外の言語の生成方法。`translate` はデフォルト言語の出力を AI に渡して翻訳します。`generate` はターゲット言語で生成パイプライン全体を再実行します。 |
| `lang` | ✅ | `string` | — | CLI・AGENTS.md・スキル・spec ファイルの動作言語（例: `"en"`、`"ja"`）。 |
| `type` | ✅ | `string` | — | アクティブなプリセットを選択するプロジェクトタイプ（例: `"cli/node-cli"`、`"webapp/cakephp2"`、`"webapp/laravel"`）。`"node-cli"` などのエイリアスは自動的に正規形式に解決されます。 |
| `documentStyle.purpose` | — | `string` | — | 生成ドキュメントの対象読者と目的（例: `"developer-guide"`、`"user-guide"`）。`documentStyle` が存在する場合は必須です。 |
| `documentStyle.tone` | — | `"polite"` \| `"formal"` \| `"casual"` | — | AI 生成テキストに適用される文体。`documentStyle` が存在する場合は必須です。 |
| `documentStyle.customInstruction` | — | `string` | — | 生成コンテンツをさらに調整するために AI プロンプトに注入する追加の自由テキスト指示。 |
| `textFill.projectContext` | — | `string` | — | ソースコードだけでは不十分な場合に AI 生成プロンプトを補完するプロジェクトの背景説明。`context.json` が存在する場合はそちらが優先されます。 |
| `textFill.preamblePatterns` | — | `object[]` | — | sdd-forge が AI レスポンスの先頭から除去する正規表現パターンを定義する `{ pattern, flags }` オブジェクトのリスト（例: 定型文の免責事項を除去するため）。 |
| `defaultAgent` | — | `string` | — | `--agent` フラグが指定されていない場合に使用する `providers` エントリのキー。 |
| `providers.<name>.command` | — | `string` | — | この AI プロバイダーに対して呼び出す実行ファイル（例: `"claude"`）。プロバイダーごとに必須です。 |
| `providers.<name>.args` | — | `string[]` | — | コマンドに渡す引数リスト。プロンプト注入の場所を示すプレースホルダーとして `{{PROMPT}}` を使用します。省略時はプロンプトが末尾に追加されます。プロバイダーごとに必須です。 |
| `providers.<name>.timeoutMs` | — | `number` | `120000` | このプロバイダーの呼び出し単位のタイムアウト（ミリ秒）。 |
| `providers.<name>.systemPromptFlag` | — | `string` | `"--system-prompt"` | プロバイダーにシステムプロンプトを渡すために使用する CLI フラグ（例: `"--system-prompt"`）。 |
| `flow.merge` | — | `"squash"` \| `"ff-only"` \| `"merge"` | `"squash"` | SDD フローがフィーチャーブランチをベースブランチにマージする際に使用する Git マージ戦略。 |
| `limits.concurrency` | — | `number` | `5` | scan および enrich ステップで並列処理するソースファイル数。 |
| `limits.designTimeoutMs` | — | `number` | — | 長時間実行される設計フェーズの AI 呼び出しに対するタイムアウト全体（ミリ秒）。 |
| `chapters` | — | `string[]` | — | このプロジェクトのプリセットのデフォルト章順序を上書きする、章ファイル名の順序付きリスト。 |
| `agentWorkDir` | — | `string` | — | `-C <dir>` 経由で AI エージェントに渡す作業ディレクトリ。指定する場合は有効なパスである必要があります。 |
| `uiLang` | — | `"en"` \| `"ja"` | — | ドキュメント出力言語とは独立して、CLI の進捗メッセージや UI 出力に使用する言語。 |

<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Explain the items users can customize. (1) AI provider settings (providers field, command/args/timeoutMs/systemPromptFlag) with configuration examples, (2) document style (purpose/tone/customInstruction), (3) preset selection (type field), (4) merge strategy (flow.merge), (5) concurrency (limits.concurrency). Include JSON configuration examples for each item.}} -->

sdd-forge には 5 つの主要なカスタマイズ領域があります。それぞれ `.sdd-forge/config.json` で設定します。

**1. AI プロバイダー設定**

`providers` マップでは、1 つ以上の AI バックエンドを定義できます。`defaultAgent` キーでデフォルトで使用するプロバイダーを選択します。各プロバイダーエントリには `command` と `args` 配列が必要です。特殊プレースホルダー `{{PROMPT}}` で、引数リスト内の生成プロンプトの注入位置を指定します。

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": ["--system-prompt", "You are a documentation assistant.", "{{PROMPT}}"],
      "timeoutMs": 180000,
      "systemPromptFlag": "--system-prompt"
    }
  }
}
```

> **注意:** Claude CLI には `--system-prompt-file` オプションは存在しません。`--system-prompt` 経由で渡す非常に長いシステムプロンプトは OS の `ARG_MAX` 制限に達する可能性があります。システムプロンプトは簡潔に保つようにしてください。

**2. ドキュメントスタイル**

`documentStyle` オブジェクトで、AI 生成テキストの目的と文体を制御します。プロジェクト固有の記述ガイダンスを注入するには `customInstruction` 文字列を追加します。

```json
{
  "documentStyle": {
    "purpose": "developer-guide",
    "tone": "formal",
    "customInstruction": "Always include code examples when describing API methods."
  }
}
```

有効な tone の値は `polite`・`formal`・`casual` です。`purpose` フィールドは自由文字列で、AI プロンプトにそのまま渡されます。

**3. プリセット選択**

`type` フィールドで、スキャンするソースファイルと生成される章を決定するドキュメントプリセットを選択します。正規のタイプパスまたはサポートされているエイリアスを設定します。

```json
{
  "type": "cli/node-cli"
}
```

サポートされているエイリアスは自動的に解決されます（例: `"node-cli"` → `"cli/node-cli"`、`"php-mvc"` → `"webapp/cakephp2"`）。利用可能なすべてのプリセットとそのキーを一覧表示するには `sdd-forge presets` を実行してください。

**4. マージ戦略**

`flow.merge` フィールドで、SDD フロー完了時にフィーチャーブランチをベースブランチにマージする方法を制御します。

```json
{
  "flow": {
    "merge": "squash"
  }
}
```

| 値 | 動作 |
|---|---|
| `squash` | マージ前にすべてのコミットを 1 つにまとめます（デフォルト）。 |
| `ff-only` | ファストフォワードのみ。ファストフォワードマージが不可能な場合は失敗します。 |
| `merge` | 標準的なマージコミット。 |

**5. 並列処理数**

`limits.concurrency` フィールドで、`scan` および `enrich` パイプラインステップ中に並列処理するソースファイル数を制御します。CPU やメモリに余裕があるマシンでは値を増やし、負荷を軽減したい場合は値を下げてください。

```json
{
  "limits": {
    "concurrency": 10,
    "designTimeoutMs": 300000
  }
}
```

デフォルトの並列処理数は `5` です。オプションの `designTimeoutMs` は長時間実行される AI 設計呼び出しのタイムアウトを設定します。省略した場合は、組み込みのコマンド単位のタイムアウト定数が適用されます（操作に応じて `120 s` / `180 s` / `300 s`）。

<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: List the environment variables referenced by the tool and their purposes in a table. SDD_SOURCE_ROOT (source code root), SDD_WORK_ROOT (working root, location of .sdd-forge/), CLAUDECODE (internal variable deleted to prevent Claude CLI hangs).}} -->

sdd-forge は実行時に以下の環境変数を読み書きします。これらは通常、サブコマンドを呼び出す前にトップレベルのディスパッチャー（`sdd-forge.js`）によって自動的に設定されますが、サブコマンドを直接実行する場合や CI パイプラインなどの高度なユースケースでは手動で設定することもできます。

| 変数 | 方向 | 説明 |
|---|---|---|
| `SDD_SOURCE_ROOT` | 読み取り | 解析対象プロジェクトのソースコードルートの絶対パス。`src/lib/cli.js` の `sourceRoot()` で使用されます。設定されている場合、`git rev-parse` や `process.cwd()` から導出された値より優先されます。 |
| `SDD_WORK_ROOT` | 読み取り | 作業ルート（`.sdd-forge/` を含むディレクトリ）の絶対パス。`src/lib/cli.js` の `repoRoot()` で使用されます。設定されている場合、git ベースの解決より優先されます。git worktree では、2 つのルートが互いに異なる場合があります。 |
| `CLAUDECODE` | 削除 | Claude CLI の内部変数で、存在すると CLI が入力待ちでハングします。`callAgentAsync()` はデッドロックを防ぐため、AI エージェントを spawn する前に子プロセスの環境からこの変数を明示的に削除します。 |

`SDD_SOURCE_ROOT` と `SDD_WORK_ROOT` は、各コマンドが独立してプロジェクトパスを再解決することなく、メインディスパッチャーがすべてのサブコマンドにプロジェクトコンテキストを伝達するための主要なメカニズムです。

<!-- {{/text}} -->
