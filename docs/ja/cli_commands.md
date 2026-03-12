# 02. CLIコマンドリファレンス

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->
本章では、sdd-forge で利用可能な全20のCLIコマンドを解説します。対象はプロジェクトセットアップ、ドキュメント生成、spec管理、SDDワークフロー自動化に及びます。コマンドは3層ディスパッチアーキテクチャでルーティングされ、トップレベルエントリポイント（`sdd-forge.js`）が5つのディスパッチャー（`docs`、`spec`、`flow`、`presets-cmd`、`help`）のいずれかに委譲し、さらに対応する実装モジュールをロードします。
<!-- {{/text}} -->

## Content

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->
| コマンド | ディスパッチャー | 説明 | 主なオプション |
|---|---|---|---|
| `help` | `help.js` | 利用可能な全コマンドを説明付きで表示 | — |
| `setup` | `docs` | インタラクティブなプロジェクト登録と設定ファイル生成 | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | `docs` | テンプレート由来のスキルファイルを現在の sdd-forge バージョンにアップグレード | `--dry-run` |
| `default [name]` | `docs` | 登録済みプロジェクトの一覧表示、またはデフォルトプロジェクトの設定 | `[name]` 位置引数 |
| `build` | `docs` | ドキュメント生成パイプラインを全実行: scan → enrich → init → data → text → readme → agents → [translate] | `--agent`, `--force`, `--verbose`, `--dry-run` |
| `init` | `docs` | プリセットテンプレートから `docs/` を初期化 | `--force`, `--dry-run` |
| `forge` | `docs` | プロンプトと spec をもとに AI でドキュメントを反復改善 | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--agent`, `--dry-run` |
| `review` | `docs` | レビューチェックリストに基づく品質チェックを実行 | — |
| `changelog` | `docs` | `specs/` ディレクトリから `change_log.md` を生成 | — |
| `agents` | `docs` | SDD セクションとプロジェクトセクションで `AGENTS.md` を更新 | `--sdd`, `--project`, `--dry-run` |
| `readme` | `docs` | docs コンテンツから `README.md` を生成 | `--dry-run` |
| `translate` | `docs` | デフォルト言語の docs を、設定されたその他の言語へ AI 翻訳 | `--lang`, `--force`, `--dry-run` |
| `scan` | `docs` | ソースコードを解析し `.sdd-forge/output/analysis.json` に書き出す | — |
| `enrich` | `docs` | AI エージェントで `analysis.json` の各エントリに役割・概要・章分類を付与 | `--agent` |
| `data` | `docs` | `docs/` ファイル内のすべての `{{data}}` ディレクティブを解決 | `--dry-run` |
| `text` | `docs` | AI エージェントで `docs/` ファイル内のすべての `{{text}}` ディレクティブを解決 | `--agent`, `--dry-run` |
| `spec` | `spec` | 番号付きフィーチャーブランチを作成し `specs/NNN-slug/spec.md` を初期化 | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `gate` | `spec` | 実装前後に spec ファイルの未解決事項を検証 | `--spec`, `--phase` |
| `flow` | `flow`（直接） | SDDフロー全体を自動実行: spec 初期化 → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `presets list` | `presets-cmd`（直接） | プリセット継承ツリーを表示 | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->
以下のオプションは `sdd-forge.js` がサブコマンドをディスパッチする前に処理され、どのコマンドを実行する場合でも共通して適用されます。

| オプション | 短縮形 | 説明 |
|---|---|---|
| `--project <name>` | — | 登録済みプロジェクトを名前で選択します。コマンド実行中、`SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` 環境変数をセットします。 |
| `--version` | `-v`, `-V` | インストール済みの sdd-forge パッケージバージョンを表示して終了します。 |
| `--help` | `-h` | トップレベルのコマンド一覧を表示します。個別コマンドに渡した場合は、そのコマンド自身のヘルプを表示します。 |

> **注:** `--project` はサブコマンドの引数をディスパッチャーに転送する前に `process.argv` から除去されるため、個別のコマンドモジュールがこのオプションを受け取ることはありません。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->
#### help

利用可能なコマンドをセクション別（Project、Build、Docs、Scan、Spec、Flow、Info）にグループ化して表示します。各コマンドの一行説明は i18n の `ui:help.commands.*` キーから取得されます。パッケージバージョンは実行時に `package.json` から読み込まれます。

```
sdd-forge help
sdd-forge          # 引数なしでもヘルプを表示
sdd-forge -h
```

#### setup

インタラクティブなウィザードを起動し、プロジェクトの登録、`.sdd-forge/config.json` の作成、`AGENTS.md` の生成、`CLAUDE.md` シンボリックリンクの作成、`.agents/skills/` および `.claude/skills/` へのスキルファイルのインストールを行います。各ステップは CLI フラグで非インタラクティブに指定することも可能です。

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
| `--set-default` | このプロジェクトをデフォルトとして設定 |
| `--dry-run` | 書き込みを行わずに実行内容を表示 |

#### upgrade

テンプレート管理ファイル（`.agents/skills/` 配下のスキル `SKILL.md` ファイル）を、現在インストールされている sdd-forge バージョンのテンプレートに合わせてアップグレードします。繰り返し実行しても安全で、テンプレート由来のコンテンツのみを上書きし、`config.json` には触れません。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### default

引数なしの場合、登録済みプロジェクトの一覧を表示し、現在のデフォルトにマークを付けます。プロジェクト名を指定した場合はデフォルトを変更します。

```
sdd-forge default               # プロジェクト一覧を表示
sdd-forge default myapp         # "myapp" をデフォルトに設定
```

#### build

ドキュメント生成パイプラインを順番に実行します: `scan → enrich → init → data → text → readme → agents`。設定の `output.isMultiLang` が `true` の場合、`translate`（または言語ごとの生成）ステップが追加されます。進捗は重み付きプログレスバーで表示されます。

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
| `--dry-run` | ファイル書き込みをすべてスキップ |

#### init

プリセットテンプレートから `docs/` を初期化（または再初期化）します。`--force` が指定されない限り、既存ファイルはスキップされます。

```
sdd-forge init
sdd-forge init --force
```

#### forge

指定した `--prompt` と任意でリンクされた spec をもとに AI エージェントへプロンプトを送り、`docs/` コンテンツを反復改善します。レビューが通るまで、または `--max-runs` に達するまで繰り返します。

```
sdd-forge forge --prompt "add enrich command section"
sdd-forge forge --prompt "describe gate phases" --spec specs/042-gate-docs/spec.md --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善リクエスト（必須） |
| `--spec <path>` | コンテキストとして使用する spec ファイルのパス |
| `--max-runs <n>` | 最大改善イテレーション数（デフォルト: 5） |
| `--mode <mode>` | `local` \| `assist` \| `agent` |
| `--agent <name>` | 設定済みのデフォルトエージェントを上書き |
| `--dry-run` | 書き込みをスキップ |

