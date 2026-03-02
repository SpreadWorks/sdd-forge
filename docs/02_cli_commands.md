# 02. CLI コマンドリファレンス

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。 -->

`sdd-forge` は 16 個のサブコマンドで構成されており、ドキュメント生成系（`build` / `scan` / `init` / `data` / `text` / `readme` / `forge` / `review` / `changelog` / `agents`）、仕様管理系（`spec` / `gate`）、フロー自動化（`flow`）、およびプロジェクト管理系（`setup` / `default` / `help`）に分類されます。全コマンドに共通するグローバルオプションとして `--project <name>` が用意されており、複数プロジェクトを登録している場合に操作対象を明示的に切り替えることができます。


## 内容

### コマンド一覧

<!-- @text: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。 -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `help` | コマンド一覧を表示する | なし |
| `setup` | プロジェクトをグローバル登録し `.sdd-forge/config.json` を生成する | `--name` `--path` `--type` `--purpose` `--tone` `--agent` |
| `default [<name>]` | デフォルトプロジェクトを確認・変更する | なし |
| `build` | `scan → init → data → text → readme → agents` を一括実行する | `--force` `--agent <name>` |
| `scan` | ソースコードを解析し `analysis.json` を生成する | `--legacy` `--stdout` |
| `init` | テンプレートから `docs/` を初期化する | `--type <type>` `--force` |
| `data` | `@data` ディレクティブを解析データで置換する | `--dry-run` `--stdout` |
| `text` | `@text` ディレクティブを AI エージェントで解決する | `--agent <name>`（必須） `--id <id>` `--dry-run` `--per-directive` |
| `readme` | `docs/` の章ファイルから `README.md` を生成・更新する | `--dry-run` |
| `forge` | プロンプトを起点に `review` が PASS するまで docs を改善する | `--prompt <text>`（必須） `--spec <path>` `--mode <mode>` `--max-runs <n>` |
| `review` | `docs/` の章ファイルの構造・未解決ディレクティブを検証する | `[<docs-dir>]` |
| `changelog` | `specs/` から仕様インデックスを `docs/change_log.md` に出力する | `[<output-file>]` |
| `agents` | `analysis.json` を基に `AGENTS.md` の PROJECT セクションを更新する | `--force` `--template` |
| `spec` | feature ブランチと `specs/NNN-<slug>/spec.md` を作成する | `--title <name>`（必須） `--base <branch>` `--dry-run` |
| `gate` | `spec.md` の未解決事項・必須セクションの有無を検証する | `--spec <path>`（必須） |
| `flow` | `spec → gate → forge` の SDD フローを自動実行する | `--request <text>`（必須） `--spec <path>` `--agent <name>` `--forge-mode <mode>` |


### グローバルオプション

<!-- @text: 全コマンドに共通するグローバルオプションを表形式で記述してください。 -->

`sdd-forge.js` のソースコードから、グローバルオプションは `--project` のみであることが確認できました。以下が生成テキストです。

---

| オプション | 説明 | 対象コマンド |
|---|---|---|
| `--project <name>` | 操作対象のプロジェクトを名前で指定する。省略時は `projects.json` の `default` プロジェクトを使用する。 | `setup`・`default`・`help` 以外の全コマンド |
| `-h`, `--help` | コマンド一覧を表示して終了する。 | 全コマンド（引数なし時も同様） |

`--project` は `.sdd-forge/projects.json` に登録済みのプロジェクト名を指定します。複数のプロジェクトを管理している場合に、デフォルト以外のプロジェクトを一時的に対象にするために使用します。

```bash
# デフォルト以外のプロジェクトを対象に scan を実行
sdd-forge --project myapp scan
```


### 各コマンドの詳細

<!-- @text: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。 -->

以下がソースコードの実装に基づいて生成したマークダウンテキストです。

---

#### `setup` — プロジェクト登録と設定生成

プロジェクトをグローバルに登録し、`.sdd-forge/config.json` を生成します。引数なしで起動すると対話式ウィザードが始まり、UI 言語・ソースパス・出力言語・プロジェクトタイプ・ドキュメントスタイル・AI エージェントを順番に設定します。すべての必須オプションをフラグで指定した場合は非対話モードで動作します。

