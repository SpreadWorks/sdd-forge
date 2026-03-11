# 02. CLIコマンドリファレンス

## 説明

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->

`sdd-forge` は、3層ディスパッチアーキテクチャに基づいて整理された19のサブコマンドを提供します。トップレベルのコマンドは `docs.js`、`spec.js`、`flow.js`、または `presets-cmd.js` ディスパッチャーを経由してから個々のコマンドモジュールに到達します。すべてのコマンドに共通するグローバルオプションが存在する一方、一部の管理コマンドはプロジェクトコンテキストの解決を完全にバイパスします。

## 目次

### コマンド一覧

<!-- {{text: List all commands in a table format. Include command name, description, and main options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `build` | ドキュメント生成パイプラインをすべて実行: `scan → enrich → init → data → text → readme → agents → translate` | `--project` |
| `scan` | ソースコードを解析し、`analysis.json` を `.sdd-forge/output/` に出力 | `--project` |
| `enrich` | AI が生成した `summary`、`detail`、`chapter`、`role` フィールドで `analysis.json` の各エントリを補完 | `--dry-run`, `--stdout` |
| `init` | プリセットテンプレートから `docs/` ディレクトリを初期化 | `--project`, `--force` |
| `data` | 解析データを用いて `docs/` 内の `{{data}}` ディレクティブを解決 | `--project` |
| `text` | AI を用いて `docs/` 内の `{{text}}` ディレクティブを解決 | `--project`, `--agent` |
| `readme` | docs のコンテンツから `README.md` を自動生成 | `--project` |
| `forge` | AI を用いて docs の品質を反復的に改善 | `--prompt`, `--spec`, `--project` |
| `review` | 生成された docs の品質チェックを実行 | `--project` |
| `changelog` | 蓄積された `specs/` エントリから `change_log.md` を生成 | `--dry-run` |
| `agents` | SDD セクションとプロジェクトセクションで `AGENTS.md` を更新 | `--sdd`, `--project`, `--dry-run` |
| `snapshot` | リグレッション検出用のスナップショットテスト（`save` / `check` / `update`） | `--project` |
| `upgrade` | インストール済みプリセットの最新バージョンにスキルファイルを更新 | `--dry-run` |
| `translate` | docs を追加言語に翻訳 | `--lang`, `--force`, `--dry-run` |
| `setup` | インタラクティブにプロジェクトを登録し、初期設定を生成 | — |
| `default` | 後続コマンド向けのデフォルトプロジェクトを表示または設定 | — |
| `spec` | フィーチャーブランチとともに新しい SDD spec ファイルを初期化 | `--title`, `--no-branch`, `--worktree` |
| `gate` | 実装前後に spec のゲートチェックを実行 | `--spec`, `--phase` |
| `flow` | リクエストから実装まで SDD ワークフロー全体を自動化 | `--request`, `--title`, `--spec` |
| `presets` | 利用可能なプリセットとそのメタデータを一覧表示 | — |
| `help` | コマンド一覧と使用方法のサマリーを表示 | — |

### グローバルオプション

<!-- {{text: Describe the global options common to all commands in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| オプション | エイリアス | 説明 |
|---|---|---|
| `--project <name>` | — | `.sdd-forge/projects.json` から参照する対象プロジェクトを名前で指定します。省略した場合は `projects.json` で `default` に設定されたプロジェクトが使用されます。 |
| `--help` | `-h` | 使用方法を表示して終了します。 |
| `--version` | `-v`, `-V` | インストール済みの `sdd-forge` バージョンを（`package.json` から読み込んで）表示して終了します。 |

> **注:** `setup`、`default`、`help`、`presets` の各コマンドはプロジェクトコンテキストの解決をスキップするため、登録済みプロジェクトの設定がなくても実行できます。その他すべてのコマンドは、実行前にプロジェクトコンテキストから `SDD_SOURCE_ROOT` および `SDD_WORK_ROOT` 環境変数を解決します。

### コマンド詳細

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command has --lang, --force, and --dry-run options.}} -->

#### build

ドキュメント生成パイプライン全体を順番に実行します:

```
scan → enrich → init → data → text → readme → agents → [translate]
```

`translate` ステップは、`.sdd-forge/config.json` に複数の出力言語が設定されている場合にのみ実行されます。`defaultAgent` が設定されていない場合、`enrich` および `text` ステップは警告とともにスキップされます。

```bash
sdd-forge build
sdd-forge build --project myproject
```

#### scan

対象プロジェクトのソースコードを解析し、構造化された出力を `.sdd-forge/output/analysis.json` に書き込みます。スキャン動作は `config.json` で定義されたプロジェクトタイプ（例: `cli/node-cli`、`webapp/cakephp2`）に従って決まります。

```bash
sdd-forge scan
```

#### enrich

`analysis.json` を読み込み、設定された AI エージェントをバッチで呼び出して、各エントリに `summary`、`detail`、`chapter`、`role` フィールドを付与します。再実行時にはすでにエンリッチ済みのエントリをスキップするため、中断して再開しても安全です。バッチサイズは `config.limits.enrichBatchSize` および `config.limits.enrichBatchLines` で設定できます。

```bash
sdd-forge enrich
sdd-forge enrich --dry-run
```

#### init

設定されたプロジェクトタイプと言語に合致するプリセットテンプレートをコピーして `docs/` ディレクトリを初期化します。既存の `docs/` ディレクトリを上書きするには `--force` を使用します。

```bash
sdd-forge init
sdd-forge init --force
```

#### data

`docs/` ファイル内のすべての `{{data}}` ディレクティブを、`analysis.json` から抽出した構造化データで置換して解決します。`{{data}}` / `{{/data}}` ブロック外のディレクティブはそのまま残されます。

```bash
sdd-forge data
```

#### text

設定された AI エージェントを呼び出して `docs/` ファイル内のすべての `{{text}}` ディレクティブを解決します。エージェントは周囲のドキュメントコンテキストと関連するソースコードを参照してセクション本文を生成します。デフォルトのエージェントを上書きするには `--agent` を使用します。

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

変更サマリーを AI エージェントに渡して docs の品質を反復的に改善します。エージェントは `docs/` 内の影響を受けるセクションを更新します。spec ファイルで記述された変更に改善範囲を絞り込むこともできます。

```bash
sdd-forge forge --prompt "ユーザー認証モジュールを追加"
sdd-forge forge --prompt "ルーティング層をリファクタリング" --spec specs/012-routing/spec.md
```

#### review

現在の `docs/` コンテンツに対して docs 品質チェックリストを実行し、PASS または FAIL を stdout に出力します。レビューチェックリストは `src/templates/review-checklist.md` から読み込まれます。

```bash
sdd-forge review
```

#### changelog

蓄積されたすべての `specs/` ディレクトリを読み込み、実装済みの機能や修正の履歴をまとめた `change_log.md` を生成します。ファイルへの書き込みをせずに出力をプレビューするには `--dry-run` を使用します。

```bash
sdd-forge changelog
sdd-forge changelog --dry-run
```

#### agents

SDD セクション（`src/presets/base/templates/{lang}/AGENTS.sdd.md` から）と PROJECT セクション（`analysis.json` から生成して AI が精査）を更新することで `AGENTS.md` を再生成します。一方のセクションだけを更新するには `--sdd` または `--project` を使用します。

```bash
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --project --dry-run
```

#### snapshot

リグレッション検出のために生成物の現在の状態をキャプチャして比較します。キャプチャ対象は `analysis.json`、すべての `docs/*.md` ファイル、および `README.md` です。スナップショットは `.sdd-forge/snapshots/` 以下に保存されます。

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

`.agents/skills/` および `.claude/skills/` 配下のスキルファイルを、インストール済みの `sdd-forge` パッケージに同梱された最新バージョンに更新します。設定ファイルや docs のコンテンツは変更されません。コンテンツがすでに最新のファイルはスキップされます。

```bash
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

#### translate

`config.json` で定義された1つまたは複数の追加言語に、既存の `docs/` コンテンツを翻訳します。特定の言語を対象にするには `--lang` を、すでに翻訳済みのファイルを再翻訳するには `--force` を、書き込みをせずにプレビューするには `--dry-run` を使用します。

| オプション | 説明 |
|---|---|
| `--lang <code>` | 対象言語コード（例: `en`、`ja`） |
| `--force` | 対象言語のファイルがすでに存在していても再翻訳 |
| `--dry-run` | ファイルへの書き込みをせずに翻訳をプレビュー |

```bash
sdd-forge translate --lang en
sdd-forge translate --lang ja --force
sdd-forge translate --dry-run
```

#### setup

ソースパス、作業ルート、出力言語、プロジェクトタイプ、ドキュメントスタイル、AI エージェント設定などを対話的に入力するウィザードを通じて新しいプロジェクトを登録します。完了すると `.sdd-forge/config.json` を生成し、`AGENTS.md` を作成して `CLAUDE.md` シンボリックリンクを設定し、スキルファイルをコピーします。CLI フラグによる非対話モードも利用できます。このコマンドはプロジェクトコンテキストの解決をスキップするため、プロジェクトが設定される前でも実行できます。

```bash
sdd-forge setup
```

#### default

登録済みプロジェクトの一覧を表示するか、`.sdd-forge/projects.json` でデフォルトプロジェクトを設定して、後続のコマンドで `--project` フラグを省略できるようにします。

```bash
sdd-forge default
sdd-forge default myproject
```

#### spec

`specs/NNN-<title>/spec.md` 以下に新しい SDD spec ファイルを作成し、デフォルトでは新しいフィーチャーブランチをチェックアウトします。git worktree 内で作業する場合は `--no-branch` を、完全に分離された git worktree 環境を作成するには `--worktree` を使用します。

```bash
sdd-forge spec --title "CSV エクスポートを追加"
sdd-forge spec --title "認証バグを修正" --no-branch
sdd-forge spec --title "ルーティングをリファクタリング" --worktree
```

#### gate

spec ファイルを SDD ゲートチェックリストに対して検証し、未解決のトークン（`TBD`、`TODO`、`[NEEDS CLARIFICATION]`）、必須セクションの欠落、未チェックの承認項目を検出します。実装前の準備確認には `--phase pre`（デフォルト）、実装後の完了確認には `--phase post` を指定して実行します。

```bash
sdd-forge gate --spec specs/012-csv-export/spec.md
sdd-forge gate --spec specs/012-csv-export/spec.md --phase post
```

#### flow

自然言語のリクエストをもとに、spec 作成からゲートチェック、forge までの SDD ワークフロー全体を自動化します。これはサブコマンドルーティングのないダイレクトコマンドです。ゲートチェックが失敗した場合、コマンドはコード `2` で終了し、次のステップを案内する `NEEDS_INPUT` を出力します。

```bash
sdd-forge flow --request "レポートデータの CSV エクスポートを追加"
sdd-forge flow --request "ログインリダイレクトを修正" --no-branch
```

#### presets

インストール済みの `sdd-forge` パッケージで利用可能なすべてのプリセットを、アーキテクチャ層・プリセット名・サポートする型エイリアス・スキャン対象キーを示す3階層の ASCII ツリー形式で一覧表示します。

```bash
sdd-forge presets
sdd-forge presets list
```

#### help

利用可能なすべてのサブコマンドとその説明をカテゴリ別にまとめたサマリーを表示します。説明テキストは設定された `lang` 設定を使用して i18n システム経由で読み込まれます。

```bash
sdd-forge help
sdd-forge -h
```

### 終了コードと出力

<!-- {{text: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the note that gate and review PASS/FAIL results are written to stdout.}} -->

| 終了コード | 意味 |
|---|---|
| `0` | コマンドが正常に完了 |
| `1` | 一般エラー — 無効な引数、設定の欠落、またはファイル I/O の失敗 |
| `1` | ゲートチェックが FAIL を返した（spec に未解決の問題が残っており、実装を進めてはならない） |
| `1` | レビューチェックが FAIL を返した（生成された docs が品質チェックリストの基準を満たさなかった） |
| `2` | flow コマンドがゲートで停止 — `NEEDS_INPUT` が出力され、未解決の問題に対するユーザーアクションが必要 |

**stdout / stderr の規則:**

| ストリーム | 用途 |
|---|---|
| `stdout` | コマンドの主要出力: 生成されたコンテンツ、テーブルデータ、PASS/FAIL の判定、パイプラインの進捗、および dry-run のプレビュー |
| `stderr` | コマンドの主要出力を構成しない診断メッセージ、警告、およびエラーの詳細 |

> `gate` および `review` は PASS または FAIL の判定を `stdout` に書き込むため、スクリプトや CI パイプラインから確実にキャプチャできます。FAIL 結果に付随する詳細な診断情報は、追加で `stderr` に出力される場合があります。
