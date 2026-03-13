# 02. CLIコマンドリファレンス

## 概要

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->
この章では、sdd-forge で利用可能な全20のCLIコマンドを解説します。プロジェクトのセットアップ、ドキュメント生成、スペック管理、SDDワークフロー自動化を網羅しています。コマンドは3層ディスパッチアーキテクチャによってルーティングされます。トップレベルのエントリーポイント（`sdd-forge.js`）が5つのディスパッチャー（`docs`、`spec`、`flow`、`presets-cmd`、`help`）のいずれかに委譲し、それぞれが対応する実装モジュールを読み込みます。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->
| コマンド | ディスパッチャー | 説明 | 主なオプション |
|---|---|---|---|
| `help` | `help.js` | 利用可能なすべてのコマンドを説明付きで表示する | — |
| `setup` | `docs` | プロジェクトの登録と設定ファイル生成を行うインタラクティブウィザード | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | `docs` | テンプレート由来のスキルファイルを現在の sdd-forge バージョンにアップグレードする | `--dry-run` |
| `default [name]` | `docs` | 登録済みプロジェクトの一覧表示またはデフォルトプロジェクトの設定 | `[name]` 位置引数 |
| `build` | `docs` | ドキュメント生成の全パイプラインを実行する: scan → enrich → init → data → text → readme → agents → [translate] | `--agent`, `--force`, `--verbose`, `--dry-run` |
| `init` | `docs` | プリセットテンプレートから `docs/` を初期化する | `--force`, `--dry-run` |
| `forge` | `docs` | プロンプトとスペックに基づいてAIによりドキュメントを反復改善する | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--agent`, `--dry-run` |
| `review` | `docs` | レビューチェックリストに対して品質チェックを実行する | — |
| `changelog` | `docs` | `specs/` ディレクトリから `change_log.md` を生成する | — |
| `agents` | `docs` | SDDセクションとプロジェクトセクションで `AGENTS.md` を更新する | `--sdd`, `--project`, `--dry-run` |
| `readme` | `docs` | ドキュメントの内容から `README.md` を生成する | `--dry-run` |
| `translate` | `docs` | デフォルト言語のドキュメントをAIで設定済みの非デフォルト言語に翻訳する | `--lang`, `--force`, `--dry-run` |
| `scan` | `docs` | ソースコードを解析して `.sdd-forge/output/analysis.json` に書き出す | — |
| `enrich` | `docs` | AIエージェントを使って `analysis.json` の各エントリーに役割・概要・章分類を付与する | `--agent` |
| `data` | `docs` | `docs/` ファイル内のすべての `{{data}}` ディレクティブを解決する | `--dry-run` |
| `text` | `docs` | AIエージェントを使って `docs/` ファイル内のすべての `{{text}}` ディレクティブを解決する | `--agent`, `--dry-run` |
| `spec` | `spec` | 番号付きフィーチャーブランチを作成し `specs/NNN-slug/spec.md` を初期化する | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `gate` | `spec` | 実装前後にスペックファイルの未解決項目を検証する | `--spec`, `--phase` |
| `flow` | `flow`（直接） | SDDフロー全体を自動化する: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `presets list` | `presets-cmd`（直接） | プリセットの継承ツリーを表示する | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->
以下のオプションは、サブコマンドがディスパッチされる前に `sdd-forge.js` で処理され、どのコマンドを実行する場合でも共通して適用されます。

| オプション | 短縮形 | 説明 |
|---|---|---|
| `--project <name>` | — | 登録済みプロジェクトを名前で選択する。コマンドの実行中に `SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` 環境変数をセットする。 |
| `--version` | `-v`, `-V` | インストール済みの sdd-forge パッケージバージョンを出力して終了する。 |
| `--help` | `-h` | トップレベルのコマンド一覧を表示する。個別コマンドに渡した場合は、そのコマンド固有のヘルプを表示する。 |

> **注意:** `--project` はサブコマンドの引数がディスパッチャーに転送される前に `process.argv` から除去されるため、個別のコマンドモジュールにはこのオプションは渡されません。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->
#### help

利用可能なすべてのコマンドをセクション別（Project、Build、Docs、Scan、Spec、Flow、Info）にグループ化して表示し、i18n の `ui:help.commands.*` キーから取得した各コマンドの一行説明を添えます。パッケージバージョンは実行時に `package.json` から読み取られます。

```
sdd-forge help
sdd-forge          # 引数なしの場合もヘルプを表示
sdd-forge -h
```

#### setup

プロジェクトの登録、`.sdd-forge/config.json` の作成、`AGENTS.md` の生成、`CLAUDE.md` シンボリックリンクの作成、`.agents/skills/` および `.claude/skills/` へのスキルファイルのインストールを行うインタラクティブウィザードを起動します。各ステップはCLIフラグで非対話的に指定することも可能です。

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2 --agent claude
```

