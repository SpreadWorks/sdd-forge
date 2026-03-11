# 02. CLIコマンドリファレンス

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options are available, and the subcommand structure.}} -->

本章では、sdd-forge CLIコマンドの完全なリファレンスを提供します。ドキュメント生成・仕様管理・ワークフロー自動化にわたる19のサブコマンドを網羅しています。コマンドは3層アーキテクチャ（トップレベルのサブコマンドが `docs.js`、`spec.js`、`flow.js`、または `presets-cmd.js` にルーティング）でディスパッチされ、すべての呼び出しに共通するグローバルオプションもいくつか存在します。
<!-- {{/text}} -->

## 目次

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in a table format, including the command name, description, and key options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| コマンド | 説明 | 主なオプション |
| --- | --- | --- |
| `build` | ドキュメント生成パイプラインをすべて実行: `scan → enrich → init → data → text → readme → agents → translate` | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `scan` | ソースファイルを解析し、`.sdd-forge/output/analysis.json` に結果を書き出す | `--verbose` |
| `enrich` | AIを使用して `analysis.json` の各エントリに `summary`、`detail`、`chapter`、`role` フィールドを付与する | `--agent`, `--batch-size` |
| `init` | プリセットテンプレートから `docs/` の章ファイルを初期化する | `--force`, `--dry-run` |
| `data` | docsファイル内の `{{data}}` ディレクティブを解析データで解決する | `--dry-run` |
| `text` | AIが生成した文章を使って `docs/` ファイル内の `{{text}}` ディレクティブを解決する | `--agent`, `--dry-run` |
| `readme` | docs章ファイルとプリセットREADMEテンプレートから `README.md` を生成する | `--dry-run` |
| `forge` | AIを使ってソースコードに対するdocsを反復的に改善する | `--prompt`, `--spec`, `--mode`, `--max-runs`, `--dry-run` |
| `review` | docsの品質チェックリストを実行してPASS/FAILを報告する | `--dry-run` |
| `changelog` | `specs/` のメタデータから `docs/change_log.md` を生成する | `--dry-run` |
| `agents` | `AGENTS.md` のSDDセクションとPROJECTセクションを更新する | `--sdd`, `--project`, `--dry-run` |
| `translate` | デフォルト以外の出力言語にdocsを翻訳する | `--lang`, `--force`, `--dry-run` |
| `upgrade` | インストール済みのsdd-forgeバージョンに合わせてテンプレート由来のファイルを更新する | `--dry-run` |
| `setup` | プロジェクトを登録して `.sdd-forge/config.json` を生成する対話型ウィザード | `--name`, `--path`, `--type`, `--dry-run` |
| `default` | デフォルトプロジェクトの確認または変更 | *(プロジェクト名を位置引数として指定)* |
| `snapshot` | リグレッション検出用のドキュメントスナップショットを保存・比較・更新する | `save \| check \| update` |
| `spec` | 番号付きfeatureブランチを作成し、`specs/NNN-slug/` ディレクトリを初期化する | `--title`, `--base`, `--no-branch`, `--worktree`, `--dry-run` |
| `gate` | 実装前（pre）または実装後（post）にspec内の未解決事項を確認する | `--spec`, `--phase` |
| `flow` | SDDフロー全体（spec作成 → gate → forge）を自動実行する | `--request`, `--title`, `--spec`, `--forge-mode`, `--max-runs`, `--dry-run` |
| `presets list` | プリセットの継承ツリーを表示する | *(オプションなし)* |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: List all global options common to every command in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| オプション | エイリアス | 説明 |
| --- | --- | --- |
| `--project <name>` | | 登録済みプロジェクトを名前で選択する。コマンド実行中、`SDD_SOURCE_ROOT` と `SDD_WORK_ROOT` 環境変数を設定する。 |
| `--help` | `-h` | コマンドの使用方法を表示して終了する。 |
| `--version` | `-v`, `-V` | インストール済みのsdd-forgeバージョンを表示して終了する。 |

> **注:** `setup`、`default`、`help`、`presets` コマンドはプロジェクトコンテキストの解決を完全にスキップします。`.sdd-forge/config.json` や登録済みプロジェクトがなくても実行でき、初期セットアップ時やプロジェクトが未設定の環境でも安全に使用できます。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command accepts --lang, --force, and --dry-run options.}} -->

#### build

