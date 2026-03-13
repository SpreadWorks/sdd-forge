# 02. CLIコマンドリファレンス

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->
この章では sdd-forge で利用可能な全20のCLIコマンドを解説します。プロジェクトのセットアップ、ドキュメント生成、スペック管理、SDDワークフロー自動化を網羅しています。コマンドは3層ディスパッチアーキテクチャでルーティングされます。トップレベルのエントリポイント（`sdd-forge.js`）が5つのディスパッチャー（`docs`、`spec`、`flow`、`presets-cmd`、`help`）のいずれかに委譲し、さらに適切な実装モジュールを読み込みます。
<!-- {{/text}} -->

## コンテンツ

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->
| コマンド | ディスパッチャー | 説明 | 主なオプション |
|---|---|---|---|
| `help` | `help.js` | 利用可能なすべてのコマンドと説明を表示する | — |
| `setup` | `docs` | プロジェクト登録と設定生成の対話型ウィザード | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `upgrade` | `docs` | テンプレート由来のスキルファイルを現在の sdd-forge バージョンにアップグレードする | `--dry-run` |
| `default [name]` | `docs` | 登録済みプロジェクトの一覧表示またはデフォルトプロジェクトの設定 | `[name]` 位置引数 |
| `build` | `docs` | ドキュメント生成パイプラインの全工程を実行する: scan → enrich → init → data → text → readme → agents → [translate] | `--agent`, `--force`, `--verbose`, `--dry-run` |
| `init` | `docs` | プリセットテンプレートから `docs/` を初期化する | `--force`, `--dry-run` |
| `forge` | `docs` | プロンプトとスペックに基づき AI を使ってドキュメントを反復的に改善する | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--agent`, `--dry-run` |
| `review` | `docs` | レビューチェックリストに基づいて品質チェックを実行する | — |
| `changelog` | `docs` | `specs/` ディレクトリから `change_log.md` を生成する | — |
| `agents` | `docs` | SDD セクションおよびプロジェクトセクションで `AGENTS.md` を更新する | `--sdd`, `--project`, `--dry-run` |
| `readme` | `docs` | docs コンテンツから `README.md` を生成する | `--dry-run` |
| `translate` | `docs` | デフォルト言語の docs を AI 経由で設定済みの非デフォルト言語に翻訳する | `--lang`, `--force`, `--dry-run` |
| `scan` | `docs` | ソースコードを解析し `.sdd-forge/output/analysis.json` に書き出す | — |
| `enrich` | `docs` | AI エージェントを使って `analysis.json` の各エントリにロール・サマリー・章分類を付与する | `--agent` |
| `data` | `docs` | `docs/` ファイル内のすべての `{{data}}` ディレクティブを解決する | `--dry-run` |
| `text` | `docs` | AI エージェントを呼び出して `docs/` ファイル内のすべての `{{text}}` ディレクティブを解決する | `--agent`, `--dry-run` |
| `spec` | `spec` | 番号付きフィーチャーブランチを作成し `specs/NNN-slug/spec.md` を初期化する | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `gate` | `spec` | 実装前後にスペックファイルの未解決項目を検証する | `--spec`, `--phase` |
| `flow` | `flow`（直接） | SDD フロー全体を自動化する: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `presets list` | `presets-cmd`（直接） | プリセットの継承ツリーを表示する | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->
以下のオプションは `sdd-forge.js` においてサブコマンドがディスパッチされる前に処理され、どのコマンドを実行する場合にも適用されます。

| オプション | 短縮形 | 説明 |
|---|---|---|
| `--project <name>` | — | 登録済みプロジェクトを名前で選択する。コマンド実行中は `SDD_SOURCE_ROOT` と `SDD_WORK_ROOT` 環境変数を設定する。 |
| `--version` | `-v`, `-V` | インストール済みの sdd-forge パッケージバージョンを表示して終了する。 |
| `--help` | `-h` | トップレベルのコマンド一覧を表示する。個々のコマンドに渡した場合は、そのコマンド固有のヘルプを表示する。 |

> **注意:** `--project` はサブコマンドの引数がディスパッチャーに転送される前に `process.argv` からサイレントに除去されるため、個々のコマンドモジュールはこのオプションを参照しません。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->
#### help

利用可能なすべてのコマンドをセクション別（Project、Build、Docs、Scan、Spec、Flow、Info）にグループ化して表示し、i18n の `ui:help.commands.*` キーから取得した各コマンドの一行説明も出力します。パッケージバージョンは実行時に `package.json` から読み込まれます。

```
sdd-forge help
sdd-forge          # 引数なしでもヘルプを表示
sdd-forge -h
```

#### setup

プロジェクトを登録し、`.sdd-forge/config.json` の作成、`AGENTS.md` の生成、`CLAUDE.md` シンボリックリンクの作成、`.agents/skills/` および `.claude/skills/` へのスキルファイルのインストールを行う対話型ウィザードを起動します。各ステップは CLI フラグで非対話的に指定することもできます。

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
| `--agent <name>` | デフォルトの AI エージェント名 |
| `--lang <code>` | 出力言語コード |
| `--set-default` | このプロジェクトをデフォルトとしてマークする |
| `--dry-run` | 書き込みを行わず実行内容を表示する |

#### upgrade

現在インストールされている sdd-forge バージョンにバンドルされているテンプレートと一致するように、テンプレート管理ファイル（主に `.agents/skills/` 配下のスキル `SKILL.md` ファイル）をアップグレードします。繰り返し実行しても安全で、テンプレート由来のコンテンツのみを上書きし、`config.json` には一切触れません。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### default

引数なしで実行すると、登録済みプロジェクトをすべて一覧表示し、現在のデフォルトをマークします。プロジェクト名を指定するとデフォルトを変更します。

```
sdd-forge default               # プロジェクトを一覧表示
sdd-forge default myapp         # "myapp" をデフォルトに設定
```

#### build

ドキュメント生成パイプラインを `scan → enrich → init → data → text → readme → agents` の順に実行します。設定の `output.isMultiLang` が `true` の場合、`translate`（または言語別生成）ステップが末尾に追加されます。進捗は重み付きプログレスバーで表示されます。

```
sdd-forge build
sdd-forge build --agent claude --force --verbose
sdd-forge build --dry-run
```

| オプション | 説明 |
|---|---|
| `--agent <name>` | `enrich` と `text` ステップで使用する AI エージェント（`config.defaultAgent` を上書き） |
| `--force` | 既存の docs ファイルを強制的に再初期化する |
| `--verbose` | ステップごとのログ出力を表示する |
| `--dry-run` | ファイル書き込みをすべてスキップする |

#### init

プリセットテンプレートから `docs/` を初期化（または再初期化）します。`--force` が指定されない限り、既存ファイルはスキップされます。

```
sdd-forge init
sdd-forge init --force
```

#### forge

指定した `--prompt` と、オプションでリンクされたスペックを AI エージェントにプロンプトとして渡し、`docs/` のコンテンツを反復的に改善します。レビューが通過するまで最大 `--max-runs` 回繰り返します。

```
sdd-forge forge --prompt "add enrich command section"
sdd-forge forge --prompt "describe gate phases" --spec specs/042-gate-docs/spec.md --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善リクエスト（必須） |
| `--spec <path>` | コンテキストとして使用するスペックファイルのパス |
| `--max-runs <n>` | 最大改善反復回数（デフォルト: 5） |
| `--mode <mode>` | `local` \| `assist` \| `agent` |
| `--agent <name>` | 設定済みのデフォルトエージェントを上書きする |
| `--dry-run` | 書き込みをスキップする |

