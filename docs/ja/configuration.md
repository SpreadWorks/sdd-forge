# 設定とカスタマイズ

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。"})}} -->

sdd-forge の動作は `.sdd-forge/config.json` を中心に制御されます。ドキュメント出力言語・プリセット選択・AI エージェント設定・スキャン対象・フローのマージ戦略など、プロジェクトごとのカスタマイズが可能です。

<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text({prompt: "このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。ソースコードのファイル読み込み処理から抽出すること。"})}} -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクト全体の設定ファイル。言語・プリセット・ドキュメント出力・エージェント・フロー等を定義します |
| `package.json` | プロジェクトルート | `loadPackageField()` により任意のフィールドが参照されます。プロジェクト名やバージョン等の取得に使用されます |
| `preset.json` | `src/presets/<key>/preset.json` | 各プリセットの定義ファイル。親プリセット・スキャン対象パターン・章構成を定義します |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成するソースコード解析結果。各コマンドがデータソースとして参照します |

`config.json` は `loadConfig()` 関数によって読み込まれ、`validateConfig()` でバリデーションされた後に各コマンドへ渡されます。ファイルが存在しない場合はエラーとなります。

<!-- {{/text}} -->

### 設定項目リファレンス

<!-- {{text({prompt: "設定ファイルの全フィールドを表形式で記述してください。フィールド名・必須かどうか・型・デフォルト値・説明を含めること。ソースコードのバリデーション処理やデフォルト値定義から抽出すること。", mode: "deep"})}} -->

`config.json` のトップレベルフィールドは以下のとおりです。

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `name` | — | `string` | — | プロジェクト名。setup ウィザードで設定されます |
| `lang` | ✔ | `string` | — | CLI・AGENTS.md・スキル・スペックの動作言語 |
| `type` | ✔ | `string \| string[]` | — | 使用するプリセット名。複数指定可（例: `["symfony", "postgres"]`） |
| `docs` | ✔ | `object` | — | ドキュメント出力設定（後述） |
| `concurrency` | — | `number` | `5` | ファイル並列処理数 |
| `chapters` | — | `string[]` | — | 章の順序をプロジェクト単位で上書きします |
| `scan` | — | `object` | — | スキャン対象の設定（後述） |
| `agent` | — | `object` | — | AI エージェント呼び出し設定（後述） |
| `flow` | — | `object` | — | SDD フロー設定（後述） |
| `commands` | — | `object` | — | 外部コマンドの有効化設定（後述） |

**`docs` オブジェクト**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `docs.languages` | ✔ | `string[]` | — | 出力言語の一覧（例: `["ja"]`, `["en", "ja"]`） |
| `docs.defaultLanguage` | ✔ | `string` | — | デフォルト出力言語。`languages` に含まれている必要があります |
| `docs.mode` | — | `string` | `"translate"` | 非デフォルト言語の生成方法。`"translate"` または `"generate"` |
| `docs.style.purpose` | — | `string` | — | ドキュメントの目的（例: `"developer-guide"`, `"user-guide"`, `"api-reference"`） |
| `docs.style.tone` | — | `string` | — | 文体。`"polite"`, `"formal"`, `"casual"` のいずれか |
| `docs.style.customInstruction` | — | `string` | — | 追加の文体指示 |
| `docs.enrichBatchSize` | — | `number` | — | enrich 処理のバッチサイズ |
| `docs.enrichBatchLines` | — | `number` | — | enrich 処理のバッチ最大行数 |

**`scan` オブジェクト**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `scan.include` | ✔ | `string[]` | — | スキャン対象の glob パターン |
| `scan.exclude` | — | `string[]` | — | 除外パターン |

**`agent` オブジェクト**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `agent.default` | — | `string` | — | デフォルトのエージェントプロバイダ名 |
| `agent.workDir` | — | `string` | — | エージェント実行時の作業ディレクトリ |
| `agent.timeout` | — | `number` | — | エージェント実行タイムアウト（秒） |
| `agent.providers.<key>.command` | ✔ | `string` | — | プロバイダの実行コマンド |
| `agent.providers.<key>.args` | ✔ | `string[]` | — | コマンド引数。`{{PROMPT}}` プレースホルダー対応 |
| `agent.providers.<key>.timeoutMs` | — | `number` | — | プロバイダ固有のタイムアウト（ms） |
| `agent.providers.<key>.systemPromptFlag` | — | `string` | — | システムプロンプト指定フラグ |

