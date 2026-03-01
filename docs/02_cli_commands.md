# 02. CLI コマンドリファレンス

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。 -->

`SCRIPTS` オブジェクトには17キーがあり、`scan:all` は別途インライン処理される。グローバルオプションは `--project <name>` のみ（`-h`/`--help` は引数なし時のヘルプ起動として扱われる）。

`sdd-forge` は `sdd-forge <subcommand> [options]` の形式で、`SCRIPTS` 定義の 17 サブコマンドに加え `scan:all` を含む計 18 のサブコマンドを提供する CLI ツールである。グローバルオプションは `--project <name>`（操作対象プロジェクトの指定）のみで、サブコマンドは仕様管理・ドキュメント生成・ソースコード解析・プロジェクト管理・フロー自動化の 5 カテゴリに分類される。



## 内容

### コマンド一覧

<!-- @text: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。 -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `help` | コマンド一覧とヘルプを表示する。引数なし・`-h`・`--help` でも起動。 | — |
| `add` | プロジェクトをパッケージに登録し、作業ディレクトリを初期化する。 | `<name> <path>`（位置引数、両方必須） |
| `default` | デフォルトプロジェクトを変更する。引数なしで登録済み一覧を表示。 | `[<name>]` |
| `spec` | 連番 feature ブランチと `specs/NNN-<slug>/spec.md` を生成する。 | `--title`（必須）`--base` `--dry-run` `--allow-dirty` |
| `gate` | `spec.md` の未解決事項（TBD・未承認・必須セクション不足等）をチェックする。 | `--spec`（必須） |
| `init` | パッケージ同梱テンプレートから `docs/` を初期化する。 | `--type` `--force` |
| `forge` | `data`・`text` を自動実行後、レビューループで docs 品質を改善する。 | `--prompt` / `--prompt-file`（どちらか必須）`--spec` `--max-runs` `--agent` `--mode` `--review-cmd` `-v` |
| `review` | `--review-cmd` で設定したコマンド（デフォルト: `npm run sdd:review`）を呼び出す docs レビューラッパー。 | — |
| `readme` | `docs/NN_*.md` の章情報から `README.md` を自動生成する。 | `--dry-run` |
| `scan` | PHP ソースコードを全カテゴリ解析し `.sdd-forge/output/analysis.json` を生成する。 | `--only <type>` `--stdout` |
| `scan:ctrl` | コントローラのみ解析する（`scan --only controllers` のショートカット）。 | `--stdout` |
| `scan:model` | モデルのみ解析する（`scan --only models` のショートカット）。 | `--stdout` |
| `scan:shell` | Shell のみ解析する（`scan --only shells` のショートカット）。 | `--stdout` |
| `scan:route` | ルートのみ解析する（`scan --only routes` のショートカット）。 | `--stdout` |
| `scan:extra` | 拡張情報のみ解析する（`scan --only extras` のショートカット）。 | `--stdout` |
| `data` | `analysis.json` を参照し、`docs/` の `@data` ディレクティブを解決・置換する。 | `--dry-run` `--stdout` |
| `text` | AI エージェントを使い、`docs/` の `@text` ディレクティブを解決・置換する。 | `--agent`（必須）`--dry-run` `--per-directive` `--timeout` |
| `scan:all` | `scan`（全カテゴリ）と `data` を順に一括実行する。 | — |
| `flow` | spec 作成・gate・forge・review を自動順実行する SDD フロー補助コマンド。 | `--request`（必須）`--title` `--spec` `--agent` `--max-runs` `--forge-mode` |



### グローバルオプション

<!-- @text: 全コマンドに共通するグローバルオプションを表形式で記述してください。 -->

| オプション | 説明 | 例 |
|---|---|---|
| `--project <name>` | 操作対象プロジェクトを明示指定する。省略時はデフォルトプロジェクトを使用。`add` / `default` / `help` には適用されない。 | `sdd-forge --project myapp scan` |
| `-h`, `--help` | ヘルプを表示して終了する。サブコマンドなし起動と同じ動作。 | `sdd-forge --help` |



### 各コマンドの詳細

<!-- @text: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。 -->

#### `default`

登録済みプロジェクトの一覧表示またはデフォルトプロジェクトの切り替えを行う。

```
sdd-forge default          # 登録済みプロジェクト一覧を表示
sdd-forge default <name>   # デフォルトプロジェクトを <name> に設定
```

