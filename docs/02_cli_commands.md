# 02. CLI コマンドリファレンス

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。}} -->

sdd-forge は `help`・`setup`・`build`・`scan`・`data`・`text`・`init`・`forge`・`review`・`changelog`・`agents`・`readme`・`spec`・`gate`・`flow`・`upgrade`・`default`・`presets` の 18 コマンドを提供します。全コマンドに共通する `--project` グローバルオプションによりマルチプロジェクト対応を実現し、docs 系・scan 系・spec 系・flow 系の 4 系統にサブコマンドが分類されます。

## 内容

### コマンド一覧

<!-- {{text: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。}} -->

| コマンド | カテゴリ | 説明 | 主なオプション |
|---|---|---|---|
| `help` | — | コマンド一覧を表示 | なし |
| `setup` | Project | プロジェクト登録と `config.json` 生成ウィザード | `--name`, `--path`, `--type`, `--agent`, `--dry-run` |
| `upgrade` | Project | プロジェクト設定をアップグレード | なし |
| `default` | Project | デフォルトプロジェクトを設定 | なし |
| `build` | Build | scan → init → data → text → readme を一括実行 | なし |
| `init` | Docs | テンプレートから `docs/` を初期化 | `--force` |
| `forge` | Docs | プロンプト起点で `docs/` を反復改善 | `--prompt`, `--spec`, `--agent`, `--mode`, `--max-runs`, `--dry-run` |
| `review` | Docs | `docs/` 章ファイルの品質チェック | なし |
| `changelog` | Docs | `specs/` から `change_log.md` を生成 | なし |
| `agents` | Docs | `AGENTS.md` の PROJECT セクションを更新 | `--sdd`, `--project`, `--dry-run` |
| `readme` | Docs | `README.md` を自動生成 | なし |
| `scan` | Scan | ソースコードを解析し `analysis.json` を生成 | `--stdout`, `--dry-run` |
| `data` | Scan | `{{data}}` ディレクティブを解析データで解決 | なし |
| `text` | Scan | `{{text}}` ディレクティブを AI で解決 | `--agent`, `--dry-run`, `--timeout`, `--id`, `--per-directive` |
| `spec` | Spec | feature ブランチと `spec.md` を作成 | `--title`, `--base`, `--no-branch`, `--worktree`, `--dry-run` |
| `gate` | Spec | `spec.md` の未解決項目をチェック | `--spec` |
| `flow` | Flow | spec 作成 → gate → forge の SDD フローを自動実行 | `--request`, `--spec`, `--agent`, `--forge-mode`, `--max-runs`, `--dry-run` |
| `presets list` | Info | 利用可能なプリセット一覧を表示 | なし |

### グローバルオプション

<!-- {{text: 全コマンドに共通するグローバルオプションを表形式で記述してください。}} -->

| オプション | 説明 |
|---|---|
| `--project <name>` | マルチプロジェクト環境で操作対象プロジェクトを指定します。`projects.json` に登録済みのプロジェクト名を渡すと、対応するソースルートと作業ルートが環境変数 `SDD_SOURCE_ROOT` / `SDD_WORK_ROOT` に自動設定されます。省略時はデフォルトプロジェクトを使用します。`default`・`help`・`setup`・`presets` ではプロジェクトコンテキストの解決がスキップされるため、このオプションは無効です。 |
| `-h`, `--help` | 各コマンドの使用方法とオプション一覧を表示して終了します。 |
| `-v`, `--version`, `-V` | sdd-forge のバージョン番号を表示して終了します。 |

### 各コマンドの詳細

<!-- {{text: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。}} -->

#### setup

プロジェクトを sdd-forge に登録し、`.sdd-forge/config.json` を生成するインタラクティブウィザードです。全オプションを CLI で指定した場合は非対話モードで動作します。実行後、`AGENTS.md` の生成・注入と `CLAUDE.md` シンボリックリンクの作成、スキル（`sdd-flow-start`・`sdd-flow-close`）のデプロイも行います。

