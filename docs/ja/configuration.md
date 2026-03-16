# 03. 設定とカスタマイズ

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。}} -->

sdd-forge の動作は `.sdd-forge/config.json` を中心に制御されます。ドキュメント出力言語・プロジェクト種別・AI エージェント構成・並列処理数・章構成・スキャン対象など、ドキュメント生成パイプラインの各段階に関わる設定項目をこのファイルで一元管理します。さらに、環境変数によるルートディレクトリの上書きにも対応しており、モノレポや CI 環境でも柔軟に運用できます。

<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。ソースコードのファイル読み込み処理から抽出すること。}} -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクト固有の設定ファイル。言語・プロジェクト種別・ドキュメントスタイル・エージェント構成などを定義します。`sdd-forge setup` で初期生成されます。 |
| `preset.json` | `src/presets/{key}/preset.json` | プリセット定義ファイル。アーキテクチャ層・章構成・スキャン設定・エイリアスをプリセットごとに定義します。ツール内部で自動探索されます。 |
| `package.json` | プロジェクトルート | Node.js パッケージ情報の読み込みに使用されます。`loadPackageField()` で任意フィールドを参照します。 |
| `config.example.json` | `src/templates/config.example.json` | 設定ファイルのテンプレート。`sdd-forge setup` がこのテンプレートを基に `config.json` を生成します。 |

`config.json` の読み込みは `loadConfig()` 関数（`src/lib/config.js`）が担当し、読み込み後に `validateConfig()`（`src/lib/types.js`）でバリデーションを実行します。バリデーションに失敗した場合はエラー一覧がまとめてスローされます。

<!-- {{/text}} -->

### 設定項目リファレンス

<!-- {{text[mode=deep]: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・必須かどうか・型・デフォルト値・説明を含めること。ソースコードのバリデーション処理やデフォルト値定義から抽出すること。}} -->

`config.json` のトップレベルフィールドは以下のとおりです。

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `lang` | ✓ | string | — | CLI・AGENTS.md・スキルの動作言語（例: `"ja"`, `"en"`） |
| `type` | ✓ | string | — | プロジェクト種別。プリセットのエイリアスも使用可能（例: `"cakephp2"` → `"webapp/cakephp2"`） |
| `docs` | ✓ | object | — | ドキュメント生成設定（後述） |
| `concurrency` | — | number | `5` | 並列ファイル処理の同時実行数。1 以上の正の数 |
| `chapters` | — | string[] | — | 章の順序を上書きする文字列配列（例: `["overview", "configuration"]`） |
| `scan` | — | object | — | スキャン設定（後述） |
| `agent` | — | object | — | エージェント設定（後述） |
| `flow` | — | object | — | フロー設定（後述） |
| `providers` | — | object | — | エージェントプロバイダー定義（後述） |

**`docs` オブジェクト**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `docs.languages` | ✓ | string[] | — | 出力言語の配列（例: `["ja"]`, `["en", "ja"]`）。空配列は不可 |
| `docs.defaultLanguage` | ✓ | string | — | デフォルト出力言語。`languages` 配列に含まれる必要があります |
| `docs.mode` | — | `"translate"` \| `"generate"` | — | 非デフォルト言語の生成方法 |
| `docs.style` | — | object | — | ドキュメントスタイル設定（後述） |
| `docs.enrichBatchSize` | — | number | `20` | enrich コマンドのバッチサイズ |
| `docs.enrichBatchLines` | — | number | `3000` | enrich コマンドのバッチあたり最大行数 |

**`docs.style` オブジェクト**

| フィールド | 必須 | 型 | 説明 |
|---|---|---|---|
| `docs.style.purpose` | ✓ | string | ドキュメントの目的（`"developer-guide"`, `"user-guide"`, `"api-reference"` または自由文字列） |
| `docs.style.tone` | ✓ | string | 文体トーン。`"polite"`, `"formal"`, `"casual"` のいずれか |
| `docs.style.customInstruction` | — | string | AI への追加指示テキスト |

**`scan` オブジェクト**

| フィールド | 必須 | 型 | 説明 |
|---|---|---|---|
| `scan.include` | ✓ | string[] | スキャン対象のグロブパターン配列。空配列は不可 |
| `scan.exclude` | — | string[] | スキャン除外のグロブパターン配列 |

**`agent` オブジェクト**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `agent.workDir` | — | string | `".tmp"` | エージェント呼び出しの作業ディレクトリ |
| `agent.timeout` | — | number | `300` | エージェントのタイムアウト（秒）。1 以上の正の数 |

**`flow` オブジェクト**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `flow.merge` | — | string | `"squash"` | マージ戦略。`"squash"`, `"ff-only"`, `"merge"` のいずれか |

**`providers` オブジェクト**

`providers.<name>` で各エージェントプロバイダーを定義します。

| フィールド | 必須 | 型 | 説明 |
|---|---|---|---|
| `providers.<name>.command` | ✓ | string | 実行コマンド（例: `"claude"`, `"codex"`） |
| `providers.<name>.args` | ✓ | string[] | コマンド引数。`{{PROMPT}}` プレースホルダーに対応 |
| `providers.<name>.systemPromptFlag` | — | string | system prompt を渡す CLI フラグ（例: `"--system-prompt"`） |

