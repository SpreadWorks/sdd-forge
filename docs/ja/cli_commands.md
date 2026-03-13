# 02. CLIコマンドリファレンス

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->
本章では、sdd-forge で利用可能な全20のCLIコマンドを解説します。対象はプロジェクトのセットアップ、ドキュメント生成、spec管理、SDDワークフロー自動化に及びます。コマンドは3層ディスパッチアーキテクチャでルーティングされます。トップレベルのエントリポイント（`sdd-forge.js`）が5つのディスパッチャー（`docs`、`spec`、`flow`、`presets-cmd`、`help`）のいずれかに委譲し、さらに適切な実装モジュールをロードします。
<!-- {{/text}} -->

## Content

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->
| コマンド | ディスパッチャー | 説明 | 主なオプション |
|---|---|---|---|
| `help` | `help.js` | 利用可能なコマンドを説明付きで一覧表示する | — |
| `setup` | `docs` | プロジェクトの登録と設定ファイル生成をインタラクティブに行う | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | `docs` | テンプレート由来のスキルファイルを現在のsdd-forgeバージョンにアップグレードする | `--dry-run` |
| `default [name]` | `docs` | 登録済みプロジェクトを一覧表示するか、デフォルトプロジェクトを設定する | `[name]` 位置引数 |
| `build` | `docs` | ドキュメント生成パイプラインを一括実行する: scan → enrich → init → data → text → readme → agents → [translate] | `--agent`, `--force`, `--verbose`, `--dry-run` |
| `init` | `docs` | プリセットテンプレートから `docs/` を初期化する | `--force`, `--dry-run` |
| `forge` | `docs` | プロンプトとspecをもとにAIでdocsを反復改善する | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--agent`, `--dry-run` |
| `review` | `docs` | レビューチェックリストに対して品質チェックを実行する | — |
| `changelog` | `docs` | `specs/` ディレクトリから `change_log.md` を生成する | — |
| `agents` | `docs` | SDDセクションとプロジェクトセクションで `AGENTS.md` を更新する | `--sdd`, `--project`, `--dry-run` |
| `readme` | `docs` | docsコンテンツから `README.md` を生成する | `--dry-run` |
| `translate` | `docs` | デフォルト言語のdocsをAI経由で設定済みの非デフォルト言語に翻訳する | `--lang`, `--force`, `--dry-run` |
| `scan` | `docs` | ソースコードを解析し、`.sdd-forge/output/analysis.json` に書き出す | — |
| `enrich` | `docs` | AIエージェントを使って `analysis.json` の各エントリーに役割・概要・章分類を付与する | `--agent` |
| `data` | `docs` | `docs/` 内の全 `{{data}}` ディレクティブを解決して生成済みMarkdownに置換する | `--dry-run` |
| `text` | `docs` | AIエージェントを使って `docs/` 内の全 `{{text}}` ディレクティブを解決する | `--agent`, `--dry-run` |
| `spec` | `spec` | 番号付きフィーチャーブランチを作成し、`specs/NNN-slug/spec.md` を初期化する | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `gate` | `spec` | 実装前後にspecファイルの未解決項目を検証する | `--spec`, `--phase` |
| `flow` | `flow`（直接） | SDDフロー全体を自動化する: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `presets list` | `presets-cmd`（直接） | プリセットの継承ツリーを表示する | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->
以下のオプションは、サブコマンドのディスパッチ前に `sdd-forge.js` が処理するものであり、どのコマンドを実行する場合でも適用されます。

| オプション | 短縮形 | 説明 |
|---|---|---|
| `--project <name>` | — | 登録済みプロジェクトを名前で選択する。コマンド実行中の環境変数 `SDD_SOURCE_ROOT` と `SDD_WORK_ROOT` を設定する。 |
| `--version` | `-v`, `-V` | インストール済みのsdd-forgeパッケージバージョンを表示して終了する。 |
| `--help` | `-h` | トップレベルのコマンド一覧を表示する。個別コマンドに付与した場合は、そのコマンド自身のヘルプテキストを表示する。 |

> **注意:** `--project` はディスパッチャーにサブコマンド引数を転送する前に `process.argv` から除去されるため、個別のコマンドモジュールがこれを受け取ることはありません。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->
#### help

利用可能なコマンドをセクション別（Project、Build、Docs、Scan、Spec、Flow、Info）にグループ化して表示します。各コマンドの一行説明は i18n の `ui:help.commands.*` キーから取得します。パッケージバージョンは実行時に `package.json` から読み込まれます。

```
sdd-forge help
sdd-forge          # 引数なしでもヘルプを表示
sdd-forge -h
```

#### setup

プロジェクトを登録し、`.sdd-forge/config.json` を作成し、`AGENTS.md` を生成し、`CLAUDE.md` シンボリックリンクを作成し、`.agents/skills/` および `.claude/skills/` 配下にスキルファイルをインストールするインタラクティブウィザードを起動します。各ステップはCLIフラグで非インタラクティブに指定することもできます。

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
| `--agent <name>` | デフォルトAIエージェント名 |
| `--lang <code>` | 出力言語コード |
| `--set-default` | このプロジェクトをデフォルトとして設定する |
| `--dry-run` | 書き込みを行わず内容を表示する |

#### upgrade

テンプレート管理ファイル（主に `.agents/skills/` 配下のスキル `SKILL.md` ファイル）を、現在インストールされているsdd-forgeバージョンに同梱されたテンプレートに合わせてアップグレードします。繰り返し実行しても安全で、テンプレート由来のコンテンツのみを上書きし、`config.json` には一切触れません。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### default

引数なしで実行すると、登録済みプロジェクトを一覧表示し、現在のデフォルトをマークします。プロジェクト名を指定するとデフォルトを変更します。

```
sdd-forge default               # プロジェクト一覧表示
sdd-forge default myapp         # "myapp" をデフォルトに設定
```

#### build

ドキュメント生成パイプラインを順に実行します: `scan → enrich → init → data → text → readme → agents`。設定の `output.isMultiLang` が `true` の場合、`translate`（または言語別生成）ステップが末尾に追加されます。進捗は重み付きプログレスバーで表示されます。

```
sdd-forge build
sdd-forge build --agent claude --force --verbose
sdd-forge build --dry-run
```

| オプション | 説明 |
|---|---|
| `--agent <name>` | `enrich` と `text` ステップで使用するAIエージェント（`config.defaultAgent` を上書き） |
| `--force` | 既存のdocsファイルを強制的に再初期化する |
| `--verbose` | ステップごとのログ出力を表示する |
| `--dry-run` | ファイル書き込みをスキップする |

#### init

プリセットテンプレートから `docs/` を初期化（または再初期化）します。`--force` を指定しない限り、既存ファイルはスキップされます。

```
sdd-forge init
sdd-forge init --force
```

#### forge

指定した `--prompt` と、オプションでリンクされたspecをもとにAIエージェントへプロンプトを送り、`docs/` のコンテンツを反復改善します。レビューが通るまで最大 `--max-runs` 回実行します。

```
sdd-forge forge --prompt "add enrich command section"
sdd-forge forge --prompt "describe gate phases" --spec specs/042-gate-docs/spec.md --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善リクエスト（必須） |
| `--spec <path>` | コンテキストとして使用するspecファイルのパス |
| `--max-runs <n>` | 最大改善反復回数（デフォルト: 5） |
| `--mode <mode>` | `local` \| `assist` \| `agent` |
| `--agent <name>` | 設定済みのデフォルトエージェントを上書きする |
| `--dry-run` | 書き込みをスキップする |

