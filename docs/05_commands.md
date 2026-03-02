# 05. CLI コマンドリファレンス

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。 -->

本章では sdd-forge が提供する全 16 コマンドの使用方法・オプション・終了コードを解説します。コマンドはプロジェクト管理・ドキュメント生成・仕様管理の 3 系統に分類され、全コマンド共通の `--help` オプションおよび `--project` グローバルオプションをサポートしています。

## 内容

### コマンド一覧

<!-- @text: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。 -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `help` | コマンド一覧・使用方法を表示 | なし |
| `setup` | プロジェクト登録と設定ファイル生成 | `--name` `--path` `--type` `--agent` |
| `default` | デフォルトプロジェクトの表示・設定 | `<name>` (引数) |
| `build` | ドキュメント一括生成パイプライン | `--force` `--agent` |
| `scan` | ソースコード解析 → analysis.json 生成 | `--legacy` `--stdout` |
| `init` | テンプレートから docs/ を初期化 | `--type` `--force` |
| `data` | @data ディレクティブを解析データで解決 | `--dry-run` `--stdout` |
| `text` | @text ディレクティブを AI で解決 | `--agent` (必須) `--id` `--dry-run` |
| `readme` | README.md を自動生成 | `--dry-run` |
| `forge` | AI によるドキュメント反復改善 | `--prompt` (必須) `--spec` `--max-runs` |
| `review` | docs/ 構造のバリデーション | `<docs-dir>` (引数) |
| `changelog` | specs/ から change_log.md を生成 | `<output-file>` (引数) |
| `agents` | AGENTS.md の PROJECT セクションを更新 | `--template` `--force` |
| `spec` | 新規 spec を作成しフィーチャーブランチを切る | `--title` (必須) `--base` `--dry-run` |
| `gate` | spec.md の完成度をゲートチェック | `--spec` (必須) |
| `flow` | SDD フローを自動実行 | `--request` (必須) `--spec` `--agent` |

### グローバルオプション

<!-- @text: 全コマンドに共通するグローバルオプションを表形式で記述してください。 -->

| オプション | 説明 | デフォルト |
|---|---|---|
| `--project <name>` | 実行対象のプロジェクトを名前で指定する。未指定の場合はデフォルトプロジェクトを使用する | デフォルトプロジェクト |
| `--help`, `-h` | コマンドごとのヘルプを表示して終了する | — |

### 各コマンドの詳細

<!-- @text: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。 -->

#### help

コマンド一覧と簡単な説明を標準出力へ表示します。

```
sdd-forge help
sdd-forge --help
```

#### setup

対話形式でプロジェクト情報を収集し、`.sdd-forge/config.json` の生成・プロジェクト登録・`AGENTS.md` の作成を行います。オプションを指定した項目は対話をスキップします。

