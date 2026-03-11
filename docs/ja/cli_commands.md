# 02. CLIコマンドリファレンス

## 概要

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->

`sdd-forge` は3層ディスパッチアーキテクチャに基づいて整理された19のサブコマンドを提供します。トップレベルのコマンドは `docs.js`、`spec.js`、`flow.js`、または `presets-cmd.js` ディスパッチャーを経由して個別のコマンドモジュールへルーティングされます。すべてのコマンドに共通するグローバルオプションが存在する一方、一部の管理系コマンドはプロジェクトコンテキストの解決を完全にスキップします。

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
| `forge` | AI を用いて docs の品質を反復的に改善 | `--prompt`, `--spec`, `--project` |
| `review` | 生成された docs の品質チェックを実行 | `--project` |
| `changelog` | 蓄積された `specs/` エントリーから `change_log.md` を生成 | `--project` |
| `agents` | SDD セクションとプロジェクトセクションで `AGENTS.md` を更新 | `--sdd`, `--project`, `--dry-run` |
| `snapshot` | リグレッション検出のためのスナップショットテスト (`save` / `check` / `update`) | `--project` |
| `upgrade` | docs テンプレートをプリセットの最新バージョンに更新 | `--project`, `--dry-run` |
| `translate` | docs を追加言語に翻訳 | `--lang`, `--force`, `--dry-run` |
| `setup` | プロジェクトを登録し初期設定を生成 | — |
| `default` | 後続コマンドのデフォルトプロジェクトを設定 | — |
| `spec` | feature ブランチ付きで新しい SDD spec ファイルを初期化 | `--title`, `--no-branch` |
| `gate` | 実装前後に spec のゲートチェックを実行 | `--spec`, `--phase` |
| `flow` | リクエストから実装までの SDD フロー全体を自動化 | `--request` |
| `presets` | 利用可能なすべてのプリセットとそのメタデータを一覧表示 | — |
| `help` | コマンド一覧と使用方法のサマリーを表示 | — |

### グローバルオプション

<!-- {{text: Describe the global options common to all commands in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| オプション | エイリアス | 説明 |
|---|---|---|
| `--project <name>` | — | 対象プロジェクトを名前で指定します。`.sdd-forge/projects.json` から検索されます。省略した場合、`projects.json` で `default` に設定されているプロジェクトが使用されます。 |
| `--help` | `-h` | 指定コマンドの使用方法を表示して終了します。 |
| `--version` | `-v`, `-V` | インストールされている `sdd-forge` のバージョンを表示して終了します（`package.json` から読み込み）。 |

> **注意:** `setup`、`default`、`help`、`presets` の各コマンドはプロジェクトコンテキストの解決をスキップするため、登録済みのプロジェクトを設定しなくても実行できます。それ以外のコマンドはすべて、実行前にプロジェクトコンテキストから `SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` 環境変数を解決します。

### コマンド詳細

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command has --lang, --force, and --dry-run options.}} -->

#### build

ドキュメント生成パイプラインを以下の順序で一括実行します:

```
scan → init → data → text → readme → agents → [translate]
```

`translate` ステップは、`.sdd-forge/config.json` で複数の出力言語が設定されている場合のみ実行されます。各ステップは解決済みのプロジェクトコンテキストで実行されます。

```bash
sdd-forge build
sdd-forge build --project myproject
```

#### scan

対象プロジェクトのソースコードを解析し、構造化された結果を `.sdd-forge/output/analysis.json` に書き出します。スキャンの動作は `config.json` で定義されたプロジェクトタイプ（例: `cli/node-cli`、`webapp/cakephp2`）に従います。

```bash
sdd-forge scan
```

#### init

設定済みのプロジェクトタイプと言語に合致するプリセットテンプレートをコピーして `docs/` ディレクトリを初期化します。既存の `docs/` ディレクトリを上書きするには `--force` を使用します。

```bash
sdd-forge init
sdd-forge init --force
```

#### data

`analysis.json` から抽出した構造化データを代入することで、`docs/` ファイル内のすべての `{{data}}` ディレクティブを解決します。`{{data}}` / `{{/data}}` ブロック外のディレクティブはそのまま維持されます。

```bash
sdd-forge data
```

#### text

設定済みの AI エージェントを呼び出して、`docs/` ファイル内のすべての `{{text}}` ディレクティブを解決します。エージェントは周辺のドキュメントコンテキストと関連するソースコードを読み込み、セクション本文を生成します。デフォルトのエージェントを上書きするには `--agent` を使用します。

```bash
sdd-forge text
sdd-forge text --agent claude
```

#### readme

アクティブなプリセットの readme テンプレートに従い、`docs/` ディレクトリのコンテンツを集約してプロジェクトルートに `README.md` を生成します。

```bash
sdd-forge readme
```

#### forge

変更のサマリーを AI エージェントに渡して docs の品質を反復的に改善します。エージェントは `docs/` 内の影響を受けるセクションを更新します。spec ファイルを指定することで、改善範囲をそのファイルに記述された変更に絞ることもできます。

```bash
sdd-forge forge --prompt "ユーザー認証モジュールを追加"
sdd-forge forge --prompt "ルーティング層をリファクタリング" --spec specs/012-routing/spec.md
```

