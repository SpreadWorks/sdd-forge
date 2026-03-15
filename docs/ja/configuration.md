# 03. 設定とカスタマイズ

## 概要

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the types of config files, range of configurable items, and customization points.}} -->
sdd-forge は主に `.sdd-forge/config.json` と `preset.json` で設定します。これらのファイルでは、プロジェクト種別、出力言語、文書スタイル、AI エージェントプロバイダー、スキャン対象、並列実行数の上限、SDD フローの挙動などを制御でき、ドキュメント生成パイプラインの各段階を幅広くカスタマイズできます。
<!-- {{/text}} -->

## 内容

### 設定ファイル

<!-- {{text: List all configuration files this tool reads, including their locations and roles, in table format. Extract from file reading logic in the source code.}} -->
次の表は、sdd-forge が実行時に読み込む設定ファイルを示しています。

| ファイル | 場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクトの主要設定です。出力言語、プロジェクト種別、文書スタイル、エージェントプロバイダー、スキャンルール、並列実行の上限、フロー設定を保持します。`sdd-forge setup` によって生成されます。 |
| `preset.json` | `src/presets/{key}/preset.json` | サポート対象の各フレームワークやプロジェクト種別ごとに、アーキテクチャ種別、ラベル、エイリアス、スキャンパターン、章の並び順を定義するプリセットマニフェストです。起動時に自動検出されます。 |
| `package.json` | プロジェクトルート | `loadPackageField()` 経由で読み込まれ、名前やバージョンなどのプロジェクトメタデータを取得します。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成する出力です。拡張済みのソースコード解析結果を保存し、後続のコマンド（`data`、`text` など）が利用します。 |
<!-- {{/text}} -->

### 設定リファレンス

<!-- {{text[mode=deep]: Describe all configuration fields in table format. Include field name, required/optional, type, default value, and description. Extract from validation logic and default value definitions in the source code.}} -->
すべての項目は `.sdd-forge/config.json` に定義します。`src/lib/types.js` の `validateConfig()` 関数が、以下のスキーマに基づいて検証します。

| 項目 | 必須 | 型 | デフォルト | 説明 |
|---|---|---|---|---|
| `output` | はい | `Object` | — | 出力言語の設定です。 |
| `output.languages` | はい | `string[]` | — | 出力言語コードの空でない配列です（例: `["en"]`、`["en", "ja"]`）。 |
| `output.default` | はい | `string` | — | 既定の出力言語です。`output.languages` のいずれかである必要があります。 |
| `output.mode` | いいえ | `string` | `"translate"` | 既定以外の言語をどのように生成するかを指定します。`"translate"` または `"generate"` を受け付けます。 |
| `lang` | はい | `string` | — | CLI メッセージ、AGENTS.md、skills、specs に使う動作言語です。設定が利用できない場合は `"en"` にフォールバックします。 |
| `type` | はい | `string` | — | プロジェクト種別の識別子です。正規パス（例: `"webapp/cakephp2"`）または短いエイリアス（例: `"laravel"`）を受け付け、後者は `TYPE_ALIASES` によって解決されます。 |
| `limits` | いいえ | `Object` | — | エージェントと並列実行制御に関する上限設定です。 |
| `limits.agentTimeout` | いいえ | `number` | — | エージェント実行のタイムアウト秒数です。 |
| `limits.concurrency` | いいえ | `number` | `5` | 並列処理するファイル数の上限です。`resolveConcurrency()` で解決されます。 |
| `documentStyle` | いいえ | `Object` | — | 生成されるドキュメントの文体や目的を制御します。 |
| `documentStyle.purpose` | 条件付き | `string` | — | `documentStyle` を指定した場合に必須です。`"developer-guide"`、`"user-guide"`、`"api-reference"`、または任意の文字列を受け付けます。 |
| `documentStyle.tone` | 条件付き | `string` | — | `documentStyle` を指定した場合に必須です。`"polite"`、`"formal"`、`"casual"` のいずれかである必要があります。 |
| `documentStyle.customInstruction` | いいえ | `string` | — | テキスト生成時に AI へ渡す追加の自由記述指示です。 |
| `textFill` | いいえ | `Object` | — | `text` コマンドの出力処理に関する設定です。 |
| `textFill.projectContext` | いいえ | `string` | — | AI にコンテキストとして渡すプロジェクト概要テキストです。 |
| `textFill.preamblePatterns` | いいえ | `Object[]` | — | `{ pattern, flags }` オブジェクトの配列です。LLM 出力の先頭に一致する不要な定型文を削除するための正規表現パターンを指定します。 |
| `scan` | いいえ | `Object` | — | ソースファイルのスキャン設定です。 |
| `scan.include` | 条件付き | `string[]` | — | `scan` を指定した場合に必須です。対象に含めるファイルの glob パターンを空でない配列で指定します。 |
| `scan.exclude` | いいえ | `string[]` | — | スキャン対象から除外するファイルの glob パターンです。 |
| `chapters` | いいえ | `string[]` | — | 章ファイル名の並び順リストです（例: `["overview", "architecture"]`）。プリセットで定義された章順を上書きします。 |
| `agentWorkDir` | いいえ | `string` | `".tmp"` | エージェントがファイル操作に使う作業ディレクトリです。 |
| `flow` | いいえ | `Object` | — | SDD フローの設定です。 |
| `flow.merge` | いいえ | `string` | `"squash"` | フロー完了時のマージ戦略です。`"squash"`、`"ff-only"`、`"merge"` を受け付けます。 |
| `providers` | いいえ | `Object` | — | 名前付きの AI エージェントプロバイダー定義です。各キーがプロバイダー名になります。 |
| `providers.<name>.command` | 条件付き | `string` | — | 各プロバイダーで必須です。実行するコマンドを指定します（例: `"claude"`、`"codex"`）。 |
| `providers.<name>.args` | 条件付き | `string[]` | — | 各プロバイダーで必須です。コマンド引数です。プロンプト本文の差し込み位置には `{{PROMPT}}` を使用します。 |
| `providers.<name>.name` | いいえ | `string` | — | プロバイダーの表示名です。 |
| `providers.<name>.timeoutMs` | いいえ | `number` | — | プロバイダー固有のタイムアウト時間（ミリ秒）です。 |
| `providers.<name>.systemPromptFlag` | いいえ | `string` | — | システムプロンプトを渡すための CLI フラグ名です（例: `"--system-prompt"`）。 |
<!-- {{/text}} -->

