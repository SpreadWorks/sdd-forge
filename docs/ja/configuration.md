# 設定とカスタマイズ

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。"})}} -->

sdd-forge は `.sdd-forge/config.json` を中心に、プリセット定義（`preset.json`）や解析結果（`analysis.json`）など複数の設定ファイルを使用します。ドキュメント出力言語・スキャン対象・AI エージェント・フローのマージ戦略など、プロジェクトごとの要件に合わせて幅広くカスタマイズできます。

<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text({prompt: "このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。ソースコードのファイル読み込み処理から抽出すること。"})}} -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクトのメイン設定ファイル。言語・プリセット・ドキュメント出力・エージェント等を定義します。`sdd-forge setup` で生成され、`loadConfig()` でバリデーション付きで読み込まれます。 |
| `preset.json` | `src/presets/<key>/preset.json` | プリセット定義ファイル。親継承チェーン・章構成・スキャンパターンを定義します。モジュールロード時に `src/presets/` 配下を自動探索して読み込まれます。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` で生成されるソースコード解析結果。data・text コマンドがドキュメント生成時に参照します。 |
| `overrides.json` | `.sdd-forge/overrides.json` | 解析エントリーの説明をユーザーが手動で上書きするためのファイル。DataSource の `desc()` / `mergeDesc()` でマージされます。 |
| `package.json` | プロジェクトルート | Node.js プロジェクトのメタデータ。`loadPackageField()` でプロジェクト名・バージョン・依存関係等を読み取ります。 |
| `composer.json` | プロジェクトルート | PHP プロジェクトの依存関係定義。Laravel 等の PHP 系プリセットで解析対象になります。 |
| `.env.example` | プロジェクトルート | 環境変数のテンプレート。Laravel プリセット等で環境変数一覧の抽出に使用されます。 |
| `.active-flow` | `.sdd-forge/.active-flow` | 現在アクティブな SDD フローの状態を追跡する JSON ファイル。spec ID と実行モード（worktree/branch/local）を保持します。 |
| `flow.json` | `specs/<number>-<name>/flow.json` | 個別の SDD フローの詳細状態（ブランチ・ステップ進捗・要件等）を保存します。 |

<!-- {{/text}} -->

### 設定項目リファレンス

<!-- {{text({prompt: "設定ファイルの全フィールドを表形式で記述してください。フィールド名・必須かどうか・型・デフォルト値・説明を含めること。ソースコードのバリデーション処理やデフォルト値定義から抽出すること。", mode: "deep"})}} -->

`.sdd-forge/config.json` のフィールド一覧です。バリデーションは `validateConfig()` （`src/lib/types.js`）で実行されます。

**トップレベルフィールド**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `name` | — | `string` | — | プロジェクト名。setup ウィザードで設定されます。 |
| `lang` | ✔ | `string` | — | CLI・AGENTS.md・スキル・スペックの操作言語（例: `"ja"`, `"en"`）。 |
| `type` | ✔ | `string \| string[]` | — | プリセット名。単一（`"laravel"`）または複数（`["laravel", "drizzle"]`）を指定します。 |
| `concurrency` | — | `number` | `5` | ファイル並列処理数。1 以上の正の整数を指定します。 |
| `chapters` | — | `string[]` | — | 章の出力順序を上書きする配列。省略時はプリセットの定義に従います。 |

**`docs`（必須）**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `docs.languages` | ✔ | `string[]` | — | 出力言語の配列（例: `["ja"]`, `["en", "ja"]`）。 |
| `docs.defaultLanguage` | ✔ | `string` | — | デフォルト出力言語。`languages` 配列に含まれている必要があります。 |
| `docs.mode` | — | `string` | `"translate"` | 非デフォルト言語の生成方法。`"translate"` または `"generate"` を指定します。 |
| `docs.style.purpose` | — | `string` | — | ドキュメントの目的（例: `"developer-guide"`, `"user-guide"`, `"api-reference"`）。`style` を指定する場合は必須です。 |
| `docs.style.tone` | — | `string` | — | 文体。`"polite"`, `"formal"`, `"casual"` のいずれか。`style` を指定する場合は必須です。 |
| `docs.style.customInstruction` | — | `string` | — | AI への追加指示テキスト。 |
| `docs.enrichBatchSize` | — | `number` | — | enrich 処理のバッチサイズ。 |
| `docs.enrichBatchLines` | — | `number` | — | enrich バッチの最大行数。 |

**`scan`（省略可）**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `scan.include` | ✔（scan 指定時） | `string[]` | — | スキャン対象の glob パターン配列。 |
| `scan.exclude` | — | `string[]` | — | 除外する glob パターン配列。 |

**`agent`（省略可）**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `agent.default` | — | `string` | — | デフォルトの AI エージェントプロバイダ名。 |
| `agent.workDir` | — | `string` | — | エージェント実行時の作業ディレクトリ。 |
| `agent.timeout` | — | `number` | — | エージェント実行タイムアウト（秒）。1 以上の正の整数。 |
| `agent.providers.<key>.command` | ✔（providers 指定時） | `string` | — | エージェント実行コマンド。 |
| `agent.providers.<key>.args` | ✔（providers 指定時） | `string[]` | — | コマンド引数。`{{PROMPT}}` プレースホルダーを使用できます。 |
| `agent.commands` | — | `object` | — | コマンドごとのエージェント・プロファイル上書き設定。 |

**`flow`（省略可）**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `flow.merge` | — | `string` | — | マージ戦略。`"squash"`, `"ff-only"`, `"merge"` のいずれか。 |
| `flow.push.remote` | — | `string` | — | push 先のリモート名。 |

**`commands`（省略可）**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `commands.gh` | — | `string` | `"disable"` | GitHub CLI の利用可否。`"enable"` または `"disable"` を指定します。 |

<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text({prompt: "ユーザーがカスタマイズできる項目を説明してください。ソースコードから設定可能な項目を抽出し、各項目に設定例を含めること。", mode: "deep"})}} -->

**ドキュメント出力言語の設定**

`docs.languages` と `docs.defaultLanguage` で出力言語を制御します。多言語出力時は `docs.mode` で翻訳方式を選択できます。

```json
{
  "docs": {
    "languages": ["ja", "en"],
    "defaultLanguage": "ja",
    "mode": "translate"
  }
}
```

**ドキュメントのスタイル指定**

`docs.style` で AI が生成する文章の目的・文体を指定できます。

```json
{
  "docs": {
    "languages": ["ja"],
    "defaultLanguage": "ja",
    "style": {
      "purpose": "developer-guide",
      "tone": "polite",
      "customInstruction": "コード例を多く含めてください。"
    }
  }
}
```

**プリセットの組み合わせ**

`type` に配列を指定することで、複数のプリセットを組み合わせてスキャン・テンプレートを統合できます。親子関係がある場合は自動的に重複が除去されます。

```json
{
  "type": ["laravel", "drizzle"]
}
```

**章の順序変更**

`chapters` でプリセットが定義する章の並び順を上書きできます。

```json
{
  "chapters": ["overview.md", "configuration.md", "cli_commands.md", "internal_design.md"]
}
```

**スキャン対象の調整**

`scan` でプリセットのデフォルトに加えて、プロジェクト固有のスキャンパターンを指定できます。

```json
{
  "scan": {
    "include": ["app/**/*.php", "lib/**/*.php"],
    "exclude": ["vendor/**", "storage/**"]
  }
}
```

**AI エージェントプロバイダの設定**

`agent.providers` で使用する AI エージェントの実行コマンドと引数を定義します。`agent.default` でデフォルトプロバイダを選択します。

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

**フローのマージ戦略と GitHub CLI 連携**

`flow.merge` でブランチのマージ方法を、`commands.gh` で GitHub CLI を有効化して PR 作成フローを利用できます。

```json
{
  "flow": {
    "merge": "squash",
    "push": { "remote": "origin" }
  },
  "commands": {
    "gh": "enable"
  }
}
```

**解析結果の手動上書き**

`.sdd-forge/overrides.json` で、自動解析された説明文を手動で上書きできます。DataSource の `desc()` メソッドが自動的にマージします。

```json
{
  "controllers": {
    "UserController": "ユーザー認証とプロフィール管理を担当するコントローラ"
  }
}
```

<!-- {{/text}} -->

### 環境変数

<!-- {{text({prompt: "ツールが参照する環境変数の一覧と用途を表形式で記述してください。ソースコードの process.env 参照から抽出すること。", mode: "deep"})}} -->

sdd-forge が参照する環境変数は以下のとおりです。いずれも省略可能で、設定されていない場合は自動的にフォールバック値が使用されます。

| 環境変数 | 用途 | フォールバック | 参照元 |
|---|---|---|---|
| `SDD_WORK_ROOT` | 作業ディレクトリ（`.sdd-forge/` や `docs/` の親ディレクトリ）を指定します。 | `git rev-parse --show-toplevel` の結果。git リポジトリ外では `process.cwd()` | `src/lib/cli.js` の `repoRoot()` |
| `SDD_SOURCE_ROOT` | スキャン対象のソースコードルートを指定します。作業ディレクトリとソースコードが異なる場所にある場合に使用します。 | `SDD_WORK_ROOT` と同じ値（`repoRoot()` の戻り値） | `src/lib/cli.js` の `sourceRoot()` |
| `CLAUDECODE` | Claude CLI が設定する環境変数です。sdd-forge はエージェント呼び出し時にこの変数を明示的に削除し、子プロセスへの伝搬を防止します。 | —（ユーザーが設定するものではありません） | `src/lib/agent.js` の `buildAgentInvocation()` |

`SDD_WORK_ROOT` と `SDD_SOURCE_ROOT` は `sdd-forge.js`（CLI エントリポイント）がプロジェクトコンテキストを解決する際に設定・参照されます。通常はリポジトリルートで実行するため明示的な設定は不要です。

<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← CLI コマンドリファレンス](cli_commands.md) | [内部設計 →](internal_design.md)
<!-- {{/data}} -->
