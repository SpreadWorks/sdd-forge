# 03. 設定とカスタマイズ

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge の動作は `.sdd-forge/config.json`（主設定）と `.sdd-forge/context.json`（プロジェクト概要）の2ファイルで制御します。プロジェクト種別・出力言語・AIプロバイダー・ドキュメントスタイルなどをこれらのファイルで設定でき、`sdd-forge setup` を実行すると対話形式で初期値が生成されます。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル | 配置場所 | 役割 | 手動編集 |
|---|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクト種別・出力言語・AIプロバイダー・ドキュメントスタイルを定義するメイン設定ファイル | ○ |
| `context.json` | `.sdd-forge/context.json` | プロジェクト概要テキストを保存するファイル。`config.json` の `textFill.projectContext` より優先して参照される | ○ |
| `projects.json` | `.sdd-forge/projects.json`（コマンド実行ディレクトリ） | マルチプロジェクト構成時のプロジェクト登録一覧。`sdd-forge setup` で自動生成される | ○ |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

以下は `.sdd-forge/config.json` の全フィールドです。

| フィールド名 | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `uiLang` | `string` | `"en"` | sdd-forge 自体のメッセージ表示言語。`"ja"` または `"en"` を指定します |
| `lang` | `string` | — | ドキュメントのデフォルト出力言語（必須）。`output.default` と同値にします |
| `type` | `string` | — | プロジェクト種別（必須）。例: `"webapp/cakephp2"`、`"cli/node-cli"` |
| `output.languages` | `string[]` | — | ドキュメントを生成する言語コードの配列。例: `["ja"]`、`["ja", "en"]` |
| `output.default` | `string` | — | `output.languages` のうちデフォルトとする言語コード |
| `documentStyle.purpose` | `string` | — | ドキュメントの目的。`"developer-guide"`・`"user-guide"`・`"api-reference"` または任意の文字列 |
| `documentStyle.tone` | `string` | — | 文体。`"polite"`（丁寧）・`"formal"`（硬め）・`"casual"`（カジュアル）のいずれか |
| `documentStyle.customInstruction` | `string` | なし | AIに与える追加指示。ドキュメント生成時のプロンプトに付加されます |
| `textFill.projectContext` | `string` | `""` | プロジェクト概要テキスト。`context.json` が存在する場合はそちらが優先されます |
| `textFill.preamblePatterns` | `{ pattern: string, flags?: string }[]` | `[{ pattern: "^(Here is\|以下に\|Based on)", flags: "i" }]` | LLM出力から除去する前置き文のパターン（正規表現） |
| `defaultAgent` | `string` | — | 使用するAIプロバイダー名。`providers` に定義したキーを指定します |
| `providers.<name>.name` | `string` | — | プロバイダーの表示名 |
| `providers.<name>.command` | `string` | — | 実行するコマンド名（必須）。例: `"claude"`、`"codex"` |
| `providers.<name>.args` | `string[]` | — | コマンド引数の配列（必須）。`{{PROMPT}}` プレースホルダーを使用できます |
| `providers.<name>.timeoutMs` | `number` | `120000` | AIコマンドのタイムアウト時間（ミリ秒） |
| `providers.<name>.systemPromptFlag` | `string` | なし | システムプロンプトを渡すフラグ。`"--system-prompt"` または `"--system-prompt-file"` |
| `flow.merge` | `string` | `"squash"` | `sdd-forge flow` でブランチをマージする際の戦略。`"squash"`・`"ff-only"`・`"merge"` のいずれか |
| `limits.designTimeoutMs` | `number` | — | ドキュメント設計フェーズのタイムアウト（ミリ秒） |
| `limits.concurrency` | `number` | `5` | ファイルごとのAI並列実行数 |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目（プロバイダー・テンプレート・コマンド等）を説明してください。カスタマイズ例を含めること。 -->

**AIプロバイダーの切り替え**

`providers` に任意のコマンドを登録し、`defaultAgent` でそれを指定することで使用するAIを切り替えられます。`args` 内の `{{PROMPT}}` にプロンプト文字列が挿入されます。`{{PROMPT}}` を省略した場合はコマンドの末尾に追加されます。

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "name": "claude-cli",
      "command": "claude",
      "args": ["--model", "opus", "-p", "{{PROMPT}}"],
      "systemPromptFlag": "--system-prompt",
      "timeoutMs": 180000
    }
  }
}
```

**ドキュメントスタイルのカスタマイズ**

`documentStyle.customInstruction` にAIへの追加指示を記述することで、生成されるドキュメントの内容や観点を調整できます。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "初心者向けにわかりやすく説明し、コマンド例を必ず含めてください。"
  }
}
```

**プロジェクト概要テキストの管理**

`.sdd-forge/context.json` にプロジェクト概要を記述しておくと、ドキュメント生成時のコンテキストとして参照されます。`setup` の対話ステップで入力した内容がここに保存されます。手動で直接編集することも可能です。

```json
{
  "projectContext": "動画コンテンツを管理するCMS。管理者向けの動画登録・公開フローと視聴者向けの再生機能を備える。"
}
```

**マルチプロジェクト管理**

複数のプロジェクトを一元管理する場合は `.sdd-forge/projects.json` にプロジェクトを登録し、`--project` オプションで切り替えます。

```bash
sdd-forge --project frontend scan
sdd-forge --project backend forge --prompt "API仕様を更新"
```

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数名 | 用途 | 設定タイミング |
|---|---|---|
| `SDD_SOURCE_ROOT` | 解析対象ソースコードのルートディレクトリ。`--project` オプション指定時に `projects.json` の `path` から自動設定されます | `sdd-forge` エントリポイントが自動設定。手動設定も可 |
| `SDD_WORK_ROOT` | `.sdd-forge/` 出力ディレクトリのルートパス。`config.json` や `analysis.json` の読み書き先として参照されます | `sdd-forge` エントリポイントが自動設定。手動設定も可 |

環境変数を手動で設定することで、`--project` オプションを使わずに実行するプロジェクトを固定することもできます。

```bash
export SDD_SOURCE_ROOT=/path/to/source
export SDD_WORK_ROOT=/path/to/source/.sdd-forge
sdd-forge scan
```