#### review

レビューチェックリスト（`templates/review-checklist.md`）に基づいて品質チェックを実行し、`docs/` で見つかった問題をレポートします。チェックが失敗した場合はゼロ以外の終了コードで終了します。

```
sdd-forge review
```

#### changelog

すべての `specs/NNN-*/spec.md` ファイルを読み込み、プロジェクトルートの `change_log.md` を生成または更新します。

```
sdd-forge changelog
```

#### agents

`agents.sdd` データソースからの最新 SDD セクションや `agents.project` からのプロジェクトセクションで `AGENTS.md` を更新します。デフォルトでは両方のセクションを更新します。

```
sdd-forge agents
sdd-forge agents --sdd            # SDD セクションのみ更新
sdd-forge agents --project        # プロジェクトセクションのみ更新
sdd-forge agents --dry-run
```

#### readme

docs コンテンツとプリセットの README テンプレートからプロジェクトルートの `README.md` を生成します。

```
sdd-forge readme
sdd-forge readme --dry-run
```

#### translate

デフォルト言語の `docs/` ファイルを `output.languages` で設定されているすべての非デフォルト言語に翻訳します。`--force` が指定されない限り、既存の翻訳よりソースの `mtime` が新しいファイルのみ再翻訳します。

```
sdd-forge translate
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

| オプション | 説明 |
|---|---|
| `--lang <code>` | この言語のみに翻訳する |
| `--force` | mtime に関わらずすべてのファイルを再翻訳する |
| `--dry-run` | 書き込みを行わず翻訳対象を表示する |

#### scan

設定済みの `sourcePath` 配下のソースコードを解析し、構造化された解析データを `.sdd-forge/output/analysis.json` に書き出します。

```
sdd-forge scan
```

#### enrich

`analysis.json` を読み込み、AI エージェントを使って各エントリに `role`、`summary`、`detail`、章分類を付与します。エンリッチ済みの結果は `analysis.json` に書き戻されます。

```
sdd-forge enrich --agent claude
```

#### data

`docs/` ファイル内のすべての `{{data: …}}` ディレクティブをインプレースで解決し、ディレクティブブロックを生成済み Markdown で置き換えます。`{{text}}` ブロックは再処理せずスキップします。

```
sdd-forge data
sdd-forge data --dry-run
```

#### text

`docs/` ファイル内のすべての `{{text: …}}` ディレクティブを検出して AI エージェントを呼び出し、生成したテキストを挿入します。本文が存在しないディレクティブ（または `--force` 使用時は古い本文を持つディレクティブ）のみが処理されます。

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
```