| オプション | 説明 |
|---|---|
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースコードのルートパス |
| `--type <type>` | プロジェクト種別（`webapp` / `webapp/cakephp2` / `cli` / `cli/node-cli` / `library`） |
| `--purpose <purpose>` | ドキュメント目的（`developer-guide` / `user-guide` / `api-reference`） |
| `--tone <tone>` | 文体（`polite` / `formal` / `casual`） |
| `--agent <name>` | デフォルト AI エージェント名 |
| `--project-context <text>` | プロジェクト概要テキスト |

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2
```

#### default

引数なしで呼び出すと登録済みプロジェクトの一覧を表示します。プロジェクト名を指定するとそのプロジェクトをデフォルトに設定します。

```
sdd-forge default
sdd-forge default myapp
```

#### build

`scan → init → data → text → readme → agents` の順でドキュメント生成パイプラインを一括実行します。

| オプション | 説明 |
|---|---|
| `--force` | init フェーズで既存 docs/ ファイルを上書きする |
| `--agent <name>` | text フェーズで使用する AI エージェント |

```
sdd-forge build
sdd-forge build --force --agent claude
```

#### scan

ソースコードを解析して `.sdd-forge/output/analysis.json` を生成します。

| オプション | 説明 |
|---|---|
| `--legacy` | CakePHP 2.x 専用のレガシーアナライザーを使用する |
| `--stdout` | ファイルへの書き込みをせず JSON を標準出力へ出力する |

```
sdd-forge scan
sdd-forge scan --stdout | jq '.controllers'
```

#### init

テンプレートから `docs/` の章ファイルを初期化します。既存ファイルは `--force` を指定しない限り上書きされません。

| オプション | 説明 |
|---|---|
| `--type <type>` | テンプレート種別（未指定時は config.json の値を使用） |
| `--force` | 既存の docs/ ファイルを上書きする |

```
sdd-forge init
sdd-forge init --force
```

#### data

`docs/` 内の `<!-- @data: ... -->` ディレクティブを `analysis.json` の解析データで置換します。

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイルを書き換えずに変更内容を表示する |
| `--stdout` | 置換件数を標準出力へ表示する |

```
sdd-forge data
sdd-forge data --dry-run
```

#### text

`docs/` 内の `<!-- @text: ... -->` ディレクティブを AI エージェントを使って解決します。`--agent` は必須です。

| オプション | 説明 |
|---|---|
| `--agent <name>` | 使用する AI エージェント（`claude` / `codex`）。**必須** |
| `--id <id>` | 指定した ID を持つディレクティブのみ処理する |
| `--dry-run` | ファイルを書き換えず変更内容を表示する |
| `--per-directive` | ファイル単位でなくディレクティブ単位でエージェントを呼び出す（レガシーモード） |
| `--timeout <ms>` | エージェントのタイムアウト（ミリ秒、デフォルト: 180000） |

```
sdd-forge text --agent claude
sdd-forge text --agent claude --id intro --dry-run
```

#### readme

`docs/` の章ファイルを集約して `README.md` を自動生成します。

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイルを書き換えず生成内容を表示する |

```
sdd-forge readme
sdd-forge readme --dry-run
```

#### forge

指定したプロンプトに基づき、AI エージェントが `docs/` を反復的に改善します。`sdd-forge review` が PASS するか `--max-runs` に達するまでループします。

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善指示テキスト。**必須**（`--prompt-file` と排他） |
| `--prompt-file <path>` | プロンプトをファイルから読み込む |
| `--spec <path>` | 参照する spec.md のパス |
| `--max-runs <n>` | 最大反復回数（デフォルト: 5） |
| `--agent <name>` | 使用する AI エージェント |
| `--mode <mode>` | 実行モード（`local` / `assist` / `agent`、デフォルト: `local`） |
| `--auto-update-context` | review PASS 後に context.json を自動更新する |
| `-v`, `--verbose` | エージェントの出力をリアルタイムで表示する |

```
sdd-forge forge --prompt "コントローラー一覧の説明を充実させてください"
sdd-forge forge --prompt "API 仕様を追記" --spec specs/001-api/spec.md --max-runs 3
```

#### review

`docs/` 内の章ファイルに対して構造チェックを実行します。すべてのチェックに合格すると終了コード 0、1 つでも失敗すると終了コード 1 を返します。

チェック内容:
- `NN_*.md` パターンの章ファイルが存在する
- 各ファイルが 15 行以上である
- H1 見出しが存在する
- 未解決の `@text` ディレクティブがない（警告のみ）
- `README.md` が存在する（警告のみ）

```
sdd-forge review
sdd-forge review docs/
```

#### changelog

`specs/` ディレクトリ内の spec.md を走査して `docs/change_log.md` を生成します。既存の `MANUAL` ブロックは保持されます。

```
sdd-forge changelog
sdd-forge changelog docs/history.md
```

#### agents

`AGENTS.md` の `<!-- PROJECT:START -->` ～ `<!-- PROJECT:END -->` セクションを更新します。

| オプション | 説明 |
|---|---|
| `--template` | AI を使わずテンプレートベースで生成する |
| `--force` | `AGENTS.md` 全体（SDD + PROJECT + Guidelines）を再生成する |

```
sdd-forge agents --template
sdd-forge agents --force
```

#### spec

新しい spec ファイルを初期化し、フィーチャーブランチを作成してチェックアウトします。`specs/NNN-<title>/spec.md` と `qa.md` が生成されます。

| オプション | 説明 |
|---|---|
| `--title <name>` | spec のタイトル・識別子。**必須** |
| `--base <branch>` | フィーチャーブランチの分岐元（デフォルト: `master`） |
| `--dry-run` | ファイル・ブランチを作成せずに処理内容を表示する |
| `--allow-dirty` | 未コミットの変更がある状態でも続行する |

```
sdd-forge spec --title "add-search-feature"
sdd-forge spec --title "refactor-auth" --base main
```

#### gate

`spec.md` の完成度をチェックし、未解決の項目があれば内容を列挙して終了コード 1 を返します。実装開始前に必ず実行してください。

| オプション | 説明 |
|---|---|
| `--spec <path>` | チェック対象の spec.md パス。**必須** |

チェック内容:
- `[NEEDS CLARIFICATION]` / `TBD` / `TODO` / `FIXME` などの未解決トークンがない
- すべてのタスク項目が `- [x]` にチェックされている
- 必須セクション（`## Clarifications`・`## Open Questions`・`## User Confirmation`・`## Acceptance Criteria`）が存在する
- `- [x] User approved this spec` が記載されている

