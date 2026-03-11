# 02. CLIコマンドリファレンス

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options are available, and the subcommand structure.}} -->

本章では、sdd-forge CLIコマンドの完全なリファレンスを提供します。ドキュメント生成、仕様管理、ワークフロー自動化にわたる19のサブコマンドを網羅しています。コマンドは3層アーキテクチャを通じてディスパッチされ、トップレベルのサブコマンドは `docs.js`、`spec.js`、`flow.js`、または `presets-cmd.js` にルーティングされます。また、すべての呼び出しに共通するグローバルオプションもあります。
<!-- {{/text}} -->

## Contents

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in a table format, including the command name, description, and key options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| コマンド | 説明 | 主なオプション |
| --- | --- | --- |
| `build` | ドキュメントパイプライン全体を実行します: `scan → enrich → init → data → text → readme → agents → translate` | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `scan` | ソースファイルを解析し、結果を `.sdd-forge/output/analysis.json` に書き込みます | `--verbose` |
| `enrich` | AIを使用して `analysis.json` の各エントリに `summary`、`detail`、`chapter`、`role` フィールドを付与します | `--agent`, `--batch-size` |
| `init` | プリセットテンプレートから `docs/` の章ファイルを初期化します | `--force`, `--dry-run` |
| `data` | analysis データを使用して docs ファイルの `{{data}}` ディレクティブを解決します | `--dry-run` |
| `text` | AIが生成した文章を使用して docs ファイルの `{{text}}` ディレクティブを解決します | `--agent`, `--dry-run` |
| `readme` | docs の章ファイルとプリセットの READMEテンプレートから `README.md` を生成します | `--dry-run` |
| `forge` | AIを使用してソースに対するドキュメントを反復改善します | `--prompt`, `--spec`, `--mode`, `--max-runs`, `--dry-run` |
| `review` | docsの品質チェックリストを実行し、PASS/FAIL を報告します | `--dry-run` |
| `changelog` | `specs/` のメタデータから `docs/change_log.md` を生成します | `--dry-run` |
| `agents` | `AGENTS.md` の SDD セクションと PROJECT セクションを更新します | `--sdd`, `--project`, `--dry-run` |
| `translate` | デフォルト以外の出力言語に docs を翻訳します | `--lang`, `--force`, `--dry-run` |
| `upgrade` | インストール済みの sdd-forge バージョンに合わせてテンプレート由来のファイルを更新します | `--dry-run` |
| `setup` | プロジェクトを登録して `.sdd-forge/config.json` を生成するインタラクティブウィザードです | `--name`, `--path`, `--type`, `--dry-run` |
| `default` | デフォルトプロジェクトを表示または変更します | *(プロジェクト名を位置引数として指定)* |
| `snapshot` | リグレッション検出のためにドキュメントのスナップショットを保存・比較・更新します | `save \| check \| update` |
| `spec` | 番号付きフィーチャーブランチを作成し、`specs/NNN-slug/` ディレクトリを初期化します | `--title`, `--base`, `--no-branch`, `--worktree`, `--dry-run` |
| `gate` | 実装前（pre）または実装後（post）に spec の未解決項目をチェックします | `--spec`, `--phase` |
| `flow` | SDD フロー全体を自動実行します: spec 作成 → gate → forge | `--request`, `--title`, `--spec`, `--forge-mode`, `--max-runs`, `--dry-run` |
| `presets list` | プリセットの継承ツリーを表示します | *(オプションなし)* |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: List all global options common to every command in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| オプション | エイリアス | 説明 |
| --- | --- | --- |
| `--project <name>` | | 登録済みプロジェクトを名前で選択します。コマンド実行中に `SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` 環境変数を設定します。 |
| `--help` | `-h` | コマンドの使用方法を表示して終了します。 |
| `--version` | `-v`, `-V` | インストール済みの sdd-forge バージョンを表示して終了します。 |

> **注意:** `setup`、`default`、`help`、`presets` コマンドはプロジェクトコンテキストの解決を完全にスキップします。`.sdd-forge/config.json` や登録済みプロジェクトがない状態でも実行でき、初期セットアップ時やプロジェクトがまだ設定されていない環境でも安全に使用できます。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command accepts --lang, --force, and --dry-run options.}} -->

#### build

ドキュメントパイプライン全体を一括実行します。パイプラインは次のステージを順番に実行します: `scan → enrich → init → data → text → readme → agents → translate`（translate ステージは `output.languages` に複数の言語が含まれる場合に自動追加されます）。各ステージは同じ解決済みプロジェクトコンテキストを共有するため、途中での手動操作は不要です。

