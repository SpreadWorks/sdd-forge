# 05. CLI コマンドリファレンス

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。 -->

`sdd-forge <subcommand>` の形式で呼び出す 16 のサブコマンドを提供します。全コマンドに共通するグローバルオプション（`--project`・`--version`）を持ち、docs 系・spec 系・flow 系の 3 グループに大別されるサブコマンド体系で構成されています。

## 内容

### コマンド一覧

<!-- @text: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。 -->

| コマンド | グループ | 説明 | 主なオプション |
|---|---|---|---|
| `help` | 共通 | コマンド一覧を表示 | なし |
| `setup` | 共通 | プロジェクト登録・初期設定ウィザード | `--name` `--path` `--type` `--agent` `--dry-run` |
| `default` | 共通 | デフォルトプロジェクトの確認・変更 | なし |
| `build` | docs | ドキュメント生成パイプラインを一括実行 | `--force` `--agent` |
| `scan` | docs | ソースコードを解析し `analysis.json` を出力 | `--stdout` `--dry-run` `--legacy` |
| `init` | docs | テンプレートから `docs/` を初期化 | `--type` `--force` `--dry-run` |
| `data` | docs | `@data` ディレクティブを解析データで解決 | `--dry-run` |
| `text` | docs | `@text` ディレクティブを AI で解決 | `--agent` `--id` `--per-directive` `--dry-run` |
| `readme` | docs | `docs/` から `README.md` を自動生成 | `--dry-run` |
| `forge` | docs | AI による `docs/` の反復改善 | `--prompt` `--spec` `--max-runs` `--agent` `--dry-run` |
| `review` | docs | `docs/` の品質チェック（PASS / FAIL） | なし |
| `changelog` | docs | `specs/` から変更履歴ファイルを生成 | `--dry-run` |
| `agents` | docs | `AGENTS.md` の PROJECT セクションを更新 | `--template` `--force` |
| `spec` | spec | spec ファイルと feature ブランチを作成 | `--title` `--base` `--no-branch` `--worktree` `--dry-run` |
| `gate` | spec | spec の実装前チェック（PASS / FAIL） | `--spec` |
| `flow` | flow | SDD ワークフローを自動実行 | `--request` `--title` `--spec` `--agent` `--no-branch` `--dry-run` |

### グローバルオプション

<!-- @text: 全コマンドに共通するグローバルオプションを表形式で記述してください。 -->

| オプション | 説明 |
|---|---|
| `--project <name>` | 使用するプロジェクトを名前で指定します。省略時はデフォルトプロジェクトが使用されます。 |
| `-v`, `--version`, `-V` | `sdd-forge` のバージョン番号を表示して終了します。 |
| `-h`, `--help` | コマンド一覧（ヘルプ）を表示して終了します。 |

### 各コマンドの詳細

<!-- @text: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。 -->

各コマンドの詳細な使用方法・オプション・実行例を以下のサブセクションに示します。ほとんどのコマンドは `--dry-run` オプションをサポートしており、実際にファイルへ書き込む前に動作を確認できます。`--project` でプロジェクトを切り替えながら複数プロジェクトを管理することも可能です。

#### sdd-forge help

ヘルプを表示します。引数なし・`-h`・`--help` のいずれでも呼び出せます。

```
sdd-forge help
sdd-forge --help
```

#### sdd-forge setup

プロジェクトの登録と初期設定を行うインタラクティブウィザードです。UI 言語・プロジェクト名・ソースパス・ドキュメント言語・フレームワーク・スタイル・エージェントを順に設定します。

| オプション | 説明 |
|---|---|
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースディレクトリ |
| `--work-root <path>` | 出力ディレクトリ |
| `--type <type>` | プロジェクト種別（`webapp` / `webapp/cakephp2` / `webapp/laravel` / `webapp/symfony` / `cli` / `library`） |
| `--purpose <purpose>` | ドキュメント目的（`developer-guide` / `user-guide` / `api-reference`） |
| `--tone <tone>` | 文体（`polite` / `formal` / `casual`） |
| `--agent <agent>` | デフォルトエージェント（`claude` / `codex`） |
| `--lang <lang>` | 出力言語（カンマ区切り） |
| `--ui-lang <lang>` | UI 言語（`en` / `ja`） |
| `--set-default` | デフォルトプロジェクトとして登録 |
| `--dry-run` | 書き込まずに内容を表示 |

