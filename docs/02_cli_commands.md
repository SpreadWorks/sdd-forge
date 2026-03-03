# 02. CLI コマンドリファレンス

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。 -->

`sdd-forge` は `sdd-forge <コマンド>` 形式のサブコマンド体系を採用しており、ドキュメント生成・品質チェック・SDD ワークフロー支援など 16 種類のコマンドを提供しています。すべてのコマンドで共通して利用できるグローバルオプションとして `--help` および `--project` が用意されています。


## 内容

### コマンド一覧

<!-- @text: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。 -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `sdd-forge help` | コマンド一覧とヘルプを表示します。 | なし |
| `sdd-forge setup` | プロジェクトを登録し `.sdd-forge/config.json` を生成します。 | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge default [name]` | デフォルトプロジェクトの確認・変更を行います。 | 引数なしで一覧表示、名前指定でデフォルト変更 |
| `sdd-forge build` | `scan → init → data → text → readme → agents` を一括実行します。 | `--force`, `--agent`, `--dry-run` |
| `sdd-forge scan` | ソースコードを解析し `analysis.json` を生成します。 | `--legacy`, `--stdout`, `--dry-run` |
| `sdd-forge init` | テンプレートから `docs/` を初期化します。 | `--type`, `--force`, `--dry-run` |
| `sdd-forge data` | `@data` ディレクティブを解析データで解決します。 | `--dry-run`, `--stdout` |
| `sdd-forge text` | `@text` ディレクティブを AI で解決します。 | `--agent`（必須）, `--id`, `--timeout`, `--dry-run` |
| `sdd-forge readme` | `docs/` の章ファイルから `README.md` を自動生成します。 | `--dry-run` |
| `sdd-forge forge` | AI を使用して `docs/` を反復的に改善します。 | `--prompt`（必須）, `--spec`, `--max-runs`, `--mode`, `--agent` |
| `sdd-forge review` | `docs/` の構造・品質チェックを実行します。 | `[docs-dir]`（省略可） |
| `sdd-forge changelog` | `specs/` の内容から `change_log.md` を生成します。 | `[output-file]`（省略可） |
| `sdd-forge agents` | `AGENTS.md` のプロジェクトコンテキストセクションを更新します。 | `--template`, `--force` |
| `sdd-forge spec` | フィーチャーブランチと `spec.md` を作成します。 | `--title`（必須）, `--base`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge gate` | `spec.md` の実装前ゲートチェックを実行します。 | `--spec`（必須） |
| `sdd-forge flow` | SDD フロー（spec 作成 → gate → forge → review）を自動実行します。 | `--request`（必須）, `--spec`, `--title`, `--max-runs`, `--agent`, `--dry-run` |


### グローバルオプション

<!-- @text: 全コマンドに共通するグローバルオプションを表形式で記述してください。 -->

| オプション | 省略形 | 説明 |
|---|---|---|
| `--help` | `-h` | コマンドの使用方法を表示します。すべてのコマンドで利用できます。 |
| `--project` | なし | 操作対象のプロジェクトを名前で指定します。省略した場合はデフォルトプロジェクトが使用されます。トップレベルオプションであり、サブコマンドより前に指定します（例: `sdd-forge --project myapp build`）。 |


### 各コマンドの詳細

<!-- @text: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。 -->

### 終了コードと出力

<!-- @text: 終了コードの定義（0=成功 等）と、stdout/stderr の使い分けルールを表形式で記述してください。 -->

コマンドの終了コードは 0・1・2 の 3 種類が使用されています。stdout/stderr の使い分けはソースコードから明確に確認できましたので、以下のテキストを生成します。

---

コマンドの終了コードは以下の 3 種類が定義されています。

| 終了コード | 意味 | 発生例 |
|---|---|---|
| `0` | 正常終了 | コマンドが期待通り完了した場合、`--help` 表示後 |
| `1` | エラー終了 | 不明なサブコマンド、必須オプションの欠落、ファイル不存在、品質チェック失敗など |
| `2` | フロー中断 | `flow` コマンド実行中に `gate` チェックが FAIL した場合 |

stdout と stderr の使い分けは以下の通りです。

| 出力先 | 用途 | 具体例 |
|---|---|---|
| stdout | 正常な実行結果・ヘルプ表示・進捗メッセージ | `gate: PASSED`、コマンドリスト、`--dry-run` 時の JSON/Markdown 出力 |
| stderr | エラーメッセージ・警告 | 不明なコマンド、設定不備の警告、チェック失敗の詳細 |

`--dry-run` または `--stdout` フラグを指定した場合、`scan`・`changelog`・`agents` コマンドはファイル書き込みを行わず、生成内容を stdout に直接出力します。`flow` コマンドはサブコマンドの stdout/stderr をそのままパススルーします。
