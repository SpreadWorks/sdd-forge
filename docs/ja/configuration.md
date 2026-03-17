# 03. 設定とカスタマイズ

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。}} -->

sdd-forge は `.sdd-forge/config.json` を中心とした設定ファイルでプロジェクトの解析対象・ドキュメント出力・AI エージェント・SDD フローの動作を制御します。プロジェクトタイプの選択、ドキュメントスタイル、多言語出力、並行処理数、エージェントプロバイダーの切り替えなど、幅広いカスタマイズが可能です。

<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。ソースコードのファイル読み込み処理から抽出すること。}} -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | メイン設定ファイル。プロジェクトタイプ・言語・ドキュメント出力・エージェント・フロー等の全設定を保持する |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` の解析結果出力。自動生成されるため手動編集は不要 |
| `package.json` | プロジェクトルート | `loadPackageField()` により `engines`・`type`・`dependencies` 等のフィールドが読み込まれる |
| `preset.json` | `src/presets/{key}/preset.json` | プリセット定義。`parent` チェーン・章構成・スキャン設定・エイリアスを宣言する |
| `AGENTS.md` | プロジェクトルート | AI エージェント向けのプロジェクトコンテキスト。`sdd-forge agents` で生成・更新される |
| `CLAUDE.md` | プロジェクトルート | Claude CLI 向けコンテキストファイル。setup 時に AGENTS.md から生成される |

`config.json` は `sdd-forge setup` コマンドの対話式ウィザードで自動生成されます。手動で編集することも可能です。

<!-- {{/text}} -->

### 設定項目リファレンス

<!-- {{text[mode=deep]: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・必須かどうか・型・デフォルト値・説明を含めること。ソースコードのバリデーション処理やデフォルト値定義から抽出すること。}} -->

`config.json` のトップレベルフィールドは以下のとおりです。

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `lang` | はい | `string` | — | CLI・AGENTS.md・スキル・spec の操作言語（例: `"ja"`, `"en"`） |
| `type` | はい | `string` | — | プロジェクトタイプ（例: `"webapp/cakephp2"`, `"cli"`, `"library"`）。エイリアス解決あり |
| `docs` | はい | `object` | — | ドキュメント出力設定（下記参照） |
| `concurrency` | いいえ | `number` | `5` | ファイル並行処理数。`resolveConcurrency()` でデフォルト `5` にフォールバック |
| `chapters` | いいえ | `string[]` | — | 章の順序をプロジェクト固有に上書きする配列 |
| `scan` | いいえ | `object` | — | スキャン対象の制御（下記参照） |
| `agent` | いいえ | `object` | — | AI エージェント呼び出し設定（下記参照） |
| `flow` | いいえ | `object` | — | SDD フロー設定（下記参照） |
| `projects` | いいえ | `object` | — | モノレポ構成時のサブプロジェクト定義 |

**`docs` オブジェクト:**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `docs.languages` | はい | `string[]` | — | 出力言語の配列（例: `["ja"]`, `["en", "ja"]`） |
| `docs.defaultLanguage` | はい | `string` | — | デフォルト出力言語。`languages` に含まれる必要がある |
| `docs.mode` | いいえ | `string` | `"translate"` | 非デフォルト言語の生成方法。`"translate"` または `"generate"` |
| `docs.style` | いいえ | `object` | — | ドキュメントスタイル設定 |
| `docs.style.purpose` | ※ | `string` | — | ドキュメントの目的（`"developer-guide"`, `"user-guide"`, `"api-reference"` 等） |
| `docs.style.tone` | ※ | `string` | — | 文体（`"polite"`, `"formal"`, `"casual"` のいずれか） |
| `docs.style.customInstruction` | いいえ | `string` | — | 任意の追加指示テキスト |
| `docs.enrichBatchSize` | いいえ | `number` | — | enrich コマンドのバッチサイズ |
| `docs.enrichBatchLines` | いいえ | `number` | — | enrich コマンドのバッチ最大行数 |

※ `docs.style` を指定した場合、`purpose` と `tone` は必須です。

**`scan` オブジェクト:**

| フィールド | 必須 | 型 | 説明 |
|---|---|---|---|
| `scan.include` | はい | `string[]` | スキャン対象のグロブパターン配列 |
| `scan.exclude` | いいえ | `string[]` | スキャン除外のグロブパターン配列 |

**`agent` オブジェクト:**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `agent.default` | いいえ | `string` | — | デフォルトのエージェントプロバイダー名 |
| `agent.workDir` | いいえ | `string` | `".tmp"` | エージェント実行時の作業ディレクトリ |
| `agent.timeout` | いいえ | `number` | `300`（秒） | エージェント実行のタイムアウト（秒） |
| `agent.providers` | いいえ | `object` | — | エージェントプロバイダー定義。各プロバイダーは `command`（必須）と `args`（必須）を持つ |
| `agent.commands` | いいえ | `object` | — | コマンドごとのエージェント・プロファイル指定 |

**`flow` オブジェクト:**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `flow.merge` | いいえ | `string` | `"squash"` | マージ戦略。`"squash"`, `"ff-only"`, `"merge"` のいずれか |

<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: ユーザーがカスタマイズできる項目を説明してください。ソースコードから設定可能な項目を抽出し、各項目に設定例を含めること。}} -->

**プロジェクトタイプの指定**

`type` フィールドでプリセットを選択します。エイリアス（短縮名）も使用できます。

```json
{ "type": "webapp/cakephp2" }
```

利用可能なプリセット: `base`, `cli`, `node-cli`, `node`, `php`, `webapp`, `cakephp2`, `laravel`, `symfony`, `library`

**ドキュメントスタイルの設定**

`docs.style` で文書の目的・文体・追加指示を制御します。

```json
{
  "docs": {
    "style": {
      "purpose": "developer-guide",
      "tone": "polite",
      "customInstruction": "コードサンプルには必ずエラーハンドリングを含めること"
    }
  }
}
```

**多言語出力**

複数の言語でドキュメントを生成できます。`mode` で翻訳と独立生成を切り替えます。

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "en",
    "mode": "translate"
  }
}
```