引数なしで実行すると、各プロジェクトのパスとデフォルトマークを一覧表示する。指定した `<name>` が未登録の場合はエラーで終了する。

#### `spec`

feature ブランチと `specs/NNN-<slug>/` ディレクトリ（`spec.md` と `qa.md`）を作成する。番号は既存 `specs/` ディレクトリ・ブランチ一覧の最大値を参照して自動採番する。

```
sdd-forge spec --title "contact-form"
sdd-forge spec --title "contact-form" --base develop --dry-run
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--title <name>` | ブランチ・ディレクトリ名に付与するスラッグ（必須） | — |
| `--base <branch>` | ブランチ作成元 | `master` |
| `--dry-run` | 実際の変更を行わず結果のみ表示 | `false` |
| `--allow-dirty` | ワークツリーが dirty でも続行 | `false` |

#### `gate`

`spec.md` の未解決項目を検出し、PASS / FAILED を返す。以下のすべての条件を満たす場合に PASS となる。

- `TBD` / `TODO` / `FIXME` / `[NEEDS CLARIFICATION]` が存在しない
- `- [ ]` の未チェックタスクが存在しない
- `## Clarifications`、`## Open Questions`、`## User Confirmation` セクションが存在する
- `## User Confirmation` 内に `- [x] User approved this spec` がある

```
sdd-forge gate --spec specs/001-contact-form/spec.md
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | チェック対象の spec.md パス（必須） |

#### `init`

`templates/locale/<lang>/<type>/` のテンプレートファイルを `docs/` にコピーする。`.sdd-forge/project-overrides.json` が存在する場合は `replace-directive` / `insert-after` / `insert-before` アクションを適用してからコピーする。

```
sdd-forge init
sdd-forge init --type php-mvc --force
```

| オプション | 説明 |
|---|---|
| `--type <type>` | テンプレートタイプ。省略時は `.sdd-forge/config.json` の `type` を参照 |
| `--force` | `docs/` に既存ファイルがある場合も上書き |

#### `forge`

`docs/` を反復改善する。各ラウンドで `data` → `text`（エージェント設定時）を実行し、その後 `--review-cmd` を実行してレビュー結果をフィードバックとして次ラウンドに渡す。レビューが PASS するか `--max-runs` に達するまで繰り返す。

```
sdd-forge forge --prompt "コントローラ一覧の記述を追加してください"
sdd-forge forge --prompt-file prompts/update.txt --spec specs/001-xxx/spec.md --agent claude --mode agent
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--prompt <text>` | 開始プロンプト（`--prompt-file` と排他） | — |
| `--prompt-file <path>` | プロンプトをファイルから読み込む | — |
| `--spec <path>` | 入力仕様書（`spec.md`）。エージェントプロンプトに含まれる | — |
| `--max-runs <n>` | 最大反復回数 | `5` |
| `--review-cmd <cmd>` | レビューコマンド | `npm run sdd:review` |
| `--agent <name>` | `config.json` の `providers` キー（例: `claude`）| config の `defaultAgent` |
| `--mode <mode>` | `local`（決定論的パッチのみ）/ `assist`（エージェント＋ローカル）/ `agent`（エージェント必須） | `local` |
| `-v`, `--verbose` | エージェント出力をリアルタイム表示 | `false` |

エージェントが追加情報を必要とする場合は `NEEDS_INPUT` を出力して中断する（終了コード 2）。

#### `review`

`--review-cmd`（`forge` オプション）または `npm run sdd:review` として定義するユーザー定義コマンド。`sdd-forge review` コマンド自体は存在せず、`forge` / `flow` から呼び出されるレビュースクリプトをプロジェクト側で用意する。

#### `readme`

`docs/NN_*.md` の章ファイルを解析し、テンプレート（`templates/locale/<lang>/<type>/README.md`）を使って `README.md` を自動生成する。既存 `README.md` の `<!-- MANUAL:START --> ... <!-- MANUAL:END -->` ブロックは上書きせず保持する。

```
sdd-forge readme
sdd-forge readme --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 生成内容を表示するが `README.md` には書き込まない |

`.sdd-forge/config.json` に `type` が設定されていない場合、またはテンプレートが見つからない場合はスキップして終了する。

#### `scan`

対象プロジェクトの `app/` ディレクトリを解析し、結果を `.sdd-forge/output/analysis.json` に書き込む。

```
sdd-forge scan
sdd-forge scan --only controllers
sdd-forge scan --only models --stdout
```