**`flow` オブジェクト**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `flow.merge` | — | `string` | `"squash"` | マージ戦略。`"squash"`, `"ff-only"`, `"merge"` のいずれか |
| `flow.push.remote` | — | `string` | `"origin"` | プッシュ先のリモート名 |

**`commands` オブジェクト**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `commands.gh` | — | `string` | `"disable"` | GitHub CLI の有効化。`"enable"` または `"disable"` |

<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text({prompt: "ユーザーがカスタマイズできる項目を説明してください。ソースコードから設定可能な項目を抽出し、各項目に設定例を含めること。", mode: "deep"})}} -->

**プリセットの選択と複数指定**

`type` フィールドで使用するプリセットを指定します。単一指定の他、配列で複数プリセットを組み合わせることができます。

```json
{
  "type": "laravel"
}
```

```json
{
  "type": ["symfony", "postgres"]
}
```

**ドキュメントの多言語出力**

`docs.languages` に複数言語を指定すると、デフォルト言語以外は `docs.mode` の設定に基づいて翻訳または個別生成されます。

```json
{
  "docs": {
    "languages": ["ja", "en"],
    "defaultLanguage": "ja",
    "mode": "translate"
  }
}
```

**文体のカスタマイズ**

`docs.style` でドキュメントの目的と文体を指定できます。`customInstruction` で追加の指示を与えることも可能です。

```json
{
  "docs": {
    "languages": ["ja"],
    "defaultLanguage": "ja",
    "style": {
      "purpose": "developer-guide",
      "tone": "polite",
      "customInstruction": "コード例を多めに含めてください"
    }
  }
}
```

**章の順序変更**

プリセットが定義する章順序をプロジェクト単位で上書きできます。`chapters` 配列で章ファイル名を列挙します。

```json
{
  "chapters": ["overview.md", "configuration.md", "cli_commands.md", "internal_design.md"]
}
```

**スキャン対象のカスタマイズ**

プリセットのデフォルトスキャン設定をプロジェクト固有の `scan` で上書きできます。

```json
{
  "scan": {
    "include": ["src/**/*.ts", "lib/**/*.ts"],
    "exclude": ["**/*.test.ts", "dist/**"]
  }
}
```

**AI エージェントプロバイダの設定**

`agent.providers` で AI エージェントの実行コマンドと引数を定義します。`agent.default` でデフォルトプロバイダを指定します。

```json
{
  "agent": {
    "default": "claude",
    "timeout": 120,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["-p", "{{PROMPT}}"]
      }
    }
  }
}
```

**フローのマージ戦略**

SDD フロー完了時のマージ方法を `flow.merge` で選択できます。

```json
{
  "flow": {
    "merge": "squash",
    "push": {
      "remote": "origin"
    }
  }
}
```

**GitHub CLI の有効化**

`commands.gh` を `"enable"` にすると、フロー終了時に PR 作成などの GitHub CLI 連携が有効になります。

```json
{
  "commands": {
    "gh": "enable"
  }
}
```

<!-- {{/text}} -->

### 環境変数

<!-- {{text({prompt: "ツールが参照する環境変数の一覧と用途を表形式で記述してください。ソースコードの process.env 参照から抽出すること。", mode: "deep"})}} -->

sdd-forge は以下の環境変数を参照します。いずれも省略可能で、設定されていない場合は自動検出にフォールバックします。

| 環境変数 | 用途 | フォールバック |
|---|---|---|
| `SDD_WORK_ROOT` | 作業ディレクトリ（`.sdd-forge/` や `docs/` の親ディレクトリ）を明示的に指定します | `git rev-parse --show-toplevel` の結果。git リポジトリ外では `process.cwd()` |
| `SDD_SOURCE_ROOT` | 対象プロジェクトのソースコードルートを指定します。作業ディレクトリとソースコードが異なる場所にある場合に使用します | `SDD_WORK_ROOT` と同じ値（`repoRoot()` の返値） |
| `CLAUDECODE` | Claude CLI 環境マーカー。sdd-forge が AI エージェントのサブプロセスを起動する際に、環境の汚染を防ぐため明示的に削除されます | — |

`SDD_WORK_ROOT` と `SDD_SOURCE_ROOT` は `src/lib/cli.js` の `repoRoot()` および `sourceRoot()` 関数で参照されます。`sdd-forge.js` がコマンド実行時にプロジェクトコンテキストを解決する際の起点となります。

<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI コマンドリファレンス](cli_commands.md) | [内部設計 →](internal_design.md)
<!-- {{/data}} -->