#### spec

番号付きフィーチャーブランチ（`feature/NNN-slug`）を作成し、`specs/NNN-slug/spec.md` と `specs/NNN-slug/qa.md` をスキャフォールドします。ブランチ戦略として branch（デフォルト）、worktree、スペックのみの3種類をサポートします。

```
sdd-forge spec --title "contact-form"
sdd-forge spec --title "contact-form" --worktree
sdd-forge spec --title "contact-form" --no-branch
sdd-forge spec --title "contact-form" --dry-run
```

| オプション | 説明 |
|---|---|
| `--title <text>` | フィーチャー名 — ブランチ/ディレクトリのスラグに使用（必須） |
| `--base <branch>` | ベースブランチ（デフォルトは現在の HEAD） |
| `--no-branch` | ブランチを作成せずスペックファイルのみ作成する |
| `--worktree` | `.sdd-forge/worktree/` 配下に独立した git worktree を作成する |
| `--allow-dirty` | ワーキングツリーのクリーンチェックをスキップする |
| `--dry-run` | 書き込みを行わず作成内容を表示する |

#### gate

実装前（`--phase pre`、デフォルト）または実装後（`--phase post`）に `spec.md` ファイルの完全性を検証します。未解決トークン（`TBD`、`TODO`、`FIXME`、`[NEEDS CLARIFICATION]`）、未チェックのタスク項目、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）、および `- [x] User approved this spec` 承認マーカーを確認します。

```
sdd-forge gate --spec specs/042-contact-form/spec.md
sdd-forge gate --spec specs/042-contact-form/spec.md --phase post
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | スペックファイルのパス（必須） |
| `--phase pre\|post` | 検証フェーズ。`pre` は Acceptance Criteria セクションのタスク項目チェックをスキップする |

#### flow

SDD フロー全体を自動化します。スペックを作成し（`--spec` が指定されない場合）、`gate` を実行し、gate 成功時に `forge` を実行します。gate が失敗した場合、最大8件のブロッキング問題を一覧表示しながら `NEEDS_INPUT` を出力して終了コード `2` で終了します。

```
sdd-forge flow --request "Add pagination to the user list"
sdd-forge flow --request "Fix CSV export encoding" --spec specs/040-csv-fix/spec.md
sdd-forge flow --request "Refactor auth module" --worktree --agent claude --max-runs 3
```

| オプション | 説明 |
|---|---|
| `--request <text>` | ユーザーの変更リクエスト（必須） |
| `--title <text>` | スペックのタイトルスラグ（省略時は `--request` から導出） |
| `--spec <path>` | 新規作成せず既存のスペックを使用する |
| `--agent <name>` | `forge` に渡す AI エージェント |
| `--max-runs <n>` | 最大 `forge` 反復回数（デフォルト: 5） |
| `--forge-mode <mode>` | `local` \| `assist` \| `agent`（デフォルト: `local`） |
| `--no-branch` | 新しいブランチを作成せずスペックを作成する |
| `--worktree` | 独立した git worktree を作成する |
| `--dry-run` | spec-init と forge ステップの書き込みをスキップする |

#### presets list

アーキテクチャレベルのノードとそのリーフプリセットをエイリアスおよび設定済みスキャンカテゴリとともに表示し、プリセットの継承ツリー全体を一覧表示します。

```
sdd-forge presets list
sdd-forge presets          # 一覧も表示される
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->
| 終了コード | 意味 | 主な発生元 |
|---|---|---|
| `0` | 成功 | 任意のコマンドの正常完了 |
| `1` | 一般エラー | 不明なサブコマンド、必須引数の欠落、ファイルが見つからない、AI エージェントの失敗、例外としてスローされた gate エラー |
| `2` | Gate チェック失敗（ブロッキング） | `gate` がゼロ以外で終了した場合の `flow` コマンド |

**stdout の規約**

情報的な進捗メッセージ、生成済み Markdown のプレビュー（dry-run）、最終的な成功サマリーは `stdout` に出力されます。`build` コマンドは重み付きプログレスバー（`createProgress()` 経由）を使用し、ステップラベルを表示します。`--verbose` を設定するとステップごとの詳細ログも表示されます。構造化出力を生成するコマンド（例: プロジェクト一覧を表示する `default`、ツリーを表示する `presets list`）は整形済みテキストを直接 `stdout` に出力します。

**stderr の規約**

不明なコマンドの通知、`--spec` 未指定の警告、gate 失敗の原因リスト、パイプラインステップのエラーなどのエラーメッセージは `console.error()` 経由で `stderr` に出力されます。`flow` コマンドは子プロセス（`spec init`、`gate`、`forge`）の `stdout` と `stderr` の両方を転送するため、すべての出力が呼び出し元から参照できます。

**dry-run の出力**

`--dry-run` が有効な場合、コマンドは実行されるはずだった各書き込み操作を `[dry-run]` プレフィックス付きの行で表示し、ファイルシステムを変更せずに `0` で終了します。
<!-- {{/text}} -->
