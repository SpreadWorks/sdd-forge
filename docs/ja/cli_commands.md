# 02. CLI コマンドリファレンス

## 概要

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

本章では `sdd-forge` で利用可能な全 20 コマンドを、Project・Build・Docs・Scan・Spec・Flow の 6 つの機能カテゴリに分けて解説する。コマンドは 3 層のディスパッチ構造に従い、トップレベルのエントリポイント（`sdd-forge.js`）がカテゴリディスパッチャー（`docs.js`、`spec.js`、`flow.js`）にルーティングし、さらに `src/docs/commands/` および `src/specs/commands/` 配下の各コマンド実装に委譲される。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| コマンド | カテゴリ | 説明 | 主なオプション |
| --- | --- | --- | --- |
| `help` | Info | 利用可能なコマンドと説明を表示する | — |
| `setup` | Project | プロジェクトを登録し `.sdd-forge/config.json` を生成する対話型ウィザード | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `upgrade` | Project | スキルや AGENTS.md などテンプレート由来のファイルをインストール済みバージョンにアップグレードする | `--dry-run` |
| `default` | Project | 登録済みプロジェクトの一覧表示またはデフォルトプロジェクトの設定 | `[<name>]` |
| `build` | Build | フルパイプラインを実行: scan → enrich → init → data → text → readme → agents → [translate] | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `init` | Docs | プリセットテンプレートから `docs/` ディレクトリを初期化する | `--force`, `--dry-run` |
| `forge` | Docs | プロンプトまたは spec を基に AI を使って docs を反復改善する | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--agent`, `--dry-run` |
| `review` | Docs | 生成された docs の品質チェックを実行する | — |
| `changelog` | Docs | `specs/` をスキャンして `docs/change_log.md` を生成する | `--dry-run` |
| `agents` | Docs | `AGENTS.md` を生成または更新する | `--sdd`, `--project`, `--dry-run` |
| `readme` | Docs | docs の章ファイルから `README.md` を生成する | `--dry-run` |
| `translate` | Docs | docs をデフォルト以外の出力言語に翻訳する | `--dry-run` |
| `scan` | Scan | ソースコードを解析し `.sdd-forge/output/analysis.json` に書き出す | — |
| `enrich` | Scan | AI を使って各解析エントリにロール・サマリー・章分類を付与する | `--agent` |
| `data` | Scan | 解析データを使って docs の `{{data}}` ディレクティブを解決する | `--dry-run` |
| `text` | Scan | AI を使って docs の `{{text}}` ディレクティブを解決する | `--agent`, `--dry-run` |
| `spec` | Spec | 番号付きフィーチャーブランチを作成し `specs/NNN-slug/` を初期化する | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `gate` | Spec | 実装前（pre）または実装後（post）に `spec.md` の未解決項目をチェックする | `--spec`, `--phase` |
| `flow` | Flow | SDD フロー全体を自動化: spec 作成 → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `presets list` | Info | プリセットの継承ツリーを表示する | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

以下のオプションはトップレベルのエントリポイント（`src/sdd-forge.js`）がサブコマンドより先に処理するため、すべてのコマンドに適用される。

| オプション | 説明 |
| --- | --- |
| `--project <name>` | `.sdd-forge/projects.json` から指定名のプロジェクトを選択する。コマンド実行中に `SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` 環境変数を設定する。 |
| `-v`, `--version`, `-V` | インストール済みの `sdd-forge` バージョンを表示して終了する。 |
| `-h`, `--help` | トップレベルのコマンド一覧を表示して終了する。特定のサブコマンドに渡した場合はそのコマンドのヘルプを表示して終了する。 |

`--dry-run` フラグは変更を伴うほとんどのコマンドでサポートされており、各コマンドのセクションに記載している。有効にするとファイルへの書き込みがすべて抑止され、書き込まれるはずだった内容が代わりに stdout に出力される。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### help

利用可能なすべてのコマンドをセクション別にグループ化し、現在のバージョン番号とともに整形して表示する。オプションは受け付けない。他のコマンドに `-h` または `--help` を渡すと、そのコマンドのヘルプが表示される。

```
sdd-forge help
```

#### setup

プロジェクトを登録し `.sdd-forge/config.json` を書き込む対話型ウィザード。フラグなしで呼び出すと、UI 言語・プロジェクト名・ソースパス・出力言語・アーキテクチャタイプ・ドキュメントスタイル・AI エージェント選択をステップごとに案内する。スクリプトや CI での利用では CLI フラグで全ステップをスキップできる。

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/laravel --lang en --agent claude
```

