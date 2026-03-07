# 02. CLI コマンドリファレンス

## 説明

<!-- {{text: Write a 1–2 sentence overview of this chapter. Cover the total number of commands, whether global options exist, and the subcommand structure.}} -->

本章では、`sdd-forge` CLI が提供する全16のサブコマンドを、ドキュメント生成コマンド・SDD ワークフローコマンド・ユーティリティコマンドに分類して解説します。`--project` や `--help` などの少数のグローバルオプションはほとんどのコマンドで共通して使用でき、各サブコマンドはそれぞれ固有のフラグを持ちます。

## 目次

### コマンド一覧

<!-- {{text: List all commands in a table format. Include the command name, description, and primary options.}} -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `build` | ドキュメント生成パイプラインを一括実行（scan → init → data → text → readme） | — |
| `scan` | ソースコードを解析し `analysis.json` を出力 | — |
| `init` | プリセットテンプレートから `docs/` を初期化 | — |
| `data` | 抽出した解析データで `{{data}}` ディレクティブを解決 | — |
| `text` | AI エージェントを使用して `{{text}}` ディレクティブを解決 | `--agent <name>` |
| `readme` | docs から `README.md` を自動生成 | — |
| `forge` | AI を使って docs を反復改善 | `--prompt "<内容>"`, `--spec <path>` |
| `review` | 生成された docs の品質チェックを実行 | — |
| `changelog` | `specs/` から `change_log.md` を生成 | — |
| `agents` | `AGENTS.md` / `CLAUDE.md` を更新 | `--sdd`, `--project`, `--dry-run` |
| `spec` | 新しい spec を初期化（feature ブランチ + `spec.md`） | `--title "<名前>"` |
| `gate` | spec のゲートチェックを実行 | `--spec <path>`, `--phase pre\|post` |
| `flow` | SDD ワークフローを自動実行 | `--request "<要求>"` |
| `setup` | プロジェクトを登録し `.sdd-forge/config.json` を生成 | — |
| `presets` | 利用可能なプロジェクトタイプのプリセット一覧を表示 | — |
| `help` | コマンド一覧を表示 | — |

### グローバルオプション

<!-- {{text: List the global options common to all commands in a table format.}} -->

| オプション | エイリアス | 説明 |
|---|---|---|
| `--project <name>` | — | 登録済みプロジェクトを名前で指定（`.sdd-forge/projects.json` から読み込み） |
| `--help` | `-h` | コマンドのヘルプテキストを表示 |
| `--version` | `-v`, `-V` | インストール済みの `sdd-forge` バージョンを表示して終了 |

> `setup`、`default`、`help`、`presets` はプロジェクトコンテキスト解決をスキップするため、`--project` は不要です。

### コマンド詳細

<!-- {{text: Describe the usage, options, and examples for each command in detail. Create a subsection for each command.}} -->

#### `build`

`scan` → `init` → `data` → `text` → `readme` というドキュメント生成パイプライン全体を1ステップで実行します。全ドキュメントをゼロから再生成する場合や、大きなソースコード変更の後に使用します。

```bash
sdd-forge build
```

#### `scan`

登録済みプロジェクトのソースコードを解析し、結果を `.sdd-forge/output/analysis.json`（および軽量版の `.sdd-forge/output/summary.json`）に書き出します。スキャンの動作は `config.json` の `type` フィールドと、対応するプリセットの `scan` 設定によって決まります。

```bash
sdd-forge scan
```

#### `init`

設定済みのプロジェクトタイプに対応するプリセットテンプレートをコピーして `docs/` ディレクトリを初期化します。既存ファイルは明示的に指定しない限り上書きされません。

```bash
sdd-forge init
```

#### `data`

`docs/` 内のファイルに含まれるすべての `{{data: ...}}` ディレクティブを、`analysis.json` から抽出した構造化データで解決します。このステップでは AI エージェントは呼び出されません。

```bash
sdd-forge data
```

#### `text`

`docs/` 内のファイルに含まれるすべての `{{text: ...}}` ディレクティブを、設定済みの AI エージェントを使って説明テキストに置換します。エージェントは `config.json` で指定するか、`--agent` で上書きできます。

```bash
sdd-forge text --agent claude
```

| オプション | 説明 |
|---|---|
| `--agent <name>` | `config.json` で定義された AI エージェントを上書き |

#### `readme`

`docs/` の内容をもとに、プロジェクトルートに `README.md` を生成します。出力言語は `config.json` の `output.default` フィールドで決まります。

```bash
sdd-forge readme
```

#### `forge`

指定したプロンプトに基づき、AI エージェントを使って現在の `docs/` の内容を反復的にレビュー・改善します。通常は SDD クローズフローの一環として、実装後に実行します。

