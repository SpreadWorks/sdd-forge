# 02. CLI コマンドリファレンス

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。 -->

`sdd-forge <サブコマンド>` 形式で呼び出す 16 のコマンドを網羅したリファレンスです。全コマンドに共通するグローバルオプション（`--project`・`--help`・`--version`）を持ち、内部的には `docs.js` / `spec.js` / `flow.js` の 3 つのディスパッチャーにルーティングされます。

## 内容

### コマンド一覧

<!-- @text: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。 -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `help` | コマンド一覧を表示する | なし |
| `setup` | プロジェクトを登録し設定ファイルを生成する | `--name` `--path` `--type` `--purpose` `--dry-run` |
| `default` | デフォルトプロジェクトを切り替える | `--name` |
| `build` | ドキュメント生成パイプラインを一括実行する（scan → init → data → text → readme） | なし |
| `scan` | ソースコードを解析し `analysis.json` / `summary.json` を生成する | `--stdout` `--dry-run` |
| `init` | テンプレートから `docs/` 配下の章ファイルを初期化する | `--type` `--force` |
| `data` | `@data` ディレクティブを解析データで解決する | `--dry-run` `--stdout` |
| `text` | `@text` ディレクティブを AI エージェントで解決する | `--agent` `--id` `--dry-run` `--per-directive` |
| `readme` | `docs/` の内容をもとに `README.md` を自動生成する | なし |
| `forge` | プロンプトをもとに `docs/` を反復的に改善する | `--prompt` `--spec` `--max-runs` `--mode` `--dry-run` |
| `review` | `docs/` 配下の章ファイルの構造を検証する | なし |
| `changelog` | `specs/` の spec をもとに `change_log.md` を生成する | なし |
| `agents` | `AGENTS.md` の PROJECT セクションを更新する | `--sdd` `--project` `--dry-run` |
| `spec` | feature ブランチを作成し `spec.md` / `qa.md` を初期化する | `--title` `--base` `--no-branch` `--worktree` |
| `gate` | `spec.md` の未解決項目を検出する | `--spec` |
| `flow` | spec 作成 → gate → forge を自動実行する | `--request` `--spec` `--agent` `--forge-mode` |

### グローバルオプション

<!-- @text: 全コマンドに共通するグローバルオプションを表形式で記述してください。 -->

| オプション | 説明 |
|---|---|
| `--project <name>` | 操作対象プロジェクトを名前で指定します。複数プロジェクトを登録している場合に使用します。省略時はデフォルトプロジェクトが使用されます。 |
| `-h`, `--help` | ヘルプを表示して終了します。サブコマンドなしで `sdd-forge` を実行した場合も同じ動作をします。 |
| `-v`, `-V`, `--version` | インストールされている sdd-forge のバージョンを表示して終了します。 |

### 各コマンドの詳細

<!-- @text: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。 -->

各コマンドの使用方法・オプション・実行例を以下のサブセクションに示します。`--dry-run` オプションが利用できるコマンドでは、ファイルへの書き込みを行わず実行内容を事前確認できます。

#### setup

プロジェクトを sdd-forge に登録し、`.sdd-forge/config.json` を生成します。オプションをすべて指定した場合は非対話モードで実行されます。セットアップ完了後、AGENTS.md の生成・CLAUDE.md シンボリックリンクの作成・スキルファイルのデプロイを自動で行います。

| オプション | 説明 |
|---|---|
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースコードのパス（省略時: カレントディレクトリ） |
| `--work-root <path>` | 出力ディレクトリのパス |
| `--type <type>` | プロジェクト種別: `webapp` / `webapp/cakephp2` / `cli` / `library` |
| `--purpose <purpose>` | ドキュメント目的: `developer-guide` / `user-guide` / `api-reference` |
| `--tone <tone>` | 文体: `polite` / `formal` / `casual` |
| `--agent <agent>` | デフォルトエージェント: `claude` / `codex` |
| `--lang <lang>` | 出力言語（カンマ区切り例: `ja,en`） |
| `--ui-lang <lang>` | UI言語: `en` / `ja` |
| `--set-default` | セットアップするプロジェクトをデフォルトに設定 |
| `--no-default` | デフォルトプロジェクトとして設定しない |
| `--dry-run` | ファイルを書き込まずに実行内容を表示 |

