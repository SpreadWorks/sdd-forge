# 02. CLIコマンドリファレンス

## Description

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->

本章では `sdd-forge` で利用可能な全19サブコマンドを、ルーティング層ごとに整理して解説します。`docs.js` 経由でディスパッチされるドキュメントコマンド、`spec.js` 経由でディスパッチされる仕様書コマンド、および直接実行される `flow` と `presets` に分類されます。`--project`・`--help`・`--version` などの少数のグローバルオプションは全コマンドに共通して適用され、各サブコマンド固有のフラグについては以降のセクションで詳述します。
<!-- {{/text}} -->

## Contents

### コマンド一覧

<!-- {{text: List all commands in a table format. Include command name, description, and main options. Commands can be identified from the modules list in the analysis data. Include both commands routed through dispatchers (docs.js, spec.js) and directly executed commands (flow, presets). Note that build is a composite command (scan → init → data → text → readme → agents → translate pipeline). Be sure to include translate (multilingual translation), upgrade (template update), and default (default project configuration).}} -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `build` | ドキュメント生成パイプラインをフル実行（scan → init → data → text → readme → agents → translate） | `--project` |
| `scan` | ソースコードを解析し `analysis.json` と `summary.json` を出力 | `--project` |
| `init` | プリセットテンプレートから `docs/` を初期化 | `--project`, `--force` |
| `data` | 解析データで `{{data}}` ディレクティブを解決 | `--project` |
| `text` | AI エージェントを使用して `{{text}}` ディレクティブを解決 | `--project`, `--agent`, `--file` |
| `readme` | docs から `README.md` を自動生成 | `--project` |
| `forge` | AI を通じて docs の品質を反復改善 | `--project`, `--prompt`, `--spec` |
| `review` | docs の品質チェックを実行し PASS/FAIL を報告 | `--project` |
| `changelog` | 蓄積された spec から `change_log.md` を生成 | `--project` |
| `agents` | `AGENTS.md` を更新（SDD テンプレート + PROJECT セクション） | `--project`, `--sdd`, `--project-only`, `--dry-run` |
| `upgrade` | バンドル済みドキュメントテンプレートを最新プリセットバージョンに更新 | `--project`, `--force` |
| `translate` | 追加言語のドキュメントを生成 | `--project`, `--lang`, `--force`, `--dry-run` |
| `setup` | プロジェクトを登録し `.sdd-forge/config.json` を生成 | — |
| `default` | `projects.json` のデフォルトプロジェクトを設定 | — |
| `spec` | 新しい SDD spec（`spec.md`）と feature ブランチを作成 | `--title`, `--no-branch` |
| `gate` | 実装前後の spec ゲートチェックを実行 | `--spec`, `--phase` |
| `flow` | 機能要求に対して SDD ワークフロー全体を自動実行 | `--request` |
| `presets` | 利用可能なプリセットとそのメタデータを一覧表示 | — |
| `help` | コマンド一覧と使用方法のサマリーを表示 | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text: Describe the global options common to all commands in a table format. Include --project, --help/-h, and --version/-v/-V. Also note that setup, default, help, and presets skip project context resolution.}} -->

| オプション | エイリアス | 説明 |
|---|---|---|
| `--project <name>` | — | 対象プロジェクトを名前で指定。`.sdd-forge/projects.json` の `default` エントリを上書きする。 |
| `--help` | `-h` | CLI または特定サブコマンドのヘルプテキストを表示して終了。 |
| `--version` | `-v`, `-V` | インストール済みの `sdd-forge` バージョンを（`package.json` から読み込んで）出力して終了。 |

`setup`・`default`・`help`・`presets` コマンドはプロジェクトコンテキストの解決を完全にスキップします。これらのコマンドは登録済みプロジェクトを必要とせず、`.sdd-forge/config.json` の読み込みや `SDD_SOURCE_ROOT` / `SDD_WORK_ROOT` の解決を試みません。

その他すべてのコマンドでは、アクティブなプロジェクトは以下の優先順位で決定されます。

1. コマンドラインで渡された `--project <name>` フラグ
2. `.sdd-forge/projects.json` の `default` フィールド
3. 外部から設定された環境変数 `SDD_SOURCE_ROOT` および `SDD_WORK_ROOT`
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a #### subsection for each command. For the build pipeline, list all steps: scan → init → data → text → readme → agents → translate. The translate command has --lang, --force, and --dry-run options.}} -->

