# 03. 設定とカスタマイズ

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。}} -->

sdd-forge はプロジェクトルート直下の `.sdd-forge/config.json` を中心に、出力言語・プロジェクト種別・ドキュメントスタイル・AI エージェント・並列数などを設定できます。さらにプリセットの `preset.json` や環境変数と組み合わせることで、スキャン対象・章構成・作業ディレクトリといった動作の大部分をカスタマイズできます。
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。ソースコードのファイル読み込み処理から抽出すること。}} -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | メイン設定ファイル。出力言語・プロジェクト種別・ドキュメントスタイル・エージェント定義など全設定を保持する。`loadConfig()` が読み込みとバリデーションを行う。 |
| `flow.json` | `.sdd-forge/flow.json` | SDD フローの状態永続化ファイル。現在のスペック・ブランチ・ステップ進捗・要件一覧を保持する。`flow-state.js` が読み書きする。 |
| `preset.json` | `src/presets/{key}/preset.json` | プリセット定義。アーキテクチャ種別・ラベル・エイリアス・スキャン対象・章構成を宣言する。`presets.js` が起動時に全プリセットを自動スキャンして `PRESETS` 配列を構築する。 |
| `package.json` | プロジェクトルート | `loadPackageField()` を通じてプロジェクト名やバージョンなどの任意フィールドを取得する。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` の出力。ソースコード解析結果を JSON で保持する。 |
<!-- {{/text}} -->

### 設定項目リファレンス

<!-- {{text[mode=deep]: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・必須かどうか・型・デフォルト値・説明を含めること。ソースコードのバリデーション処理やデフォルト値定義から抽出すること。}} -->

`.sdd-forge/config.json` の全フィールドを以下に示します。`validateConfig()` （`src/lib/types.js`）がバリデーションを行い、不正な値はエラー一覧としてまとめて報告されます。

**トップレベルフィールド**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `output` | ✅ | `Object` | — | 出力言語設定（後述） |
| `lang` | ✅ | `string` | `"en"` （`loadLang` のフォールバック） | CLI・AGENTS.md・スキル・スペックの操作言語 |
| `type` | ✅ | `string` | — | プロジェクト種別。`"webapp/cakephp2"`、`"cli"`、`"node-cli"` など。短縮名は `TYPE_ALIASES` で正規パスに解決される |
| `documentStyle` | — | `Object` | — | ドキュメントスタイル設定（後述） |
| `limits` | — | `Object` | — | 制限値設定（後述） |
| `textFill` | — | `Object` | — | text コマンド向け設定（後述） |
| `chapters` | — | `string[]` | プリセットの `chapters` 配列 | 章ファイルの順序を上書きする |
| `agentWorkDir` | — | `string` | `".tmp"` | エージェントの作業ディレクトリ |
| `agent` | — | `Object` | — | エージェント設定（後述） |
| `scan` | — | `Object` | — | スキャン対象設定（後述） |
| `flow` | — | `Object` | — | SDD フロー設定（後述） |

**`output` オブジェクト**

| フィールド | 必須 | 型 | 説明 |
|---|---|---|---|
| `output.languages` | ✅ | `string[]` | 出力言語コードの配列（例: `["ja"]`、`["en", "ja"]`）。空配列は不可 |
| `output.default` | ✅ | `string` | デフォルト出力言語。`languages` に含まれている必要がある |
| `output.mode` | — | `"translate"` \| `"generate"` | デフォルト以外の言語の生成方法 |

**`documentStyle` オブジェクト**

| フィールド | 必須 | 型 | 説明 |
|---|---|---|---|
| `documentStyle.purpose` | ✅（設定時） | `string` | `"developer-guide"`・`"user-guide"`・`"api-reference"` または自由文字列 |
| `documentStyle.tone` | ✅（設定時） | `string` | `"polite"`・`"formal"`・`"casual"` のいずれか |
| `documentStyle.customInstruction` | — | `string` | 任意の追加指示テキスト |

**`limits` オブジェクト**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `limits.agentTimeout` | — | `number` | `300` | エージェントのタイムアウト（秒） |
| `limits.concurrency` | — | `number` | `5` | ファイル並列処理数。`resolveConcurrency()` で解決される |
| `limits.enrichBatchSize` | — | `number` | `20` | enrich コマンドの 1 バッチあたりの最大エントリ数 |
| `limits.enrichBatchLines` | — | `number` | `3000` | enrich コマンドの 1 バッチあたりの最大行数 |

**`textFill` オブジェクト**

| フィールド | 必須 | 型 | 説明 |
|---|---|---|---|
| `textFill.projectContext` | — | `string` | プロジェクト概要テキスト。AI への追加コンテキストとして使用される |
| `textFill.preamblePatterns` | — | `Array<{pattern, flags?}>` | AI 出力から除去するプレフィックスの正規表現パターン配列 |

**`agent` オブジェクト**

| フィールド | 必須 | 型 | 説明 |
|---|---|---|---|
| `agent.default` | — | `string` | デフォルトのエージェント名（例: `"claude"`） |
| `agent.providers` | — | `Object` | エージェント定義のマップ。各キーに `command`（必須）・`args`（必須）・`systemPromptFlag`・`timeoutMs`・`profiles` を持つ |
| `agent.commands` | — | `Object` | コマンドごとのエージェント・プロファイル指定（例: `{ "docs": { agent: "claude", profile: "sonnet" } }`） |

**`scan` オブジェクト**

| フィールド | 必須 | 型 | 説明 |
|---|---|---|---|
| `scan.include` | ✅（設定時） | `string[]` | スキャン対象の glob パターン配列。空配列は不可 |
| `scan.exclude` | — | `string[]` | 除外する glob パターン配列 |

**`flow` オブジェクト**

| フィールド | 必須 | 型 | デフォルト値 | 説明 |
|---|---|---|---|---|
| `flow.merge` | — | `string` | `"squash"` | Git マージ戦略。`"squash"`・`"ff-only"`・`"merge"` のいずれか |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: ユーザーがカスタマイズできる項目を説明してください。ソースコードから設定可能な項目を抽出し、各項目に設定例を含めること。}} -->

**プロジェクト種別の指定**

`type` フィールドでプリセットを選択します。短縮名がサポートされており、`buildTypeAliases()` により正規パスに自動解決されます。

```json
{ "type": "cakephp2" }
```

上記は `"webapp/cakephp2"` に解決されます。利用可能なプリセットは `sdd-forge presets` コマンドで確認できます。

**ドキュメントスタイルの変更**

`documentStyle` で AI が生成するドキュメントの文体と目的を制御します。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "初心者向けにわかりやすく記述すること"
  }
}
```

