# 02. CLIコマンドリファレンス

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options are available, and the subcommand structure.}} -->

本章では、sdd-forge CLIコマンドの完全なリファレンスを提供します。ドキュメント生成、仕様管理、ワークフロー自動化にわたる19のサブコマンドを網羅しています。コマンドは3層アーキテクチャを通じてディスパッチされ、トップレベルのサブコマンドは `docs.js`、`spec.js`、`flow.js`、または `presets-cmd.js` にルーティングされます。また、いくつかのグローバルオプションがすべての呼び出しに適用されます。
<!-- {{/text}} -->

## Contents

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in a table format, including the command name, description, and key options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| コマンド | 説明 | 主要オプション |
| --- | --- | --- |
| `build` | ドキュメント生成パイプラインを一括実行します: `scan → enrich → init → data → text → readme → agents → translate` | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `scan` | ソースファイルを解析し、結果を `.sdd-forge/output/analysis.json` に書き出します | `--verbose` |
| `enrich` | AIを使って `analysis.json` の各エントリに `summary`、`detail`、`chapter`、`role` フィールドを付与します | `--agent`, `--batch-size` |
| `init` | プリセットテンプレートから `docs/` の章ファイルを初期化します | `--force`, `--dry-run` |
| `data` | docsファイル内の `{{data}}` ディレクティブを解析データで解決します | `--dry-run` |
| `text` | docsファイル内の `{{text}}` ディレクティブをAI生成テキストで解決します | `--agent`, `--dry-run` |
| `readme` | docsの章ファイルとプリセットのREADMEテンプレートから `README.md` を生成します | `--dry-run` |
| `forge` | AIを使ってdocsをソースコードに対して反復的に改善します | `--prompt`, `--spec`, `--mode`, `--max-runs`, `--dry-run` |
| `review` | docsの品質チェックリストを実行し、PASS/FAILを報告します | `--dry-run` |
| `changelog` | `specs/` のメタデータから `docs/change_log.md` を生成します | `--dry-run` |
| `agents` | `AGENTS.md` のSDDセクションとPROJECTセクションを更新します | `--sdd`, `--project`, `--dry-run` |
| `translate` | デフォルト以外の出力言語にdocsを翻訳します | `--lang`, `--force`, `--dry-run` |
| `upgrade` | インストール済みの sdd-forge バージョンに合わせてテンプレート由来ファイルを更新します | `--dry-run` |
| `setup` | プロジェクトを登録し `.sdd-forge/config.json` を生成する対話型ウィザードです | `--name`, `--path`, `--type`, `--dry-run` |
| `default` | デフォルトプロジェクトを表示または変更します | *（プロジェクト名を位置引数として指定）* |
| `snapshot` | リグレッション検出用のドキュメントスナップショットを保存・比較・更新します | `save \| check \| update` |
| `spec` | 連番付きのfeatureブランチを作成し、`specs/NNN-slug/` ディレクトリを初期化します | `--title`, `--base`, `--no-branch`, `--worktree`, `--dry-run` |
| `gate` | 実装前（pre）または実装後（post）にspecの未解決項目をチェックします | `--spec`, `--phase` |
| `flow` | SDDフロー全体を自動化します: spec作成 → gate → forge | `--request`, `--title`, `--spec`, `--forge-mode`, `--max-runs`, `--dry-run` |
| `presets list` | プリセットの継承ツリーを表示します | *（オプションなし）* |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: List all global options common to every command in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| オプション | エイリアス | 説明 |
| --- | --- | --- |
| `--project <name>` | | 登録済みプロジェクトを名前で選択します。コマンド実行中、`SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` 環境変数が設定されます。 |
| `--help` | `-h` | コマンドの使用方法を表示して終了します。 |
| `--version` | `-v`, `-V` | インストール済みの sdd-forge バージョンを表示して終了します。 |

> **注:** `setup`、`default`、`help`、`presets` コマンドはプロジェクトコンテキストの解決を完全にスキップします。`.sdd-forge/config.json` や登録済みプロジェクトがない状態でも実行でき、初期セットアップ時やプロジェクトが未設定の環境でも安全に使用できます。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command accepts --lang, --force, and --dry-run options.}} -->

#### build

