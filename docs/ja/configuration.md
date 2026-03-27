<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../configuration.md) | **日本語**
<!-- {{/data}} -->

# 設定とカスタマイズ

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。"})}} -->

sdd-forge は `.sdd-forge/config.json` を中心に、プロジェクトのドキュメント生成言語・プリセット種別・AI エージェント・並列数・フロー戦略などを設定します。設定ファイルのフィールドに加え、環境変数 `SDD_WORK_ROOT` / `SDD_SOURCE_ROOT` によるパス解決のカスタマイズも可能です。
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text({prompt: "このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。ソースコードのファイル読み込み処理から抽出すること。"})}} -->

sdd-forge が読み込む設定ファイルは以下のとおりです。

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクト固有の全設定（言語・プリセット・エージェント・フロー等）を定義するメインの設定ファイル。`sdd-forge setup` で生成される |
| `package.json` | プロジェクトルート | プロジェクト名・バージョン・スクリプト等のメタ情報を読み取る。`loadPackageField()` で任意フィールドを取得 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成するソースコード解析結果。各コマンドがデータソースとして参照する |
| `preset.json` | `src/presets/{key}/preset.json` | 各プリセットの定義（親プリセット・章構成・スキャン設定等）。sdd-forge パッケージに同梱 |
<!-- {{/text}} -->

### 設定項目リファレンス

<!-- {{text({prompt: "設定ファイルの全フィールドを表形式で記述してください。フィールド名・必須かどうか・型・デフォルト値・説明を含めること。ソースコードのバリデーション処理やデフォルト値定義から抽出すること。", mode: "deep"})}} -->

`.sdd-forge/config.json` の全フィールドは以下のとおりです。

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `name` | — | `string` | — | プロジェクト名。setup ウィザードで設定 |
| `lang` | ✔ | `string` | — | CLI・AGENTS.md・スキル・スペックの操作言語 |
| `type` | ✔ | `string \| string[]` | — | プリセット名（例: `"symfony"`, `["symfony", "postgres"]`） |
| `docs` | ✔ | `object` | — | ドキュメント生成設定（下記参照） |
| `docs.languages` | ✔ | `string[]` | — | 出力言語の配列（例: `["ja"]`, `["en", "ja"]`） |
| `docs.defaultLanguage` | ✔ | `string` | — | デフォルト出力言語。`docs.languages` に含まれる必要がある |
| `docs.mode` | — | `string` | — | 非デフォルト言語の生成方法。`"translate"` または `"generate"` |
| `docs.style.purpose` | — | `string` | — | ドキュメントの用途（例: `"developer-guide"`） |
| `docs.style.tone` | — | `string` | — | 文体。`"polite"` / `"formal"` / `"casual"` のいずれか |
| `docs.style.customInstruction` | — | `string` | — | 任意の追加指示 |
| `docs.enrichBatchSize` | — | `number` | — | enrich バッチサイズ |
| `docs.enrichBatchLines` | — | `number` | — | enrich バッチ最大行数 |
| `concurrency` | — | `number` | `5` | ファイル処理の並列数 |
| `chapters` | — | `string[]` | — | 章の順序をプロジェクト固有に上書き |
| `scan.include` | — | `string[]` | — | スキャン対象のパスパターン（scan 指定時は必須） |
| `scan.exclude` | — | `string[]` | — | スキャン除外のパスパターン |
| `agent.default` | — | `string` | — | デフォルトのエージェントプロバイダ名 |
| `agent.workDir` | — | `string` | — | エージェント実行の作業ディレクトリ |
| `agent.timeout` | — | `number` | — | エージェント実行タイムアウト（秒） |
| `agent.retryCount` | — | `number` | `1` | `docs enrich` 専用の再試行回数。空レスポンスと一時的な agent 呼び出し失敗を 3 秒固定で再試行する。他の agent コマンドでは未実装。 |
| `agent.providers` | — | `object` | — | エージェントプロバイダの定義（名前→設定のマップ） |
| `agent.commands` | — | `object` | — | コマンド別のエージェント・プロファイル上書き |
| `flow.merge` | — | `string` | — | マージ戦略。`"squash"` / `"ff-only"` / `"merge"` のいずれか |
| `flow.push.remote` | — | `string` | `"origin"` | push 先のリモート名 |
| `commands.gh` | — | `string` | `"disable"` | GitHub CLI の利用。`"enable"` または `"disable"` |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text({prompt: "ユーザーがカスタマイズできる項目を説明してください。ソースコードから設定可能な項目を抽出し、各項目に設定例を含めること。", mode: "deep"})}} -->

**ドキュメント言語とスタイル**

`docs` セクションで出力言語・文体をカスタマイズできます。複数言語を指定すると、デフォルト言語以外は `mode` に応じて翻訳または個別生成されます。

```json
"docs": {
  "languages": ["en", "ja"],
  "defaultLanguage": "ja",
  "mode": "translate",
  "style": {
    "purpose": "user-guide",
    "tone": "polite"
  }
}
```

**プリセットの組み合わせ**

`type` に配列を指定すると、複数のプリセットを組み合わせてスキャン・章構成を統合できます。親子関係にあるプリセットは自動で重複が除去されます。

```json
"type": ["laravel", "postgres"]
```

**章の順序変更**

`chapters` でプリセットのデフォルト章順序をプロジェクト固有に上書きできます。

```json
"chapters": ["overview", "configuration", "architecture", "cli_commands"]
```

**AI エージェントの設定**

`agent` セクションで AI プロバイダの指定やコマンドごとのプロファイル切り替えが可能です。`providers` に複数のプロバイダを定義し、`default` でデフォルトを選択します。

```json
"agent": {
  "default": "claude",
  "timeout": 120,
  "providers": {
    "claude": {
      "name": "Claude",
      "command": "claude",
      "args": ["-p", "{{PROMPT}}"]
    }
  }
}
```

**フロー戦略の変更**

SDD フローのマージ方法と push 先リモートを指定できます。

```json
"flow": {
  "merge": "squash",
  "push": { "remote": "origin" }
}
```

**GitHub CLI の有効化**

PR 作成などの GitHub 連携機能を利用するには `commands.gh` を有効にします。

```json
"commands": { "gh": "enable" }
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text({prompt: "ツールが参照する環境変数の一覧と用途を表形式で記述してください。ソースコードの process.env 参照から抽出すること。", mode: "deep"})}} -->

sdd-forge が参照する環境変数は以下のとおりです。

| 環境変数 | 用途 | 参照箇所 |
|---|---|---|
| `SDD_WORK_ROOT` | プロジェクトの作業ルートディレクトリを明示的に指定します。設定されていない場合は `git rev-parse --show-toplevel` にフォールバックし、それも失敗すると `process.cwd()` を使用します | `src/lib/cli.js` — `repoRoot()` |
| `SDD_SOURCE_ROOT` | ソースコードのルートディレクトリを明示的に指定します。設定されていない場合は `SDD_WORK_ROOT` と同じ値にフォールバックします | `src/lib/cli.js` — `sourceRoot()` |
| `CLAUDECODE` | エージェント実行時にサブプロセスの環境から削除されます。Claude Code 環境の検出用に存在する変数で、子プロセスへの伝播を防ぐ目的で除去されます | `src/lib/agent.js` — `executeAgent()` |

`SDD_WORK_ROOT` と `SDD_SOURCE_ROOT` はモノレポ構成やサブディレクトリでの実行時に有用です。通常のリポジトリルートからの実行では設定不要です。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI コマンドリファレンス](cli_commands.md)
<!-- {{/data}} -->