```
sdd-forge setup [--name <name>] [--path <path>] [--type <type>] [--purpose <purpose>] [--tone <tone>] [--agent <agent>] [--project-context <text>]
```

| オプション | 説明 | 選択肢 |
|---|---|---|
| `--name <name>` | プロジェクト名 | 任意文字列（省略時: カレントディレクトリ名） |
| `--path <path>` | ソースコードのパス | 絶対・相対パス（省略時: カレントディレクトリ） |
| `--type <type>` | プロジェクト種別 | `webapp` / `webapp/cakephp2` / `cli` / `library` |
| `--purpose <purpose>` | ドキュメントの目的 | `developer-guide` / `user-guide` / `api-reference` |
| `--tone <tone>` | 文体 | `polite` / `formal` / `casual` |
| `--agent <agent>` | デフォルト AI エージェント | `claude` / `codex` |
| `--project-context <text>` | プロジェクト概要テキスト | 任意文字列 |

セットアップ完了後は `AGENTS.md` の生成・注入と `CLAUDE.md` シンボリックリンクの作成を対話的に案内します。

```bash
# 対話式
sdd-forge setup

# 非対話式（全必須フラグを指定）
sdd-forge setup --name myapp --path /src/myapp --type webapp/cakephp2 --purpose developer-guide --tone polite
```

#### `default` — デフォルトプロジェクトの変更

引数なしで登録済みプロジェクト一覧を表示します。プロジェクト名を指定するとそのプロジェクトをデフォルトに設定します。

```
sdd-forge default [<name>]
```

```bash
# 一覧表示
sdd-forge default

# デフォルトを変更
sdd-forge default myapp
```

#### `build` — ドキュメント一括生成

`scan → init → data → text → readme → agents` のパイプラインを一括実行します。`defaultAgent` が未設定の場合、`text` ステップはスキップされます。

```
sdd-forge build [--force] [--agent <name>]
```

| オプション | 説明 |
|---|---|
| `--force` | `init` ステップで既存ファイルを上書き |
| `--agent <name>` | `text` ステップで使用する AI エージェントを指定（省略時: `config.json` の `defaultAgent`） |

```bash
sdd-forge build
sdd-forge build --force --agent claude
```

#### `scan` — ソースコード解析

ソースコードを解析し、`.sdd-forge/output/analysis.json` を生成します。プロジェクト種別が `webapp/cakephp2` の場合は CakePHP 固有の追加解析も実行されます。

```
sdd-forge scan [--legacy] [--stdout]
```

| オプション | 説明 |
|---|---|
| `--legacy` | 旧 CakePHP 固有解析器を使用する（後方互換） |
| `--stdout` | ファイル書き込みをせず、JSON を stdout に出力する |

```bash
sdd-forge scan
sdd-forge scan --stdout | jq '.controllers.summary'
```

#### `init` — テンプレートから docs/ を初期化

プロジェクト種別のテンプレート継承チェーンをマージして `docs/` にファイルを出力します。`analysis.json` が存在する場合は不要な章を自動フィルタリングします。`.sdd-forge/custom/` ディレクトリがあれば、ブロック継承によりカスタム上書きが適用されます。

```
sdd-forge init [--type <type>] [--force]
```

| オプション | 説明 |
|---|---|
| `--type <type>` | テンプレート種別を指定（省略時: `config.json` の `type`） |
| `--force` | 既存ファイルを上書きする |

```bash
sdd-forge init
sdd-forge init --force
sdd-forge init --type webapp/cakephp2
```

#### `data` — @data ディレクティブの解決

`docs/` 内の `<!-- @data: category -->` ディレクティブを `analysis.json` のデータで置換します。事前に `sdd-forge scan` を実行しておく必要があります。