**章の順序カスタマイズ**

`chapters` 配列でプリセットの章順序を上書きできます。

```json
{ "chapters": ["overview", "architecture", "cli_commands", "configuration"] }
```

**エージェントプロバイダーの切り替え**

`agent.providers` に複数のプロバイダーを定義し、`agent.default` やコマンドごとの `agent.commands` で使い分けます。`profiles` でモデル切り替えも可能です。

```json
{
  "agent": {
    "default": "claude",
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["-p", "{{PROMPT}}"],
        "systemPromptFlag": "--system-prompt",
        "profiles": {
          "default": [],
          "opus": ["--model", "opus"]
        }
      }
    },
    "commands": {
      "docs.review": { "agent": "claude", "profile": "opus" }
    }
  }
}
```

**スキャン対象の制御**

`scan` でスキャン対象・除外パターンを指定します。

```json
{
  "scan": {
    "include": ["src/**/*.js", "lib/**/*.ts"],
    "exclude": ["**/*.test.js", "**/node_modules/**"]
  }
}
```

**並行処理数の調整**

ファイル処理の並行度を変更できます。省略時のデフォルトは `5` です。

```json
{ "concurrency": 10 }
```

<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: ツールが参照する環境変数の一覧と用途を表形式で記述してください。ソースコードの process.env 参照から抽出すること。}} -->

| 環境変数 | 用途 | 参照箇所 |
|---|---|---|
| `SDD_WORK_ROOT` | 作業ルートディレクトリの絶対パスを指定します。設定されている場合、git リポジトリルートの自動検出をスキップし、この値を使用します | `src/lib/cli.js` の `repoRoot()` |
| `SDD_SOURCE_ROOT` | ソースコードのルートディレクトリの絶対パスを指定します。設定されている場合、`sourceRoot()` がこの値を返します。未設定時は `repoRoot()` と同じ値になります | `src/lib/cli.js` の `sourceRoot()` |

これらの環境変数は、ソースコードと作業ディレクトリが異なる場所にある場合（例: モノレポ構成やサブディレクトリ単位での解析）に使用します。通常は設定不要で、git リポジトリルートが自動検出されます。

<!-- {{/text}} -->
