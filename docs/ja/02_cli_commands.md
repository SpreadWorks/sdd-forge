# 02. CLIコマンドリファレンス

## 説明

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->
本章では `sdd-forge` で利用可能な全18サブコマンドを解説します。ドキュメント生成コマンド（`docs.js` 経由でルーティング）、specワークフローコマンド（`spec.js` 経由でルーティング）、および直接実行コマンド（`flow`、`presets`）に分類されます。すべてのコマンドは共通のグローバルオプションを持ち、ほとんどのコマンドは実行前にプロジェクトコンテキストの解決が必要です。
<!-- {{/text}} -->

## 目次

### コマンド一覧

<!-- {{text: List all commands in a table format. Include command name, description, and main options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->
| コマンド | 説明 | 主なオプション |
|---|---|---|
| `build` | ドキュメント生成パイプライン全体（`scan → init → data → text → readme → agents → translate`）を一括実行する | `--project` |
| `scan` | ソースコードを解析し、`analysis.json` と `summary.json` を生成する | `--project` |
| `init` | プリセットテンプレートから `docs/` を初期化する | `--project` |
| `data` | 解析出力を使用して `{{data: ...}}` ディレクティブを解決する | `--project` |
| `text` | 設定済みAIエージェントを使用して `{{text: ...}}` ディレクティブを解決する | `--file`、`--agent`、`--project` |
| `readme` | docsの内容をもとにAIで `README.md` を自動生成する | `--project` |
| `forge` | プロンプトに基づき、AIを使ってdocsを反復的に改善する | `--prompt`、`--spec`、`--project` |
| `review` | docsのAI品質チェックを実行し、PASS/FAILを報告する | `--project` |
| `changelog` | `specs/` 配下の全specファイルから `change_log.md` を生成する | `--project` |
| `agents` | 最新のSDDテンプレートとPROJECTセクションで `AGENTS.md` を更新する | `--sdd`、`--project-only`、`--dry-run` |
| `translate` | configで定義された追加出力言語へdocsを翻訳する | `--lang`、`--force`、`--dry-run` |
| `upgrade` | インストール済みパッケージバージョンに合わせてSDDマネージドテンプレートセクションを更新する | `--project` |
| `setup` | プロジェクトを登録し、初期 `.sdd-forge/config.json` を生成する | — |
| `default` | `projects.json` のデフォルトプロジェクトを設定または表示する | — |
| `spec` | 新しいspecファイルを作成し、オプションでfeatureブランチを作成する | `--title`、`--no-branch` |
| `gate` | 実装前または実装後にspecを受入基準に照らして検証する | `--spec`、`--phase` |
| `flow` | 自然言語のリクエストからSDDフロー全体を自動実行する | `--request` |
| `presets` | バンドル済みのプロジェクトタイププリセット一覧を表示する | — |
| `help` | 利用可能なサブコマンドと説明を表示する | `-h`、`--help` |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text: List global options common to all commands in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->
| オプション | エイリアス | 説明 |
|---|---|---|
| `--project <name>` | — | `.sdd-forge/projects.json` に登録されたプロジェクト名で対象プロジェクトを指定する。省略した場合は `projects.json` の `default` に設定されたプロジェクトが使用される。 |
| `--help` | `-h` | 指定したサブコマンドのヘルプテキストを表示して終了する。 |
| `--version` | `-v`、`-V` | `package.json` から現在の `sdd-forge` バージョンを表示して終了する。 |

> **注意:** `setup`、`default`、`help`、`presets` コマンドはプロジェクトコンテキストの解決を完全にスキップします。これらのコマンドは登録済みプロジェクトを必要とせず、`--project` フラグを無視します。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command has --lang, --force, and --dry-run options.}} -->
以下の各コマンドについて、目的・利用可能なオプション・代表的な使用例を解説します。AIを使って生成するコマンドには、`.sdd-forge/config.json` に有効な `defaultAgent` または `providers` エントリが必要です。ディスクへの書き込みを行うコマンドは、特記がない限り解決済みプロジェクトの `docs/` ディレクトリ内で動作します。
<!-- {{/text}} -->