```
sdd-forge data [--dry-run] [--stdout]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイル書き込みをせず、変更行数のみ表示する |
| `--stdout` | 各ファイルの変更行数を表示する |

```bash
sdd-forge data
sdd-forge data --dry-run
```

#### `text` — @text ディレクティブの AI 解決

`docs/` 内の `<!-- @text: 指示 -->` ディレクティブを AI エージェントで解決し、ディレクティブ直後に生成テキストを挿入します。デフォルトはファイル単位バッチモード（1 ファイルにつき 1 回の AI 呼び出し）です。

```
sdd-forge text --agent <name> [--id <id>] [--dry-run] [--per-directive] [--timeout <ms>]
```

| オプション | 説明 |
|---|---|
| `--agent <name>` | AI エージェントを指定（必須）: `claude` / `codex` |
| `--id <id>` | 指定 ID の `@text` ディレクティブのみ処理する（`--per-directive` が強制される） |
| `--dry-run` | ファイル書き込みをせず、プロンプト内容のみ表示する |
| `--per-directive` | 1 ディレクティブにつき 1 回の AI 呼び出し（旧モード） |
| `--timeout <ms>` | AI エージェントのタイムアウト（デフォルト: `180000` ms） |

```bash
sdd-forge text --agent claude
sdd-forge text --agent claude --id overview
sdd-forge text --agent claude --dry-run
```

#### `readme` — README.md 自動生成

`docs/` の章ファイルからプロジェクト概要テーブルを生成し `README.md` を更新します。既存 `README.md` の `<!-- MANUAL:START -->` ～ `<!-- MANUAL:END -->` ブロックは保持されます。

```
sdd-forge readme [--dry-run]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイル書き込みをせず、生成内容を stdout に出力する |

```bash
sdd-forge readme
sdd-forge readme --dry-run
```

#### `forge` — docs 反復改善

プロンプトを起点に `review` が PASS するまで docs を改善を繰り返します。`--mode local`（デフォルト）ではローカルの決定的パッチのみ適用します。`--mode assist` / `--mode agent` では AI エージェントと連携して編集します。

```
sdd-forge forge --prompt "<内容>" [--spec <path>] [--max-runs <n>] [--mode <mode>] [--agent <name>] [--verbose]
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--prompt <text>` | 改善の指示テキスト（必須、または `--prompt-file`） | — |
| `--prompt-file <path>` | 指示テキストをファイルから読み込む | — |
| `--spec <path>` | 仕様書 (`spec.md`) のパスを指定する | — |
| `--max-runs <n>` | 最大反復回数 | `5` |
| `--mode <mode>` | 実行モード: `local` / `assist` / `agent` | `local` |
| `--agent <name>` | AI エージェントを指定 | `config.json` の `defaultAgent` |
| `--auto-update-context` | review PASS 後に `context.json` を確認なしで自動更新 | `false` |
| `-v, --verbose` | AI エージェントの実行ログを逐次表示 | `false` |

```bash
sdd-forge forge --prompt "コントローラの説明を充実させる"
sdd-forge forge --prompt "追加機能を反映" --spec specs/001-my-feature/spec.md --mode assist
```

#### `review` — docs 品質チェック

`docs/` 内の章ファイル（`NN_*.md`）の構造を検証します。各ファイルの行数・H1 見出しの存在・未解決の `@text` ディレクティブをチェックします。

```
sdd-forge review [<docs-dir>]
```

引数を指定しない場合は `$SDD_WORK_ROOT/docs` を対象にします。検証結果は `[FAIL]` / `[WARN]` プレフィックスで stdout に出力されます。すべてのチェックを通過した場合は終了コード `0` を返します。

```bash
sdd-forge review
sdd-forge review /path/to/docs
```

#### `changelog` — change_log.md 生成

`specs/` ディレクトリを走査して仕様インデックスを `docs/change_log.md` に出力します。既存ファイルの `<!-- MANUAL:START -->` ～ `<!-- MANUAL:END -->` ブロックは保持されます。

```
sdd-forge changelog [<output-file>]
```

引数を指定しない場合は `$SDD_WORK_ROOT/docs/change_log.md` に出力します。

```bash
sdd-forge changelog
sdd-forge changelog docs/my-changelog.md
```

#### `agents` — AGENTS.md の PROJECT セクション更新

`analysis.json` を基に `AGENTS.md` の `<!-- PROJECT:START -->` ～ `<!-- PROJECT:END -->` セクションを更新します。デフォルトでは AI エージェントによる要約生成を行います。

```
sdd-forge agents [--force] [--template]
```

| オプション | 説明 |
|---|---|
| `--force` | `AGENTS.md` 全体を SDD テンプレート + PROJECT + 空の Guidelines で書き直す |
| `--template` | AI を使わず解析データから自動的に構造化テキストを生成する |

```bash
sdd-forge agents
sdd-forge agents --template
sdd-forge agents --force
```

