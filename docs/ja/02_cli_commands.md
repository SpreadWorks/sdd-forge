# 02. CLI コマンドリファレンス

## 説明

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->

`sdd-forge` は、3 層ディスパッチアーキテクチャに基づいて整理された 19 のサブコマンドを提供します。トップレベルのコマンドは `docs.js`、`spec.js`、`flow.js`、または `presets-cmd.js` ディスパッチャーを経由して個別のコマンドモジュールへルーティングされます。全コマンドに共通するグローバルオプションが存在し、一部の管理コマンドはプロジェクトコンテキストの解決をスキップします。

## 目次

### コマンド一覧

<!-- {{text: List all commands in a table format. Include command name, description, and main options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `build` | ドキュメント生成パイプラインを一括実行: `scan → init → data → text → readme → agents → translate` | `--project` |
| `scan` | ソースコードを解析し `analysis.json` を `.sdd-forge/output/` に出力 | `--project` |
| `init` | プリセットテンプレートから `docs/` ディレクトリを初期化 | `--project`, `--force` |
| `data` | 解析データを使って `docs/` 内の `{{data}}` ディレクティブを解決 | `--project` |
| `text` | AI を使って `docs/` 内の `{{text}}` ディレクティブを解決 | `--project`, `--agent` |
| `readme` | docs のコンテンツから `README.md` を自動生成 | `--project` |
| `forge` | AI を使って docs の品質を反復改善 | `--prompt`, `--spec`, `--project` |
| `review` | 生成された docs の品質チェックを実行 | `--project` |
| `changelog` | 蓄積された `specs/` エントリから `change_log.md` を生成 | `--project` |
| `agents` | SDD セクションとプロジェクトセクションで `AGENTS.md` を更新 | `--sdd`, `--project`, `--dry-run` |
| `snapshot` | リグレッション検出用スナップショットテスト（`save` / `check` / `update`） | `--project` |
| `upgrade` | docs テンプレートを最新プリセットバージョンに更新 | `--project`, `--dry-run` |
| `translate` | docs を追加言語に翻訳 | `--lang`, `--force`, `--dry-run` |
| `setup` | プロジェクトを登録し初期設定を生成 | — |
| `default` | 後続コマンド用のデフォルトプロジェクトを設定 | — |
| `spec` | feature ブランチと共に新しい SDD spec ファイルを初期化 | `--title`, `--no-branch` |
| `gate` | 実装前後に spec のゲートチェックを実行 | `--spec`, `--phase` |
| `flow` | 要求から実装まで SDD ワークフロー全体を自動化 | `--request` |
| `presets` | 利用可能な全プリセットとそのメタデータを一覧表示 | — |
| `help` | コマンド一覧と使い方の概要を表示 | — |

### グローバルオプション

<!-- {{text: Describe the global options common to all commands in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| オプション | エイリアス | 説明 |
|---|---|---|
| `--project <name>` | — | 対象プロジェクトを名前で指定します。`.sdd-forge/projects.json` から検索されます。省略した場合は `projects.json` で `default` に設定されたプロジェクトが使用されます。 |
| `--help` | `-h` | 指定したコマンドの使い方を表示して終了します。 |
| `--version` | `-v`, `-V` | インストール済みの `sdd-forge` バージョン（`package.json` から読み込み）を表示して終了します。 |

> **注意:** `setup`、`default`、`help`、`presets` コマンドはプロジェクトコンテキストの解決をスキップするため、プロジェクトが登録されていなくても実行できます。それ以外のコマンドはすべて、実行前にプロジェクトコンテキストから `SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` 環境変数を解決します。

### コマンド詳細

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command has --lang, --force, and --dry-run options.}} -->

#### build

ドキュメント生成パイプラインを順番に実行します:

```
scan → init → data → text → readme → agents → [translate]
```

`translate` ステップは、`.sdd-forge/config.json` で複数の出力言語が設定されている場合にのみ実行されます。各ステップは解決済みのプロジェクトコンテキストで実行されます。

```bash
sdd-forge build
sdd-forge build --project myproject
```

#### scan

対象プロジェクトのソースコードを解析し、構造化された出力を `.sdd-forge/output/analysis.json` に書き込みます。スキャンの動作は `config.json` で定義されたプロジェクトタイプ（例: `cli/node-cli`、`webapp/cakephp2`）によって決まります。

```bash
sdd-forge scan
```

#### init

設定されたプロジェクトタイプと言語に合致するプリセットテンプレートをコピーして、`docs/` ディレクトリを初期化します。既存の `docs/` ディレクトリを上書きするには `--force` を使用します。

```bash
sdd-forge init
sdd-forge init --force
```

#### data

`analysis.json` から抽出した構造化データで置換することで、`docs/` ファイル内のすべての `{{data}}` ディレクティブを解決します。`{{data}}` / `{{/data}}` ブロック外のディレクティブはそのまま保持されます。

```bash
sdd-forge data
```

#### text

設定済みの AI エージェントを呼び出して、`docs/` ファイル内のすべての `{{text}}` ディレクティブを解決します。エージェントは周辺のドキュメントコンテキストと関連ソースコードを読み込み、セクション本文テキストを生成します。デフォルトのエージェントを上書きするには `--agent` を使用します。

```bash
sdd-forge text
sdd-forge text --agent claude
```

#### readme

アクティブなプリセットの readme テンプレートに従って `docs/` ディレクトリのコンテンツを集約し、プロジェクトルートに `README.md` を生成します。

```bash
sdd-forge readme
```

#### forge

変更の概要を AI エージェントに渡すことで docs の品質を反復改善します。エージェントは `docs/` 内の影響を受けるセクションを更新します。spec ファイルで記述された変更に改善範囲を絞り込むこともできます。

```bash
sdd-forge forge --prompt "Added user authentication module"
sdd-forge forge --prompt "Refactored routing layer" --spec specs/012-routing/spec.md
```

#### review

現在の `docs/` コンテンツに対してドキュメント品質チェックリストを実行し、PASS または FAIL を stdout に出力します。レビューチェックリストは `src/templates/review-checklist.md` から読み込まれます。

```bash
sdd-forge review
```

#### changelog

蓄積されたすべての `specs/` ディレクトリを読み込み、実装された機能と修正の履歴をまとめた `change_log.md` を生成します。

```bash
sdd-forge changelog
```

#### agents

SDD セクション（`src/presets/base/templates/{lang}/AGENTS.sdd.md` から）と PROJECT セクション（`analysis.json` から生成され AI で精査）を更新して `AGENTS.md` を再生成します。どちらか一方のセクションのみ更新するには `--sdd` または `--project` を使用します。

```bash
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --project --dry-run
```

#### snapshot

リグレッション検出のために生成出力の現在の状態をキャプチャ・比較します。キャプチャ対象は `analysis.json`、すべての `docs/*.md` ファイル、および `README.md` です。

| サブコマンド | 説明 |
|---|---|
| `save` | 現在の出力を名前付きスナップショットとして保存 |
| `check` | 現在の出力と保存済みスナップショットを比較 |
| `update` | 保存済みスナップショットを現在の出力で上書き更新 |

```bash
sdd-forge snapshot save
sdd-forge snapshot check
sdd-forge snapshot update
```

#### upgrade

インストール済みプリセットが提供する最新バージョンに `docs/` テンプレートファイルを更新します。ディレクティブブロック外の手動記述コンテンツは保持されます。

```bash
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### translate

`config.json` で定義された 1 つ以上の追加言語に既存の `docs/` コンテンツを翻訳します。特定の言語を対象にするには `--lang`、既に翻訳済みのファイルを再翻訳するには `--force`、書き込みなしでプレビューするには `--dry-run` を使用します。

| オプション | 説明 |
|---|---|
| `--lang <code>` | 対象言語コード（例: `en`、`ja`） |
| `--force` | 対象言語に既に存在するファイルを再翻訳 |
| `--dry-run` | ファイルに書き込まずに翻訳をプレビュー |

```bash
sdd-forge translate --lang en
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

#### setup

ソースパス、作業ルート、プロジェクトタイプを対話形式で入力を求めて新規プロジェクトを登録し、初期の `.sdd-forge/config.json` を生成します。このコマンドはプロジェクトコンテキストの解決をスキップするため、プロジェクトが未設定の状態でも実行できます。

```bash
sdd-forge setup
```

#### default

`.sdd-forge/projects.json` にデフォルトプロジェクトを設定することで、後続のコマンドで `--project` フラグを省略できるようにします。

```bash
sdd-forge default myproject
```

#### spec

`specs/NNN-<title>/spec.md` に新しい SDD spec ファイルを作成し、デフォルトで新しい feature ブランチをチェックアウトします。git worktree 内で作業する場合は `--no-branch` を使用します。

```bash
sdd-forge spec --title "Add CSV export"
sdd-forge spec --title "Fix auth bug" --no-branch
```

#### gate

SDD ゲートチェックリストに対して spec ファイルを検証します。実装前の準備確認には `--phase pre`（デフォルト）を、実装後の完了確認には `--phase post` を指定して実行します。

```bash
sdd-forge gate --spec specs/012-csv-export/spec.md
sdd-forge gate --spec specs/012-csv-export/spec.md --phase post
```

#### flow

自然言語による要求に基づいて、spec 作成からゲートチェック、実装まで SDD ワークフロー全体を自動化します。サブコマンドルーティングなしのダイレクトコマンドです。

```bash
sdd-forge flow --request "Add CSV export for report data"
```

#### presets

インストール済みの `sdd-forge` パッケージで利用可能な全プリセットを、タイプ識別子・アーキテクチャ層・サポートされるエイリアスと共に一覧表示します。

```bash
sdd-forge presets
```

#### help

利用可能な全サブコマンドとその説明の概要を表示します。

```bash
sdd-forge help
sdd-forge -h
```

### 終了コードと出力

<!-- {{text: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the note that gate and review PASS/FAIL results are written to stdout.}} -->

| 終了コード | 意味 |
|---|---|
| `0` | コマンドが正常に完了 |
| `1` | 一般エラー（無効な引数、設定の欠如、ファイル I/O エラーなど） |
| `1` | ゲートチェックが FAIL を返した（実装を進めるべきでない） |
| `1` | レビューチェックが FAIL を返した（docs の品質がチェックリストの基準を満たさなかった） |

**stdout / stderr の規約:**

| ストリーム | 用途 |
|---|---|
| `stdout` | コマンドの主要出力: 生成コンテンツ、テーブルデータ、PASS/FAIL 判定、進捗メッセージ |
| `stderr` | コマンドの主要出力に含まれない診断メッセージ、警告、エラー詳細 |

> `gate` と `review` は PASS または FAIL の結果を `stdout` に書き込むため、スクリプトや CI パイプラインで結果をキャプチャできます。FAIL 結果に付随する詳細な診断情報は `stderr` にも出力される場合があります。