<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: ユーザーがカスタマイズできる項目を説明してください。ソースコードから設定可能な項目を抽出し、各項目に設定例を含めること。}} -->

**ドキュメントの言語と出力モード**

`docs.languages` と `docs.defaultLanguage` で出力言語を制御します。複数言語を指定した場合、`docs.mode` で翻訳（`translate`）か独立生成（`generate`）かを選択できます。

```json
{
  "docs": {
    "languages": ["en", "ja"],
    "defaultLanguage": "ja",
    "mode": "translate"
  }
}
```

**ドキュメントスタイルの調整**

`docs.style` でドキュメントの目的・文体・追加指示を設定します。`tone` は `polite`（です・ます調）、`formal`（である調）、`casual`（くだけた表現）から選択できます。

```json
{
  "docs": {
    "style": {
      "purpose": "user-guide",
      "tone": "polite",
      "customInstruction": "初心者向けに、専門用語には簡潔な補足を入れてください"
    }
  }
}
```

**章構成の上書き**

プリセットが定義する章の順序を `chapters` 配列で上書きできます。配列内はファイル名（`.md` 拡張子なし）で指定します。

```json
{
  "chapters": ["overview", "configuration", "cli_commands", "api_reference"]
}
```

**プロジェクト種別のエイリアス**

`type` フィールドには短縮名を使用できます。`resolveType()` が `buildTypeAliases()` で構築されたエイリアスマップを参照し、正規パスに自動解決します。

```json
{ "type": "cakephp2" }
```

上記は内部で `"webapp/cakephp2"` に解決されます。同様に `"laravel"` → `"webapp/laravel"`、`"symfony"` → `"webapp/symfony"` のように変換されます。

**スキャン対象の制御**

`scan.include` と `scan.exclude` でソースコードスキャンの対象を制御できます。

```json
{
  "scan": {
    "include": ["app/**/*.php", "src/**/*.php"],
    "exclude": ["**/vendor/**", "**/tests/**"]
  }
}
```

**並列処理数の調整**

`concurrency` でファイル処理の同時実行数を変更できます。デフォルトは `5` です。マシンリソースに応じて調整してください。

```json
{ "concurrency": 10 }
```

**AI エージェントの構成**

`agent` セクションでエージェントプロバイダーの定義と、コマンドごとのエージェント割り当てを設定できます。`profiles` を使って同一プロバイダーでモデルを切り替えることも可能です。

```json
{
  "agent": {
    "default": "claude",
    "timeout": 300,
    "providers": {
      "claude": {
        "command": "claude",
        "args": ["-p", "{{PROMPT}}"],
        "profiles": {
          "default": ["--model", "sonnet"],
          "opus": ["--model", "opus"]
        }
      }
    },
    "commands": {
      "docs.text": { "agent": "claude", "profile": "opus" }
    }
  }
}
```

**マージ戦略の変更**

SDD フローのマージ方法を `flow.merge` で設定します。デフォルトは `squash` です。

```json
{
  "flow": { "merge": "ff-only" }
}
```

<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: ツールが参照する環境変数の一覧と用途を表形式で記述してください。ソースコードの process.env 参照から抽出すること。}} -->

sdd-forge が参照する環境変数は以下のとおりです。いずれも `src/lib/cli.js` で解決されます。

| 環境変数 | 用途 | 未設定時の動作 |
|---|---|---|
| `SDD_WORK_ROOT` | 作業ルートディレクトリ（`.sdd-forge/`・`docs/`・`specs/` の配置先）を上書きします | `git rev-parse --show-toplevel` でリポジトリルートを検出し、失敗時は `process.cwd()` を使用します |
| `SDD_SOURCE_ROOT` | ソースコードルート（スキャン・解析対象のディレクトリ）を上書きします | `SDD_WORK_ROOT` の解決結果（またはそのフォールバック値）と同じディレクトリを使用します |

**解決の優先順位**

作業ルートは次の順序で決定されます。

1. `SDD_WORK_ROOT` 環境変数（設定されている場合）
2. `git rev-parse --show-toplevel` の結果（Git リポジトリ内の場合）
3. `process.cwd()`（カレントディレクトリ）

ソースルートは次の順序で決定されます。

1. `SDD_SOURCE_ROOT` 環境変数（設定されている場合）
2. 作業ルートと同じ値

**使用例**

ソースコードと `.sdd-forge/` ディレクトリが異なる場所にある場合（モノレポや CI 環境など）に設定します。

```bash
export SDD_WORK_ROOT=/path/to/project
export SDD_SOURCE_ROOT=/path/to/project/packages/app
sdd-forge docs build
```

通常のリポジトリ構成（ソースコードと `.sdd-forge/` が同一ルートに存在する場合）では、環境変数の設定は不要です。Git リポジトリの自動検出が適用されます。

なお、エージェント呼び出し時には `CLAUDECODE` 環境変数がサブプロセスの環境から自動的に除去されます（`src/lib/agent.js`）。これはネストされた CLI セッションの競合を防ぐための内部処理であり、ユーザーが設定する必要はありません。

<!-- {{/text}} -->