#### build

ドキュメント生成パイプラインを順番に実行します。各ステップは前のステップが成功した場合にのみ実行されます。

**パイプラインのステップ:**
1. `scan` — ソースコードを解析
2. `init` — テンプレートから docs を初期化（docs が既に存在する場合はスキップ）
3. `data` — `{{data}}` ディレクティブを解決
4. `text` — AI を通じて `{{text}}` ディレクティブを解決
5. `readme` — `README.md` を生成
6. `agents` — `AGENTS.md` を更新
7. `translate` — 追加言語のドキュメントを生成（複数の `output.languages` が設定されている場合のみ）

```sh
sdd-forge build
sdd-forge build --project myproject
```

#### scan

登録されたプロジェクトのソースコードを解析し、結果を `.sdd-forge/output/analysis.json` に書き込みます。AI コマンドへの優先入力として使用される軽量な `summary.json` も同じパスに生成されます。

```sh
sdd-forge scan
sdd-forge scan --project myproject
```

#### init

`@extends` / `@block` 継承を使ってプリセットテンプレートをマージし、`docs/` ディレクトリを初期化します。`docs/` が既に存在する場合、`--force` を指定しない限りファイルは上書きされません。

| オプション | 説明 |
|---|---|
| `--force` | 既存のドキュメントファイルを上書き |

```sh
sdd-forge init
sdd-forge init --force
```

#### data

`docs/` ファイル内のすべての `{{data: ...}}` ディレクティブを解決し、`analysis.json` から抽出した構造化データでインライン置換します。

```sh
sdd-forge data
sdd-forge data --project myproject
```

#### text

設定済みの AI エージェントを呼び出し、生成されたテキストを挿入することで、`docs/` ファイル内のすべての `{{text: ...}}` ディレクティブを解決します。

| オプション | 説明 |
|---|---|
| `--agent <name>` | デフォルトの代わりに `config.json` で定義された特定のプロバイダーを使用 |
| `--file <path>` | すべてのファイルではなく、指定したドキュメントファイルのみを処理 |

```sh
sdd-forge text
sdd-forge text --file docs/01_overview.md
sdd-forge text --agent claude
```

#### readme

ドキュメントと解析データを組み合わせてプロジェクトルートに `README.md` を生成します。出力フォーマットはプロジェクトタイプのプリセットに従います。

```sh
sdd-forge readme
sdd-forge readme --project myproject
```

#### forge

自然言語のプロンプトに基づいて、1つまたは複数のドキュメントファイルを反復的に改善します。AI は既存のコンテンツを全面置換するのではなく、修正するよう指示されます。

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 実施する変更や改善内容の説明（必須） |
| `--spec <path>` | 更新範囲を特定の spec コンテキストに限定 |

```sh
sdd-forge forge --prompt "概要のauthenticationフローを明確化する"
sdd-forge forge --prompt "OAuthサポート追加後の更新" --spec specs/012-oauth/spec.md
```

#### review

レビューチェックリストを使って `docs/` の品質チェックを実行し、全体の PASS または FAIL を標準出力に報告します。終了コードは結果を反映します（0 = PASS、1 = FAIL）。

```sh
sdd-forge review
sdd-forge review --project myproject
```

#### changelog

`specs/` 配下に蓄積されたすべての spec ファイルから情報を集約して `docs/change_log.md` を生成します。

```sh
sdd-forge changelog
sdd-forge changelog --project myproject
```

#### agents

`<!-- SDD:START/END -->` セクションを最新のバンドル済みテンプレートで置き換え、`<!-- PROJECT:START/END -->` セクションを解析データから再生成することで `AGENTS.md` を更新します。

| オプション | 説明 |
|---|---|
| `--sdd` | SDD テンプレートセクションのみを更新 |
| `--project-only` | PROJECT セクションのみを再生成 |
| `--dry-run` | ディスクへの書き込みなしに変更をプレビュー |

```sh
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --dry-run
```

#### upgrade

`docs/` 内のドキュメントテンプレートファイルを、インストール済みプリセットに同梱された最新バージョンに更新します。`sdd-forge` パッケージをアップグレードした後に便利です。

| オプション | 説明 |
|---|---|
| `--force` | カスタマイズされたテンプレートブロックを上書き |

```sh
sdd-forge upgrade
sdd-forge upgrade --force
```