#### review

レビューチェックリスト（`templates/review-checklist.md`）に対して `docs/` の品質チェックを実行し、問題点を報告します。チェックが失敗した場合は非ゼロで終了します。

```
sdd-forge review
```

#### changelog

全 `specs/NNN-*/spec.md` ファイルを読み込み、プロジェクトルートの `change_log.md` を生成または更新します。

```
sdd-forge changelog
```

#### agents

`agents.sdd` データソース（SDDセクション）および `agents.project`（プロジェクトセクション）をもとに `AGENTS.md` を更新します。デフォルトでは両セクションを更新します。

```
sdd-forge agents
sdd-forge agents --sdd            # SDDセクションのみ更新
sdd-forge agents --project        # プロジェクトセクションのみ更新
sdd-forge agents --dry-run
```

#### readme

docsコンテンツとプリセットのREADMEテンプレートをもとに、プロジェクトルートの `README.md` を生成します。

```
sdd-forge readme
sdd-forge readme --dry-run
```

#### translate

`docs/` のデフォルト言語ファイルを、`output.languages` に設定された全非デフォルト言語に翻訳します。`--force` を指定しない限り、既存の翻訳よりソースの `mtime` が新しいファイルのみ再翻訳します。

```
sdd-forge translate
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

| オプション | 説明 |
|---|---|
| `--lang <code>` | この言語のみに翻訳する |
| `--force` | mtimeに関わらず全ファイルを再翻訳する |
| `--dry-run` | 書き込みを行わず翻訳対象を表示する |

#### scan

設定済みの `sourcePath` 配下のソースコードを解析し、構造化された解析データを `.sdd-forge/output/analysis.json` に書き出します。

```
sdd-forge scan
```

#### enrich

`analysis.json` を読み込み、AIエージェントを使って各エントリーに `role`・`summary`・`detail`・章分類を付与します。エンリッチ済みの結果は `analysis.json` に書き戻されます。

```
sdd-forge enrich --agent claude
```

#### data

`docs/` 内の全 `{{data: …}}` ディレクティブをインプレースで解決し、ディレクティブブロックを生成済みMarkdownに置換します。`{{text}}` ブロックは再処理せずスキップします。

```
sdd-forge data
sdd-forge data --dry-run
```

#### text

`docs/` 内で見つかった各 `{{text: …}}` ディレクティブに対してAIエージェントを呼び出し、生成テキストを挿入します。本文が存在しないディレクティブ（または `--force` 使用時に古い本文を持つもの）のみ処理されます。

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
```