### カスタマイズポイント

<!-- {{text[mode=deep]: Describe items that users can customize. Extract configurable items from the source code and include configuration examples for each.}} -->
sdd-forge の挙動は、いくつかの設定領域を通じて調整できます。

**プロジェクト種別の選択**

`type` フィールドは、どのプリセットを読み込むかを決定します。これにより、スキャンパターン、章構成、利用可能な DataSources が切り替わります。短いエイリアスにも対応しており、自動的に解決されます。

```json
{ "type": "webapp/laravel" }
```

または同等の指定として:

```json
{ "type": "laravel" }
```

**文書スタイル**

`documentStyle` オブジェクトでは、生成される文章の目的と文体を制御します。`customInstruction` を追加すると、プロジェクト固有の執筆ガイドラインを差し込めます。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "casual",
    "customInstruction": "Use concrete examples wherever possible."
  }
}
```

**多言語出力**

`output` を設定すると、複数言語でドキュメントを生成できます。`mode` フィールドは、既定言語から機械翻訳するか、各言語を個別に生成するかを制御します。

```json
{
  "output": {
    "languages": ["en", "ja"],
    "default": "en",
    "mode": "translate"
  }
}
```

**章の並び順**

プリセット既定の章順を上書きしたい場合は、希望する順序で章ファイル名を並べて指定します。

```json
{
  "chapters": ["overview", "architecture", "configuration", "cli_commands"]
}
```

**AI エージェントプロバイダー**

1 つ以上のエージェントプロバイダーを定義し、それぞれにコマンド、引数、必要に応じてプロファイルを設定できます。`{{PROMPT}}` プレースホルダーは、実行時に実際のプロンプト本文へ置き換えられます。

```json
{
  "providers": {
    "claude": {
      "name": "claude-cli",
      "command": "claude",
      "args": ["-p", "{{PROMPT}}"],
      "systemPromptFlag": "--system-prompt"
    },
    "codex": {
      "name": "codex-cli",
      "command": "codex",
      "args": ["exec", "--full-auto", "-C", ".tmp", "{{PROMPT}}"]
    }
  }
}
```

**並列実行数とタイムアウトの上限**

並列処理数やエージェントのタイムアウトしきい値を、使用するハードウェアや CI 環境に合わせて調整できます。

```json
{
  "limits": {
    "concurrency": 10,
    "agentTimeout": 600
  }
}
```

**前置き文の除去**

LLM の応答には、不要な書き出し文が含まれることがあります。`preamblePatterns` を設定すると、それらを自動的に取り除けます。

```json
{
  "textFill": {
    "preamblePatterns": [
      { "pattern": "^(Here is|以下に|Based on)", "flags": "i" }
    ]
  }
}
```

**フローマージ戦略**

SDD フローのブランチを main ブランチへどのように取り込むかを制御します。

```json
{
  "flow": {
    "merge": "ff-only"
  }
}
```
<!-- {{/text}} -->

### 環境変数

<!-- {{text[mode=deep]: List all environment variables referenced by the tool and their purposes in table format. Extract from process.env references in the source code.}} -->
sdd-forge は実行時に次の環境変数を参照します。いずれも任意です。

| 変数 | 用途 | 既定の挙動 |
|---|---|---|
| `SDD_WORK_ROOT` | sdd-forge が `.sdd-forge/`、`docs/`、`specs/` を探す作業ルートディレクトリを上書きします。ソースコードと出力先ディレクトリが異なるプロジェクトモードで使います。 | `git rev-parse --show-toplevel` によって検出されます。Git リポジトリ外の場合は、現在の作業ディレクトリにフォールバックします。 |
| `SDD_SOURCE_ROOT` | ファイルスキャンと解析に使うソースコードルートディレクトリを上書きします。作業ルートとスキャン対象を分離できます。 | 作業ルートと同じです（`repoRoot()` が返す値）。 |
| `CLAUDECODE` | sdd-forge 自体は読み取りません。この変数は AI エージェントの子プロセスを起動する前に環境変数から明示的に削除され、Claude CLI の内部マーカーが入れ子の呼び出しへ引き継がれないようにしています。 | 該当なし。`src/lib/agent.js` で子プロセス環境から削除されます。 |

これらの変数は、一般的にはエンドユーザーが直接設定するのではなく、ラッパースクリプトや CI パイプラインで設定されます。単一リポジトリの大半のプロジェクトでは、sdd-forge がリポジトリルートを自動検出するため、`SDD_WORK_ROOT` も `SDD_SOURCE_ROOT` も設定する必要はありません。
<!-- {{/text}} -->