```
sdd-forge setup [options]

オプション:
  --name <name>              プロジェクト名
  --path <path>              ソースコードのパス（デフォルト: カレントディレクトリ）
  --work-root <path>         ドキュメント出力先ディレクトリ
  --type <type>              プロジェクト種別（例: webapp/cakephp2, cli/node-cli）
  --purpose <purpose>        ドキュメント用途（developer-guide | user-guide | api-reference）
  --tone <tone>              文体（polite | formal | casual）
  --agent <agent>            デフォルト AI エージェント（claude | codex）
  --project-context <text>   プロジェクト概要テキスト
  --lang <lang>              出力言語（カンマ区切り、例: ja,en）
  --ui-lang <lang>           UI 言語（en | ja）
  --set-default              デフォルトプロジェクトに設定する
  --no-default               デフォルトプロジェクトに設定しない
  --dry-run                  ファイルを書き込まず内容を表示する
```

```bash
# インタラクティブモード
sdd-forge setup

# 非対話モード
sdd-forge setup --name myapp --path /path/to/src --type webapp/laravel \
  --purpose developer-guide --tone polite --agent claude --lang ja
```

#### scan

ソースコードを解析し、`.sdd-forge/output/analysis.json` と `.sdd-forge/output/summary.json` を生成します。`config.json` の `type` フィールドに対応するプリセットの DataSource を読み込み、プリセット固有のスキャンを実行します。

```
sdd-forge scan [options]

オプション:
  --stdout    結果を stdout に出力（ファイル書き込みしない）
  --dry-run   --stdout と同じ（ファイル書き込みしない）
```

```bash
sdd-forge scan
sdd-forge scan --stdout | jq .controllers.summary
```

#### init

テンプレート継承チェーンを解決し、`docs/` 配下に章ファイル（`NN_*.md`）を生成します。既存ファイルがある場合は `--force` を付与しないと上書きされません。

```
sdd-forge init [--force]
```

#### data

`docs/` の章ファイルに含まれる `{{data: ...}}` ディレクティブを `analysis.json` の解析データで解決し、表やリストを自動挿入します。

```
sdd-forge data
```

#### text

`docs/` の章ファイルに含まれる `{{text: ...}}` ディレクティブを AI エージェントで解決し、説明文を生成・挿入します。デフォルトはファイル単位バッチモード（1 ファイル = 1 呼び出し）で、`--per-directive` で 1 ディレクティブ = 1 呼び出しに切り替えられます。

```
sdd-forge text [options]

オプション:
  --agent <name>       AI エージェント名（必須。config.json の providers キー）
  --id <id>            指定 ID の {{text}} ディレクティブのみ処理
  --dry-run            変更内容を表示するだけでファイル書き込みしない
  --per-directive      1 ディレクティブ = 1 呼び出しモード
  --timeout <ms>       タイムアウト ms（デフォルト: 180000）
```

```bash
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
sdd-forge text --agent claude --id overview
```

#### forge

`docs/` の反復改善を実行します。`--prompt` で変更内容を指定し、`--spec` で対応する spec.md を渡すことで SDD フロー内での利用も可能です。`review` が PASS するまで最大 `--max-runs` 回繰り返します。

```
sdd-forge forge [options]

オプション:
  --prompt <text>          開始プロンプト（必須）
  --prompt-file <path>     プロンプトをファイルから読み込む
  --spec <path>            入力仕様書（spec.md）へのパス
  --max-runs <n>           反復回数（デフォルト: 3）
  --review-cmd <cmd>       review コマンド（デフォルト: sdd-forge review）
  --agent <name>           AI エージェント名
  --mode <mode>            実行モード（local | assist | agent、デフォルト: local）
  --dry-run                ファイル書き込み・review・agent 呼び出しをスキップ
  --auto-update-context    review 成功後に context.json を自動更新
  -v, --verbose            エージェントログを逐次表示
```

```bash
sdd-forge forge --prompt "コントローラー一覧セクションを更新する"
sdd-forge forge --prompt "API リファレンスを追加" --spec specs/005-api-ref/spec.md --agent claude --mode agent
```

#### review

`docs/` 配下の章ファイル（`NN_*.md`）の品質チェックを実行します。各ファイルについて行数・H1 見出し・未解決の `{{data}}`/`{{text}}` ディレクティブ・MANUAL ブロックの整合性を検証します。`analysis.json` の鮮度も確認し、古い場合は警告を出します。

