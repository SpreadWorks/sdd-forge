# 03. 設定とカスタマイズ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/` ディレクトリ配下の JSON ファイル群によって動作を制御します。プロジェクト種別・出力言語・AI プロバイダー・ドキュメントスタイルなど、ツールの主要な挙動はこれらの設定ファイルから読み込まれ、環境変数によって実行環境ごとに上書きすることもできます。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクト設定の本体。`type`・`lang`・`providers`・`documentStyle` などを定義します。 |
| `context.json` | `.sdd-forge/context.json` | プロジェクト概要テキスト（`projectContext`）を格納します。AI へのコンテキスト注入に使用されます。 |
| `projects.json` | `.sdd-forge/projects.json` | マルチプロジェクト構成時に、対象プロジェクトのパスとデフォルト設定を管理します。 |
| `current-spec` | `.sdd-forge/current-spec` | 現在進行中の SDD フローで使用中の spec ファイルパスを保持します。フロー終了時に削除されます。 |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が出力するソースコード解析結果（コンパクト JSON）です。 |
| `summary.json` | `.sdd-forge/output/summary.json` | `analysis.json` の軽量版です。AI 入力用に優先して使用されます。 |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

**config.json**

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `type` | string | （必須） | プロジェクト種別（例: `webapp/cakephp2`、`cli/node-cli`）。短縮エイリアス（例: `cakephp2`）も使用できます。 |
| `lang` | string | （必須） | ドキュメント出力のデフォルト言語（`ja` / `en`）。 |
| `uiLang` | string | — | CLI メッセージの表示言語（`ja` / `en`）。省略時はシステムデフォルトに従います。 |
| `output.languages` | string[] | — | 出力言語のリスト（例: `["ja"]`、`["en", "ja"]`）。 |
| `output.default` | string | — | `output.languages` の中でデフォルトとする言語。`lang` フィールドと対応します。 |
| `defaultAgent` | string | — | AI エージェントのデフォルト名。`providers` に定義したキーを指定します。 |
| `providers.<name>.command` | string | — | AI エージェントの実行コマンド（例: `claude`）。 |
| `providers.<name>.args` | string[] | — | コマンド引数の配列。`{{PROMPT}}` プレースホルダーが使用できます。 |
| `providers.<name>.timeoutMs` | number | — | エージェント呼び出しのタイムアウト（ミリ秒）。 |
| `providers.<name>.systemPromptFlag` | string | — | システムプロンプトを渡すフラグ（例: `--system-prompt`、`--system-prompt-file`）。 |
| `documentStyle.purpose` | string | — | ドキュメントの用途（`developer-guide` / `user-guide` / `api-reference` または任意文字列）。 |
| `documentStyle.tone` | string | — | 文体（`polite` / `formal` / `casual`）。 |
| `documentStyle.customInstruction` | string | — | AI へ渡す追加指示テキスト（任意）。 |
| `textFill.projectContext` | string | — | プロジェクト概要テキスト。`context.json` の同名フィールドが存在する場合はそちらが優先されます。 |
| `textFill.preamblePatterns` | object[] | — | AI 出力から除去するプレフィックスパターン（正規表現）の配列。`pattern` と `flags` を持つオブジェクトで指定します。 |
| `limits.designTimeoutMs` | number | — | 設計フェーズのタイムアウト（ミリ秒）。 |
| `limits.concurrency` | number | `5` | ファイル単位の並行処理数。 |
| `flow.merge` | string | `squash` | feature ブランチのマージ戦略（`squash` / `ff-only` / `merge`）。 |

**context.json**

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `projectContext` | string | — | プロジェクト概要テキスト。AI へのコンテキスト注入に使用されます。`config.json` の `textFill.projectContext` より優先されます。 |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目（プロバイダー・テンプレート・コマンド等）を説明してください。カスタマイズ例を含めること。 -->

**AI プロバイダーの追加**

`config.json` の `providers` フィールドに任意の AI エージェントを定義できます。`command` と `args` を指定し、`args` の中で `{{PROMPT}}` プレースホルダーを使うとプロンプトが自動的に埋め込まれます。`defaultAgent` に定義したキー名を設定すると、コマンドごとに `--agent` を指定しなくても使用されます。

```json
{
  "defaultAgent": "my-ai",
  "providers": {
    "my-ai": {
      "command": "claude",
      "args": ["--print", "{{PROMPT}}"],
      "timeoutMs": 60000,
      "systemPromptFlag": "--system-prompt"
    }
  }
}
```

**ドキュメントスタイルの調整**

`documentStyle` フィールドで生成ドキュメントのトーンや用途を指定できます。`customInstruction` を使うと、AI への追加指示を自由に記述できます。

```json
{
  "documentStyle": {
    "purpose": "user-guide",
    "tone": "polite",
    "customInstruction": "利用者は非エンジニアを想定してください。専門用語には必ず補足を付けてください。"
  }
}
```

**マージ戦略の変更**

`flow.merge` を変更することで、SDD フローでの feature ブランチ統合方法を切り替えられます。CI 要件やチームの運用ルールに合わせて `squash`・`ff-only`・`merge` から選択してください。

**プロジェクトコンテキストの設定**

`context.json` の `projectContext` にプロジェクト概要を記述することで、AI が生成するドキュメントの品質を向上させられます。`sdd-forge setup` 実行時に対話形式で設定できるほか、直接ファイルを編集しても構いません。

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数 | 用途 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象のソースコードが配置されているルートディレクトリを指定します。マルチプロジェクトモードでプロジェクトごとのソースパスを伝播する際に使用されます。未設定時は `SDD_WORK_ROOT` または git リポジトリルートにフォールバックします。 |
| `SDD_WORK_ROOT` | sdd-forge が設定ファイル・出力ファイルを読み書きする作業ルートを指定します。未設定時は `git rev-parse --show-toplevel` で取得したリポジトリルート、それも失敗した場合は `process.cwd()` が使用されます。 |
