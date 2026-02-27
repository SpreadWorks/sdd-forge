# 03. 設定とカスタマイズ

## 説明

<!-- @text-fill: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge の動作は `.sdd-forge/config.json` を中心とした複数の JSON 設定ファイルによって制御され、言語・テンプレートタイプ・AIプロバイダー・タイムアウト・テキスト生成挙動など幅広い項目をカスタマイズできる。プロジェクトごとのテンプレート差し替えは `project-overrides.json`、解析結果の表現上書きは `overrides.json` で行い、関心ごとに設定を分離できる構成になっている。


## 内容

### 設定ファイル

<!-- @text-fill: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイル | 配置場所 | 役割 | 参照コマンド |
|---|---|---|---|
| `config.json` | `.sdd-forge/config.json` | メイン設定ファイル。`lang`・`type`・`providers`・`defaultAgent`・`agents`・`textFill`・`limits` を定義する。 | `init`, `forge`, `tfill`, `readme` |
| `project-overrides.json` | `.sdd-forge/project-overrides.json` | `sdd-forge init` 実行時にテンプレートへ適用するファイル単位の差し替え・挿入アクションを定義する。存在しない場合は無視される。 | `init` |
| `overrides.json` | `.sdd-forge/overrides.json` | ドキュメント生成時にリゾルバー（`resolver.js`）が参照するセクション・キーの説明文オーバーライドを定義する。存在しない場合は空オブジェクトとして扱う。 | `populate`, `tfill` |
| `analysis.json` | `.sdd-forge/output/analysis.json` | `sdd-forge scan` が生成するソースコード解析結果。`@data-fill` / `@text-fill` ディレクティブ解決の入力データとなる。 | `populate`, `tfill`, `forge` |
| `projects.json` | `<CLI実行ディレクトリ>/projects.json` | 複数プロジェクトの登録テーブル。プロジェクト名→パスのマッピングとデフォルトプロジェクトを保持する。`sdd-forge add` で生成される。 | `add`, `default`, 全コマンド（`--project` 解決） |
| `package.json` | `<プロジェクトルート>/package.json` | `docsInit.defaultType` フィールドを `sdd-forge init` の `type` フォールバックとして参照する。 | `init` |


### 設定項目リファレンス

<!-- @text-fill: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

`.sdd-forge/config.json` の全フィールドを以下に示す。

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `lang` | string | `"ja"` | ドキュメントテンプレートのロケール。`sdd-forge init` がテンプレート選択に使用する。現在 `"ja"` のみサポート。 |
| `type` | string | なし（必須） | テンプレートタイプ。`"php-mvc"` または `"node-cli"` を指定する。`sdd-forge init` がドキュメント構成の選択に使用する。 |
| `limits.designTimeoutMs` | number | `900000` | エージェント呼び出し 1 回あたりのタイムアウト（ミリ秒）。`sdd-forge forge` および `sdd-forge tfill` が参照する。 |
| `defaultAgent` | string | なし | `providers` に登録されたキー名。`--agent` 未指定時に使用されるプロバイダー。 |
| `providers.<key>.name` | string | なし | プロバイダーの表示名（任意）。 |
| `providers.<key>.command` | string | 必須 | 実行するコマンド名またはパス。 |
| `providers.<key>.args` | string[] | `[]` | コマンドに渡す引数の配列。`{{PROMPT}}` を含めるとその位置にプロンプトが展開される。含めない場合はプロンプトが末尾に追加される。 |
| `agents.<role>.provider` | string | なし | ロール（`docsForge` 等）ごとに使用するプロバイダーキー。未指定時は `defaultAgent` にフォールバックする。`forge.js` が参照する。 |
| `textFill.projectContext` | string | `""` | `@text-fill` ディレクティブ解決時にプロンプトへ注入するプロジェクト説明文。 |
| `textFill.preamblePatterns` | array | `[]` | エージェント出力の前置き行を除去するための正規表現パターン定義。各要素は `{ "pattern": string, "flags": string }` 形式。 |


### カスタマイズポイント

<!-- @text-fill: ユーザーがカスタマイズできる項目（プロバイダー・テンプレート・コマンド等）を説明してください。カスタマイズ例を含めること。 -->

主なカスタマイズポイントは以下の 4 つである。

**エージェントプロバイダー**: `providers` フィールドに任意のキー名でコマンドと引数を定義し、`defaultAgent` で既定プロバイダーを指定する。引数配列に `{{PROMPT}}` を含めるとその位置にプロンプトが展開され、含めない場合はプロンプトが末尾に追加される。`forge --agent <key>` でコマンドラインから一時的に切り替えることも可能。

```json
"providers": {
  "claude": {
    "name": "claude-cli",
    "command": "claude",
    "args": ["--model", "sonnet", "-p", "{{PROMPT}}"]
  },
  "custom-llm": {
    "command": "my-llm",
    "args": ["--prompt", "{{PROMPT}}", "--max-tokens", "2000"]
  }
},
"defaultAgent": "custom-llm"
```

**テンプレートタイプ**: `type` フィールドで `php-mvc` または `node-cli` を選択する。`sdd-forge init` はこの値をもとにドキュメントテンプレートを `docs/` へ展開する。

**プロジェクトオーバーライド**: `.sdd-forge/project-overrides.json` を作成し、`replace-directive` / `insert-after` / `insert-before` アクションでテンプレートの特定セクションをプロジェクト固有の内容に差し替えられる。`sdd-forge init` 実行時に自動適用される。

**レビューコマンド**: `sdd-forge forge --review-cmd "<コマンド>"` でレビュー判定に使うコマンドを差し替えられる。CI スクリプトや独自チェックスクリプトを指定することで、forge ループの合否基準を変更できる。


### 環境変数

<!-- @text-fill: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 変数名 | 設定主体 | 用途 |
|---|---|---|
| `SDD_WORK_ROOT` | CLI 自動設定 | 作業ルートの絶対パス。`docs/`・`specs/`・`.sdd-forge/` の起点となる。`--project` でプロジェクトが解決された場合に `bin/sdd-forge.js` が自動設定し、`lib/cli.js` の `repoRoot()` が参照する。未設定時は `git rev-parse --show-toplevel` の結果または `process.cwd()` を使用する。 |
| `SDD_SOURCE_ROOT` | CLI 自動設定 | 解析対象プロジェクトのソースルート絶対パス。`--project` でプロジェクトが解決された場合に `bin/sdd-forge.js` が自動設定し、`lib/cli.js` の `sourceRoot()` が参照する。未設定時は `SDD_WORK_ROOT`（または `repoRoot()`）と同じ値を返す。 |
| `CLAUDECODE` | claude CLI が設定 | `engine/tfill.js` がエージェントとして claude CLI を起動する際、ネスト起動ガードを回避するためにサブプロセスの環境変数から削除する。ユーザーが直接設定する変数ではない。 |

`SDD_WORK_ROOT` と `SDD_SOURCE_ROOT` は通常ユーザーが手動設定する必要はなく、`sdd-forge --project <name>` 実行時に登録済みプロジェクト情報から自動的に注入される。プロジェクト登録なしで単体ディレクトリから実行する場合、これらは設定されず `git rev-parse` または `process.cwd()` が代替として機能する。
