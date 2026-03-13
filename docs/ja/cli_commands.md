# 02. CLIコマンドリファレンス

## 概要

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->
この章では、sdd-forge で利用可能な全20のCLIコマンドを解説します。プロジェクトのセットアップ、ドキュメント生成、spec管理、SDDワークフロー自動化を網羅しています。コマンドは3層のディスパッチアーキテクチャを通じてルーティングされます。トップレベルのエントリポイント（`sdd-forge.js`）が5つのディスパッチャー（`docs`、`spec`、`flow`、`presets-cmd`、`help`）のいずれかに委譲し、さらに対応する実装モジュールがロードされます。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->
| コマンド | ディスパッチャー | 説明 | 主なオプション |
|---|---|---|---|
| `help` | `help.js` | 利用可能な全コマンドと説明を表示 | — |
| `setup` | `docs` | プロジェクトの対話的な登録と設定ファイルの生成 | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | `docs` | テンプレート由来のスキルファイルを現在のsdd-forgeバージョンにアップグレード | `--dry-run` |
| `default [name]` | `docs` | 登録済みプロジェクトの一覧表示またはデフォルトプロジェクトの設定 | `[name]` 位置引数 |
| `build` | `docs` | ドキュメント生成パイプラインの全ステップを実行: scan → enrich → init → data → text → readme → agents → [translate] | `--agent`, `--force`, `--verbose`, `--dry-run` |
| `init` | `docs` | プリセットテンプレートから `docs/` を初期化 | `--force`, `--dry-run` |
| `forge` | `docs` | プロンプトとspecに基づき、AIを使ってdocsを反復的に改善 | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--agent`, `--dry-run` |
| `review` | `docs` | レビューチェックリストに基づいて品質チェックを実行 | — |
| `changelog` | `docs` | `specs/` ディレクトリから `change_log.md` を生成 | — |
| `agents` | `docs` | SDDセクションとプロジェクトセクションで `AGENTS.md` を更新 | `--sdd`, `--project`, `--dry-run` |
| `readme` | `docs` | docsコンテンツから `README.md` を生成 | `--dry-run` |
| `translate` | `docs` | デフォルト言語のdocsをAI経由で設定済みの非デフォルト言語に翻訳 | `--lang`, `--force`, `--dry-run` |
| `scan` | `docs` | ソースコードを解析し `.sdd-forge/output/analysis.json` に書き出す | — |
| `enrich` | `docs` | AIエージェントを使って `analysis.json` の各エントリにロール・サマリー・章分類を付与 | `--agent` |
| `data` | `docs` | `docs/` ファイル内の `{{data}}` ディレクティブをすべて解決 | `--dry-run` |
| `text` | `docs` | AIエージェントを呼び出して `docs/` ファイル内の `{{text}}` ディレクティブをすべて解決 | `--agent`, `--dry-run` |
| `spec` | `spec` | 番号付きフィーチャーブランチを作成し `specs/NNN-slug/spec.md` を初期化 | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `gate` | `spec` | 実装前後にspecファイルの未解決項目を検証 | `--spec`, `--phase` |
| `flow` | `flow`（直接） | SDDフローを自動化: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `presets list` | `presets-cmd`（直接） | プリセット継承ツリーを表示 | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->
以下のオプションは `sdd-forge.js` がサブコマンドをディスパッチする前に処理され、どのコマンドを実行する場合にも適用されます。

| オプション | 短縮形 | 説明 |
|---|---|---|
| `--project <name>` | — | 登録済みプロジェクトを名前で選択。コマンドの実行中、`SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` 環境変数を設定します。 |
| `--version` | `-v`, `-V` | インストール済みのsdd-forgeバージョンを表示して終了。 |
| `--help` | `-h` | トップレベルのコマンド一覧を表示。個別のコマンドに渡した場合は、そのコマンド固有のヘルプテキストを表示。 |

> **注:** `--project` はサブコマンド引数がディスパッチャーに転送される前に `process.argv` からサイレントに除去されるため、個別のコマンドモジュールには渡りません。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->
#### help

利用可能な全コマンドをセクション別（Project、Build、Docs、Scan、Spec、Flow、Info）にグループ化して表示し、i18n の `ui:help.commands.*` キーから取得した1行の説明を付記します。パッケージバージョンは実行時に `package.json` から読み取ります。

```
sdd-forge help
sdd-forge          # 引数なしの場合もヘルプを表示
sdd-forge -h
```

#### setup

対話形式のウィザードを起動し、プロジェクトの登録、`.sdd-forge/config.json` の作成、`AGENTS.md` の生成、`CLAUDE.md` シンボリックリンクの作成、および `.agents/skills/` と `.claude/skills/` へのスキルファイルのインストールを行います。各ステップはCLIフラグで非対話的に指定することもできます。

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
| `--set-default` | このプロジェクトをデフォルトとして設定 |
| `--dry-run` | 書き込みを行わずに実行内容を表示 |

#### upgrade

テンプレート管理ファイル、具体的には `.agents/skills/` 配下のスキル `SKILL.md` ファイルを、現在インストールされているsdd-forgeバージョンにバンドルされたテンプレートに合わせてアップグレードします。繰り返し実行しても安全で、テンプレート由来のコンテンツのみを上書きし、`config.json` には一切触れません。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### default

引数なしの場合、登録済みプロジェクトの一覧を表示し、現在のデフォルトを示します。プロジェクト名を指定した場合はデフォルトを変更します。

```
sdd-forge default               # プロジェクト一覧を表示
sdd-forge default myapp         # "myapp" をデフォルトに設定
```

#### build

ドキュメント生成パイプラインを順番に実行します: `scan → enrich → init → data → text → readme → agents`。設定の `output.isMultiLang` が `true` の場合、`translate`（または言語別の生成）ステップが末尾に追加されます。進行状況は重み付きプログレスバーで表示されます。

```
sdd-forge build
sdd-forge build --agent claude --force --verbose
sdd-forge build --dry-run
```

| オプション | 説明 |
|---|---|
| `--agent <name>` | `enrich` と `text` ステップで使用するAIエージェント（`config.defaultAgent` を上書き） |
| `--force` | 既存のdocsファイルを強制的に再初期化 |
| `--verbose` | ステップごとのログ出力を表示 |
| `--dry-run` | すべてのファイル書き込みをスキップ |

#### init

プリセットテンプレートから `docs/` を初期化（または再初期化）します。`--force` が指定されない限り、既存のファイルはスキップされます。

```
sdd-forge init
sdd-forge init --force
```

#### forge

指定された `--prompt` と、オプションで連携するspecを使ってAIエージェントにプロンプトを送り、`docs/` コンテンツを反復的に改善します。レビューが通過するまで最大 `--max-runs` 回繰り返します。

```
sdd-forge forge --prompt "add enrich command section"
sdd-forge forge --prompt "describe gate phases" --spec specs/042-gate-docs/spec.md --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善リクエスト（必須） |
| `--spec <path>` | コンテキスト用のspecファイルパス |
| `--max-runs <n>` | 最大改善反復回数（デフォルト: 5） |
| `--mode <mode>` | `local` \| `assist` \| `agent` |
| `--agent <name>` | 設定済みのデフォルトエージェントを上書き |
| `--dry-run` | 書き込みをスキップ |