```
sdd-forge setup
sdd-forge setup --name myapp --path ./src --type webapp/laravel --agent claude
```

生成されるファイル: `.sdd-forge/config.json`・`AGENTS.md`・`CLAUDE.md`（シンボリックリンク）・スキルファイル群

#### sdd-forge default

登録済みプロジェクトの一覧表示・デフォルト変更を行います。

```
sdd-forge default              # 一覧表示
sdd-forge default <name>       # デフォルトを <name> に変更
```

#### sdd-forge build

ドキュメント生成パイプラインを一括実行します。`scan → init → data → text → readme → agents` の順に処理します。

| オプション | 説明 |
|---|---|
| `--force` | 既存テンプレートファイルを上書き |
| `--agent <name>` | テキスト生成エージェントを上書き指定 |

```
sdd-forge build
sdd-forge build --force --agent claude
```

#### sdd-forge scan

ソースコードを解析し、構造情報を JSON ファイルに出力します。

| オプション | 説明 |
|---|---|
| `--stdout` / `--dry-run` | ファイルに書き込まず stdout へ出力 |
| `--legacy` | レガシー CakePHP 専用アナライザーを使用 |

```
sdd-forge scan
sdd-forge scan --dry-run
```

出力先: `.sdd-forge/output/analysis.json`

#### sdd-forge init

テンプレートから `docs/` 章ファイルを初期化します。`.sdd-forge/custom/` に配置したカスタムテンプレートで上書きできます。

| オプション | 説明 |
|---|---|
| `--type <type>` | テンプレート種別（`setup` の設定を上書き） |
| `--force` | 既存の `docs/` ファイルを上書き |
| `--dry-run` | 書き込まずに実行内容を表示 |

```
sdd-forge init
sdd-forge init --type cli --force
```

#### sdd-forge data

`docs/` 内の `<!-- @data: ... -->` ディレクティブを `analysis.json` のデータで解決・置換します。

| オプション | 説明 |
|---|---|
| `--dry-run` / `--stdout` | 書き込まずに変更内容を表示 |

```
sdd-forge data
sdd-forge data --dry-run
```

事前に `sdd-forge scan` の実行が必要です。

#### sdd-forge text

`docs/` 内の `<!-- @text: ... -->` ディレクティブを AI エージェントで解決・置換します。

| オプション | 説明 |
|---|---|
| `--agent <name>` | 使用エージェント（`claude` / `codex`） |
| `--id <id>` | 特定 ID のディレクティブのみ処理 |
| `--per-directive` | ディレクティブごとに個別コールするモード |
| `--timeout <ms>` | エージェントタイムアウト（デフォルト: `180000`） |
| `--dry-run` | エージェントを呼ばずに実行内容を表示 |

```
sdd-forge text --agent claude
sdd-forge text --agent claude --id overview --dry-run
```

#### sdd-forge readme

`docs/` の章ファイルから `README.md` を自動生成します。既存の MANUAL ブロックは保持されます。

| オプション | 説明 |
|---|---|
| `--dry-run` | 書き込まずに stdout へ出力 |

```
sdd-forge readme
sdd-forge readme --dry-run
```

#### sdd-forge forge

AI エージェントによる `docs/` の反復改善を行います。`review` が PASS するまでループします。

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善依頼テキスト（必須） |
| `--prompt-file <path>` | ファイルからプロンプトを読み込む |
| `--spec <path>` | コンテキストとして `spec.md` を含める |
| `--max-runs <n>` | 最大反復回数（デフォルト: `5`） |
| `--mode <mode>` | 実行モード（`local` / `assist` / `agent`） |
| `--agent <name>` | 使用エージェントを上書き |
| `--dry-run` | 書き込み・レビューを行わずに表示 |
| `-v, --verbose` | エージェント出力をストリーム表示 |

```
sdd-forge forge --prompt "API 仕様の章を追加する"
sdd-forge forge --prompt "構成を整理" --spec specs/001-api/spec.md --max-runs 3
```