#### translate

`config.json` の `output.languages` で指定された追加出力言語のドキュメントを生成します。デフォルト言語は常に翻訳対象から除外されます。

| オプション | 説明 |
|---|---|
| `--lang <code>` | ターゲット言語コード（例: `en`、`ja`） |
| `--force` | 翻訳済みファイルが既に存在する場合でも再生成 |
| `--dry-run` | 書き込みを行わずに生成対象ファイルをプレビュー |

```sh
sdd-forge translate
sdd-forge translate --lang en
sdd-forge translate --lang en --force
sdd-forge translate --dry-run
```

#### setup

プロジェクトを登録して `.sdd-forge/config.json` を作成するインタラクティブなコマンド。このコマンドはプロジェクトコンテキストの解決をスキップし、通常はプロジェクトごとに一度だけ実行されます。

```sh
sdd-forge setup
```

#### default

`.sdd-forge/projects.json` のデフォルトプロジェクトを設定します。指定されたプロジェクトは、`--project` が指定されていない場合に自動的に使用されます。

```sh
sdd-forge default myproject
```

#### spec

`specs/NNN-<title>/spec.md` に新しい SDD spec ファイルを作成し、オプションで feature ブランチを作成します。`--no-branch` が指定された場合（または git worktree 内で実行している場合）、ブランチは作成されません。

| オプション | 説明 |
|---|---|
| `--title <name>` | 人間が読める spec のタイトル（必須） |
| `--no-branch` | ブランチ作成をスキップ |

```sh
sdd-forge spec --title "CSV エクスポートを追加"
sdd-forge spec --title "ページネーションのバグを修正" --no-branch
```

#### gate

実装前（pre）または実装後（post）の仕様書の完全性を検証するための構造化されたゲートチェックを spec ファイルに対して実行します。

| オプション | 説明 |
|---|---|
| `--spec <path>` | 対象の `spec.md` へのパス（必須） |
| `--phase <pre\|post>` | チェックフェーズ: `pre`（デフォルト）は実装前、`post` は実装後 |

```sh
sdd-forge gate --spec specs/005-csv-export/spec.md
sdd-forge gate --spec specs/005-csv-export/spec.md --phase post
```

#### flow

自由形式の機能要求に応じて、spec 作成・ゲートチェック・スキャフォールディングを含む SDD ワークフロー全体を自動実行します。フルのインタラクティブフローをツールに委譲したい場合に使用します。

| オプション | 説明 |
|---|---|
| `--request <text>` | 機能や修正の自然言語による説明（必須） |

```sh
sdd-forge flow --request "API にユーザーレベルのレート制限を追加する"
```

#### presets

`src/presets/` 配下で検出されたすべての利用可能なプリセットを、そのタイプ・アーキテクチャ層・サポートされるスキャンカテゴリとともに一覧表示します。

```sh
sdd-forge presets
```

#### help

利用可能なすべてのサブコマンドとその説明のサマリーを表示します。

```sh
sdd-forge help
sdd-forge --help
sdd-forge -h
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text: Describe exit code definitions (0=success, 1=general error, etc.) and the rules for stdout/stderr usage in a table format. Include the note that gate and review PASS/FAIL results are written to stdout.}} -->

| 終了コード | 意味 |
|---|---|
| `0` | コマンドが正常に完了した |
| `1` | 一般的なエラー（無効な引数、設定の欠落、ファイル I/O の失敗など） |
| `1` | `gate` チェックが FAIL を返した |
| `1` | `review` チェックが FAIL を返した |

**stdout と stderr の使い分け:**

| ストリーム | 内容 |
|---|---|
| `stdout` | コマンドの主要な出力: 生成されたテキスト、PASS/FAIL の判定結果、ファイルパス、サマリー |
| `stderr` | 進捗インジケーター、警告、デバッグメッセージ、非致命的な通知 |

`gate` と `review` コマンドは PASS/FAIL の結果行を stdout に書き込むため、CI パイプラインやシェルスクリプトでの出力キャプチャに適しています。診断の詳細（どのチェックが失敗したか、その理由など）も、最終判定行の直前に stdout に書き込まれます。

ディスク上のファイルを変更するすべてのコマンドは、完了時に影響を受けたファイルパスを stdout に出力し、後続のツールがどのファイルが変更されたかを検出できるようにします。
<!-- {{/text}} -->