#### review

レビューチェックリスト（`templates/review-checklist.md`）に基づいて品質チェックを実行し、`docs/` で見つかった問題点を報告します。チェックが失敗した場合はゼロ以外で終了します。

```
sdd-forge review
```

#### changelog

すべての `specs/NNN-*/spec.md` ファイルを読み込み、プロジェクトルートに `change_log.md` を生成または更新します。

```
sdd-forge changelog
```

#### agents

最新のSDDセクション（`agents.sdd` データソースから）および/またはプロジェクトセクション（`agents.project` から）で `AGENTS.md` を更新します。デフォルトでは両方のセクションを更新します。

```
sdd-forge agents
sdd-forge agents --sdd            # SDDセクションのみ更新
sdd-forge agents --project        # プロジェクトセクションのみ更新
sdd-forge agents --dry-run
```

#### readme

docsコンテンツとプリセットのREADMEテンプレートから、プロジェクトルートに `README.md` を生成します。

```
sdd-forge readme
sdd-forge readme --dry-run
```

#### translate

デフォルト言語の `docs/` ファイルを、設定された全非デフォルト言語に翻訳します。`--force` が指定されない限り、既存の翻訳よりソースの `mtime` が新しいファイルのみ再翻訳します。

```
sdd-forge translate
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

| オプション | 説明 |
|---|---|
| `--lang <code>` | この言語のみに翻訳 |
| `--force` | mtimeに関わらず全ファイルを再翻訳 |
| `--dry-run` | 書き込みを行わずに翻訳対象を表示 |

#### scan

設定された `sourcePath` 配下のソースコードを解析し、構造化された解析データを `.sdd-forge/output/analysis.json` に書き出します。

```
sdd-forge scan
```

#### enrich

`analysis.json` を読み込み、AIエージェントを使って各エントリに `role`、`summary`、`detail`、および章分類を付与します。エンリッチされた結果は `analysis.json` に書き戻されます。

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

`docs/` ファイル内で見つかった各 `{{text: …}}` ディレクティブに対してAIエージェントを呼び出し、生成されたテキストを挿入します。本文が存在しないディレクティブ（または `--force` 使用時に古い本文のあるもの）のみ処理されます。

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
```

#### spec