| オプション | 説明 |
| --- | --- |
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースディレクトリへの絶対パス |
| `--work-root <path>` | ワーキングルートの上書き（デフォルトは `--path`） |
| `--type <type>` | プリセットタイプ文字列（例: `webapp/laravel`, `cli`, `library`） |
| `--lang <lang>` | デフォルト出力言語コード（例: `en`, `ja`） |
| `--purpose <text>` | docs スタイルプロンプト用のプロジェクト概要（1 行） |
| `--tone <text>` | AI 生成テキストの推奨文体 |
| `--agent <name>` | デフォルト AI エージェント（`claude`、`codex`、またはスキップ） |
| `--set-default` | このプロジェクトをデフォルトに設定する |
| `--no-default` | 現在のデフォルトプロジェクトを変更しない |
| `--dry-run` | 変更を加えずに書き込まれる内容を表示する |

#### upgrade

テンプレートで管理されているファイル（現在は `.agents/skills/` 配下のスキル `SKILL.md` ファイルおよび `.claude/skills/` のシンボリックリンク）を、インストール済みの `sdd-forge` バージョンに合わせてアップグレードする。設定ファイル（`config.json`、`context.json`）は変更されない。繰り返し実行しても安全。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 書き込みを行わずに更新対象のファイルを報告する |

#### default

引数なしの場合、登録済みプロジェクトを一覧表示し現在のデフォルトをマークする。プロジェクト名を指定した場合は、そのプロジェクトを新しいデフォルトに設定する。

```
sdd-forge default
sdd-forge default myapp
```

#### build

ドキュメント生成パイプライン全体を順番に実行する: `scan → enrich → init → data → text → readme → agents`。多言語出力が設定されている場合は `translate` も実行する。各ステップはプログレスバーで進捗を表示する。`defaultAgent` が設定されていない場合、`enrich` と `text` のステップは警告とともにスキップされる。

```
sdd-forge build
sdd-forge build --agent claude --verbose
sdd-forge build --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--agent <name>` | `enrich` と `text` ステップで使用する AI エージェント（`config.defaultAgent` を上書き） |
| `--force` | `init` ステップに `--force` を渡し、既存の章ファイルを上書きする |
| `--dry-run` | すべてのステップに `--dry-run` を渡し、ファイルを書き込まない |
| `--verbose` | パイプライン実行中にステップごとのログ出力を表示する |

#### init

プリセットテンプレートから `docs/` ディレクトリを初期化または更新する。`--force` を指定しない限り、既存の章ファイルは上書きされない。

```
sdd-forge init
sdd-forge init --force
```

| オプション | 説明 |
| --- | --- |
| `--force` | 既存の章ファイルを上書きする |
| `--dry-run` | 作成または更新されるファイルを表示する |

#### forge

AI を使ってドキュメントファイルを反復改善する。各実行でエージェントが現在の docs を読み込み、プロンプトまたは spec の要件を適用し、更新されたファイルを書き込む。`--max-runs` 回のイテレーション後またはレビューがパスした時点で停止する。

```
sdd-forge forge --prompt "設定ファイルフォーマットに関するセクションを追加する"
sdd-forge forge --spec specs/042-config-docs/spec.md --mode agent --max-runs 3
```

| オプション | 説明 |
| --- | --- |
| `--prompt <text>` | AI への自由記述の指示 |
| `--spec <path>` | 改善を駆動する `spec.md` へのパス |
| `--max-runs <n>` | 最大改善イテレーション数（デフォルト: `5`） |
| `--mode <mode>` | `local`（デフォルト）、`assist`、または `agent` |
| `--agent <name>` | 使用する AI エージェント |
| `--dry-run` | ファイルを書き込まずに実行する |

