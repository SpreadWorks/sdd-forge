# 02. CLIコマンドリファレンス

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->
本章では sdd-forge で利用可能な全20のCLIコマンドを解説します。プロジェクトセットアップ、ドキュメント生成、スペック管理、SDDワークフロー自動化を網羅しています。コマンドは3層ディスパッチアーキテクチャでルーティングされます。トップレベルエントリポイント（`sdd-forge.js`）が5つのディスパッチャー（`docs`、`spec`、`flow`、`presets-cmd`、`help`）のいずれかに委譲し、さらに対応する実装モジュールを読み込みます。
<!-- {{/text}} -->

## Content

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->
| コマンド | ディスパッチャー | 説明 | 主なオプション |
|---|---|---|---|
| `help` | `help.js` | 利用可能な全コマンドを説明付きで表示 | — |
| `setup` | `docs` | インタラクティブなプロジェクト登録と設定ファイル生成 | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | `docs` | テンプレート由来のスキルファイルを現在の sdd-forge バージョンにアップグレード | `--dry-run` |
| `default [name]` | `docs` | 登録済みプロジェクトの一覧表示またはデフォルトプロジェクトの設定 | `[name]` 位置引数 |
| `build` | `docs` | ドキュメント生成パイプライン全体を実行: scan → enrich → init → data → text → readme → agents → [translate] | `--agent`, `--force`, `--verbose`, `--dry-run` |
| `init` | `docs` | プリセットテンプレートから `docs/` を初期化 | `--force`, `--dry-run` |
| `forge` | `docs` | プロンプトとスペックを基に AI でドキュメントを反復的に改善 | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--agent`, `--dry-run` |
| `review` | `docs` | レビューチェックリストに照らして品質チェックを実行 | — |
| `changelog` | `docs` | `specs/` ディレクトリから `change_log.md` を生成 | — |
| `agents` | `docs` | SDD セクションとプロジェクトセクションで `AGENTS.md` を更新 | `--sdd`, `--project`, `--dry-run` |
| `readme` | `docs` | docs コンテンツから `README.md` を生成 | `--dry-run` |
| `translate` | `docs` | デフォルト言語の docs ファイルを、設定されたデフォルト以外の言語へ AI 翻訳 | `--lang`, `--force`, `--dry-run` |
| `scan` | `docs` | ソースコードを解析し `.sdd-forge/output/analysis.json` に書き出す | — |
| `enrich` | `docs` | `analysis.json` の各エントリに AI が役割・概要・章分類を付与 | `--agent` |
| `data` | `docs` | `docs/` ファイル内の全 `{{data}}` ディレクティブを解決 | `--dry-run` |
| `text` | `docs` | `docs/` ファイル内の全 `{{text}}` ディレクティブを AI エージェントで解決 | `--agent`, `--dry-run` |
| `spec` | `spec` | 番号付きフィーチャーブランチを作成し `specs/NNN-slug/spec.md` を初期化 | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `gate` | `spec` | 実装前後にスペックファイルの未解決項目を検証 | `--spec`, `--phase` |
| `flow` | `flow`（直接） | SDD フロー全体を自動化: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `presets list` | `presets-cmd`（直接） | プリセットの継承ツリーを表示 | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->
以下のオプションは `sdd-forge.js` がサブコマンドをディスパッチする前に処理され、どのコマンドを実行する場合にも適用されます。

| オプション | 短縮形 | 説明 |
|---|---|---|
| `--project <name>` | — | 登録済みプロジェクトを名前で選択。コマンド実行中に `SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` 環境変数を設定する。 |
| `--version` | `-v`, `-V` | インストール済み sdd-forge パッケージのバージョンを表示して終了。 |
| `--help` | `-h` | トップレベルのコマンド一覧を表示。個別コマンドに渡した場合はそのコマンド固有のヘルプテキストを表示。 |

> **注意:** `--project` はサブコマンドの引数をディスパッチャーに転送する前に `process.argv` から除去されるため、個々のコマンドモジュールはこのオプションを参照しません。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->
#### help

利用可能な全コマンドをセクション別（Project、Build、Docs、Scan、Spec、Flow、Info）にグループ化して表示し、各コマンドの一行説明を i18n の `ui:help.commands.*` キーから取得して出力します。パッケージバージョンは実行時に `package.json` から読み込まれます。

```
sdd-forge help
sdd-forge          # 引数なしでもヘルプを表示
sdd-forge -h
```

#### setup

インタラクティブウィザードを起動し、プロジェクトの登録、`.sdd-forge/config.json` の作成、`AGENTS.md` の生成、`CLAUDE.md` シンボリックリンクの作成、`.agents/skills/` および `.claude/skills/` へのスキルファイルのインストールを行います。各ステップは CLI フラグで非インタラクティブに指定することもできます。

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2 --agent claude
```