ドキュメント生成パイプライン全体を1ステップで実行します。パイプラインは次の順序でステージを実行します: `scan → enrich → init → data → text → readme → agents → translate`（translateステージは `output.languages` に複数言語が含まれる場合に自動的に追加されます）。各ステージは同じ解決済みプロジェクトコンテキストを共有するため、手動の中間ステップは不要です。

```
sdd-forge build [--agent <name>] [--force] [--dry-run] [--verbose]
```

| オプション | 説明 |
| --- | --- |
| `--agent <name>` | `enrich` および `text` ステップで使用するAIエージェントを上書きする |
| `--force` | 章ファイルが既に存在する場合でもdocsを再初期化する |
| `--dry-run` | ファイルを変更せずにすべての書き込み操作をシミュレートする |
| `--verbose` | 各パイプラインステージの進捗の詳細を表示する |

#### scan

プロジェクトの `type` とプリセットのスキャン設定に従ってソースファイルを解析し、`.sdd-forge/output/analysis.json` に結果を書き出します。この出力が後続のすべてのパイプラインステージの基盤となります。

```
sdd-forge scan
```

#### enrich

`analysis.json` のエントリをバッチでAIエージェントに送信し、各エントリに `summary`、`detail`、`chapter`、`role` フィールドを書き戻します。再実行時には既にenrich済みのエントリをスキップするため、処理を中断して再開しても安全です。

```
sdd-forge enrich [--agent <name>] [--batch-size <n>]
```

#### init

プロジェクトの `type` に対応するプリセットテンプレートを使用して、`docs/` に章ファイルを作成または更新します。`--force` を指定しない限り、既存のファイルは変更されません。

```
sdd-forge init [--force] [--dry-run]
```

#### data

現在の `analysis.json` に対してプロジェクトのDataSourceクラスを照会し、すべての `docs/*.md` ファイル内の `{{data: source.method(...)}}` ディレクティブを解決します。

```
sdd-forge data [--dry-run]
```

#### text

設定済みのAIエージェントを呼び出して `docs/*.md` 内の `{{text: ...}}` ディレクティブを解決します。各ディレクティブは個別に処理され、テンプレートで定義された周囲の構造を維持します。

```
sdd-forge text [--agent <name>] [--dry-run]
```

#### readme

プリセットのREADMEテンプレートと解決済みの `docs/` 章ファイルから `README.md` を生成します。READMEテンプレート内の `{{data}}` ディレクティブは生成時に解決されます。生成内容が既存ファイルと同一の場合は書き込みをスキップします。

```
sdd-forge readme [--dry-run]
```

#### forge

変更プロンプトとともに現在のソースコードとdocsをAIエージェントに送信し、`docs/` 内のドキュメントを反復的に改善します。3つのモードをサポートします: `local`（docsファイルを直接更新）、`assist`（修正案を表示）、`agent`（AIエージェントが自律的に変更を適用）。

```
sdd-forge forge --prompt "<説明>" [--spec <path>] [--mode local|assist|agent] [--max-runs <n>] [--dry-run]
```

#### review

`src/templates/review-checklist.md` で定義されたdocs品質チェックリストを実行し、PASSまたはFAILを標準出力に表示します。`forge` 後に実行することで、ドキュメントがプロジェクトの品質基準を満たしているか確認できます。

```
sdd-forge review [--dry-run]
```

#### changelog

`specs/` ディレクトリをスキャンし、各 `spec.md` からメタデータを抽出して、統合された `docs/change_log.md` を生成します。出力にはシリーズごとの最新specのインデックスと時系列順の全体テーブルが含まれます。

```
sdd-forge changelog [<output-path>] [--dry-run]
```

#### agents

`AGENTS.md` ファイルを更新します。デフォルトでは `<!-- SDD:START/END -->` セクション（プリセットテンプレートから）と `<!-- PROJECT:START/END -->` セクション（`analysis.json` からAI生成）の両方が更新されます。`--sdd` または `--project` を使用すると、どちらか一方のセクションのみを更新できます。

```
sdd-forge agents [--sdd] [--project] [--dry-run]
```

#### translate

`docs/*.md` ファイルを `output.languages` に列挙されたデフォルト以外の言語に翻訳します。`translate` モード（デフォルト）ではAIエージェントがデフォルト言語のファイルを翻訳し、`generate` モードでは各対象言語に対して `init → data → text → readme` を独立して実行します。

```
sdd-forge translate [--lang <code>] [--force] [--dry-run]
```

#### upgrade