```bash
# 対話式セットアップ
sdd-forge setup

# 非対話式セットアップ
sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2 \
  --purpose developer-guide --tone polite --agent claude --lang ja
```

#### build

`scan → init → data → text → readme` のパイプラインを一括実行してドキュメントを生成します。初回セットアップ後または定期的なドキュメント更新に使用します。

```bash
sdd-forge build
```

#### scan

ソースコードを解析し、`.sdd-forge/output/analysis.json` と `.sdd-forge/output/summary.json` を生成します。preset に応じたカテゴリ（controllers・models・shells・routes など）を自動スキャンします。

| オプション | 説明 |
|---|---|
| `--stdout` | 結果をファイルに書き込まず stdout に出力 |
| `--dry-run` | `--stdout` と同等 |

```bash
sdd-forge scan
sdd-forge scan --stdout
```

#### init

テンプレートチェーンをもとに `docs/` 配下の章ファイル（`NN_name.md`）を初期化します。既存ファイルは `MANUAL` ブロックを保持して上書きされます。

| オプション | 説明 |
|---|---|
| `--type <type>` | プロジェクト種別を明示指定 |
| `--force` | 既存ファイルを強制上書き |

```bash
sdd-forge init
sdd-forge init --type webapp/cakephp2
```

#### data

`docs/` 内の `<!-- @data: ... -->` ディレクティブを `analysis.json` の解析データで解決します。

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイルを書き込まず変換結果のみ表示 |
| `--stdout` | 処理結果を stdout に出力 |

```bash
sdd-forge data
sdd-forge data --dry-run
```

#### text

`docs/` 内の `<!-- @text: ... -->` ディレクティブを AI エージェントで解決し、説明文を挿入します。デフォルトはファイル単位のバッチモードで実行されます。

| オプション | 説明 |
|---|---|
| `--agent <name>` | 使用するエージェント: `claude` / `codex`（必須） |
| `--id <id>` | 指定 ID の @text ディレクティブのみ処理（per-directive モード強制） |
| `--dry-run` | 変換内容を表示するだけでファイルを書き込まない |
| `--per-directive` | 1ディレクティブ=1呼び出しの旧モード |
| `--timeout <ms>` | エージェントタイムアウト（デフォルト: 180000） |

```bash
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
sdd-forge text --agent claude --id intro
```

#### forge

プロンプトを起点に `docs/` を反復的に改善します。`@data` および `@text` の解決を行い、`review` が PASS するまで最大 `--max-runs` 回繰り返します。

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善指示のプロンプト（必須） |
| `--prompt-file <path>` | プロンプトをファイルから読み込む |
| `--spec <path>` | 参照する spec.md のパス |
| `--max-runs <n>` | 最大反復回数（デフォルト: 3） |
| `--mode <mode>` | 実行モード: `local` / `assist` / `agent`（デフォルト: `local`） |
| `--agent <name>` | 使用するエージェント |
| `--dry-run` | ファイル書き込み・review・エージェント呼び出しをスキップ |
| `-v`, `--verbose` | エージェント実行ログを逐次表示 |
| `--auto-update-context` | review 成功後に context.json を確認なしで自動更新 |

```bash
sdd-forge forge --prompt "コントローラー一覧を追記してください"
sdd-forge forge --prompt "機能追加に対応" --spec specs/003-new-feature/spec.md --mode agent
```

#### review

`docs/` 配下の章ファイル（`NN_*.md`）の基本構造を検証します。各ファイルの行数・見出し構造などを確認し、問題があれば詳細を出力して終了コード 1 で終了します。

```bash
sdd-forge review
```