#### review

レビューチェックリスト（`templates/review-checklist.md`）に基づいて `docs/` の品質チェックを実行し、問題があればレポートします。チェックが失敗した場合は非ゼロで終了します。

```
sdd-forge review
```

#### changelog

すべての `specs/NNN-*/spec.md` ファイルを読み込み、プロジェクトルートの `change_log.md` を生成または更新します。

```
sdd-forge changelog
```

#### agents

`agents.sdd` データソース（SDD セクション）および `agents.project`（プロジェクトセクション）をもとに `AGENTS.md` を更新します。デフォルトでは両方のセクションを更新します。

```
sdd-forge agents
sdd-forge agents --sdd            # SDD セクションのみ更新
sdd-forge agents --project        # プロジェクトセクションのみ更新
sdd-forge agents --dry-run
```

#### readme

docs コンテンツとプリセットの README テンプレートをもとに、プロジェクトルートへ `README.md` を生成します。

```
sdd-forge readme
sdd-forge readme --dry-run
```

#### translate

デフォルト言語の `docs/` ファイルを、`output.languages` に設定されたすべての非デフォルト言語へ翻訳します。`--force` が指定されない限り、既存の翻訳より新しい `mtime` を持つソースファイルのみを再翻訳します。

```
sdd-forge translate
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

| オプション | 説明 |
|---|---|
| `--lang <code>` | 指定した言語にのみ翻訳 |
| `--force` | mtime に関わらず全ファイルを再翻訳 |
| `--dry-run` | 書き込みを行わずに翻訳対象を表示 |

#### scan

設定された `sourcePath` 配下のソースコードを解析し、構造化された解析データを `.sdd-forge/output/analysis.json` に書き出します。

```
sdd-forge scan
```

#### enrich

`analysis.json` を読み込み、AI エージェントを使って各エントリに `role`、`summary`、`detail`、章分類を付与します。エンリッチ済みの結果は `analysis.json` に書き戻されます。

```
sdd-forge enrich --agent claude
```

#### data

`docs/` ファイル内のすべての `{{data: …}}` ディレクティブをその場で解決し、ディレクティブブロックを生成した Markdown で置き換えます。`{{text}}` ブロックは再処理せずにスキップします。

```
sdd-forge data
sdd-forge data --dry-run
```

#### text

`docs/` ファイル内で見つかった各 `{{text: …}}` ディレクティブに対して AI エージェントを呼び出し、生成したテキストを挿入します。本文が存在しないディレクティブ（または `--force` 使用時は古い本文を持つもの）のみを処理します。

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
```

#### spec