#### build

ドキュメント生成パイプライン全体を一括実行します。パイプラインは `scan → init → data → text → readme → agents → translate` の順で各ステージを実行します。プロジェクトのdocs初回作成や完全な再生成の標準的なエントリポイントです。

```bash
sdd-forge build
sdd-forge build --project myproject
```

#### scan

設定済みプリセット（例: `cli/node-cli`、`webapp/cakephp2`）に従ってプロジェクトのソースコードを解析し、`.sdd-forge/output/analysis.json` と `.sdd-forge/output/summary.json` に結果を書き込みます。`summary.json` はAI向けの軽量版です。

```bash
sdd-forge scan
```

#### init

プリセットテンプレートをコピーして `docs/` ディレクトリ構造を初期化します。テンプレートは `src/presets/{preset}/templates/{lang}/` から解決されます。強制上書きを指定しない限り、既存ファイルは上書きされません。

```bash
sdd-forge init
```

#### data

`docs/` ファイル内のすべての `{{data: ...}}` ディレクティブを解決し、`analysis.json` から抽出した構造化データに置き換えます。テンプレート境界の外にあるディレクティブはそのまま保持されます。

```bash
sdd-forge data
```

#### text

設定済みAIエージェントを使用して `docs/` ファイル内の `{{text: ...}}` ディレクティブを解決します。`limits.concurrency` の設定に従ってファイルを並列処理します。特定のファイルのみを対象にすることもできます。

| オプション | 説明 |
|---|---|
| `--file <path>` | 指定したdocsファイルのみを処理する |
| `--agent <name>` | 使用するAIエージェントを上書きする |

```bash
sdd-forge text
sdd-forge text --file docs/02_cli_commands.md
```

#### readme

`docs/` の内容をソースとして、AIエージェントを使ってプロジェクトルートに `README.md` を自動生成します。使用するAIエージェントはプロジェクトconfigで定義します。

```bash
sdd-forge readme
```

#### forge

最近の変更内容を説明するプロンプトに基づき、AIを使って1つ以上のdocsファイルを反復的に改善します。`--spec` を指定すると、specファイルがAIへの追加コンテキストとして含まれます。

| オプション | 説明 |
|---|---|
| `--prompt <text>` | docsに反映する変更内容の説明（必須） |
| `--spec <path>` | 追加コンテキストとして使用するspecファイルのパス |

```bash
sdd-forge forge --prompt "translateコマンドに--langオプションを追加"
sdd-forge forge --prompt "scannerをリファクタリング" --spec specs/010-refactor/spec.md
```

#### review

AIを使って生成済みdocsの品質チェックを実行し、完全性・正確性・ソースコードとの整合性を検証します。実行可能なフィードバックとともにPASSまたはFAILの結果を出力します。

```bash
sdd-forge review
```

#### changelog

`specs/` 配下のすべてのspecファイルを集約して `change_log.md` を生成します。各specが表す機能または修正の説明としてchangelogエントリを提供します。

```bash
sdd-forge changelog
```

#### agents

最新のSDDインストラクションテンプレートと `analysis.json` / `summary.json` から新たに生成したPROJECTセクションで `AGENTS.md` を更新します。フラグで部分的な更新も可能です。

| オプション | 説明 |
|---|---|
| `--sdd` | `<!-- SDD:START/END -->` セクションのみを更新する |
| `--project` | `<!-- PROJECT:START/END -->` セクションのみを更新する |
| `--dry-run` | ディスクへの書き込みを行わずに出力をプレビューする |

```bash
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --dry-run
```

#### translate

プロジェクトconfigの `output.languages` で指定された1つ以上の追加出力言語へ生成済みdocsを翻訳します。翻訳戦略の決定には `output.mode`（`translate` または `generate`）が使用されます。

| オプション | 説明 |
|---|---|
| `--lang <code>` | 翻訳先の言語コード（例: `en`、`ja`） |
| `--force` | 既存の翻訳済みファイルを上書きする |
| `--dry-run` | ディスクへの書き込みを行わずにプレビューする |

```bash
sdd-forge translate --lang en
sdd-forge translate --lang en --force
```