番号付きフィーチャーブランチ（`feature/NNN-slug`）を作成し、`specs/NNN-slug/spec.md` と `specs/NNN-slug/qa.md` をスキャフォールドします。ブランチ戦略として、branch（デフォルト）、worktree、specのみ の3種類をサポートします。

```
sdd-forge spec --title "contact-form"
sdd-forge spec --title "contact-form" --worktree
sdd-forge spec --title "contact-form" --no-branch
sdd-forge spec --title "contact-form" --dry-run
```

| オプション | 説明 |
|---|---|
| `--title <text>` | フィーチャー名 — ブランチ/ディレクトリのスラッグに使用（必須） |
| `--base <branch>` | ベースブランチ（デフォルトは現在のHEAD） |
| `--no-branch` | specファイルのみ作成し、ブランチは作成しない |
| `--worktree` | `.sdd-forge/worktree/` 配下に独立したgit worktreeを作成 |
| `--allow-dirty` | 作業ツリーの清潔さチェックをスキップ |
| `--dry-run` | 書き込みを行わずに作成内容を表示 |

#### gate

実装前（`--phase pre`、デフォルト）または実装後（`--phase post`）に `spec.md` ファイルの完全性を検証します。未解決トークン（`TBD`、`TODO`、`FIXME`、`[NEEDS CLARIFICATION]`）、未チェックのタスク項目、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）、および `- [x] User approved this spec` の承認マーカーを確認します。

```
sdd-forge gate --spec specs/042-contact-form/spec.md
sdd-forge gate --spec specs/042-contact-form/spec.md --phase post
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | specファイルのパス（必須） |
| `--phase pre\|post` | 検証フェーズ。`pre` はAcceptance Criteriaセクションのタスク項目チェックをスキップ |

#### flow

SDDフローの全体を自動化します: specの作成（`--spec` が指定されない場合）、`gate` の実行、そしてgateが成功した場合の `forge` の実行。gateが失敗した場合、最大8件のブロッキング問題を列挙して `NEEDS_INPUT` を出力し、終了コード `2` で終了します。

```
sdd-forge flow --request "Add pagination to the user list"
sdd-forge flow --request "Fix CSV export encoding" --spec specs/040-csv-fix/spec.md
sdd-forge flow --request "Refactor auth module" --worktree --agent claude --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--request <text>` | ユーザーの変更リクエスト（必須） |
| `--title <text>` | specタイトルスラッグ（省略時は `--request` から導出） |
| `--spec <path>` | 新規作成の代わりに既存のspecを使用 |
| `--agent <name>` | `forge` に渡すAIエージェント |
| `--max-runs <n>` | `forge` の最大反復回数（デフォルト: 5） |
| `--forge-mode <mode>` | `local` \| `assist` \| `agent`（デフォルト: `local`） |
| `--no-branch` | 新しいブランチを作成せずにspecを作成 |
| `--worktree` | 独立したgit worktreeを作成 |
| `--dry-run` | spec-initとforgeステップの書き込みをスキップ |

#### presets list

アーキテクチャレベルのノードとそのリーフプリセットを、エイリアスおよび設定済みのスキャンカテゴリと共に表示し、プリセット継承ツリー全体を出力します。

```
sdd-forge presets list
sdd-forge presets          # こちらでも一覧を表示
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->
| 終了コード | 意味 | 主な発生元 |
|---|---|---|
| `0` | 成功 | 任意のコマンドの正常完了 |
| `1` | 一般エラー | 不明なサブコマンド、必須引数の欠如、ファイルが見つからない、AIエージェントの失敗、例外としてスローされたgateエラー |
| `2` | gateチェック失敗（ブロッキング） | `gate` がゼロ以外で終了した際の `flow` コマンド |

**stdout の規約**

情報メッセージ、生成されたMarkdownのプレビュー（dry-run）、および最終的な成功サマリーは `stdout` に書き出されます。`build` コマンドは重み付きプログレスバー（`createProgress()` 経由）を使用し、ステップラベルを表示します。`--verbose` が指定された場合は、ステップごとの詳細ログもオプションで表示されます。構造化された出力を生成するコマンド（例: プロジェクト一覧を表示する `default`、ツリーを表示する `presets list`）は、フォーマット済みのテキストを直接 `stdout` に書き出します。

**stderr の規約**

エラーメッセージ — 不明なコマンドの通知、`--spec` の欠如に関する警告、gateの失敗理由リスト、パイプラインステップのエラーなど — は `console.error()` 経由で `stderr` に書き出されます。`flow` コマンドは子プロセス（`spec init`、`gate`、`forge`）の `stdout` と `stderr` の両方を転送するため、すべての出力が呼び出し元から見えるようになります。

**dry-run の出力**

`--dry-run` が有効な場合、コマンドは発生するであろう各書き込み操作を `[dry-run]` プレフィックス付きの行で表示し、ファイルシステムを変更することなく `0` で終了します。
<!-- {{/text}} -->
