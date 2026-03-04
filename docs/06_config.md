# 06. 設定とカスタマイズ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/` ディレクトリに配置された JSON 形式の設定ファイル群によって動作を制御します。プロジェクトタイプ・出力言語・AIエージェント定義・ドキュメントスタイルなどを設定でき、`sdd-forge setup` による対話的セットアップまたはファイルの直接編集によってカスタマイズできます。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクトタイプ・出力言語・AIエージェント・ドキュメントスタイルなど主要設定を定義する必須ファイルです。 |
| `context.json` | `.sdd-forge/context.json` | プロジェクト概要テキストなどの動的コンテキスト情報を保持します。存在しない場合は空オブジェクトとして扱われます。 |
| `projects.json` | `.sdd-forge/projects.json` | 複数プロジェクトを管理する場合の登録簿です。各プロジェクトのソースパスと出力先パスを定義します。 |
| `overrides.json` | `.sdd-forge/overrides.json` | ドキュメント生成後の調整ルールを記述する任意ファイルです。特定セクションのディレクティブ置き換えや行挿入を指定できます。 |
| `output/analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成するコード構造解析データです。ドキュメント生成コマンドの入力として使用されます。 |
| `output/summary.json` | `.sdd-forge/output/summary.json` | `analysis.json` の軽量版です。AI に渡すコマンド（`forge`・`agents` など）はこちらを優先して使用します。 |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

以下は `.sdd-forge/config.json` の全フィールドです。

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `lang` | `string` | なし（必須） | ドキュメントのデフォルト出力言語（例: `"ja"`・`"en"`）。後方互換のために残されており、`output.default` と同義です。 |
| `type` | `string` | なし（必須） | プロジェクトタイプ（例: `"cli/node-cli"`・`"webapp/cakephp2"`）。スキャンや初期化テンプレートの選択に使用されます。 |
| `uiLang` | `string` | なし | CLIの表示言語。`"ja"` または `"en"` を指定します。 |
| `output.languages` | `string[]` | なし | サポートする出力言語の配列（例: `["ja", "en"]`）。 |
| `output.default` | `string` | なし | `output.languages` に含まれるデフォルト言語を指定します。 |
| `documentStyle.purpose` | `string` | なし | ドキュメントの用途。`"developer-guide"`・`"user-guide"`・`"api-reference"` などを指定します。 |
| `documentStyle.tone` | `string` | なし（必須） | 生成テキストの文体。`"polite"`・`"formal"`・`"casual"` から選択します。 |
| `documentStyle.customInstruction` | `string` | なし | テキスト生成時に追加で与える任意の指示文です。 |
| `textFill.projectContext` | `string` | `""` | プロジェクト全体の概要説明テキストです。`context.json` の値が優先されます。 |
| `textFill.preamblePatterns` | `object[]` | なし | LLM 出力から除去する前置き文パターンの配列。各要素は `pattern`（正規表現）と `flags` を持ちます。 |
| `limits.designTimeoutMs` | `number` | `120000` | AI 呼び出しのタイムアウト（ミリ秒）です。 |
| `limits.concurrency` | `number` | `5` | ドキュメントファイルを並行処理する最大数です。 |
| `defaultAgent` | `string` | なし | `providers` のキー名でデフォルトの AI エージェントを指定します。 |
| `providers.<name>.command` | `string` | なし | エージェント実行コマンド（例: `"claude"`）です。 |
| `providers.<name>.args` | `string[]` | なし | コマンド引数の配列。`{{PROMPT}}` プレースホルダーを含めることができます。 |
| `providers.<name>.systemPromptFlag` | `string` | なし | システムプロンプト指定フラグ（例: `"--system-prompt"`）です。 |
| `providers.<name>.timeoutMs` | `number` | なし | エージェント個別のタイムアウト（ミリ秒）です。 |
| `flow.merge` | `string` | `"squash"` | feature ブランチのマージ戦略。`"squash"`・`"ff-only"`・`"merge"` から選択します。 |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目を説明してください。カスタマイズ例を含めること。 -->

**ドキュメントスタイルの変更**

`documentStyle` フィールドを編集することで、生成テキストの文体や目的を変更できます。たとえば利用者向けガイドをです・ます調で生成するには次のように設定します。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "です・ます調で記述すること"
  }
}
```

**カスタム AI エージェントの追加**

`providers` に任意のキーを追加することで、独自のエージェントコマンドを定義できます。`{{PROMPT}}` プレースホルダーがない場合はプロンプトがコマンドの末尾に追加されます。

```json
{
  "providers": {
    "my-agent": {
      "name": "My Custom Agent",
      "command": "my-llm-cli",
      "args": ["--output", "markdown", "{{PROMPT}}"],
      "systemPromptFlag": "--system",
      "timeoutMs": 180000
    }
  },
  "defaultAgent": "my-agent"
}
```

**前置き除去パターンの追加**

LLM が出力する「以下に示します」などの前置き文を自動除去するパターンを `textFill.preamblePatterns` に追加できます。

```json
{
  "textFill": {
    "preamblePatterns": [
      { "pattern": "^(Here is|以下に|Based on)", "flags": "i" },
      { "pattern": "^Sure,", "flags": "i" }
    ]
  }
}
```

**AGENTS.md への業務背景の追記**

プロジェクトルートの `AGENTS.md`（または `CLAUDE.md`）の `<!-- MANUAL:START -->` 〜 `<!-- MANUAL:END -->` ブロック内に、AI への補足情報を自由に記述できます。このブロック外の内容は `sdd-forge` コマンド実行時に上書きされます。

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数 | 用途 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象ソースコードのルートパスを指定します。`sdd-forge.js` がプロジェクト解決後に自動設定します。手動で設定することで特定のソースディレクトリを強制的に指定できます。 |
| `SDD_WORK_ROOT` | ドキュメント出力先（`.sdd-forge/` を含むディレクトリ）のパスを指定します。`sdd-forge.js` がプロジェクト解決後に自動設定します。`SDD_SOURCE_ROOT` と異なるパスを指定することで、ソースと出力を分離できます。 |

`SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` は `sdd-forge.js` が `projects.json` のプロジェクト定義をもとに自動設定します。`--project <name>` フラグで対象プロジェクトを明示的に指定しない場合は `default` に設定されたプロジェクトが使用されます。これらの環境変数が未設定の場合、各コマンドは git リポジトリルートまたはカレントディレクトリを代替値として使用します。