#### review

生成された docs をレビューチェックリストと照合し、品質上の問題を報告する。問題が見つかった場合はゼロ以外の終了コードで終了する。

```
sdd-forge review
```

#### changelog

`specs/` ディレクトリをスキャンし、各 `spec.md` からメタデータ（タイトル・ステータス・作成日・ブランチ）を抽出して、シリーズごとの最新 spec のインデックスと全体の時系列テーブルを含む `docs/change_log.md` を生成する。

```
sdd-forge changelog
sdd-forge changelog --dry-run
```

| オプション | 説明 |
| --- | --- |
| `[output-path]` | 出力ファイルの任意の上書きパス（デフォルト: `docs/change_log.md`） |
| `--dry-run` | 書き込まずに生成内容を stdout に出力する |

#### agents

現在の SDD ツーリング手順とプロジェクト固有のコンテキストを含む `AGENTS.md`（および `CLAUDE.md` シンボリックリンク）を生成または更新する。

```
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --project
```

| オプション | 説明 |
| --- | --- |
| `--sdd` | SDD テンプレートセクションのみ再生成する |
| `--project` | プロジェクトコンテキストセクションのみ再生成する |
| `--dry-run` | 書き込まずに出力を表示する |

#### readme

プリセットの README テンプレートと現在の docs 章ファイルからルートの `README.md` を生成する。生成時に `{{data}}` ディレクティブを解決する。内容に変更がない場合は書き込みをスキップする。

```
sdd-forge readme
sdd-forge readme --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 書き込まずに生成内容を表示する |

#### translate

`config.output.languages` で設定されたデフォルト以外の言語に docs を翻訳する。翻訳モード（`translate` または `generate`）は `config.output.mode` によって決定される。

```
sdd-forge translate
sdd-forge translate --dry-run
```

#### scan

設定されたソースルート配下のソースコードを解析し、結果を `.sdd-forge/output/analysis.json` に書き込む。AI 呼び出しは行わず、設定済みプリセットスキャナーによる純粋な静的解析のみを実行する。

```
sdd-forge scan
```

#### enrich

解析データを AI エージェントに送信し、各エントリに `role`・`summary`・`detail`・章分類を付与する。エンリッチされたデータを `analysis.json` に書き戻す。

```
sdd-forge enrich --agent claude
```

| オプション | 説明 |
| --- | --- |
| `--agent <name>` | 使用する AI エージェント（`defaultAgent` が未設定の場合は必須） |

#### data

現在の `analysis.json` を使って docs 章ファイル内のすべての `{{data: source.method(...)}}` ディレクティブを解決する。AI は呼び出さない。

```
sdd-forge data
sdd-forge data --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 書き込まずに解決後の内容を表示する |

#### text

AI を使って docs 章ファイル内のすべての `{{text: ...}}` ディレクティブを解決する。`--force` を指定しない限り、未入力（または空）のディレクティブのみ処理する。

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--agent <name>` | 使用する AI エージェント |
| `--dry-run` | 書き込まずに生成テキストを表示する |

#### spec

連番付きのフィーチャーブランチ（`feature/NNN-slug`）を作成し、`spec.md` と `qa.md` テンプレートを含む対応する `specs/NNN-slug/` ディレクトリを初期化する。

```
sdd-forge spec --title "user authentication"
sdd-forge spec --title "user authentication" --no-branch
sdd-forge spec --title "user authentication" --worktree
```

| オプション | 説明 |
| --- | --- |
| `--title <text>` | フィーチャーのタイトル（必須）。URL フレンドリーなスラッグに変換される |
| `--base <branch>` | ブランチ元のベースブランチ（デフォルト: 現在の HEAD） |
| `--no-branch` | Git ブランチを作成せず spec ファイルのみ作成する |
| `--worktree` | フィーチャーブランチ用の専用 Git worktree を作成する |
| `--allow-dirty` | クリーン worktree チェックをスキップする |
| `--dry-run` | 変更を加えずに作成される内容を表示する |

#### gate

`spec.md` の未解決項目と必須セクションの欠落をチェックする。`pre` フェーズ（デフォルト）では、`Status`・`Acceptance Criteria`・`User Scenarios & Testing` セクション内の未チェック項目は許容される。`post` フェーズではすべての項目がチェック済みでなければならない。

```
sdd-forge gate --spec specs/042-auth/spec.md
sdd-forge gate --spec specs/042-auth/spec.md --phase post
```

| オプション | 説明 |
| --- | --- |
| `--spec <path>` | チェック対象の `spec.md` ファイルへのパス（必須） |
| `--phase <pre\|post>` | チェックフェーズ: `pre`（実装前）または `post`（実装後）。デフォルトは `pre` |

以下の条件でゲート失敗となる: `[NEEDS CLARIFICATION]`・`TBD`・`TODO`・`FIXME` トークンの存在、免除セクション外の未チェック `- [ ]` 項目、`## Clarifications`・`## Open Questions`・`## User Confirmation` セクションの欠落、`## User Confirmation` 内に `- [x] User approved this spec` がない、`## Acceptance Criteria` または `## User Scenarios` セクションの欠落。