番号付きフィーチャーブランチ（`feature/NNN-slug`）を作成し、`specs/NNN-slug/spec.md` と `specs/NNN-slug/qa.md` を雛形から生成します。ブランチ戦略は3種類（branch（デフォルト）、worktree、spec-only）から選択できます。

```
sdd-forge spec --title "contact-form"
sdd-forge spec --title "contact-form" --worktree
sdd-forge spec --title "contact-form" --no-branch
sdd-forge spec --title "contact-form" --dry-run
```

| オプション | 説明 |
|---|---|
| `--title <text>` | 機能名 — ブランチ/ディレクトリのスラグに使用（必須） |
| `--base <branch>` | ベースブランチ（デフォルトは現在の HEAD） |
| `--no-branch` | spec ファイルのみ作成し、ブランチは作成しない |
| `--worktree` | `.sdd-forge/worktree/` 配下に独立した git worktree を作成 |
| `--allow-dirty` | ワーキングツリーのクリーンチェックをスキップ |
| `--dry-run` | 書き込みを行わずに作成内容を表示 |

#### gate

実装前（`--phase pre`、デフォルト）または実装後（`--phase post`）に `spec.md` ファイルの完全性を検証します。未解決トークン（`TBD`、`TODO`、`FIXME`、`[NEEDS CLARIFICATION]`）、未チェックのタスクアイテム、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）の存在、および `- [x] User approved this spec` 承認マーカーを確認します。

```
sdd-forge gate --spec specs/042-contact-form/spec.md
sdd-forge gate --spec specs/042-contact-form/spec.md --phase post
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | spec ファイルのパス（必須） |
| `--phase pre\|post` | 検証フェーズ。`pre` の場合、Acceptance Criteria セクションのタスクアイテムチェックをスキップ |

#### flow

SDDフロー全体を自動化します: spec の作成（`--spec` 未指定の場合）、`gate` の実行、gate 成功後の `forge` 実行。gate が失敗した場合、最大8件のブロッキング問題を一覧表示したうえで `NEEDS_INPUT` を出力し、終了コード `2` で終了します。

```
sdd-forge flow --request "Add pagination to the user list"
sdd-forge flow --request "Fix CSV export encoding" --spec specs/040-csv-fix/spec.md
sdd-forge flow --request "Refactor auth module" --worktree --agent claude --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--request <text>` | ユーザーの変更リクエスト（必須） |
| `--title <text>` | spec タイトルスラグ（省略時は `--request` から派生） |
| `--spec <path>` | 既存の spec を新規作成の代わりに使用 |
| `--agent <name>` | `forge` に渡す AI エージェント |
| `--max-runs <n>` | `forge` の最大イテレーション数（デフォルト: 5） |
| `--forge-mode <mode>` | `local` \| `assist` \| `agent`（デフォルト: `local`） |
| `--no-branch` | 新しいブランチを作成せずに spec を作成 |
| `--worktree` | 独立した git worktree を作成 |
| `--dry-run` | spec 初期化と forge ステップの書き込みをスキップ |

#### presets list

アーキテクチャレベルのノードとそのリーフプリセット（エイリアスおよび設定済みスキャンカテゴリを含む）を合わせて表示し、プリセット継承ツリー全体を一覧表示します。

```
sdd-forge presets list
sdd-forge presets          # 上記と同じ一覧を表示
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->
| 終了コード | 意味 | 主な発生元 |
|---|---|---|
| `0` | 成功 | 任意のコマンドの正常終了 |
| `1` | 一般エラー | 不明なサブコマンド、必須引数の欠落、ファイルが見つからない、AI エージェントの失敗、gate が例外としてスローするエラー |
| `2` | gate チェック失敗（ブロッキング） | `gate` が非ゼロで終了した場合の `flow` コマンド |

**stdout の規則**

進捗に関する情報メッセージ、生成された Markdown のプレビュー（dry-run 時）、最終的な成功サマリーは `stdout` に出力されます。`build` コマンドは重み付きプログレスバー（`createProgress()` 経由）を使用し、ステップラベルを表示します。`--verbose` 指定時はステップごとの詳細ログも表示されます。構造化された出力を生成するコマンド（例: プロジェクト一覧を表示する `default`、ツリーを表示する `presets list`）は、フォーマット済みテキストを直接 `stdout` に書き出します。

**stderr の規則**

不明なコマンドの通知、`--spec` 未指定の警告、gate 失敗の理由リスト、パイプラインステップのエラーなどのエラーメッセージは、`console.error()` を通じて `stderr` に書き出されます。`flow` コマンドは子プロセス（`spec init`、`gate`、`forge`）の `stdout` および `stderr` を両方フォワードするため、すべての出力が呼び出し元に見えます。

**dry-run の出力**

`--dry-run` が有効な場合、コマンドは発生するはずだった書き込み操作を `[dry-run]` プレフィックス付きで出力し、ファイルシステムを変更せずに `0` で終了します。
<!-- {{/text}} -->