| オプション | 説明 |
|---|---|
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースコードディレクトリ |
| `--work-root <path>` | 作業ルート（デフォルトはソースパス） |
| `--type <preset>` | プリセット識別子（例: `webapp/cakephp2`、`cli/node-cli`） |
| `--purpose <text>` | ドキュメントの目的説明 |
| `--tone <text>` | ドキュメントのトーン |
| `--agent <name>` | デフォルトのAIエージェント名 |
| `--lang <code>` | 出力言語コード |
| `--set-default` | このプロジェクトをデフォルトとして設定する |
| `--dry-run` | 実際に書き込まずに何が書き込まれるかを表示する |

#### upgrade

`.agents/skills/` 配下のスキル `SKILL.md` ファイルなど、テンプレート管理されたファイルを現在インストール済みの sdd-forge バージョンにバンドルされたテンプレートに合わせてアップグレードします。繰り返し実行しても安全で、テンプレート由来のコンテンツのみを上書きし、`config.json` には一切触れません。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### default

引数なしの場合、登録済みプロジェクトをすべて一覧表示し、現在のデフォルトを示します。プロジェクト名を指定した場合は、デフォルトを変更します。

```
sdd-forge default               # プロジェクト一覧を表示
sdd-forge default myapp         # "myapp" をデフォルトに設定
```

#### build

ドキュメント生成パイプラインを順番に実行します: `scan → enrich → init → data → text → readme → agents`。設定の `output.isMultiLang` が `true` の場合、`translate`（または言語ごとの生成）ステップが追加されます。進捗は重み付きプログレスバーで報告されます。

```
sdd-forge build
sdd-forge build --agent claude --force --verbose
sdd-forge build --dry-run
```

| オプション | 説明 |
|---|---|
| `--agent <name>` | `enrich` および `text` ステップで使用するAIエージェント（`config.defaultAgent` を上書き） |
| `--force` | 既存のdocsファイルを強制的に再初期化する |
| `--verbose` | ステップごとのログ出力を表示する |
| `--dry-run` | すべてのファイル書き込みをスキップする |

#### init

プリセットテンプレートから `docs/` を初期化（または再初期化）します。`--force` が指定されない限り、既存のファイルはスキップされます。

```
sdd-forge init
sdd-forge init --force
```

#### forge

指定した `--prompt` と任意でリンクされたスペックを使ってAIエージェントに `docs/` の内容を改善するよう促し、レビューが通るまで最大 `--max-runs` 回反復します。

```
sdd-forge forge --prompt "add enrich command section"
sdd-forge forge --prompt "describe gate phases" --spec specs/042-gate-docs/spec.md --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善リクエスト（必須） |
| `--spec <path>` | コンテキストとして使用するスペックファイルへのパス |
| `--max-runs <n>` | 最大改善反復回数（デフォルト: 5） |
| `--mode <mode>` | `local` \| `assist` \| `agent` |
| `--agent <name>` | 設定済みのデフォルトエージェントを上書きする |
| `--dry-run` | 書き込みをスキップする |

#### review

レビューチェックリスト（`templates/review-checklist.md`）に対して品質チェックを実行し、`docs/` で見つかった問題を報告します。チェックに失敗した場合はゼロ以外の終了コードで終了します。

```
sdd-forge review
```

#### changelog

すべての `specs/NNN-*/spec.md` ファイルを読み込み、プロジェクトルートの `change_log.md` を生成または更新します。

```
sdd-forge changelog
```

#### agents

`agents.sdd` データソースからのSDDセクションと `agents.project` からのプロジェクトセクションで `AGENTS.md` を更新します。デフォルトでは両方のセクションを更新します。

```
sdd-forge agents
sdd-forge agents --sdd            # SDDセクションのみ更新
sdd-forge agents --project        # プロジェクトセクションのみ更新
sdd-forge agents --dry-run
```

#### readme

ドキュメントの内容とプリセットのREADMEテンプレートからプロジェクトルートの `README.md` を生成します。

```
sdd-forge readme
sdd-forge readme --dry-run
```

#### translate

設定の `output.languages` に設定された非デフォルト言語すべてに対して、デフォルト言語の `docs/` ファイルを翻訳します。`--force` が指定されない限り、既存の翻訳ファイルよりもソースの `mtime` が新しいファイルのみ再翻訳します。

```
sdd-forge translate
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

| オプション | 説明 |
|---|---|
| `--lang <code>` | この言語のみに翻訳する |
| `--force` | mtimeに関わらずすべてのファイルを再翻訳する |
| `--dry-run` | 実際に書き込まずに何が翻訳されるかを表示する |

#### scan

設定された `sourcePath` 配下のソースコードを解析し、構造化された解析データを `.sdd-forge/output/analysis.json` に書き出します。

```
sdd-forge scan
```

#### enrich

`analysis.json` を読み込み、AIエージェントを使って各エントリーに `role`、`summary`、`detail`、章分類を付与します。エンリッチ済みの結果は `analysis.json` に書き戻されます。

```
sdd-forge enrich --agent claude
```

#### data

`docs/` ファイル内のすべての `{{data: …}}` ディレクティブをインプレースで解決し、ディレクティブブロックを生成されたMarkdownに置き換えます。`{{text}}` ブロックは再処理せずスキップします。

```
sdd-forge data
sdd-forge data --dry-run
```

#### text