ドキュメント生成パイプライン全体を1ステップで実行します。パイプラインは次の順序でステージを実行します: `scan → enrich → init → data → text → readme → agents → translate`（`output.languages` に複数の言語が含まれている場合、translateステージが自動的に追加されます）。各ステージは同じ解決済みプロジェクトコンテキストを共有するため、途中で手動の操作は不要です。

```
sdd-forge build [--agent <name>] [--force] [--dry-run] [--verbose]
```

| オプション | 説明 |
| --- | --- |
| `--agent <name>` | `enrich` および `text` ステップで使用するAIエージェントを上書きします |
| `--force` | 章ファイルが既に存在する場合でもdocsを再初期化します |
| `--dry-run` | ファイルを実際に変更せず、すべての書き込み操作をシミュレートします |
| `--verbose` | 各パイプラインステージの進捗詳細を出力します |

#### scan

プロジェクトの `type` とプリセットのスキャン設定に従ってソースファイルを解析し、結果を `.sdd-forge/output/analysis.json` に書き出します。この出力は後続するすべてのパイプラインステージの基盤となります。

```
sdd-forge scan
```

#### enrich

`analysis.json` のエントリをバッチ単位でAIエージェントに送信し、各エントリに `summary`、`detail`、`chapter`、`role` フィールドを書き戻します。再実行時は既にenrich済みのエントリをスキップするため、中断して再開しても安全です。

```
sdd-forge enrich [--agent <name>] [--batch-size <n>]
```

#### init

プロジェクトの `type` に対応するプリセットテンプレートを使用して、`docs/` の章ファイルを作成または更新します。`--force` を指定しない限り、既存ファイルは変更されません。

```
sdd-forge init [--force] [--dry-run]
```

#### data

現在の `analysis.json` に対してプロジェクトのDataSourceクラスを照会し、すべての `docs/*.md` ファイル内の `{{data: source.method(...)}}` ディレクティブを解決します。

```
sdd-forge data [--dry-run]
```

#### text

設定済みのAIエージェントを呼び出して `docs/*.md` 内の `{{text: ...}}` ディレクティブを解決します。各ディレクティブは個別に処理され、テンプレートで定義された周囲の構造が維持されます。

```
sdd-forge text [--agent <name>] [--dry-run]
```

#### readme

プリセットのREADMEテンプレートと解決済みの `docs/` 章ファイルから `README.md` を生成します。READMEテンプレート内の `{{data}}` ディレクティブは生成時に解決されます。生成結果が既存ファイルと同一の場合は書き込みをスキップします。

```
sdd-forge readme [--dry-run]
```

#### forge

現在のソースコードとdocsを変更プロンプトとともにAIエージェントに送信し、`docs/` のドキュメントを反復的に改善します。3つのモードをサポートします: `local`（docsファイルを直接更新）、`assist`（変更案を出力）、`agent`（AIエージェントが自律的に変更を適用）。

```
sdd-forge forge --prompt "<description>" [--spec <path>] [--mode local|assist|agent] [--max-runs <n>] [--dry-run]
```

#### review

`src/templates/review-checklist.md` で定義されたdocs品質チェックリストを実行し、PASSまたはFAILをstdoutに出力します。`forge` の後にこのコマンドを使用して、ドキュメントがプロジェクトの品質基準を満たしているか確認してください。

```
sdd-forge review [--dry-run]
```

#### changelog

`specs/` ディレクトリをスキャンして各 `spec.md` からメタデータを抽出し、統合された `docs/change_log.md` を生成します。出力にはシリーズごとの最新specのインデックスと、完全な時系列テーブルが含まれます。

```
sdd-forge changelog [<output-path>] [--dry-run]
```

#### agents

`AGENTS.md` ファイルを更新します。デフォルトでは `<!-- SDD:START/END -->` セクション（プリセットテンプレートから）と `<!-- PROJECT:START/END -->` セクション（`analysis.json` からAI生成）の両方が更新されます。`--sdd` または `--project` を使用して片方のセクションのみ更新できます。

```
sdd-forge agents [--sdd] [--project] [--dry-run]
```

#### translate

`docs/*.md` ファイルを `output.languages` に列挙されたデフォルト以外の言語に翻訳します。`translate` モード（デフォルト）ではAIエージェントがデフォルト言語のファイルを翻訳し、`generate` モードでは対象言語ごとに `init → data → text → readme` が独立して実行されます。

```
sdd-forge translate [--lang <code>] [--force] [--dry-run]
```