```
sdd-forge build [--agent <name>] [--force] [--dry-run] [--verbose]
```

| オプション | 説明 |
| --- | --- |
| `--agent <name>` | `enrich` および `text` ステップで使用する AI エージェントを上書きします |
| `--force` | 章ファイルが既に存在していても docs を再初期化します |
| `--dry-run` | ファイルを変更せずにすべての書き込み操作をシミュレートします |
| `--verbose` | 各パイプラインステージの進捗詳細を表示します |

#### scan

プロジェクトの `type` とプリセットのスキャン設定に従ってソースファイルを解析し、結果を `.sdd-forge/output/analysis.json` に書き込みます。この出力は後続のすべてのパイプラインステージの基盤となります。

```
sdd-forge scan
```

#### enrich

`analysis.json` のエントリをバッチ単位で AI エージェントに送信し、各エントリに `summary`、`detail`、`chapter`、`role` フィールドを書き戻します。再実行時には既に enrich 済みのエントリをスキップするため、途中で中断して再開することが可能です。

```
sdd-forge enrich [--agent <name>] [--batch-size <n>]
```

#### init

プロジェクトの `type` に対応するプリセットテンプレートを使用して、`docs/` に章ファイルを作成または更新します。`--force` を指定しない限り、既存ファイルは変更されません。

```
sdd-forge init [--force] [--dry-run]
```

#### data

現在の `analysis.json` に対してプロジェクトの DataSource クラスを照会することで、すべての `docs/*.md` ファイル内の `{{data: source.method(...)}}` ディレクティブを解決します。

```
sdd-forge data [--dry-run]
```

#### text

設定済みの AI エージェントを呼び出すことで、`docs/*.md` の `{{text: ...}}` ディレクティブを解決します。各ディレクティブは個別に処理され、テンプレートで定義された周囲の構造は維持されます。

```
sdd-forge text [--agent <name>] [--dry-run]
```

#### readme

プリセットの README テンプレートと解決済みの `docs/` 章ファイルから `README.md` を生成します。README テンプレート内の `{{data}}` ディレクティブは生成時に解決されます。生成された内容が既存ファイルと同一の場合は書き込みをスキップします。

```
sdd-forge readme [--dry-run]
```

#### forge

変更プロンプトとともに現在のソースコードと docs を AI エージェントに送信することで、`docs/` のドキュメントを反復改善します。3つのモードをサポートします: `local`（docs ファイルを直接更新）、`assist`（変更案を表示）、`agent`（AI エージェントが自律的に変更を適用）。

```
sdd-forge forge --prompt "<description>" [--spec <path>] [--mode local|assist|agent] [--max-runs <n>] [--dry-run]
```

#### review

`src/templates/review-checklist.md` で定義された docs 品質チェックリストを実行し、PASS または FAIL を標準出力に表示します。`forge` の後にこのコマンドを実行して、ドキュメントがプロジェクトの品質基準を満たしているか確認します。

```
sdd-forge review [--dry-run]
```

#### changelog

`specs/` ディレクトリをスキャンして各 `spec.md` からメタデータを抽出し、`docs/change_log.md` にまとめて出力します。出力にはシリーズごとの最新 spec のインデックスと時系列順の全テーブルが含まれます。

```
sdd-forge changelog [<output-path>] [--dry-run]
```

#### agents

`AGENTS.md` ファイルを更新します。デフォルトでは `<!-- SDD:START/END -->` セクション（プリセットテンプレートから）と `<!-- PROJECT:START/END -->` セクション（`analysis.json` から AI 生成）の両方が更新されます。`--sdd` または `--project` を使用して一方のみを更新できます。

```
sdd-forge agents [--sdd] [--project] [--dry-run]
```

#### translate

`docs/*.md` ファイルを `output.languages` に列挙されたデフォルト以外の言語に翻訳します。`translate` モード（デフォルト）では AI エージェントがデフォルト言語のファイルを翻訳します。`generate` モードでは、各対象言語に対して `init → data → text → readme` が独立して実行されます。

```
sdd-forge translate [--lang <code>] [--force] [--dry-run]
```

#### upgrade

テンプレート由来のファイル（主に `.agents/skills/` 配下のスキル SKILL.md ファイルおよびその `.claude/skills/` シンボリックリンク）を、現在インストール済みの sdd-forge バージョンに合わせて更新します。設定ファイル（`config.json`、`context.json`）は変更されません。また、不足している推奨設定のヒントも表示します。