```
sdd-forge review [<docs-dir>]
```

```bash
sdd-forge review
sdd-forge review docs/
```

#### changelog

`specs/` ディレクトリを走査し、各 `spec.md` のメタ情報から `change_log.md` を生成します。既存ファイルの `MANUAL` ブロックは保持されます。

```
sdd-forge changelog
```

#### agents

`AGENTS.md` の `SDD` セクションをテンプレートで差し替え、`PROJECT` セクションを `analysis.json` から生成・AI で精査します。

```
sdd-forge agents [options]

オプション:
  --sdd       SDD セクションのみテンプレートで差し替え（AI なし）
  --project   PROJECT セクションのみ生成・AI 精査
  --dry-run   ファイルに書き込まず結果を標準出力に表示
```

#### readme

`docs/` の内容をもとに `README.md` を自動生成します。

```
sdd-forge readme
```

#### spec

連番の feature ブランチと `specs/NNN-<slug>/spec.md`・`qa.md` を作成します。worktree 内で実行された場合は自動的に `--no-branch` が適用されます。

```
sdd-forge spec [options]

オプション:
  --title <name>    連番の後ろに付与する短い名前（必須）
  --base <branch>   ブランチ作成元（デフォルト: 現在のブランチ）
  --no-branch       ブランチを作成せず spec のみ作成する
  --worktree        git worktree を作成して spec を配置する
  --dry-run         変更せず結果のみ表示
  --allow-dirty     ワークツリーが dirty でも続行する
```

```bash
sdd-forge spec --title "user-authentication"
sdd-forge spec --title "export-csv" --no-branch
```

#### gate

`spec.md` の未解決項目を検出します。TBD・TODO・未チェックタスク・必須セクション不足・ユーザー確認未承認をチェックし、問題があれば一覧を表示して終了コード 1 で終了します。

```
sdd-forge gate --spec <path>
```

```bash
sdd-forge gate --spec specs/005-export-csv/spec.md
```

#### flow

spec 作成 → gate → forge の SDD フローを自動実行します。gate が FAIL した場合は未解決事項を表示して終了コード 2 で停止し、実装を行いません。

```
sdd-forge flow [options]

オプション:
  --request <text>     実装要求（必須）
  --title <text>       spec 用タイトル（省略時は request 先頭を利用）
  --spec <path>        既存 spec.md を使う
  --agent <name>       AI エージェント名
  --max-runs <n>       forge 反復回数（デフォルト: 5）
  --forge-mode <mode>  forge モード（local | assist | agent、デフォルト: local）
  --no-branch          ブランチを作成せず spec のみ作成する
  --worktree           git worktree を作成して spec を配置する
  --dry-run            全サブコマンドを dry-run で実行する
```

```bash
sdd-forge flow --request "ユーザー一覧画面に CSV エクスポート機能を追加する"
sdd-forge flow --request "メール通知を実装" --agent claude --forge-mode agent
```

### 終了コードと出力

<!-- {{text: 終了コードの定義（0=成功 等）と、stdout/stderr の使い分けルールを表形式で記述してください。}} -->

#### 終了コード

| コード | 意味 | 主な発生コマンド |
|---|---|---|
| `0` | 正常終了 | すべてのコマンド |
| `1` | エラー終了（設定不正・ファイル未検出・レビュー FAIL 等） | 全コマンド共通 |
| `2` | NEEDS_INPUT（gate FAIL または forge が情報不足で停止） | `gate`, `flow`, `forge` |

#### stdout / stderr の使い分け

| ストリーム | 出力内容 |
|---|---|
| `stdout` | 通常の進捗ログ・コマンド実行結果・生成されたファイルパス・AI 出力など |
| `stderr` | エラーメッセージ・不明なコマンド通知（`sdd-forge: unknown command '...'`）・gate FAIL 理由の一覧 |

`review` および `gate` は PASS/FAIL を `stdout` に出力し、エラー詳細（`-` で始まる項目一覧）は `stderr` に出力します。`scan` で `--stdout` を指定した場合、解析結果の JSON は `stdout` に出力されます。