#### spec

番号付きフィーチャーブランチ（`feature/NNN-slug`）を作成し、`specs/NNN-slug/spec.md` と `specs/NNN-slug/qa.md` をスキャフォールドします。ブランチ戦略として、branch（デフォルト）、worktree、specのみの3種類をサポートします。

```
sdd-forge spec --title "contact-form"
sdd-forge spec --title "contact-form" --worktree
sdd-forge spec --title "contact-form" --no-branch
sdd-forge spec --title "contact-form" --dry-run
```

| オプション | 説明 |
|---|---|
| `--title <text>` | フィーチャー名 — ブランチ・ディレクトリのスラグに使用（必須） |
| `--base <branch>` | ベースブランチ（デフォルトは現在のHEAD） |
| `--no-branch` | ブランチを作成せずspecファイルのみ作成する |
| `--worktree` | `.sdd-forge/worktree/` 配下に独立したgit worktreeを作成する |
| `--allow-dirty` | 作業ツリーの清潔さチェックをスキップする |
| `--dry-run` | 書き込みを行わず作成内容を表示する |

#### gate

実装前（`--phase pre`、デフォルト）または実装後（`--phase post`）に `spec.md` ファイルの完全性を検証します。未解決トークン（`TBD`、`TODO`、`FIXME`、`[NEEDS CLARIFICATION]`）、未チェックのタスク項目、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）、および `- [x] User approved this spec` 承認マーカーを確認します。

```
sdd-forge gate --spec specs/042-contact-form/spec.md
sdd-forge gate --spec specs/042-contact-form/spec.md --phase post
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | specファイルへのパス（必須） |
| `--phase pre\|post` | 検証フェーズ。`pre` はAcceptance Criteriaセクションのタスク項目チェックをスキップする |

#### flow

SDDフロー全体を自動化します: specの作成（`--spec` が指定されていない場合）、`gate` の実行、そしてgate成功時の `forge` 実行。gateが失敗した場合、終了コード `2` で `NEEDS_INPUT` を出力し、最大8件のブロッキング問題を一覧表示します。

```
sdd-forge flow --request "Add pagination to the user list"
sdd-forge flow --request "Fix CSV export encoding" --spec specs/040-csv-fix/spec.md
sdd-forge flow --request "Refactor auth module" --worktree --agent claude --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--request <text>` | ユーザーの変更リクエスト（必須） |
| `--title <text>` | specタイトルのスラグ（省略時は `--request` から導出） |
| `--spec <path>` | 新規作成の代わりに既存のspecを使用する |
| `--agent <name>` | `forge` に渡すAIエージェント |
| `--max-runs <n>` | `forge` の最大反復回数（デフォルト: 5） |
| `--forge-mode <mode>` | `local` \| `assist` \| `agent`（デフォルト: `local`） |
| `--no-branch` | 新規ブランチを作成せずspecを作成する |
| `--worktree` | 独立したgit worktreeを作成する |
| `--dry-run` | spec-initとforgeステップの書き込みをスキップする |

#### presets list

プリセットの継承ツリー全体を表示します。アーキテクチャレベルのノードと、そのリーフプリセット（エイリアスおよび設定済みスキャンカテゴリを含む）が表示されます。

```
sdd-forge presets list
sdd-forge presets          # 一覧も表示される
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->
| 終了コード | 意味 | 典型的な発生元 |
|---|---|---|
| `0` | 成功 | 任意のコマンドが正常完了した場合 |
| `1` | 一般エラー | 不明なサブコマンド、必須引数の欠如、ファイルが見つからない、AIエージェントの失敗、例外としてスローされたgateエラー |
| `2` | gateチェック失敗（ブロッキング） | `gate` が非ゼロで終了した場合の `flow` コマンド |

**stdout の規則**

情報提供用の進捗メッセージ、生成済みMarkdownのプレビュー（dry-run）、最終的な成功サマリーは `stdout` に書き出されます。`build` コマンドは重み付きプログレスバー（`createProgress()` 経由）を使用してステップラベルを表示し、`--verbose` 設定時はステップごとの詳細ログもオプションで表示します。構造化された出力を生成するコマンド（例: プロジェクト一覧を表示する `default`、ツリーを表示する `presets list`）は、フォーマット済みテキストを直接 `stdout` に書き出します。

**stderr の規則**

エラーメッセージ（不明なコマンドの通知、`--spec` 未指定の警告、gateの失敗理由リスト、パイプラインステップのエラーなど）は `console.error()` 経由で `stderr` に書き出されます。`flow` コマンドは子プロセス（`spec init`、`gate`、`forge`）の `stdout` と `stderr` の両方を転送するため、全ての出力が呼び出し元から確認できます。

**dry-runの出力**

`--dry-run` が有効な場合、コマンドは実行されるはずだった各書き込み操作を `[dry-run]` プレフィックス付きで表示した後、ファイルシステムを変更せずに終了コード `0` で終了します。
<!-- {{/text}} -->