#### upgrade

`docs/` テンプレートのSDDマネージドセクションを、インストール済みの `sdd-forge` パッケージに同梱された最新バージョンに更新します。ディレクティブ境界の外にあるコンテンツは保持されます。

```bash
sdd-forge upgrade
```

#### setup

新しいプロジェクトを `sdd-forge` に登録し、初期 `.sdd-forge/config.json` を生成します。プロジェクトタイプのプリセット選択と出力言語設定の構成をユーザーに案内します。`AGENTS.md` の作成と `CLAUDE.md` シンボリックリンクの作成も行います。

```bash
sdd-forge setup
```

#### default

現在のツールインストールのデフォルトプロジェクトを設定または表示します。デフォルトプロジェクトは `.sdd-forge/projects.json` に保存され、`--project` が指定されていない場合に使用されます。

```bash
sdd-forge default
sdd-forge default myproject
```

#### spec

`specs/NNN-<slug>/spec.md` に新しいspecファイルを作成し、オプションでfeatureブランチを作成します。SDDワークフローにおいて新機能または修正の開始時に使用します。

| オプション | 説明 |
|---|---|
| `--title <name>` | specおよび機能のタイトル（必須） |
| `--no-branch` | ブランチ作成をスキップする（例: worktree内で作業している場合） |

```bash
sdd-forge spec --title "translateコマンドを追加"
sdd-forge spec --title "scannerを修正" --no-branch
```

#### gate

実装前（`--phase pre`）または実装後（`--phase post`）に、定義された受入基準に照らしてspecファイルを検証します。各チェック項目についてPASSまたはFAILを報告します。

| オプション | 説明 |
|---|---|
| `--spec <path>` | 検証するspecファイルのパス（必須） |
| `--phase <pre\|post>` | ゲートフェーズ。デフォルトは `pre` |

```bash
sdd-forge gate --spec specs/010-translate/spec.md
sdd-forge gate --spec specs/010-translate/spec.md --phase post
```

#### flow

自然言語のリクエストに対して、spec作成・ゲートチェック・実装スキャフォールディングを含むSDDフロー全体を自動実行します。手動でのステップ実行が現実的でないAIエージェント環境を想定しています。

| オプション | 説明 |
|---|---|
| `--request <text>` | 機能または修正の自然言語による説明 |

```bash
sdd-forge flow --request "多言語出力のサポートを追加"
```

#### presets

`sdd-forge` にバンドルされているすべてのプロジェクトタイププリセットを一覧表示します。アーキテクチャ層プリセット（`webapp`、`cli`、`library`）およびフレームワーク固有プリセット（`cakephp2`、`laravel`、`symfony`、`node-cli`）が含まれます。

```bash
sdd-forge presets
```

#### help

利用可能なすべてのサブコマンドとその説明のまとめを表示します。引数なしで `sdd-forge` を実行した場合と同等です。

```bash
sdd-forge help
sdd-forge -h
```

### 終了コードと出力

<!-- {{text: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the fact that gate and review PASS/FAIL results are printed to stdout.}} -->
| 終了コード | 意味 |
|---|---|
| `0` | コマンドが正常に完了した |
| `1` | 一般エラー（必須オプションの欠如、ファイルが見つからない、設定が無効など） |
| `2` | gateまたはreviewのチェックが失敗した（FAILの結果が報告される。詳細はstdoutを参照） |

**stdout / stderr の使い分け:**

| ストリーム | 内容 |
|---|---|
| `stdout` | 主要なコマンド出力: 生成テキスト、レンダリングされたテーブル、`gate` および `review` のPASS/FAIL結果、dry-runプレビュー |
| `stderr` | 進捗インジケーター、警告、デバッグ情報、エラーメッセージ |

`gate` と `review` は常にPASS/FAILの判定と各チェック項目の結果を **stdout** に出力するため、CIパイプラインでのキャプチャに適しています。コマンドが実行できない理由を示すエラーメッセージ（設定がない、引数が無効など）は **stderr** に書き込まれ、キャプチャしたstdoutには現れません。
<!-- {{/text}} -->