`docs/` ファイルに含まれる各 `{{text: …}}` ディレクティブに対してAIエージェントを呼び出し、生成されたテキストを挿入します。本文のないディレクティブ（または `--force` 使用時は古い本文を持つもの）のみ処理されます。

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
```

#### spec

番号付きフィーチャーブランチ（`feature/NNN-slug`）を作成し、`specs/NNN-slug/spec.md` と `specs/NNN-slug/qa.md` を生成します。ブランチ戦略として branch（デフォルト）、worktree、spec のみ作成の3種類をサポートします。

```
sdd-forge spec --title "contact-form"
sdd-forge spec --title "contact-form" --worktree
sdd-forge spec --title "contact-form" --no-branch
sdd-forge spec --title "contact-form" --dry-run
```

| オプション | 説明 |
|---|---|
| `--title <text>` | 機能名 — ブランチ/ディレクトリのスラグに使用される（必須） |
| `--base <branch>` | ベースブランチ（デフォルトは現在のHEAD） |
| `--no-branch` | スペックファイルのみ作成し、ブランチは作成しない |
| `--worktree` | `.sdd-forge/worktree/` 配下に独立したgit worktreeを作成する |
| `--allow-dirty` | 作業ツリーのクリーンチェックをスキップする |
| `--dry-run` | 実際に書き込まずに何が作成されるかを表示する |

#### gate

実装前（`--phase pre`、デフォルト）または実装後（`--phase post`）に `spec.md` ファイルの完全性を検証します。未解決トークン（`TBD`、`TODO`、`FIXME`、`[NEEDS CLARIFICATION]`）、未チェックのタスク項目、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）、および `- [x] User approved this spec` 承認マーカーを確認します。

```
sdd-forge gate --spec specs/042-contact-form/spec.md
sdd-forge gate --spec specs/042-contact-form/spec.md --phase post
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | スペックファイルへのパス（必須） |
| `--phase pre\|post` | 検証フェーズ; `pre` は Acceptance Criteria セクションのタスク項目チェックをスキップする |

#### flow

SDDフロー全体を自動化します: スペック作成（`--spec` が指定されていない場合）、`gate` の実行、gate 成功時の `forge` 実行。gate が失敗した場合は終了コード `2` で終了し、最大8つのブロッキング問題の一覧とともに `NEEDS_INPUT` を出力します。

```
sdd-forge flow --request "Add pagination to the user list"
sdd-forge flow --request "Fix CSV export encoding" --spec specs/040-csv-fix/spec.md
sdd-forge flow --request "Refactor auth module" --worktree --agent claude --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--request <text>` | ユーザーの変更リクエスト（必須） |
| `--title <text>` | スペックのタイトルスラグ（省略時は `--request` から派生） |
| `--spec <path>` | 新規作成する代わりに既存のスペックを使用する |
| `--agent <name>` | `forge` に渡すAIエージェント |
| `--max-runs <n>` | 最大 `forge` 反復回数（デフォルト: 5） |
| `--forge-mode <mode>` | `local` \| `assist` \| `agent`（デフォルト: `local`） |
| `--no-branch` | 新しいブランチを作成せずにスペックを作成する |
| `--worktree` | 独立したgit worktreeを作成する |
| `--dry-run` | spec-init と forge ステップで書き込みをスキップする |

#### presets list

アーキテクチャレベルのノードとそのリーフプリセット、エイリアス、設定済みスキャンカテゴリを含むプリセットの完全な継承ツリーを表示します。

```
sdd-forge presets list
sdd-forge presets          # 一覧も表示
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->
| 終了コード | 意味 | 主な発生元 |
|---|---|---|
| `0` | 成功 | 任意のコマンドの正常完了 |
| `1` | 一般エラー | 不明なサブコマンド、必須引数の欠落、ファイルが見つからない、AIエージェントの失敗、例外としてスローされるgateエラー |
| `2` | gateチェック失敗（ブロッキング） | `gate` がゼロ以外で終了した場合の `flow` コマンド |

**stdout の規則**

情報提供の進捗メッセージ、生成されたMarkdownのプレビュー（dry-run）、最終的な成功サマリーは `stdout` に書き出されます。`build` コマンドは重み付きプログレスバー（`createProgress()` 経由）を使用し、ステップラベルを出力します。`--verbose` が指定された場合はステップごとの詳細ログも出力します。構造化された出力を生成するコマンド（例: プロジェクト一覧を表示する `default`、ツリーを表示する `presets list`）は書式化されたテキストを直接 `stdout` に書き出します。

**stderr の規則**

エラーメッセージ（不明なコマンドの通知、`--spec` の欠落に関する警告、gateの失敗理由の一覧、パイプラインステップのエラーなど）は `console.error()` を通じて `stderr` に書き出されます。`flow` コマンドは子プロセス（`spec init`、`gate`、`forge`）の `stdout` と `stderr` の両方を転送し、すべての出力が呼び出し元から見えるようにします。

**dry-run 出力**

`--dry-run` が有効な場合、コマンドは発生するはずの各書き込み操作を `[dry-run]` プレフィックス付きの行で表示し、ファイルシステムを変更せずに `0` で終了します。
<!-- {{/text}} -->
