# 05. CLI コマンドリファレンス

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。 -->

`sdd-forge` が提供する 16 のサブコマンドをリファレンス形式でまとめた章です。すべてのコマンドに共通する `--project` および `--help` グローバルオプションを備え、ドキュメント生成系・SDD ワークフロー系・プロジェクト管理系の 3 つの用途に大別されるサブコマンド体系を構成しています。


## 内容

### コマンド一覧

<!-- @text: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。 -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `sdd-forge help` | ヘルプを表示します。 | — |
| `sdd-forge setup` | プロジェクトの登録と初期設定を行うインタラクティブウィザードです。 | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge default` | 登録済みプロジェクトの一覧表示・デフォルト変更を行います。 | `<name>`（デフォルト変更時） |
| `sdd-forge build` | ドキュメント生成パイプラインを一括実行します（scan → init → data → text → readme → agents）。 | `--force`, `--agent <name>` |
| `sdd-forge scan` | ソースコードを解析し、`analysis.json` を生成します。 | `--stdout`, `--dry-run`, `--legacy` |
| `sdd-forge init` | テンプレートから `docs/` 章ファイルを初期化します。 | `--type`, `--force`, `--dry-run` |
| `sdd-forge data` | `@data` ディレクティブを `analysis.json` のデータで解決します。 | `--dry-run` |
| `sdd-forge text` | `@text` ディレクティブを AI エージェントで解決します。 | `--agent <name>`, `--id <id>`, `--dry-run` |
| `sdd-forge readme` | `docs/` の章ファイルから `README.md` を自動生成します。 | `--dry-run` |
| `sdd-forge forge` | AI エージェントによる `docs/` の反復改善を行います。 | `--prompt <text>`（必須）, `--spec`, `--max-runs`, `--dry-run` |
| `sdd-forge review` | `docs/` の品質チェックを行い、PASS / FAIL を返します。 | `<docs-path>`（省略可） |
| `sdd-forge changelog` | `specs/` の `spec.md` 群から変更履歴ファイルを生成します。 | `<output-file>`, `--dry-run` |
| `sdd-forge agents` | `AGENTS.md` の PROJECT セクションを更新します。 | `--template`, `--force` |
| `sdd-forge spec` | 機能仕様の spec ファイルと feature ブランチを作成します。 | `--title <name>`（必須）, `--base`, `--no-branch`, `--dry-run` |
| `sdd-forge gate` | `spec.md` の実装前チェックを行い、PASS / FAIL を返します。 | `--spec <path>`（必須） |
| `sdd-forge flow` | SDD ワークフロー（spec 作成 → gate → forge）を自動実行します。 | `--request <text>`（必須）, `--spec`, `--agent`, `--dry-run` |


### グローバルオプション

<!-- @text: 全コマンドに共通するグローバルオプションを表形式で記述してください。 -->

| オプション | 省略形 | 説明 |
|---|---|---|
| `--project <name>` | — | 操作対象のプロジェクト名を指定します。省略時は登録済みのデフォルトプロジェクトが使用されます。`help`・`setup`・`default` コマンドでは無視されます。 |
| `--help` | `-h` | コマンドのヘルプを表示します。引数なしで `sdd-forge` を実行した場合も同様にヘルプが表示されます。 |

プロジェクト選択に関しては、環境変数 `SDD_SOURCE_ROOT`（ソースコードのパス）および `SDD_WORK_ROOT`（出力ディレクトリのパス）を設定することでも上書きできます。`--project` オプションはこれらの環境変数に展開されたうえでサブコマンドに引き渡されます。


### 各コマンドの詳細

<!-- @text: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。 -->

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

| コード | 意味 | 主な発生コマンド |
|--------|------|-----------------|
| `0` | 正常終了 | 全コマンド（処理成功時） |
| `1` | エラー終了 | 設定不備・ファイル未検出・バリデーション失敗など |
| `2` | ゲート未解決による中断 | `flow`（gate FAIL かつ未解決事項あり） |

**stdout / stderr の使い分け**

| 出力先 | 用途 | 例 |
|--------|------|----|
| stdout | ユーザー向けの結果・ステータス | コマンド結果、PASS/FAIL 判定、ヘルプ、`NEEDS_INPUT` |
| stderr | 進捗ログ・警告・エラーメッセージ | `[scan]`・`[init]` 等のタグ付き進捗、`ERROR:`・`WARN:` メッセージ |

stderr への出力は `[コマンド名]` 形式のタグを先頭に付けて出力します。サブプロセスを呼び出すコマンド（`flow` 等）は、サブプロセスの stdout/stderr をそのまま転送し、終了コードも引き継ぎます。