| オプション | 説明 |
|---|---|
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースコードディレクトリ |
| `--work-root <path>` | 作業ルート（デフォルトはソースパス） |
| `--type <preset>` | プリセット識別子（例: `webapp/cakephp2`, `cli/node-cli`） |
| `--purpose <text>` | ドキュメントの目的説明 |
| `--tone <text>` | ドキュメントのトーン |
| `--agent <name>` | デフォルト AI エージェント名 |
| `--lang <code>` | 出力言語コード |
| `--set-default` | このプロジェクトをデフォルトに設定 |
| `--dry-run` | 書き込みを行わずに内容を表示 |

#### upgrade

テンプレート管理ファイル（具体的には `.agents/skills/` 配下のスキル `SKILL.md` ファイル）を、現在インストール済みの sdd-forge バージョンに同梱されたテンプレートに合わせてアップグレードします。繰り返し実行しても安全で、テンプレート由来のコンテンツのみ上書きし、`config.json` には手を加えません。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### default

引数なしの場合、登録済みプロジェクトを一覧表示し現在のデフォルトを示します。プロジェクト名を指定するとデフォルトを変更します。

```
sdd-forge default               # プロジェクト一覧表示
sdd-forge default myapp         # "myapp" をデフォルトに設定
```

#### build

ドキュメント生成パイプライン全体を順番に実行します: `scan → enrich → init → data → text → readme → agents`。設定の `output.isMultiLang` が `true` の場合、`translate`（または言語ごとの生成）ステップが末尾に追加されます。進捗は重み付きプログレスバーで表示されます。

```
sdd-forge build
sdd-forge build --agent claude --force --verbose
sdd-forge build --dry-run
```

| オプション | 説明 |
|---|---|
| `--agent <name>` | `enrich` および `text` ステップで使用する AI エージェント（`config.defaultAgent` を上書き） |
| `--force` | 既存の docs ファイルを強制的に再初期化 |
| `--verbose` | ステップごとのログ出力を表示 |
| `--dry-run` | ファイル書き込みをスキップ |

#### init

プリセットテンプレートから `docs/` を初期化（または再初期化）します。`--force` が指定されない限り既存ファイルはスキップされます。

```
sdd-forge init
sdd-forge init --force
```

#### forge

指定した `--prompt` と任意でリンクされたスペックを使い、AI エージェントに `docs/` コンテンツを反復的に改善させます。レビューが通るまで最大 `--max-runs` 回繰り返します。

```
sdd-forge forge --prompt "add enrich command section"
sdd-forge forge --prompt "describe gate phases" --spec specs/042-gate-docs/spec.md --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善リクエスト（必須） |
| `--spec <path>` | コンテキスト用スペックファイルのパス |
| `--max-runs <n>` | 最大改善イテレーション数（デフォルト: 5） |
| `--mode <mode>` | `local` \| `assist` \| `agent` |
| `--agent <name>` | 設定済みデフォルトエージェントを上書き |
| `--dry-run` | 書き込みをスキップ |

#### review

レビューチェックリスト（`templates/review-checklist.md`）に照らして `docs/` の品質チェックを実行し、問題があれば報告します。チェックが失敗した場合は非ゼロで終了します。

```
sdd-forge review
```

#### changelog

全ての `specs/NNN-*/spec.md` ファイルを読み込み、プロジェクトルートに `change_log.md` を生成または更新します。

```
sdd-forge changelog
```

#### agents

`agents.sdd` データソースから最新の SDD セクションを、`agents.project` からプロジェクトセクションを取得し `AGENTS.md` を更新します。デフォルトでは両セクションを更新します。

```
sdd-forge agents
sdd-forge agents --sdd            # SDD セクションのみ更新
sdd-forge agents --project        # プロジェクトセクションのみ更新
sdd-forge agents --dry-run
```

#### readme

docs コンテンツとプリセット README テンプレートからプロジェクトルートに `README.md` を生成します。

```
sdd-forge readme
sdd-forge readme --dry-run
```

#### translate

デフォルト言語の `docs/` ファイルを、`output.languages` で設定されたデフォルト以外の全言語へ翻訳します。`--force` が指定されない限り、翻訳済みファイルより新しい `mtime` のソースファイルのみ再翻訳します。

```
sdd-forge translate
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

| オプション | 説明 |
|---|---|
| `--lang <code>` | この言語のみに翻訳 |
| `--force` | mtime に関わらず全ファイルを再翻訳 |
| `--dry-run` | 書き込みを行わずに翻訳対象を表示 |

#### scan

設定済み `sourcePath` 配下のソースコードを解析し、構造化された解析データを `.sdd-forge/output/analysis.json` に書き出します。

```
sdd-forge scan
```

#### enrich

`analysis.json` を読み込み、AI エージェントを使って各エントリに `role`、`summary`、`detail`、章分類を付与します。エンリッチされた結果は `analysis.json` に書き戻されます。

```
sdd-forge enrich --agent claude
```

#### data

`docs/` ファイル内の全 `{{data: …}}` ディレクティブをインプレースで解決し、ディレクティブブロックを生成された Markdown に置き換えます。`{{text}}` ブロックは再処理せずにスキップします。

```
sdd-forge data
sdd-forge data --dry-run
```

#### text