#### upgrade

テンプレート由来のファイル（主に `.agents/skills/` 配下のスキルSKILL.mdファイルとその `.claude/skills/` シンボリックリンク）を、現在インストールされている sdd-forge バージョンに合わせて更新します。設定ファイル（`config.json`、`context.json`）は変更されません。また、推奨される設定が不足している場合はヒントを表示します。

```
sdd-forge upgrade [--dry-run]
```

#### setup

プロジェクトを登録し、`.sdd-forge/config.json` を生成し、`AGENTS.md` を作成し、`CLAUDE.md` シンボリックリンクを追加し、スキルファイルをコピーする対話型ウィザードです。対話モード（readline）と非対話モード（CLIフラグ）の両方をサポートします。

```
sdd-forge setup [--name <name>] [--path <path>] [--type <type>] [--agent <name>] [--dry-run]
```

#### default

引数なしの場合、登録済みのすべてのプロジェクトを一覧表示し、現在のデフォルトをマークします。プロジェクト名を引数として指定すると、そのプロジェクトを新しいデフォルトに設定します。

```
sdd-forge default [<project-name>]
```

#### snapshot

`.sdd-forge/snapshots/` に保存されたドキュメントスナップショットの保存・比較・更新を行います。`check` をCIで使用することで、`analysis.json`、`docs/*.md`、`README.md` にわたる意図しないリグレッションを検出できます。

```
sdd-forge snapshot save | check | update
```

#### spec

連番付きのfeatureブランチを作成し、`spec.md` と `qa.md` ファイルを含む対応する `specs/NNN-slug/` ディレクトリを初期化します。連番は既存のspecとブランチから自動的に導出されます。ブランチ戦略は `--no-branch`（specファイルのみ）または `--worktree`（独立したgit worktree）で制御できます。

```
sdd-forge spec --title "<feature name>" [--base <branch>] [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

#### gate

実装前（`--phase pre`、デフォルト）または実装後（`--phase post`）にspecファイルの未解決項目を検証します。チェック項目には、未解決トークン（`TBD`、`TODO`、`FIXME`、`[NEEDS CLARIFICATION]`）、未チェックのタスク、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`）、および `- [x] User approved this spec` 行の存在が含まれます。

```
sdd-forge gate --spec <path/to/spec.md> [--phase pre|post]
```

#### flow

SDDループ全体を自動化します: 必要に応じてspecを作成し、`gate` を実行し、成功時に `forge` を呼び出します。gateが失敗した場合、コマンドはコード2で終了し、ユーザーが再実行前に対処できるよう未解決項目を出力します。

```
sdd-forge flow --request "<request text>" [--title <title>] [--spec <path>] [--forge-mode local|assist|agent] [--max-runs <n>] [--no-branch] [--worktree] [--dry-run]
```

#### presets list

アーキテクチャ層のルート（`webapp`、`cli`、`library`）とフレームワーク固有のリーフプリセット（エイリアスとスキャンカテゴリを含む）を示すプリセット継承ツリーをstdoutに表示します。

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
| `1` | 一般エラー — 無効な引数、必須ファイルの欠如、予期しない実行時エラー、またはgate/reviewのFAIL結果。 |
| `2` | gateで入力が必要 — `sdd-forge gate` または `sdd-forge flow` がspecの未解決項目を検出し、処理を進める前にユーザーの対応が必要です。 |

**stdout と stderr の規則:**

| ストリーム | 内容 |
| --- | --- |
| `stdout` | コマンドの主要出力: 生成されたファイルの内容（`--dry-run`）、`gate` と `review` のPASS/FAIL判定、進捗メッセージ、情報サマリー。 |
| `stderr` | エラーメッセージ、警告（例: `defaultAgent` の未設定によるステップのスキップ）、スタックトレース。 |

`gate` と `review` はPASS/FAIL判定をstdoutに書き出すため、スクリプトで結果をキャプチャして解析できます:

```bash
sdd-forge gate --spec specs/001-my-feature/spec.md
# stdout: "gate: PASSED" または問題の一覧（終了コード 1 または 2）
```

`build` コマンドはインプロセスのプログレスバーを使用し、ステップごとの警告をプログレスロガーにルーティングします（`--verbose` で確認可能）。これにより、リダイレクト時もstdoutをクリーンに保ちます。
<!-- {{/text}} -->