#### changelog

`specs/` ディレクトリ配下の spec ファイルをもとに `change_log.md` を生成します。

```bash
sdd-forge changelog
```

#### agents

`AGENTS.md` の `<!-- PROJECT:START/END -->` セクションを `analysis.json` の情報をもとに更新します。

| オプション | 説明 |
|---|---|
| `--sdd` | SDD セクションのみ更新 |
| `--project` | PROJECT セクションのみ更新 |
| `--dry-run` | ファイルを書き込まず変換結果を表示 |

```bash
sdd-forge agents
sdd-forge agents --project --dry-run
```

#### readme

`docs/` の内容をもとに `README.md` を自動生成します。

```bash
sdd-forge readme
```

#### spec

feature ブランチを作成し、`specs/NNN-<name>/spec.md` と `qa.md` を初期化します。連番はリポジトリ内の既存ブランチおよび specs ディレクトリから自動採番されます。

| オプション | 説明 |
|---|---|
| `--title <name>` | spec 名（必須）。連番スラグとしてブランチ名に使われます |
| `--base <branch>` | ブランチ作成元（省略時: 現在のブランチ） |
| `--no-branch` | ブランチを作成せず spec ファイルのみ作成 |
| `--worktree <path>` | git worktree を作成して spec を配置 |
| `--allow-dirty` | ワークツリーが dirty でも続行 |
| `--dry-run` | 変更せず実行予定の内容を表示 |

```bash
sdd-forge spec --title "user-auth"
sdd-forge spec --title "user-auth" --no-branch
sdd-forge spec --title "user-auth" --worktree ../worktrees/user-auth
```

#### gate

`spec.md` の未解決項目を検出します。未チェックタスク・TBD/TODO などのトークン・必須セクションの欠如・ユーザー承認の未設定を検出し、問題があれば終了コード 1 で終了します。

| オプション | 説明 |
|---|---|
| `--spec <path>` | チェック対象の spec.md パス（必須） |

```bash
sdd-forge gate --spec specs/003-user-auth/spec.md
```

#### flow

spec 作成 → gate → forge をシーケンシャルに自動実行します。gate が FAIL した場合は終了コード 2 で停止し、未解決事項を出力します。

| オプション | 説明 |
|---|---|
| `--request <text>` | 実装要求（必須） |
| `--title <text>` | spec 用タイトル（省略時は request の先頭を使用） |
| `--spec <path>` | 既存の spec.md を再利用 |
| `--agent <name>` | 使用するエージェント |
| `--max-runs <n>` | forge の反復回数 |
| `--forge-mode <m>` | forge モード: `local` / `assist` / `agent`（デフォルト: `local`） |
| `--no-branch` | ブランチを作成せず spec のみ作成 |
| `--worktree <path>` | git worktree を作成して spec を配置 |
| `--dry-run` | 全サブコマンドを dry-run モードで実行 |

```bash
sdd-forge flow --request "ユーザー認証機能を追加する"
sdd-forge flow --request "バグ修正" --spec specs/004-fix/spec.md --forge-mode agent
```

### 終了コードと出力

<!-- @text: 終了コードの定義（0=成功 等）と、stdout/stderr の使い分けルールを表形式で記述してください。 -->

**終了コード**

| 終了コード | 説明 | 該当コマンド |
|---|---|---|
| `0` | 正常終了 | 全コマンド |
| `1` | 検証エラー・不明なオプション・プロジェクト解決失敗などの異常終了 | 全コマンド（`review`・`gate` での検証 FAIL を含む） |
| `2` | `flow` コマンドで `gate` が FAIL し処理を中断した場合 | `flow` |

**stdout / stderr の使い分け**

| 出力先 | 内容 |
|---|---|
| stdout | 正常な処理結果・`--stdout` / `--dry-run` モードでの変換結果・バージョン文字列・ヘルプテキスト |
| stderr | エラーメッセージ・警告・不明なコマンドの通知 |