主に `.agents/skills/` 配下のスキルSKILL.mdファイルとその `.claude/skills/` シンボリックリンクといったテンプレート由来のファイルを、現在インストールされているsdd-forgeのバージョンに合わせて更新します。設定ファイル（`config.json`、`context.json`）は変更されません。また、推奨設定の不足箇所についてもヒントを表示します。

```
sdd-forge upgrade [--dry-run]
```

#### setup

プロジェクトを登録し、`.sdd-forge/config.json` を生成し、`AGENTS.md` を作成し、`CLAUDE.md` シンボリックリンクを追加し、スキルファイルをコピーする対話型ウィザードです。対話モード（readline）と非対話モード（CLIフラグ）の両方をサポートします。

```
sdd-forge setup [--name <name>] [--path <path>] [--type <type>] [--agent <name>] [--dry-run]
```

#### default

引数なしの場合は登録済みの全プロジェクトを一覧表示し、現在のデフォルトをマークします。プロジェクト名を引数として指定すると、そのプロジェクトを新しいデフォルトに設定します。

```
sdd-forge default [<project-name>]
```

#### snapshot

`.sdd-forge/snapshots/` に保存されたドキュメントスナップショットを保存・比較・更新します。CIで `check` を使用すると、`analysis.json`、`docs/*.md`、`README.md` にわたる意図しないリグレッションを検出できます。

```
sdd-forge snapshot save | check | update
```

#### spec

番号付きfeatureブランチを作成し、`spec.md` と `qa.md` ファイルを含む対応する `specs/NNN-slug/` ディレクトリを初期化します。シーケンス番号は既存のspecとブランチから自動的に導出されます。ブランチ戦略は `--no-branch`（specファイルのみ）または `--worktree`（独立したgit worktree）で制御します。

```
sdd-forge spec --title "<機能名>" [--base <branch>] [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

#### gate

実装前（`--phase pre`、デフォルト）または実装後（`--phase post`）にspecファイルの未解決事項を検証します。チェック項目には、未解決トークン（`TBD`、`TODO`、`FIXME`、`[NEEDS CLARIFICATION]`）、未チェックのタスク、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`）、および `- [x] User approved this spec` 行の存在が含まれます。

```
sdd-forge gate --spec <path/to/spec.md> [--phase pre|post]
```

#### flow

SDDループ全体（オプションでspecの作成 → `gate` の実行 → 成功時に `forge` の呼び出し）を自動化します。gateが失敗した場合、コマンドはコード2で終了し、未解決の事項を表示します。ユーザーはそれに対処してから再実行する必要があります。

```
sdd-forge flow --request "<リクエスト内容>" [--title <title>] [--spec <path>] [--forge-mode local|assist|agent] [--max-runs <n>] [--no-branch] [--worktree] [--dry-run]
```

#### presets list

アーキテクチャ層ルート（`webapp`、`cli`、`library`）とそのフレームワーク固有のリーフプリセット（エイリアスとスキャンカテゴリ付き）を示すプリセット継承ツリーを標準出力に表示します。

```
sdd-forge presets list
sdd-forge presets          # list と同じ
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the point that gate and review PASS/FAIL results are written to stdout.}} -->

| 終了コード | 意味 |
| --- | --- |
| `0` | コマンドが正常に完了した。 |
| `1` | 一般エラー — 無効な引数、必要なファイルの欠如、予期しない実行時エラー、またはgate/reviewのFAIL結果。 |
| `2` | gateの入力要求 — `sdd-forge gate` または `sdd-forge flow` がspecの未解決事項を検出し、続行前にユーザーの対応が必要。 |

**stdoutとstderrの規約:**

| ストリーム | 内容 |
| --- | --- |
| `stdout` | コマンドの主な出力: 生成されたファイルの内容（`--dry-run`）、`gate` および `review` からのPASS/FAILの評定、進捗メッセージ、情報サマリー。 |
| `stderr` | エラーメッセージ、警告（例: `defaultAgent` 未設定によるステップのスキップ）、スタックトレース。 |

`gate` と `review` はPASS/FAILの評定を標準出力に書き込むため、スクリプトで結果をキャプチャして解析できます:

```bash
sdd-forge gate --spec specs/001-my-feature/spec.md
# stdout: "gate: PASSED" または終了コード1か2と共に問題点の一覧
```

`build` コマンドはインプロセスのプログレスバーを使用し、ステップごとの警告をプログレスロガーにルーティングします（`--verbose` で表示可能）。これにより、リダイレクト用のstdoutをクリーンな状態に保ちます。
<!-- {{/text}} -->