#### review

現在の `docs/` コンテンツに対して docs 品質チェックリストを実行し、PASS または FAIL を標準出力に報告します。レビューチェックリストは `src/templates/review-checklist.md` から読み込まれます。

```bash
sdd-forge review
```

#### changelog

蓄積されたすべての `specs/` ディレクトリを読み込み、実装済みの機能や修正の履歴をまとめた `change_log.md` を生成します。

```bash
sdd-forge changelog
```

#### agents

SDD セクション（`src/presets/base/templates/{lang}/AGENTS.sdd.md` から取得）とプロジェクトセクション（`analysis.json` から生成し AI で精査）を更新して `AGENTS.md` を再生成します。`--sdd` または `--project` を使用することで、いずれか一方のセクションのみ更新できます。

```bash
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --project --dry-run
```

#### snapshot

生成された出力の現在の状態をキャプチャ・比較してリグレッションを検出します。キャプチャ対象は `analysis.json`、すべての `docs/*.md` ファイル、および `README.md` です。

| サブコマンド | 説明 |
|---|---|
| `save` | 現在の出力を名前付きスナップショットとして保存 |
| `check` | 現在の出力と保存済みスナップショットを比較 |
| `update` | 保存済みスナップショットを現在の出力で上書き |

```bash
sdd-forge snapshot save
sdd-forge snapshot check
sdd-forge snapshot update
```

#### upgrade

インストール済みプリセットの最新バージョンが提供する `docs/` テンプレートファイルに更新します。ディレクティブブロック外の手動記述コンテンツは保持されます。

```bash
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### translate

`config.json` で定義された1つ以上の追加言語に既存の `docs/` コンテンツを翻訳します。特定言語を指定するには `--lang`、翻訳済みファイルを再翻訳するには `--force`、ファイルに書き込まずプレビューするには `--dry-run` を使用します。

| オプション | 説明 |
|---|---|
| `--lang <code>` | 対象言語コード（例: `en`、`ja`） |
| `--force` | 対象言語で既に存在するファイルも再翻訳 |
| `--dry-run` | ファイルに書き込まずに翻訳内容をプレビュー |

```bash
sdd-forge translate --lang en
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

#### setup

ソースパス、作業ルート、プロジェクトタイプの入力を促して新しいプロジェクトを登録し、初期 `.sdd-forge/config.json` を生成します。このコマンドはプロジェクトコンテキストの解決をスキップするため、プロジェクトが未設定の状態でも実行できます。

```bash
sdd-forge setup
```

#### default

`.sdd-forge/projects.json` のデフォルトプロジェクトを設定し、後続のコマンドで `--project` フラグを省略できるようにします。

```bash
sdd-forge default myproject
```

#### spec

`specs/NNN-<title>/spec.md` に新しい SDD spec ファイルを作成し、デフォルトでは新しい feature ブランチをチェックアウトします。git worktree 内で作業している場合は `--no-branch` を使用します。

```bash
sdd-forge spec --title "CSV エクスポートを追加"
sdd-forge spec --title "認証バグを修正" --no-branch
```

#### gate

SDD ゲートチェックリストに対して spec ファイルを検証します。実装前の準備確認には `--phase pre`（デフォルト）、実装後の完了確認には `--phase post` を指定して実行します。

```bash
sdd-forge gate --spec specs/012-csv-export/spec.md
sdd-forge gate --spec specs/012-csv-export/spec.md --phase post
```

#### flow

自然言語のリクエストをもとに、spec 作成からゲートチェック、実装までの SDD フロー全体を自動化します。サブコマンドルーティングのないダイレクトコマンドです。

```bash
sdd-forge flow --request "レポートデータの CSV エクスポートを追加"
```

#### presets

インストール済みの `sdd-forge` パッケージで利用可能なすべてのプリセットを、タイプ識別子・アーキテクチャ層・サポートされるエイリアスとともに一覧表示します。

```bash
sdd-forge presets
```

#### help

利用可能なすべてのサブコマンドとその説明のサマリーを表示します。

```bash
sdd-forge help
sdd-forge -h
```

### 終了コードと出力

<!-- {{text: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the note that gate and review PASS/FAIL results are written to stdout.}} -->

| 終了コード | 意味 |
|---|---|
| `0` | コマンドが正常に完了 |
| `1` | 一般エラー（無効な引数、設定ファイル不足、ファイル I/O 障害など） |
| `1` | ゲートチェックが FAIL を返した（実装を進めてはならない） |
| `1` | レビューチェックが FAIL を返した（docs の品質がチェックリストの基準を満たしていない） |

**stdout / stderr の使い分け:**

| ストリーム | 用途 |
|---|---|
| `stdout` | コマンドの主要出力: 生成コンテンツ、テーブルデータ、PASS/FAIL の判定結果、進捗メッセージ |
| `stderr` | コマンドの主要出力に含まれない診断メッセージ、警告、エラーの詳細 |

> `gate` と `review` は PASS または FAIL の結果を `stdout` に書き出すため、スクリプトや CI パイプラインで結果をキャプチャできます。FAIL に伴う詳細な診断情報は `stderr` にも出力される場合があります。