```
sdd-forge gate --spec specs/001-add-search/spec.md
```

#### flow

spec 作成からゲートチェック、forge 実行までの SDD フローを自動で実行します。gate が FAIL した場合は終了コード 2 を返し、解決すべき質問を出力します。

| オプション | 説明 |
|---|---|
| `--request <text>` | 実装依頼・要件テキスト。**必須** |
| `--title <text>` | spec のタイトル（省略時は `--request` から自動生成） |
| `--spec <path>` | 既存の spec.md を使用する場合に指定 |
| `--agent <name>` | 使用する AI エージェント |
| `--max-runs <n>` | forge の最大反復回数（デフォルト: 5） |
| `--forge-mode <mode>` | forge の実行モード（`local` / `assist` / `agent`） |

```
sdd-forge flow --request "ユーザー検索機能を追加したい"
sdd-forge flow --request "認証リファクタリング" --spec specs/002-auth/spec.md
```

### 終了コードと出力

<!-- @text: 終了コードの定義（0=成功 等）と、stdout/stderr の使い分けルールを表形式で記述してください。 -->

**終了コード**

| コード | 意味 | 該当コマンド |
|---|---|---|
| 0 | 正常終了 | 全コマンド |
| 1 | エラー終了（引数不正・ファイル未検出・バリデーション失敗など） | 全コマンド |
| 2 | NEEDS_INPUT（ユーザーによる追加入力が必要） | `flow`・`forge` |

**stdout / stderr の使い分け**

| 出力先 | 使用用途 | 例 |
|---|---|---|
| stdout | 機械的に処理可能なデータ・生成物 | `--stdout` オプション時の JSON、`created spec:` メッセージ、`NEEDS_INPUT` ブロック |
| stderr | 進捗ログ・警告・エラーメッセージ | `[scan]`・`[init]`・`[forge]` プレフィックス付きメッセージ、`[WARN]`・`[FAIL]`・`[ERROR]` メッセージ |

進捗ログは各コマンドの識別子をプレフィックスとして `[コマンド名]` 形式で stderr へ出力されます。review や gate のチェック結果（`[FAIL]`・`[PASS]`）も stderr へ出力されるため、スクリプトから終了コードのみを判定することができます。
