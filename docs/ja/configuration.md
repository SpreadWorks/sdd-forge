<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../configuration.md) | **日本語**
<!-- {{/data}} -->

# 設定とカスタマイズ

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。"})}} -->

このツールは主に `.sdd-forge/config.json` を読み込み、ドキュメント生成、言語設定、並列実行数、対象タイプ、フロー動作、エージェント実行条件などを設定できます。あわせて一部の処理では `package.json` やドキュメント用の言語設定を参照し、多言語出力や補助的な表示内容を切り替えられます。
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text({prompt: "このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。ソースコードのファイル読み込み処理から抽出すること。"})}} -->

| 設定ファイル | 配置場所 | 役割 |
| --- | --- | --- |
| `.sdd-forge/config.json` | プロジェクトルート直下の `.sdd-forge/config.json` | ツールの主要設定を保持します。`loadConfig()` が読み込み、設定内容を検証したうえで各機能に渡します。`loadLang()` や言語切替リンク生成でも参照されます。 |
| `package.json` | プロジェクトルート直下の `package.json` | `loadPackageField()` が任意のフィールド値を補助的に取得します。ファイルが存在しない場合や JSON 解析に失敗した場合は `undefined` を返します。 |
<!-- {{/text}} -->

### 設定項目リファレンス

<!-- {{text({prompt: "設定ファイルの全フィールドを表形式で記述してください。フィールド名・必須かどうか・型・デフォルト値・説明を含めること。ソースコードのバリデーション処理やデフォルト値定義から抽出すること。", mode: "deep"})}} -->

| フィールド名 | 必須 | 型 | デフォルト値 | 説明 |
| --- | --- | --- | --- | --- |
| `docs` | 必須 | オブジェクト | なし | ドキュメント出力全体の設定です。 |
| `docs.languages` | 必須 | 文字列配列 | なし | 出力対象の言語一覧です。1件以上必要です。 |
| `docs.defaultLanguage` | 必須 | 文字列 | なし | 既定の言語です。`docs.languages` に含まれている必要があります。 |
| `docs.mode` | 任意 | 文字列 | `translate` | ドキュメント出力モードです。`translate` または `generate` を指定できます。 |
| `docs.style` | 任意 | オブジェクト | なし | ドキュメント文体に関する設定です。 |
| `docs.style.purpose` | `docs.style` 指定時は必須 | 文字列 | なし | 文書の目的を表します。 |
| `docs.style.tone` | `docs.style` 指定時は必須 | 文字列 | なし | 文体です。`polite`、`formal`、`casual` のいずれかを指定します。 |
| `docs.style.customInstruction` | 任意 | 文字列 | なし | 追加の文書指示です。 |
| `lang` | 必須 | 文字列 | `en`（事前読込時） | ツールの言語設定です。`loadLang()` では設定ファイルが読めない場合に `en` を返します。 |
| `type` | 必須 | 文字列または文字列配列 | なし | 対象のプロジェクト種別です。文字列配列の場合は空要素を含められません。 |
| `concurrency` | 任意 | 数値 | `5` | 並列実行数です。1以上の数値を指定します。`resolveConcurrency()` で未指定時は `5` になります。 |
| `chapters` | 任意 | 文字列配列 | なし | 生成対象の章一覧です。 |
| `agent` | 任意 | オブジェクト | なし | エージェント実行設定です。 |
| `agent.workDir` | 任意 | 文字列 | なし | エージェントの作業ディレクトリです。 |
| `agent.timeout` | 任意 | 数値 | なし | エージェント実行タイムアウトです。1以上である必要があります。 |
| `agent.retryCount` | 任意 | 数値 | なし | エージェントの再試行回数です。1以上である必要があります。 |
| `agent.providers` | 任意 | オブジェクト | なし | 名前付きのエージェントプロバイダー定義です。 |
| `agent.providers.<name>.command` | `agent.providers.<name>` 指定時は必須 | 文字列 | なし | 実行コマンドです。空文字列は不可です。 |
| `agent.providers.<name>.args` | `agent.providers.<name>` 指定時は必須 | 配列 | なし | コマンド引数配列です。 |
| `scan` | 任意 | オブジェクト | なし | 解析対象ファイルの走査条件です。 |
| `scan.include` | `scan` 指定時は必須 | 文字列配列 | なし | 走査対象に含めるパターンです。1件以上必要です。 |
| `scan.exclude` | 任意 | 文字列配列 | なし | 走査対象から除外するパターンです。 |
| `flow` | 任意 | オブジェクト | なし | フロー実行時の設定です。 |
| `flow.merge` | 任意 | 文字列 | なし | マージ方式です。`squash`、`ff-only`、`merge` のいずれかを指定します。 |
| `flow.push` | 任意 | オブジェクト | なし | push 動作の設定です。 |
| `flow.push.remote` | 任意 | 文字列 | なし | push 先リモート名です。 |
| `commands` | 任意 | オブジェクト | なし | 外部コマンド利用可否などの設定です。 |
| `commands.gh` | 任意 | 文字列 | なし | GitHub CLI の利用設定です。`enable` または `disable` を指定します。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text({prompt: "ユーザーがカスタマイズできる項目を説明してください。ソースコードから設定可能な項目を抽出し、各項目に設定例を含めること。", mode: "deep"})}} -->

`docs.languages` と `docs.defaultLanguage` を使うと、多言語ドキュメントの対象言語と既定言語を変更できます。

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en"
  }
}
```

`docs.mode` と `docs.style` を使うと、出力モードと文体を調整できます。

```json
{
  "docs": {
    "mode": "translate",
    "style": {
      "purpose": "利用者向けガイドの生成",
      "tone": "polite",
      "customInstruction": "簡潔に記述する"
    }
  }
}
```

`lang`、`type`、`chapters` を使うと、ツールの言語、対象プロジェクト種別、生成対象章を切り替えられます。

```json
{
  "lang": "ja",
  "type": ["node-cli", "postgres"],
  "chapters": ["overview", "configuration", "cli_commands"]
}
```

`concurrency`、`scan.include`、`scan.exclude` を使うと、実行並列数と解析対象ファイルの範囲を調整できます。

```json
{
  "concurrency": 8,
  "scan": {
    "include": ["src/**/*.js", "docs/**/*.md"],
    "exclude": ["dist/**", "coverage/**"]
  }
}
```

`agent` と `agent.providers` を使うと、作業ディレクトリ、タイムアウト、再試行回数、実行コマンド群を設定できます。

```json
{
  "agent": {
    "workDir": ".tmp",
    "timeout": 120,
    "retryCount": 2,
    "providers": {
      "default": {
        "command": "codex",
        "args": ["run"]
      }
    }
  }
}
```

`flow.merge`、`flow.push.remote`、`commands.gh` を使うと、フロー実行時のマージ方式、push 先、GitHub CLI 利用可否を変更できます。

```json
{
  "flow": {
    "merge": "squash",
    "push": {
      "remote": "origin"
    }
  },
  "commands": {
    "gh": "enable"
  }
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text({prompt: "ツールが参照する環境変数の一覧と用途を表形式で記述してください。ソースコードの process.env 参照から抽出すること。", mode: "deep"})}} -->

| 環境変数 | 用途 |
| --- | --- |
| 該当なし | 提供された解析データに含まれるコア設定読み込み処理（`.sdd-forge/config.json`、`package.json`、設定検証、並列数解決、言語切替リンク生成）では `process.env` の参照は確認できませんでした。 |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI コマンドリファレンス](cli_commands.md)
<!-- {{/data}} -->