#### flow

SDD フロー全体を自動化する: spec の作成（`--spec` 指定時はスキップ）→ `gate` の実行 → 成功時に `forge` を実行。gate が失敗した場合は `NEEDS_INPUT` とブロック理由を出力し、終了コード `2` で終了する。

```
sdd-forge flow --request "受注ページに CSV エクスポートを追加する"
sdd-forge flow --request "ページネーションのバグを修正する" --spec specs/039-pagination/spec.md
sdd-forge flow --request "認証モジュールをリファクタリングする" --forge-mode agent --max-runs 3
```

| オプション | 説明 |
| --- | --- |
| `--request <text>` | ユーザーのリクエストテキスト（必須） |
| `--title <text>` | 導出される spec タイトルスラッグの上書き |
| `--spec <path>` | 新規作成せずに既存の spec を使用する |
| `--agent <name>` | forge で使用する AI エージェント |
| `--max-runs <n>` | forge の最大イテレーション数（デフォルト: `5`） |
| `--forge-mode <mode>` | `local`（デフォルト）、`assist`、または `agent` |
| `--no-branch` | Git ブランチを作成せず spec ファイルのみ作成する |
| `--worktree` | 専用の Git worktree を作成する |
| `--dry-run` | すべての子コマンドをドライラン実行する |

#### presets list

プリセットの継承ツリー全体を stdout に出力する。アーキテクチャレイヤーのプリセットをノード、フレームワーク固有のプリセットをエイリアスとスキャンカテゴリ付きのリーフとして表示する。

```
sdd-forge presets list
sdd-forge presets
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

| 終了コード | 意味 | 主な発生元 |
| --- | --- | --- |
| `0` | 成功 | 通常のコマンド完了。`build` はパイプライン終了後に明示的に `process.exit(0)` を呼び出す |
| `1` | 一般エラー | 無効な引数、必須フラグの欠落、ファイル未検出エラー、直接呼び出し時の gate チェック失敗、または未処理の例外 |
| `2` | gate ブロック — 入力が必要 | gate ステップが失敗した場合の `flow` コマンド。終了前にブロック理由が stdout に出力される |

**stdout** にはユーザー向けの進捗メッセージ、生成コンテンツ（`--dry-run` 有効時）、`help` のコマンド一覧や `presets list` のプリセットツリーなどの構造化出力が出力される。

**stderr** にはエラーメッセージ、警告（例: `[enrich] WARN: no defaultAgent configured`）、および gate 失敗の詳細（例: `- line 12: unresolved token (TBD)`）が出力される。

ファイル出力を生成するコマンド（`data`、`text`、`readme`、`changelog` など）は成功時に確認メッセージを stdout に出力し（例: `[readme] updated`）、内容に変更がない場合は書き込みをスキップして `no changes` の通知を表示する。`--dry-run` フラグを指定すると、ファイルへの書き込みが stdout にリダイレクトされ、`---` セパレーターまたは stderr へのドライラン通知が先行して出力される。
<!-- {{/text}} -->
