# 03. 設定とカスタマイズ

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。設定ファイルの種類・設定可能な項目の範囲・カスタマイズポイントを踏まえること。 -->

sdd-forge は `.sdd-forge/` ディレクトリ内の JSON ファイル群によって動作を制御する。AIプロバイダー・言語・タイムアウト・テキスト補完コンテキスト・ドキュメントオーバーライドの各項目をプロジェクトごとにカスタマイズできる。

## 内容

### 設定ファイル

<!-- @text: このツールが読み込む設定ファイルの一覧と、それぞれの配置場所・役割を表形式で記述してください。 -->

| ファイルパス | 配置場所 | 役割 |
|---|---|---|
| `.sdd-forge/config.json` | プロジェクトルート直下 | 言語・プロジェクト種別・AIプロバイダー・タイムアウト・テキスト補完設定など主要設定を保持する |
| `.sdd-forge/project-overrides.json` | プロジェクトルート直下 | テーブル説明・コントローラ説明など解析結果への補足・上書きデータを保持する |
| `.sdd-forge/overrides.json` | プロジェクトルート直下 | ドキュメントディレクティブの差し替え・追加（`replace-directive`, `insert-after`）を定義する |
| `projects.json` | sdd-forge パッケージ実行ディレクトリ | マルチプロジェクト管理。プロジェクト名と対象パスの対応・デフォルトプロジェクトを保持する |

### 設定項目リファレンス

<!-- @text: 設定ファイルの全フィールドを表形式で記述してください。フィールド名・型・デフォルト値・説明を含めること。 -->

`.sdd-forge/config.json` の全フィールドを示す。

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `lang` | string | (必須) | ドキュメントの言語（例: `"ja"`）。テンプレート選択に使用する |
| `type` | string | (必須) | プロジェクト種別（例: `"php-mvc"`, `"node-cli"`）。`sdd-forge init` のテンプレート選択に使用する |
| `limits.designTimeoutMs` | number | 180000 | AIエージェント実行のタイムアウト（ミリ秒）。`forge` コマンドが参照する |
| `textFill.projectContext` | string | `""` | `@text` ディレクティブ解決時にAIへ渡すプロジェクト説明文 |
| `textFill.preamblePatterns` | array | `[]` | AI出力の前置き行を除去する正規表現パターン配列。各要素は `{ pattern, flags }` 形式 |
| `defaultAgent` | string | (なし) | `providers` のキー名。`--agent` 未指定時に使用するAIプロバイダーを指定する |
| `providers.<key>.name` | string | (必須) | プロバイダーの表示名（ログ出力に使用） |
| `providers.<key>.command` | string | (必須) | 実行コマンド（シェルから呼び出すCLIコマンド名） |
| `providers.<key>.args` | array | `[]` | コマンド引数。`{{PROMPT}}` トークンが実行時にプロンプト文字列へ置換される |
| `providers.<key>.timeoutMs` | number | `limits.designTimeoutMs` の値 | プロバイダー個別のタイムアウト（ミリ秒） |

### カスタマイズポイント

<!-- @text: ユーザーがカスタマイズできる項目（プロバイダー・テンプレート・コマンド等）を説明してください。カスタマイズ例を含めること。 -->

**AIプロバイダーの追加・切り替え**

`providers` に任意のキーを追加することで、Claude 以外のCLI AIエージェントを利用できる。`sdd-forge forge --agent <key>` でプロバイダーを切り替える。

```json
"providers": {
  "my-agent": {
    "name": "my-agent-cli",
    "command": "my-agent",
    "args": ["--print", "{{PROMPT}}"]
  }
}
```

**レビューコマンドの差し替え**

`sdd-forge forge --review-cmd "npm run lint:docs"` のように `--review-cmd` オプションでドキュメントレビューに使用するコマンドを変更できる。デフォルトは `npm run sdd:review`。

**ドキュメント構造のオーバーライド**

`.sdd-forge/overrides.json` の `replace-directive` アクションでテンプレートが生成したディレクティブを別の指示に差し替え、`insert-after` アクションで特定見出しの直後に新セクションを挿入できる。

**解析補足データの上書き**

`.sdd-forge/project-overrides.json` にテーブル説明・コントローラ説明などを記述することで、ソースコード静的解析では取得できない意味情報を `@data` / `@text` ディレクティブへ補完できる。

### 環境変数

<!-- @text: ツールが参照する環境変数の一覧と用途を表形式で記述してください。 -->

| 環境変数 | 設定元 | 用途 |
|---|---|---|
| `SDD_WORK_ROOT` | `bin/sdd-forge.js`（プロジェクトモード時に自動設定） | 作業ルートディレクトリ。`docs/` や `.sdd-forge/` の配置場所として使用する。未設定時は `git rev-parse --show-toplevel` の結果、または `process.cwd()` を使用する |
| `SDD_SOURCE_ROOT` | `bin/sdd-forge.js`（プロジェクトモード時に自動設定） | 解析対象ソースコードのルートディレクトリ。未設定時は `SDD_WORK_ROOT` と同じ値になる |

---

現在のファイル（`docs/03_configuration.md`）には末尾にゴミが混入しています（`---` と生成根拠のメタコメンタリー）。上記が正しい完成版です。ファイルへの書き込み権限を付与していただければ、末尾のゴミを削除して保存します。