#### sdd-forge review

`docs/` の品質チェックを行い、PASS / FAIL を返します。

```
sdd-forge review
sdd-forge review path/to/docs
```

チェック項目: 章ファイルの存在・最低 15 行・H1 見出し・未解決 `@text` ディレクティブの不在。`README.md` の存在は警告のみ。

#### sdd-forge changelog

`specs/` ディレクトリの `spec.md` 群から変更履歴ファイルを生成します。

| オプション | 説明 |
|---|---|
| `<output-file>` | 出力先（デフォルト: `docs/change_log.md`） |
| `--dry-run` | 書き込まずに stdout へ出力 |

```
sdd-forge changelog
sdd-forge changelog docs/history.md --dry-run
```

#### sdd-forge agents

`AGENTS.md` の PROJECT セクションを更新します。

| オプション | 説明 |
|---|---|
| `--template` | AI を使わずテンプレートベースで生成（`build` から利用） |
| `--force` | SDD・PROJECT・Guidelines セクション全体を上書き |

```
sdd-forge agents
sdd-forge agents --template
```

#### sdd-forge spec

機能仕様の spec ファイルと feature ブランチを作成します。

| オプション | 説明 |
|---|---|
| `--title <name>` | 機能名（必須） |
| `--base <branch>` | ベースブランチ（デフォルト: `master`） |
| `--no-branch` | ブランチを作成せず spec ファイルのみ生成 |
| `--worktree <path>` | Git worktree を作成 |
| `--allow-dirty` | 作業ツリーが dirty でも続行 |
| `--dry-run` | 書き込まずに実行内容を表示 |

```
sdd-forge spec --title "ユーザー認証機能"
sdd-forge spec --title "API 追加" --base main --no-branch
```

生成されるファイル: `specs/NNN-slug/spec.md`・`specs/NNN-slug/qa.md`

#### sdd-forge gate

`spec.md` の実装前チェックを行います。未解決トークン（`TBD`・`TODO`・`FIXME` 等）・未チェックタスク・必須セクションの不在・ユーザー承認の有無を検証します。

| オプション | 説明 |
|---|---|
| `--spec <path>` | チェック対象の `spec.md`（必須） |

```
sdd-forge gate --spec specs/001-user-auth/spec.md
```

PASS で終了コード `0`、FAIL で `1` を返します。

#### sdd-forge flow

SDD ワークフロー（spec 作成 → gate → forge）を自動実行します。

| オプション | 説明 |
|---|---|
| `--request <text>` | ユーザー要望（必須） |
| `--title <text>` | spec タイトル（省略時は要望から自動生成） |
| `--spec <path>` | 既存 spec を使用（spec 作成をスキップ） |
| `--agent <name>` | forge で使用するエージェント |
| `--max-runs <n>` | forge の最大反復回数（デフォルト: `5`） |
| `--forge-mode <mode>` | forge 実行モード（`local` / `assist` / `agent`） |
| `--no-branch` | ブランチ作成をスキップ |
| `--dry-run` | 全サブコマンドをドライランで実行 |

```
sdd-forge flow --request "検索機能を追加する" --agent claude
sdd-forge flow --request "リファクタリング" --spec specs/005-refactor/spec.md
```

gate が FAIL の場合は `NEEDS_INPUT` を出力して終了コード `2` で停止します。


### 終了コードと出力

<!-- @text: 終了コードの定義（0=成功 等）と、stdout/stderr の使い分けルールを表形式で記述してください。 -->

**終了コード**

| コード | 意味 | 該当コマンド |
|---|---|---|
| `0` | 正常終了（PASS を含む） | 全コマンド |
| `1` | エラー終了（FAIL・不正な引数・実行時エラー） | 全コマンド |
| `2` | NEEDS_INPUT（gate FAIL のため人間の介入が必要） | `flow` |

**stdout / stderr の使い分け**

| 出力先 | 内容 |
|---|---|
| stdout | コマンドの主出力（生成テキスト・JSON・`--dry-run` プレビュー・PASS/FAIL 結果） |
| stderr | エラーメッセージ・警告・進捗ログ（パイプ処理の妨げにならないよう分離） |