```
sdd-forge upgrade [--dry-run]
```

#### setup

プロジェクトを登録し、`.sdd-forge/config.json` を生成し、`AGENTS.md` を作成し、`CLAUDE.md` シンボリックリンクを追加し、スキルファイルをコピーするインタラクティブウィザードです。インタラクティブ（readline）とノンインタラクティブ（CLI フラグ）の両モードをサポートします。

```
sdd-forge setup [--name <name>] [--path <path>] [--type <type>] [--agent <name>] [--dry-run]
```

#### default

引数なしの場合は、登録済みのすべてのプロジェクトを一覧表示し、現在のデフォルトを示します。プロジェクト名を引数として指定すると、そのプロジェクトを新しいデフォルトに設定します。

```
sdd-forge default [<project-name>]
```

#### snapshot

`.sdd-forge/snapshots/` に保存されたドキュメントスナップショットを保存・比較・更新します。CI で `check` を使用することで、`analysis.json`、`docs/*.md`、`README.md` にわたる意図しないリグレッションを検出できます。

```
sdd-forge snapshot save | check | update
```

#### spec

番号付きフィーチャーブランチを作成し、`spec.md` と `qa.md` ファイルを含む対応する `specs/NNN-slug/` ディレクトリを初期化します。シーケンス番号は既存の spec とブランチから自動的に導出されます。ブランチ戦略は `--no-branch`（spec ファイルのみ）または `--worktree`（独立した git worktree）で制御します。

```
sdd-forge spec --title "<feature name>" [--base <branch>] [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

#### gate

実装前（`--phase pre`、デフォルト）または実装後（`--phase post`）に spec ファイルの未解決項目を検証します。チェック内容: 未解決トークン（`TBD`、`TODO`、`FIXME`、`[NEEDS CLARIFICATION]`）、未チェックのタスク、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`）、および `- [x] User approved this spec` 行の存在。

```
sdd-forge gate --spec <path/to/spec.md> [--phase pre|post]
```

#### flow

SDD ループ全体を自動化します: 任意で spec を作成し、`gate` を実行し、成功した場合は `forge` を呼び出します。gate が失敗した場合、コマンドはコード 2 で終了し、未解決項目を表示することで、ユーザーが再実行前に対処できるようにします。

```
sdd-forge flow --request "<request text>" [--title <title>] [--spec <path>] [--forge-mode local|assist|agent] [--max-runs <n>] [--no-branch] [--worktree] [--dry-run]
```

#### presets list

アーキテクチャ層のルート（`webapp`、`cli`、`library`）とそのフレームワーク固有のリーフプリセット（エイリアスおよびスキャンカテゴリを含む）を示すプリセット継承ツリーを標準出力に表示します。

```
sdd-forge presets list
sdd-forge presets          # list と同じ
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the point that gate and review PASS/FAIL results are written to stdout.}} -->

| 終了コード | 意味 |
| --- | --- |
| `0` | コマンドが正常に完了しました。 |
| `1` | 一般エラー — 無効な引数、必須ファイルの欠落、予期しない実行時エラー、または gate/review の FAIL 結果。 |
| `2` | gate でユーザー対応が必要 — `sdd-forge gate` または `sdd-forge flow` が spec の未解決項目を検出し、処理を続行する前にユーザーの対応が必要です。 |

**stdout と stderr の規則:**

| ストリーム | 内容 |
| --- | --- |
| `stdout` | コマンドのプライマリ出力: 生成されたファイルの内容（`--dry-run`）、`gate` および `review` の PASS/FAIL 判定、進捗メッセージ、および情報サマリー。 |
| `stderr` | エラーメッセージ、警告（例: `defaultAgent` が未設定によるステップのスキップ）、およびスタックトレース。 |

`gate` と `review` は PASS/FAIL の判定を標準出力に書き込むため、スクリプトで結果をキャプチャして解析できます:

```bash
sdd-forge gate --spec specs/001-my-feature/spec.md
# stdout: "gate: PASSED" または問題一覧の後に終了コード 1 または 2
```

`build` コマンドはインプロセスのプログレスバーを使用し、ステップごとの警告をプログレスロガーに出力します（`--verbose` で表示可能）。これにより、リダイレクト用に標準出力がクリーンに保たれます。
<!-- {{/text}} -->