```bash
sdd-forge forge --prompt "レポートに CSV エクスポート機能を追加"
sdd-forge forge --prompt "認証ロジックを更新" --spec specs/005-auth/spec.md
```

| オプション | 説明 |
|---|---|
| `--prompt "<テキスト>"` | docs に反映すべき変更内容の要約 **（必須）** |
| `--spec <path>` | 改善対象を特定の spec コンテキストに限定 |

#### `review`

生成された docs の品質と一貫性を、レビューチェックリスト（`.sdd-forge/review-checklist.md` またはバンドルされたデフォルト）に照らして確認します。問題が検出された場合はゼロ以外の終了コードで終了します。修正適用後に再実行してください。

```bash
sdd-forge review
```

#### `changelog`

`specs/` ディレクトリをスキャンし、spec エントリを `docs/change_log.md` にまとめます。

```bash
sdd-forge changelog
```

#### `agents`

`AGENTS.md`（および `CLAUDE.md` シンボリックリンク）を更新します。デフォルトでは `<!-- SDD:START/END -->` テンプレートセクションと `<!-- PROJECT:START/END -->` 生成セクションの両方を更新します。

```bash
sdd-forge agents
sdd-forge agents --sdd          # SDD セクションのみ更新
sdd-forge agents --project      # PROJECT セクションのみ更新
sdd-forge agents --dry-run      # 書き込まずに変更内容をプレビュー
```

| オプション | 説明 |
|---|---|
| `--sdd` | `<!-- SDD:START/END -->` テンプレートブロックのみ更新 |
| `--project` | `<!-- PROJECT:START/END -->` 生成ブロックのみ更新 |
| `--dry-run` | ディスクに書き込まず、結果を stdout に出力 |

#### `spec`

新しい SDD spec を作成します。`specs/NNN-<slug>/spec.md` ファイルを初期化し、（任意で）feature ブランチを作成します。

```bash
sdd-forge spec --title "CSV エクスポートを追加"
```

| オプション | 説明 |
|---|---|
| `--title "<名前>"` | spec の人が読みやすいタイトル **（必須）** |
| `--no-branch` | ブランチ作成をスキップ（worktree 内では自動的に付与） |

#### `gate`

spec ファイルに対してゲートチェックを実行し、実装前（pre）または実装後（post）に必要なフィールドと判断事項がすべて揃っているか確認します。

```bash
sdd-forge gate --spec specs/003-csv-export/spec.md
sdd-forge gate --spec specs/003-csv-export/spec.md --phase post
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | チェック対象の `spec.md` ファイルへのパス **（必須）** |
| `--phase pre\|post` | ゲートフェーズ（デフォルト: `pre`） |

#### `flow`

自然言語の要求から SDD ワークフロー全体を自動実行します。spec 作成 → ゲートチェック → 実装ガイダンス → ドキュメント更新の流れを自動で行います。

```bash
sdd-forge flow --request "メールによるパスワードリセットを追加"
```

| オプション | 説明 |
|---|---|
| `--request "<テキスト>"` | 平易な言葉で書いた機能追加・修正の要求 **（必須）** |

#### `setup`

現在の（または指定した）プロジェクトを `.sdd-forge/projects.json` に登録し、対話形式で初期の `.sdd-forge/config.json` を生成します。

```bash
sdd-forge setup
```

#### `presets`

利用可能なプロジェクトタイプのプリセット（例: `webapp/cakephp2`、`cli/node-cli`）の一覧を、説明とサポートされるスキャンカテゴリとともに表示します。

```bash
sdd-forge presets
```

#### `help`

利用可能なすべてのコマンドと簡単な説明を整形して表示します。

```bash
sdd-forge help
sdd-forge --help
```

### 終了コードと出力

<!-- {{text: Describe exit code definitions (e.g., 0 = success) and the rules for stdout/stderr usage in a table format.}} -->

| 終了コード | 意味 |
|---|---|
| `0` | コマンドが正常に完了 |
| `1` | 一般エラー（無効な引数・設定ファイルの欠如・ファイル I/O の失敗など） |
| `2` | ゲートチェック失敗（`gate` コマンド — spec に未解決事項が検出された） |
| `3` | レビューチェック失敗（`review` コマンド — docs に品質上の問題が検出された） |

**stdout / stderr の規約:**

| ストリーム | 用途 |
|---|---|
| `stdout` | コマンドの主要出力: 生成テキスト・テーブル表示・合否結果・dry-run プレビュー |
| `stderr` | 診断メッセージ・警告・進捗表示・エラー詳細 |

ファイルを書き出すコマンド（`build`、`forge`、`agents` など）は、書き込んだファイルごとに確認メッセージを stdout に出力します。`--dry-run` が使用可能な場合は、書き込まれるはずだった内容が stdout に送られ、ファイルは変更されません。
