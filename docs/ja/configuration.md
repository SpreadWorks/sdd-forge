<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../configuration.md) | **日本語**
<!-- {{/data}} -->

# 設定とカスタマイズ

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。"})}} -->

このツールは主に `.sdd-forge/config.json` を読み込み、ドキュメント生成、CLI の動作言語、プリセット種別、並列実行数、エージェント実行、フロー制御、外部コマンド利用可否などを設定できます。
あわせて `package.json` の任意フィールドも参照できるため、プロジェクト情報の取り込みや実行環境に応じたカスタマイズが可能です。
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text({prompt: "このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。ソースコードのファイル読み込み処理から抽出すること。"})}} -->

| 設定ファイル | 配置場所 | 役割 |
| --- | --- | --- |
| `.sdd-forge/config.json` | プロジェクトルート配下の `.sdd-forge/config.json` | ツール本体の設定ファイルです。`loadConfig()` が読み込み、`validateConfig()` で検証します。`loadLang()` はこのファイルから `lang` だけを先行して読み取ります。 |
| `package.json` | プロジェクトルートの `package.json` | `loadPackageField()` が任意フィールドを安全に読み取るために使用します。存在しない場合や JSON の解析に失敗した場合は `undefined` を返します。 |
<!-- {{/text}} -->

### 設定項目リファレンス

<!-- {{text({prompt: "設定ファイルの全フィールドを表形式で記述してください。フィールド名・必須かどうか・型・デフォルト値・説明を含めること。ソースコードのバリデーション処理やデフォルト値定義から抽出すること。", mode: "deep"})}} -->

| フィールド名 | 必須 | 型 | デフォルト値 | 説明 |
| --- | --- | --- | --- | --- |
| `name` | 任意 | 文字列 | なし | プロジェクト名です。セットアップウィザードで設定される任意項目です。 |
| `docs` | 必須 | オブジェクト | なし | ドキュメント出力全体の設定です。 |
| `docs.languages` | 必須 | 文字列配列 | なし | 出力するドキュメント言語の一覧です。空配列は不可です。 |
| `docs.defaultLanguage` | 必須 | 文字列 | なし | 既定の出力言語です。`docs.languages` に含まれている必要があります。 |
| `docs.mode` | 任意 | `translate` または `generate` | なし | 既定言語以外の生成方法です。 |
| `docs.style` | 任意 | オブジェクト | なし | 文書スタイル設定です。 |
| `docs.style.purpose` | `docs.style` 使用時は必須 | 文字列 | なし | 文書の用途です。例として `developer-guide`、`user-guide`、`api-reference` が想定されています。 |
| `docs.style.tone` | `docs.style` 使用時は必須 | `polite` / `formal` / `casual` | なし | 文体指定です。 |
| `docs.style.customInstruction` | 任意 | 文字列 | なし | 追加の任意指示です。 |
| `lang` | 必須 | 文字列 | なし | CLI、AGENTS.md、skills、specs で使う動作言語です。なお設定ファイル未読込時の補助値としては `en` が使われます。 |
| `type` | 必須 | 文字列 または 文字列配列 | なし | 使用するプリセット名です。空文字列や空配列は不可です。 |
| `concurrency` | 任意 | 正の数値 | `5` | ファイル単位の並列処理数です。未設定時は `DEFAULT_CONCURRENCY` が使われます。 |
| `chapters` | 任意 | 文字列配列 | なし | 章の一覧です。指定する場合は各要素が文字列である必要があります。 |
| `scan` | 任意 | オブジェクト | なし | 解析対象ファイルの走査設定です。 |
| `scan.include` | `scan` 使用時は必須 | 文字列配列 | なし | 走査対象に含めるパターン一覧です。空配列は不可です。 |
| `scan.exclude` | 任意 | 文字列配列 | なし | 走査対象から除外するパターン一覧です。 |
| `agent` | 任意 | オブジェクト | なし | AI エージェント実行設定です。 |
| `agent.default` | 任意 | 文字列 | なし | 既定のエージェントプロバイダー名です。 |
| `agent.workDir` | 任意 | 文字列 | なし | エージェント実行時の作業ディレクトリです。 |
| `agent.timeout` | 任意 | 正の数値 | なし | エージェント実行タイムアウト秒数です。 |
| `agent.retryCount` | 任意 | 正の数値 | なし | docs enrich のエージェント呼び出し再試行回数です。 |
| `agent.providers` | 任意 | オブジェクト | なし | 利用可能なエージェントプロバイダー定義です。 |
| `agent.providers.<provider>.name` | 任意 | 文字列 | なし | プロバイダー表示名です。 |
| `agent.providers.<provider>.command` | 任意 | 文字列 | なし | 実行コマンドです。 |
| `agent.providers.<provider>.args` | 任意 | 文字列配列 | なし | コマンド引数です。`{{PROMPT}}` プレースホルダーに対応します。 |
| `agent.providers.<provider>.timeoutMs` | 任意 | 数値 | なし | プロバイダー単位のタイムアウトミリ秒です。 |
| `agent.providers.<provider>.systemPromptFlag` | 任意 | 文字列 | なし | system prompt を渡すフラグ名です。 |
| `flow` | 任意 | オブジェクト | なし | フロー制御設定です。 |
| `flow.merge` | 任意 | `squash` / `ff-only` / `merge` | `squash` | マージ戦略です。 |
| `flow.push` | 任意 | オブジェクト | なし | push 設定です。 |
| `flow.push.remote` | 任意 | 文字列 | `origin` | push 先のリモート名です。 |
| `commands` | 任意 | オブジェクト | なし | 外部コマンド利用設定です。 |
| `commands.gh` | 任意 | `enable` / `disable` | `disable` | GitHub CLI の利用可否です。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text({prompt: "ユーザーがカスタマイズできる項目を説明してください。ソースコードから設定可能な項目を抽出し、各項目に設定例を含めること。", mode: "deep"})}} -->