**章構成の上書き**

プリセットが定義する章の順序をプロジェクト固有に変更できます。`chapters` 配列でファイル名（拡張子なし）を列挙します。

```json
{ "chapters": ["overview", "configuration", "cli_commands", "development_testing"] }
```

**AI エージェントの設定**

`agent` オブジェクトでエージェントプロバイダーの定義とコマンドごとの割り当てを設定します。`args` 配列内の `{{PROMPT}}` はプロンプト文字列に置換されます。

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

**並列数・タイムアウトの調整**

大規模プロジェクトでは並列数やタイムアウトを引き上げることでスループットを改善できます。

```json
{
  "limits": {
    "concurrency": 10,
    "agentTimeout": 600,
    "enrichBatchSize": 30,
    "enrichBatchLines": 5000
  }
}
```

**スキャン対象の指定**

プリセットのスキャン設定を上書きし、プロジェクト固有のファイルパターンを指定できます。

```json
{
  "scan": {
    "include": ["src/**/*.ts", "lib/**/*.ts"],
    "exclude": ["**/*.test.ts", "**/node_modules/**"]
  }
}
```

**AI 出力のプリアンブル除去**

AI が出力する冒頭の定型文（例: 「以下に〜」「Here is〜」）を正規表現で自動除去できます。

```json
{
  "textFill": {
    "preamblePatterns": [
      { "pattern": "^(Here is|以下に|Based on)", "flags": "i" }
    ]
  }
}
```

**多言語出力**

複数言語でドキュメントを生成する場合、`output.languages` に言語コードを列挙し、`mode` で生成方式を選択します。

```json
{
  "output": {
    "languages": ["en", "ja"],
    "default": "ja",
    "mode": "translate"
  }
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: ツールが参照する環境変数の一覧と用途を表形式で記述してください。ソースコードの process.env 参照から抽出すること。}} -->

sdd-forge が参照する環境変数は以下の 2 つです。いずれも `src/lib/cli.js` で参照されており、未設定の場合は自動検出にフォールバックします。

| 環境変数 | 用途 | フォールバック |
|---|---|---|
| `SDD_WORK_ROOT` | 作業ルート（リポジトリルート）のパスを上書きする。`repoRoot()` が最初にこの値を確認し、設定されていればそのまま返す。 | `git rev-parse --show-toplevel` の結果。Git リポジトリ外では `process.cwd()` |
| `SDD_SOURCE_ROOT` | ソースコードルートのパスを上書きする。`sourceRoot()` が最初にこの値を確認し、設定されていればそのまま返す。作業ルートとソースルートが異なるプロジェクト構成で使用する。 | `repoRoot()` と同じ値 |

これらの環境変数は、モノレポ構成やサブディレクトリにソースコードが配置されている場合に有用です。例えば、リポジトリルートが `/repo` でソースコードが `/repo/packages/app` にある場合、以下のように設定します。

```bash
export SDD_WORK_ROOT=/repo
export SDD_SOURCE_ROOT=/repo/packages/app
sdd-forge docs build
```
<!-- {{/text}} -->
