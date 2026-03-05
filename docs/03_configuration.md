# 03. 設定とカスタマイズ

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。}} -->

本章では、sdd-forge が読み込む設定ファイルの構成と各設定項目の意味、AIプロバイダーやドキュメントスタイルといったカスタマイズポイントについて説明します。設定ファイルはすべてプロジェクトルート直下の `.sdd-forge/` ディレクトリに配置され、プロジェクト種別・出力言語・AI連携など幅広い動作をコントロールできます。

## 内容

### 設定ファイル

<!-- {{text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。}} -->

| ファイル | 配置場所 | 役割 |
|---|---|---|
| `config.json` | `.sdd-forge/config.json` | プロジェクト全体の設定（種別・言語・AIプロバイダー・フロー動作など） |
| `context.json` | `.sdd-forge/context.json` | AI に渡すプロジェクトコンテキスト文字列（`projectContext` フィールド） |
| `projects.json` | `.sdd-forge/projects.json` | マルチプロジェクト登録情報（`--project` フラグで参照） |
| `current-spec` | `.sdd-forge/current-spec` | 現在作業中の spec ファイルパス（SDD フロー終了時に削除） |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が出力するソースコード解析結果（コンパクト JSON） |
| `summary.json` | `.sdd-forge/output/summary.json` | `analysis.json` の軽量版。AI 入力用に優先使用され、存在しない場合は `analysis.json` にフォールバックします |

### 設定項目リファレンス

<!-- {{text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。}} -->

以下は `config.json` の主要フィールド一覧です。

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `type` | `string` | — | プロジェクト種別。プリセットを特定するキーとして使用されます（例: `webapp/cakephp2`, `cli/node-cli`）。エイリアス（短縮形）も使用可能です |
| `lang` | `string` | `"ja"` | ドキュメント出力言語（`ja` または `en`） |
| `uiLang` | `string` | `"ja"` | CLI のメッセージ表示言語（`ja` または `en`） |
| `defaultAgent` | `string` | — | `providers` に定義したエージェント名のうち、デフォルトで使用するもの |
| `providers` | `object` | — | AI エージェント定義のマップ。各エントリに `command`・`args`・`systemPromptFlag` を指定します |
| `providers.<name>.command` | `string` | — | AI CLI の実行コマンド |
| `providers.<name>.args` | `string[]` | `[]` | AI CLI に渡す追加引数 |
| `providers.<name>.systemPromptFlag` | `string` | — | システムプロンプトを渡すフラグ名（例: `--system-prompt`） |
| `documentStyle.purpose` | `string` | — | ドキュメントの目的・用途を記述するフィールド |
| `documentStyle.tone` | `string` | — | ドキュメントのトーン・文体指定 |
| `documentStyle.customInstruction` | `string` | — | AI 生成時に追加するカスタム指示文 |
| `flow.merge` | `string` | `"squash"` | SDD フローでのマージ戦略（`squash` / `ff-only` / `merge`） |

### カスタマイズポイント

<!-- {{text: ユーザーがカスタマイズできる項目（プロバイダー・テンプレート・コマンド等）を説明してください。カスタマイズ例を含めること。}} -->

**AIプロバイダーの切り替え**

`config.json` の `providers` に複数のエージェントを定義し、`defaultAgent` で使用するものを指定できます。`sdd-forge text --agent <name>` でコマンド単位に切り替えることも可能です。

```json
{
  "defaultAgent": "claude",
  "providers": {
    "claude": {
      "command": "claude",
      "args": [],
      "systemPromptFlag": "--system-prompt"
    }
  }
}
```

**ドキュメントスタイルの調整**

`documentStyle` フィールドを使うと、AI が生成するドキュメントのトーンや目的を統一できます。たとえば利用者向けの操作ガイドであれば `tone` に `"丁寧・です・ます調"` を指定し、`purpose` に `"エンドユーザー向け操作手順"` と記述することで、AI 生成テキスト全体に一貫したスタイルを適用できます。

**テンプレートのカスタマイズ**

`sdd-forge init` が参照するドキュメントテンプレートは `src/templates/` 以下にバンドルされています。プリセットごとのテンプレートを上書きしたい場合は、プロジェクトの `docs/` ディレクトリ内に対応するファイルを配置することで差し替えが可能です。手動で追記・変更したい箇所は必ず `<!-- MANUAL:START -->` 〜 `<!-- MANUAL:END -->` ブロック内に記述してください。ブロック外の内容は `sdd-forge forge` 実行時に上書きされます。

**マージ戦略の変更**

`flow.merge` を変更することで、SDD フロー完了時の git マージ動作を切り替えられます。チームのブランチ運用ポリシーに合わせて `squash`・`ff-only`・`merge` から選択してください。

### 環境変数

<!-- {{text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。}} -->

| 環境変数 | 用途 |
|---|---|
| `SDD_SOURCE_ROOT` | 解析対象プロジェクトのソースコードルートディレクトリパス。`--project` フラグ使用時にプロジェクトコンテキストとして伝播されます |
| `SDD_WORK_ROOT` | sdd-forge の作業ディレクトリパス（`.sdd-forge/` の親）。マルチプロジェクト構成で複数プロジェクトを切り替える際に参照されます |