#### `spec` — spec 初期化

連番の feature ブランチと `specs/NNN-<slug>/spec.md` を作成します。ワークツリーが dirty な状態では `--allow-dirty` を指定しない限り実行できません。

```
sdd-forge spec --title "<機能名>" [--base <branch>] [--dry-run] [--allow-dirty]
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--title <name>` | 機能名（必須）。スラッグ化してブランチ名・ディレクトリ名に使用 | — |
| `--base <branch>` | ブランチ作成元のベースブランチ | `master` |
| `--dry-run` | 変更を行わず、生成されるブランチ名とファイルパスのみ表示 | `false` |
| `--allow-dirty` | ワークツリーが dirty でも続行する | `false` |

```bash
sdd-forge spec --title "user-authentication"
sdd-forge spec --title "contact-form" --dry-run
```

#### `gate` — spec ゲートチェック

`spec.md` に未解決事項がないかチェックします。未チェックのタスク (`- [ ]`)・`TBD` / `TODO` / `FIXME` トークン・必須セクションの欠落・ユーザー承認の未設定を検出します。

```
sdd-forge gate --spec <path>
```

| チェック項目 | 内容 |
|---|---|
| 未チェックタスク | `- [ ]` 行が残っていないか |
| 未解決トークン | `TBD` / `TODO` / `FIXME` / `[NEEDS CLARIFICATION]` |
| 必須セクション | `## Clarifications` / `## Open Questions` / `## User Confirmation` / `## Acceptance Criteria` |
| ユーザー承認 | `- [x] User approved this spec` が設定されているか |

```bash
sdd-forge gate --spec specs/001-user-auth/spec.md
```

PASS の場合は終了コード `0`、FAIL の場合は終了コード `1` で終了します。

#### `flow` — SDD フロー自動実行

`spec 作成 → gate チェック → forge 実行` の SDD フローを自動実行します。gate が FAIL の場合は `NEEDS_INPUT` を出力して終了コード `2` で停止します。

```
sdd-forge flow --request "<要望>" [--title <text>] [--spec <path>] [--agent <name>] [--max-runs <n>] [--forge-mode <mode>]
```

| オプション | 説明 | デフォルト |
|---|---|---|
| `--request <text>` | 実装要求テキスト（必須） | — |
| `--title <text>` | spec 用タイトル（省略時は `--request` の先頭を利用） | — |
| `--spec <path>` | 既存の `spec.md` を使用する場合に指定 | — |
| `--agent <name>` | AI エージェント: `claude` / `codex` | `config.json` の `defaultAgent` |
| `--max-runs <n>` | `forge` の最大反復回数 | `5` |
| `--forge-mode <mode>` | `forge` の実行モード: `local` / `assist` / `agent` | `local` |

```bash
sdd-forge flow --request "ユーザー登録フォームを追加する"
sdd-forge flow --request "ログイン機能を実装" --agent claude --forge-mode assist
```


### 終了コードと出力

<!-- @text: 終了コードの定義（0=成功 等）と、stdout/stderr の使い分けルールを表形式で記述してください。 -->

sdd-forge の終了コードと出力の使い分けルールを以下の表にまとめます。

---

**終了コード**

| コード | 意味 | 主な発生ケース |
|--------|------|----------------|
| `0` | 成功 | コマンドが正常に完了した場合 |
| `1` | エラー | 不明なサブコマンド、必須引数の欠落、ファイル不在、処理失敗など |
| `2` | 入力待ち（gate 未通過） | `flow` 実行時にゲートチェックが失敗し、ユーザーの確認・修正が必要な場合 |

**stdout / stderr の使い分け**

| ストリーム | 用途 | 具体例 |
|------------|------|--------|
| stdout | 機械可読な構造化データ・使用法・最終結果 | `scan` コマンドの JSON 出力、ヘルプ・使用方法テキスト、正常完了メッセージ |
| stderr | 進捗・診断・警告・エラーメッセージ | 処理中のステータス（`[init] done. N files`）、WARNING / ERROR ログ、サブプロセスの診断出力 |

進捗・診断メッセージはすべて stderr に書き込まれるため、stdout をパイプで受け取るスクリプトから分離して扱えます。`scan` コマンドが出力する `analysis.json` は stdout にのみ書き込まれます。