ユーザーが主に調整できるのは、出力言語、文書スタイル、プリセット種別、並列数、エージェント実行方法、フロー制御、外部コマンド利用可否です。

- ドキュメント出力言語は `docs.languages` と `docs.defaultLanguage` で設定します。
  例: `"docs": { "languages": ["ja", "en"], "defaultLanguage": "ja" }`
- 多言語生成方法は `docs.mode` で切り替えます。
  例: `"docs": { "languages": ["ja", "en"], "defaultLanguage": "ja", "mode": "translate" }`
- 文書の用途や文体は `docs.style` で指定します。
  例: `"docs": { "languages": ["ja"], "defaultLanguage": "ja", "style": { "purpose": "user-guide", "tone": "polite", "customInstruction": "です・ます調で記述する" } }`
- CLI などの動作言語は `lang` で指定します。
  例: `"lang": "ja"`
- 使用するプリセットは `type` で 1 件または複数指定できます。
  例: `"type": "symfony"`
  例: `"type": ["symfony", "postgres"]`
- 並列処理数は `concurrency` で調整できます。未設定時は `5` です。
  例: `"concurrency": 8`
- 対象章を限定する場合は `chapters` を設定します。
  例: `"chapters": ["overview", "configuration", "cli_commands"]`
- 解析対象ファイルは `scan.include` と `scan.exclude` で制御できます。
  例: `"scan": { "include": ["src/**/*.js"], "exclude": ["dist/**", "node_modules/**"] }`
- エージェントの既定プロバイダーや実行条件は `agent` で設定します。
  例: `"agent": { "default": "codex", "workDir": ".", "timeout": 300, "retryCount": 2 }`
- エージェントプロバイダー定義は `agent.providers` で追加できます。
  例: `"agent": { "providers": { "codex": { "name": "Codex", "command": "codex", "args": ["run", "{{PROMPT}}"], "timeoutMs": 60000, "systemPromptFlag": "--system-prompt" } } }`
- フロー時のマージ戦略と push 先は `flow` で設定します。
  例: `"flow": { "merge": "ff-only", "push": { "remote": "origin" } }`
- GitHub CLI の利用可否は `commands.gh` で切り替えます。
  例: `"commands": { "gh": "enable" }`
<!-- {{/text}} -->

### 環境変数

<!-- {{text({prompt: "ツールが参照する環境変数の一覧と用途を表形式で記述してください。ソースコードの process.env 参照から抽出すること。", mode: "deep"})}} -->

`src/lib/config.js` と `src/lib/types.js` の解析データ上、`process.env` を直接参照している処理は確認できません。

| 環境変数 | 用途 |
| --- | --- |
| 該当なし | 提供された解析対象には、ツール本体が `process.env` から値を読み込む実装は含まれていません。 |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI コマンドリファレンス](cli_commands.md)
<!-- {{/data}} -->