| オプション | 説明 |
|---|---|
| `--only <type>` | `controllers` / `models` / `shells` / `routes` / `extras` のいずれかに絞る |
| `--stdout` | `analysis.json` へ書き込まず stdout に出力 |

#### `scan:ctrl` / `scan:model` / `scan:shell` / `scan:route` / `scan:extra`

`scan --only <category>` のショートカット。それぞれ `controllers` / `models` / `shells` / `routes` / `extras` カテゴリのみを解析する。`--stdout` オプションも同様に使用できる。

```
sdd-forge scan:ctrl
sdd-forge scan:model --stdout
```

#### `data`

`analysis.json` を読み込み、`docs/*.md` 内の `<!-- @data: ... -->` ディレクティブをレンダリング済みテーブルやコードブロックに置換する。`@text` ディレクティブはスキップしてログ出力する。

```
sdd-forge data
sdd-forge data --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 変更内容を表示するが `docs/` へ書き込まない |
| `--stdout` | 変更したファイルの行数差分を stdout に表示 |

事前に `sdd-forge scan` を実行して `analysis.json` を生成しておく必要がある。

#### `text`

`docs/*.md` 内の `<!-- @text: ... -->` ディレクティブを LLM エージェントで解決し、ディレクティブ直後に説明文を挿入する。デフォルトはファイル単位バッチ（1ファイル=1呼び出し）で処理する。

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
sdd-forge text --agent claude --per-directive --timeout 300000
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--agent <name>` | `config.json` の `providers` キー（必須） | — |
| `--dry-run` | ディレクティブを表示するが LLM を呼び出さない | `false` |
| `--per-directive` | 1ディレクティブ=1呼び出しの旧モード | `false`（バッチモード） |
| `--timeout <ms>` | エージェントのタイムアウト | `180000` |

バッチモードで `filled=0` になった場合は自動的に `--per-directive` モードへフォールバックする。

#### `scan:all`

`scan`（全カテゴリ）と `data` を順に実行するショートカット。解析と `@data` 解決を一括で行う場合に使用する。

```
sdd-forge scan:all
```

追加オプションは受け付けない。

#### `flow`

spec 作成 → gate → forge を連続実行する。`--spec` を省略した場合は `--request` からタイトルを自動導出して `spec` コマンドを実行する。gate が FAIL した場合は `NEEDS_INPUT` を出力して終了コード 2 で中断する。

```
sdd-forge flow --request "コントローラ一覧の章を追加する"
sdd-forge flow --request "DB テーブル定義を更新する" --agent claude --forge-mode agent
sdd-forge flow --request "修正を反映する" --spec specs/002-fix-tables/spec.md
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--request <text>` | 実装要求（必須） | — |
| `--title <text>` | spec 用タイトル。省略時は `--request` の先頭 40 文字から自動生成 | — |
| `--spec <path>` | 既存の `spec.md` を使用する場合に指定 | — |
| `--agent <name>` | forge に渡す AI エージェント | — |
| `--max-runs <n>` | forge の最大反復回数 | `5` |
| `--forge-mode <m>` | forge の実行モード: `local` / `assist` / `agent` | `local` |


#### `help`

ヘルプを表示する。引数なし・`-h`・`--help` でも起動する。

```
sdd-forge help
```

#### `add`

プロジェクトを sdd-forge に登録し、作業ディレクトリ（`projects/<name>/`）を初期化する。ソースプロジェクトに `.sdd-forge/config.json` が存在する場合はそれをコピーし、なければデフォルト設定（`lang: "ja"`）で生成する。

```
sdd-forge add <name> <path>

# 例
sdd-forge add myapp /path/to/myapp
```

| 引数 | 説明 |
|---|---|
| `<name>` | 登録名（プロジェクト識別子） |
| `<path>` | ソースプロジェクトの絶対または相対パス |

#### `default`

デフォルトプロジェクトを変更する。引数なしで登録済みプロジェクト一覧を表示する。

```
sdd-forge default            # 一覧表示
sdd-forge default <name>     # デフォルト変更
```

#### `spec`

連番 feature ブランチを作成し、`specs/NNN-<slug>/spec.md` と `qa.md` を生成する。ワークツリーが dirty な場合はエラー（`--allow-dirty` で回避可）。

```
sdd-forge spec --title "機能名" [--base <branch>] [--dry-run] [--allow-dirty]

# 例
sdd-forge spec --title "user-auth"
sdd-forge spec --title "fix payment" --base main --dry-run
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--title <name>` | spec 名（必須） | — |
| `--base <branch>` | ブランチ作成元 | `master` |
| `--dry-run` | 変更せず結果のみ表示 | `false` |
| `--allow-dirty` | dirty ワークツリーでも続行 | `false` |

#### `gate`

`spec.md` の未解決事項をチェックする。`TBD`・`TODO`・`FIXME`・未チェックタスク（`- [ ]`）・必須セクション不足・ユーザー承認未設定を検出する。問題がなければ `gate: PASSED` を stdout に出力、問題がある場合は `gate: FAILED` を stderr に出力して終了コード 1 で終了する。

```
sdd-forge gate --spec specs/001-user-auth/spec.md
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | チェック対象の spec.md（必須） |

#### `init`

パッケージ同梱のテンプレートから `docs/` を初期化する。テンプレートタイプは `--type` または `.sdd-forge/config.json` の `type` フィールドから解決する。`--force` を指定しない場合、既存ファイルがあればエラー。`.sdd-forge/project-overrides.json` が存在する場合はオーバーライドを適用する。

```
sdd-forge init [--type <type>] [--force]

# 例
sdd-forge init                       # config.json の type を使用
sdd-forge init --type php-mvc        # テンプレートタイプを直接指定
sdd-forge init --type php-mvc --force  # 既存ファイルを上書き
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--type <type>` | テンプレートタイプ | `.sdd-forge/config.json` の `type` |
| `--force` | 既存ファイルを上書き | `false` |

#### `forge`

analysis.json の `data`・`text` を自動実行した後、レビューループ（最大 `--max-runs` 回）を回して docs 品質を改善する。エージェントが追加情報を必要とする場合は `NEEDS_INPUT` を出力して終了コード 2 で停止する。

```
sdd-forge forge --prompt "変更内容の要約" [options]

# 例
sdd-forge forge --prompt "コントローラ一覧を最新に更新"
sdd-forge forge --prompt "認証フローを追記" --agent claude --mode assist
sdd-forge forge --prompt-file prompts/task.txt --spec specs/001-auth/spec.md --max-runs 3
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--prompt <text>` | 開始プロンプト（`--prompt-file` と排他） | — |
| `--prompt-file <path>` | プロンプトをファイルから読み込む | — |
| `--spec <path>` | 参照する spec.md | — |
| `--max-runs <n>` | 最大反復回数 | `5` |
| `--review-cmd <cmd>` | docs レビューコマンド | `npm run sdd:review` |
| `--agent <name>` | AI エージェント（config.json 内のプロバイダキー） | config.json の `defaultAgent` |
| `--mode <mode>` | 実行モード: `local` / `assist` / `agent` | `local` |
| `-v`, `--verbose` | エージェント実行ログを逐次表示 | `false` |

#### `review`

docs レビューを実行する。レビューコマンドは `forge --review-cmd` または `package.json` の `sdd:review` スクリプトとして定義する。`sdd-forge review` 自体は `npm run sdd:review` を呼び出すラッパーとして機能する。

```
sdd-forge review
```

#### `readme`

`docs/NN_*.md` の章タイトルと説明を抽出して `README.md` を自動生成する。既存 `README.md` の `<!-- MANUAL:START -->` 〜 `<!-- MANUAL:END -->` ブロックは保持される。テンプレートは `templates/locale/<lang>/<type>/README.md` を使用する。

```
sdd-forge readme [--dry-run]

# 例
sdd-forge readme             # README.md を生成・上書き
sdd-forge readme --dry-run   # 差分を表示のみ
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 差分を表示するが書き込まない |

#### `scan` / `scan:ctrl` / `scan:model` / `scan:shell` / `scan:route` / `scan:extra`

PHP ソースコードを解析して `.sdd-forge/output/analysis.json` を生成する。サブコマンド `scan:*` は特定カテゴリのみを解析する。

```
sdd-forge scan                        # 全カテゴリを解析
sdd-forge scan:ctrl                   # コントローラのみ
sdd-forge scan:model                  # モデルのみ
sdd-forge scan:shell                  # Shell のみ
sdd-forge scan:route                  # ルートのみ
sdd-forge scan:extra                  # 拡張情報のみ
sdd-forge scan --stdout               # ファイル書き込みせず stdout に出力
```

| オプション | 説明 |
|---|---|
| `--stdout` | `analysis.json` に書き込まず stdout に出力 |

解析ログは stderr に出力され、`app/` ディレクトリが見つからない場合はエラーで終了する。

#### `scan:all`

`scan`（全カテゴリ）と `data` を順に実行するショートカット。

```
sdd-forge scan:all
```

#### `data`

`.sdd-forge/output/analysis.json` を読み、`docs/NN_*.md` 内の `@data` ディレクティブを解析データで解決・置換する。`@text` ディレクティブはスキップされ、stderr にログを出力する。事前に `sdd-forge scan` の実行が必要。

```
sdd-forge data [--dry-run] [--stdout]

# 例
sdd-forge data
sdd-forge data --dry-run   # 変更内容を確認のみ
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 変更内容を表示するが書き込まない |
| `--stdout` | 各ファイルの変更行数を stdout に表示 |

#### `text`

`docs/NN_*.md` 内の `@text` ディレクティブを AI エージェントで解決する。デフォルトはファイル単位のバッチモード（1 ファイル = 1 LLM 呼び出し）。バッチで 0 件の場合は自動的にディレクティブ単位モードにフォールバックする。

```
sdd-forge text --agent claude [options]

# 例
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
sdd-forge text --agent claude --per-directive --timeout 300000
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--agent <name>` | AI エージェント名（必須） | — |
| `--dry-run` | 変更内容を表示するが書き込まない | `false` |
| `--per-directive` | 1 ディレクティブ = 1 LLM 呼び出しの旧モード | `false`（バッチモード） |
| `--timeout <ms>` | エージェントタイムアウト（ミリ秒） | `180000` |

#### `flow`

spec 作成 → gate → forge を一括実行する。`--spec` を省略すると `--request` 先頭から slug を生成して新規 spec を作成する。gate が FAIL した場合は `NEEDS_INPUT` を stdout に出力して終了コード 2 で停止する。

```
sdd-forge flow --request "要望テキスト" [options]

# 例
sdd-forge flow --request "コントローラ一覧を最新化"
sdd-forge flow --request "認証フロー追記" --agent claude --forge-mode assist
sdd-forge flow --request "修正対応" --spec specs/001-fix/spec.md --max-runs 3
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--request <text>` | 実装要求（必須） | — |
| `--title <text>` | spec タイトル（省略時は request 先頭を利用） | — |
| `--spec <path>` | 既存 spec.md を使用（省略時は新規作成） | — |
| `--agent <name>` | AI エージェント名 | — |
| `--max-runs <n>` | forge 最大反復回数 | `5` |
| `--forge-mode <m>` | forge モード: `local` / `assist` / `agent` | `local` |


### 終了コードと出力

<!-- @text: 終了コードの定義（0=成功 等）と、stdout/stderr の使い分けルールを表形式で記述してください。 -->

| 終了コード | 意味 | 発生条件の例 |
|---|---|---|
| `0` | 成功 | コマンド正常完了（`gate: PASSED`、`scan:all` 完了、ヘルプ表示など） |
| `1` | エラー | 設定不備・ファイル未検出・不明コマンド・`gate` FAIL・引数不足 |
| `2` | 入力待ち | `flow` 実行中に `gate` が FAIL し未解決事項が残っている場合（`NEEDS_INPUT` 状態） |
| サブプロセス終了コード | 伝播 | `flow` がサブプロセス（`spec`・`gate`・`forge`）の終了コードをそのまま伝播する場合 |

`stdout` と `stderr` の使い分けは以下の通り。

| 出力先 | 用途 | 例 |
|---|---|---|
| `stdout` | 機械処理を想定した出力・最終結果・ヘルプテキスト | `gate: PASSED`、`NEEDS_INPUT`、DRY-RUN 出力サマリ、`--stdout` 指定時の JSON 解析結果、ヘルプ一覧 |
| `stderr` | 進捗ログ・警告・エラーメッセージ | `[tfill] Batch DONE …`、`[init] copied: …`、`[populate] WARN: …`、`ERROR:` プレフィックス付きエラー |

`[tfill]`・`[init]`・`[populate]`・`[analyze]` など角括弧プレフィックス付きの進捗行はすべて `stderr` に出力されるため、`stdout` をパイプ処理する場合でも混入しない。サブモジュール内の重大エラーは `[keyword] ERROR: …` 形式、警告は `[keyword] WARN: …` 形式で `stderr` に出力される。