`docs/` ファイル内の各 `{{text: …}}` ディレクティブに対して AI エージェントを呼び出し、生成されたテキストを挿入します。本文が存在しないディレクティブ（または `--force` 使用時は古い本文を持つディレクティブ）のみ処理します。

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
```

#### spec

番号付きフィーチャーブランチ（`feature/NNN-slug`）を作成し、`specs/NNN-slug/spec.md` および `specs/NNN-slug/qa.md` をスキャフォールドします。ブランチ戦略として branch（デフォルト）、worktree、spec のみの3種類をサポートします。

```
sdd-forge spec --title "contact-form"
sdd-forge spec --title "contact-form" --worktree
sdd-forge spec --title "contact-form" --no-branch
sdd-forge spec --title "contact-form" --dry-run
```

| オプション | 説明 |
|---|---|
| `--title <text>` | フィーチャー名 — ブランチ/ディレクトリのスラッグに使用（必須） |
| `--base <branch>` | ベースブランチ（デフォルトは現在の HEAD） |
| `--no-branch` | スペックファイルのみ作成、ブランチなし |
| `--worktree` | `.sdd-forge/worktree/` 配下に独立した git worktree を作成 |
| `--allow-dirty` | 作業ツリーのクリーン状態チェックをスキップ |
| `--dry-run` | 書き込みを行わずに作成内容を表示 |

#### gate

実装前（`--phase pre`、デフォルト）または実装後（`--phase post`）に `spec.md` ファイルの完全性を検証します。未解決トークン（`TBD`、`TODO`、`FIXME`、`[NEEDS CLARIFICATION]`）、未チェックのタスク項目、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）、および `- [x] User approved this spec` 承認マーカーを確認します。

```
sdd-forge gate --spec specs/042-contact-form/spec.md
sdd-forge gate --spec specs/042-contact-form/spec.md --phase post
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | スペックファイルのパス（必須） |
| `--phase pre\|post` | 検証フェーズ; `pre` は Acceptance Criteria セクションのタスク項目チェックをスキップ |

#### flow

SDD フロー全体を自動化します: スペックの作成（`--spec` 未指定時）、`gate` の実行、ゲート成功時に `forge` を実行します。ゲートが失敗した場合はコード `2` で終了し、最大8件のブロッキング問題を列挙して `NEEDS_INPUT` を表示します。

```
sdd-forge flow --request "Add pagination to the user list"
sdd-forge flow --request "Fix CSV export encoding" --spec specs/040-csv-fix/spec.md
sdd-forge flow --request "Refactor auth module" --worktree --agent claude --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--request <text>` | ユーザーの変更リクエスト（必須） |
| `--title <text>` | スペックタイトルスラッグ（省略時は `--request` から導出） |
| `--spec <path>` | 新規作成の代わりに既存スペックを使用 |
| `--agent <name>` | `forge` に渡す AI エージェント |
| `--max-runs <n>` | 最大 `forge` イテレーション数（デフォルト: 5） |
| `--forge-mode <mode>` | `local` \| `assist` \| `agent`（デフォルト: `local`） |
| `--no-branch` | 新規ブランチなしでスペックを作成 |
| `--worktree` | 独立した git worktree を作成 |
| `--dry-run` | spec-init および forge ステップの書き込みをスキップ |

#### presets list

アーチレベルノードと、エイリアスおよび設定済みスキャンカテゴリを含むリーフプリセットを合わせて、プリセットの継承ツリー全体を表示します。

```
sdd-forge presets list
sdd-forge presets          # 一覧表示も可能
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->
| 終了コード | 意味 | 主な発生元 |
|---|---|---|
| `0` | 成功 | 任意のコマンドの正常終了 |
| `1` | 一般エラー | 不明なサブコマンド、必須引数の欠落、ファイルが見つからない、AI エージェント失敗、例外としてスローされた gate エラー |
| `2` | ゲートチェック失敗（ブロッキング） | `gate` が非ゼロで終了した場合の `flow` コマンド |

**stdout の規則**

情報提供用のプログレスメッセージ、生成された Markdown のプレビュー（dry-run）、最終的な成功サマリーは `stdout` に書き出されます。`build` コマンドは重み付きプログレスバー（`createProgress()` 経由）を使用してステップラベルを表示し、`--verbose` 指定時はオプションでステップごとの詳細ログも出力します。構造化された出力を生成するコマンド（`default` のプロジェクト一覧表示、`presets list` のツリー表示など）は整形済みテキストを直接 `stdout` に書き出します。

**stderr の規則**

不明なコマンドの通知、`--spec` 未指定の警告、gate 失敗の原因リスト、パイプラインステップのエラーなど、エラーメッセージは `console.error()` 経由で `stderr` に書き出されます。`flow` コマンドは子プロセス（`spec init`、`gate`、`forge`）の `stdout` と `stderr` を両方転送するため、全ての出力が呼び出し元から見えます。

**dry-run の出力**

`--dry-run` が有効な場合、コマンドは発生する各書き込み操作を `[dry-run]` プレフィックス付きの行で表示した後、ファイルシステムを変更せずにコード `0` で終了します。
<!-- {{/text}} -->
