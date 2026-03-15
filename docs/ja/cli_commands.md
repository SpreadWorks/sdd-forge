# 02. CLI コマンドリファレンス

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。コマンド総数・サブコマンド体系を踏まえること。}} -->

sdd-forge は 20 以上のサブコマンドを提供する CLI ツールで、3 層ディスパッチ構造（`sdd-forge` → 名前空間ディスパッチャー → 個別コマンド）でルーティングされます。コマンドは Docs・Spec・Flow の 3 名前空間と、setup・upgrade・presets・help の独立コマンドに分類されます。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text[mode=deep]: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。ソースコードのコマンド定義・ルーティングから網羅的に抽出すること。}} -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `sdd-forge help` | 利用可能な全コマンドを表示する | — |
| `sdd-forge setup` | 対話型セットアップウィザードで `.sdd-forge/config.json` を生成する | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | テンプレート由来ファイル（スキル等）を最新版に更新する | `--dry-run` |
| `sdd-forge presets list` | プリセット継承ツリーを表示する | — |
| `sdd-forge docs build` | scan→enrich→init→data→text→readme→agents→translate の全パイプラインを実行する | `--force`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | ソースコードを静的解析して `analysis.json` を生成する | `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | AI で `analysis.json` の各エントリーに summary/detail/chapter/role を付与する | `--stdout`, `--dry-run` |
| `sdd-forge docs init` | プリセットテンプレートから章ファイルを `docs/` に配置する | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `sdd-forge docs data` | `{{data}}` ディレクティブを解決してマークダウンテーブル等を挿入する | `--docs-dir`, `--stdout`, `--dry-run` |
| `sdd-forge docs text` | AI で `{{text}}` ディレクティブ内の本文を生成する | `--timeout`, `--id`, `--lang`, `--docs-dir`, `--per-directive`, `--dry-run` |
| `sdd-forge docs readme` | `docs/` の章ファイルから `README.md` を自動生成する | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | AI と review を反復実行して docs を改善する | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | 生成済み docs の品質レビューを実行する | — |
| `sdd-forge docs translate` | デフォルト言語の docs を非デフォルト言語に AI 翻訳する | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | 変更履歴を生成する | `--dry-run` |
| `sdd-forge docs agents` | `AGENTS.md` の `{{data}}` ディレクティブを解決し AI で精査・更新する | `--dry-run` |
| `sdd-forge docs snapshot` | docs 出力のスナップショットを保存・比較する | サブコマンド: `save`, `check`, `update` |
| `sdd-forge spec init` | 連番 feature ブランチと spec.md テンプレートを作成する | `--title`, `--base`, `--allow-dirty`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge spec gate` | spec.md の未解決項目を検出しガードレール準拠を検証する | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | ガードレール（不変原則）の初期化・更新を行う | サブコマンド: `init`, `update`。`--force`, `--agent`, `--dry-run` |
| `sdd-forge flow start` | SDD フロー（spec init → gate → forge）を自動実行する | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | フロー進捗の表示・更新・アーカイブを行う | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `sdd-forge flow review` | 実装完了後のコード品質レビューを実行する（draft → final → apply） | `--dry-run`, `--skip-confirm` |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: 全コマンドに共通するグローバルオプションを表形式で記述してください。ソースコードの引数パース処理から抽出すること。}} -->

`parseArgs` ユーティリティ（`src/lib/cli.js`）が全コマンドで共通して処理するオプションは以下のとおりです。

| オプション | 説明 |
|---|---|
| `-h`, `--help` | コマンドのヘルプを表示して終了します。`parseArgs` が `help: true` を自動設定します。 |
| `-v`, `--version`, `-V` | sdd-forge のバージョン番号を表示して終了します（トップレベルのみ）。 |
| `--dry-run` | 多くのコマンドで共通して使用でき、ファイルの書き込みを行わず結果をプレビューします。 |

`--dry-run` はほぼ全てのコマンドでサポートされていますが、`parseArgs` の `flags` 配列に個別登録する形式のため、厳密にはコマンドごとに定義されています。`--help` のみがパーサーレベルで暗黙的に処理される真のグローバルオプションです。
<!-- {{/text}} -->

### 各コマンドの詳細

<!-- {{text[mode=deep]: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとに #### サブセクションを立てること。ソースコードの引数定義・ヘルプメッセージから情報を抽出すること。}} -->

#### `sdd-forge help`

利用可能な全コマンドを Project / Docs / Spec / Flow / Info のセクション別に表示します。ANSI エスケープによるボールド・dim 装飾付きで出力されます。

```
sdd-forge help
sdd-forge --help
```

#### `sdd-forge setup`

対話型ウィザードで `.sdd-forge/config.json` を生成し、プロジェクトディレクトリ構造（`.sdd-forge/output/`, `docs/`, `specs/`）を作成します。AGENTS.md テンプレートの配置、CLAUDE.md の作成、スキルファイルのコピーも行います。

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2 --agent claude
```

| オプション | 説明 |
|---|---|
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースディレクトリのパス |
| `--work-root <path>` | 作業ルートディレクトリ（省略時は `--path` と同じ） |
| `--type <type>` | アーキテクチャタイプ（例: `webapp/cakephp2`, `cli/node-cli`） |
| `--purpose <purpose>` | ドキュメントの目的 |
| `--tone <tone>` | 文体スタイル（`polite`, `formal`, `casual`） |
| `--agent <agent>` | デフォルトエージェント（`claude`, `codex`） |
| `--lang <lang>` | 操作言語 |
| `--dry-run` | ファイル書き込みを行わずプレビューする |

全ての必須オプションを指定すると非対話モードで動作します。

#### `sdd-forge upgrade`

インストール済み sdd-forge バージョンのテンプレートに合わせて `.agents/skills/` のスキルファイルを更新します。`.claude/skills/` へのシンボリックリンクも再作成します。config.json の設定ヒント（`systemPromptFlag` の未設定など）も表示します。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 更新内容をプレビューする |

#### `sdd-forge presets list`

プリセットの継承ツリーを `base/ → arch → leaf` の階層でコンソールに表示します。各ノードの label・aliases・scan キー、テンプレートディレクトリの有無が確認できます。

```
sdd-forge presets list
```

#### `sdd-forge docs build`

scan → enrich → init → data → text → readme → agents → translate の全パイプラインを順次実行します。プログレスバーで進捗を表示し、`defaultAgent` 未設定時は enrich と text をスキップします。多言語設定時は translate または generate モードで非デフォルト言語の docs を生成します。

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

| オプション | 説明 |
|---|---|
| `--force` | テンプレートの上書きを強制する |
| `--verbose` | 詳細ログを出力する |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs scan`

ソースコードを静的解析して `.sdd-forge/output/analysis.json` を生成します。

```
sdd-forge docs scan
sdd-forge docs scan --stdout
```

| オプション | 説明 |
|---|---|
| `--stdout` | 結果を標準出力に出力する |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs enrich`

AI を使って `analysis.json` の各エントリーに `summary`・`detail`・`chapter`・`role` メタデータを付与します。合計行数ベース（デフォルト 3000 行）またはアイテム数ベース（デフォルト 20 件）でバッチ分割し、各バッチ完了後に中間保存するレジューム機能を備えます。

```
sdd-forge docs enrich
sdd-forge docs enrich --dry-run
```

| オプション | 説明 |
|---|---|
| `--stdout` | 結果を標準出力に出力する |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs init`

プリセットテンプレートから章ファイル（`.md`）を `docs/` ディレクトリに配置します。テンプレート継承（base → arch → leaf）とプロジェクトローカルテンプレート（`.sdd-forge/templates/`）をサポートします。

```
sdd-forge docs init
sdd-forge docs init --type cli/node-cli --force
```

| オプション | 説明 |
|---|---|
| `--type <type>` | アーキテクチャタイプを明示指定する |
| `--lang <lang>` | 出力言語を指定する |
| `--docs-dir <path>` | docs ディレクトリのパスを指定する |
| `--force` | 既存ファイルを上書きする |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs data`

章ファイル内の `{{data}}` ディレクティブを解決し、DataSource から生成したマークダウンテーブル等を挿入します。

```
sdd-forge docs data
sdd-forge docs data --docs-dir docs/ja
```

| オプション | 説明 |
|---|---|
| `--docs-dir <path>` | 対象の docs ディレクトリを指定する |
| `--stdout` | 結果を標準出力に出力する |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs text`

AI を使って章ファイル内の `{{text}}` ディレクティブの本文を生成します。バッチモード（ファイル単位）とディレクティブ単位モードを選択できます。

```
sdd-forge docs text
sdd-forge docs text --per-directive --id cli_commands
```

| オプション | 説明 |
|---|---|
| `--timeout <ms>` | AI 呼び出しのタイムアウト（ミリ秒） |
| `--id <chapter>` | 特定の章のみ処理する |
| `--lang <lang>` | 出力言語を指定する |
| `--docs-dir <path>` | 対象の docs ディレクトリを指定する |
| `--per-directive` | ディレクティブ単位で AI を呼び出す |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs readme`

`docs/` 配下の章ファイルからプリセットテンプレートを使って `README.md` を自動生成します。テンプレート継承・`{{data}}`/`{{text}}` ディレクティブ解決・多言語対応を行います。

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

| オプション | 説明 |
|---|---|
| `--lang <lang>` | 出力言語を指定する |
| `--output <path>` | 出力先パスを指定する |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs forge`

AI エージェントと review コマンドを反復実行して docs の品質を改善します。local（ローカル AI）・assist（補助モード）・agent（フルエージェント）の 3 モードで動作します。

```
sdd-forge docs forge --prompt "APIセクションを充実させる"
sdd-forge docs forge --spec specs/001-feature/spec.md --mode agent --max-runs 5
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善指示のプロンプトテキスト |
| `--prompt-file <path>` | プロンプトをファイルから読み込む |
| `--spec <path>` | spec ファイルのパス（対象ファイル推定に使用） |
| `--max-runs <n>` | 最大反復回数（デフォルト: 3） |
| `--review-cmd <cmd>` | レビュー実行コマンド（デフォルト: `sdd-forge docs review`） |
| `--mode <mode>` | 動作モード（`local`, `assist`, `agent`） |
| `--verbose` | 詳細ログを出力する |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs review`

生成済み docs の品質レビューを実行します。

```
sdd-forge docs review
```

#### `sdd-forge docs translate`

デフォルト言語の docs を非デフォルト言語に AI 翻訳します。mtime 比較による差分翻訳をサポートし、`mapWithConcurrency` で並列処理を行います。

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| オプション | 説明 |
|---|---|
| `--lang <lang>` | 特定の言語のみ翻訳対象にする |
| `--force` | mtime に関係なく全ファイルを再翻訳する |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs changelog`

変更履歴を生成します。

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs agents`

`AGENTS.md` 内の `{{data: agents.sdd}}` / `{{data: agents.project}}` ディレクティブを解決し、PROJECT セクションを AI で精査・更新します。

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge docs snapshot`

docs 出力のスナップショットを保存・比較・更新します。

```
sdd-forge docs snapshot save
sdd-forge docs snapshot check
sdd-forge docs snapshot update
```

| サブコマンド | 説明 |
|---|---|
| `save` | 現在の出力をスナップショットとして保存する |
| `check` | 保存済みスナップショットと比較する |
| `update` | スナップショットを現在の出力で更新する |

#### `sdd-forge spec init`

連番 feature ブランチと `specs/NNN-<slug>/` ディレクトリを作成し、`spec.md` と `qa.md` テンプレートを配置します。ブランチ作成・worktree 作成・spec ファイルのみ作成の 3 モードで動作します。

```
sdd-forge spec init --title "contact-form"
sdd-forge spec init --title "login-feature" --worktree
sdd-forge spec init --title "hotfix" --no-branch
```

| オプション | 説明 |
|---|---|
| `--title <title>` | **必須**。feature のタイトル（ブランチ名・ディレクトリ名に使用） |
| `--base <branch>` | ベースブランチ（省略時は現在のブランチ） |
| `--allow-dirty` | ワークツリーが dirty でも続行する |
| `--no-branch` | ブランチを作成せず spec ファイルのみ作成する |
| `--worktree` | `git worktree add` で隔離されたワークツリーを作成する |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge spec gate`

実装開始前に spec.md の品質をチェックします。未解決トークン（TBD, TODO, FIXME）、未チェックタスク、必須セクションの欠落、ユーザー承認の未チェックを検出します。ガードレール準拠の AI 検証も実行します。

```
sdd-forge spec gate --spec specs/001-feature/spec.md
sdd-forge spec gate --spec specs/001-feature/spec.md --phase post --skip-guardrail
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | **必須**。チェック対象の spec.md パス |
| `--phase <phase>` | チェックフェーズ（`pre`: 実装前、`post`: 実装後。デフォルト: `pre`） |
| `--skip-guardrail` | ガードレール AI 準拠チェックをスキップする |

`--phase pre` では Status・Acceptance Criteria・User Scenarios セクションの未チェック項目をスキップします。

#### `sdd-forge spec guardrail`

プロジェクトのガードレール（不変原則）を管理します。`init` と `update` の 2 つのサブコマンドを持ちます。

```
sdd-forge spec guardrail init
sdd-forge spec guardrail init --force
sdd-forge spec guardrail update --agent claude
```

| サブコマンド | 説明 |
|---|---|
| `init` | プリセット階層からテンプレートをマージして `.sdd-forge/guardrail.md` を作成する |
| `update` | 既存の guardrail.md と analysis.json を AI に渡し、新規記事を提案・追記する |

| オプション | 対象 | 説明 |
|---|---|---|
| `--force` | `init` | 既存ファイルを上書きする |
| `--agent <name>` | `update` | 使用するエージェントを指定する |
| `--dry-run` | 両方 | ファイル書き込みを行わない |

#### `sdd-forge flow start`

SDD フローを自動実行します。内部で `spec init` → `spec gate` → `docs forge` を順次呼び出し、フロー状態を `.sdd-forge/flow.json` に保存します。

```
sdd-forge flow start --request "ログイン機能を追加"
sdd-forge flow start --request "add API endpoint" --forge-mode agent --worktree
```

| オプション | 説明 |
|---|---|
| `--request <text>` | **必須**。機能追加・修正の要求テキスト |
| `--title <title>` | feature タイトル（省略時はリクエストから自動生成） |
| `--spec <path>` | 既存の spec.md を指定する（省略時は `spec init` を実行） |
| `--agent <name>` | 使用するエージェントを指定する |
| `--max-runs <n>` | forge の最大反復回数（デフォルト: 5） |
| `--forge-mode <mode>` | forge の動作モード（`local`, `assist`, `agent`。デフォルト: `local`） |
| `--no-branch` | ブランチ作成をスキップする |
| `--worktree` | git worktree で隔離環境を作成する |
| `--dry-run` | ファイル書き込みを行わない |

#### `sdd-forge flow status`

フローの進捗表示と状態更新を行います。オプションなしで現在のフロー状態（spec パス・ブランチ・ステップ進捗・要件進捗）を表示します。

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --summary '["要件1", "要件2"]'
sdd-forge flow status --req 0 --status done
sdd-forge flow status --archive
```

| オプション | 説明 |
|---|---|
| `--step <id> --status <val>` | ステップのステータスを更新する |
| `--summary '<JSON>'` | 要件リストを JSON 配列で一括設定する |
| `--req <index> --status <val>` | 個別の要件ステータスを更新する |
| `--archive` | `flow.json` を spec ディレクトリにコピーし削除する |

#### `sdd-forge flow review`

実装完了後にコード品質レビューを実行します。draft（AI による提案生成）→ final（妥当性検証）→ apply（承認済み提案の適用）の 3 フェーズで動作します。

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 提案の表示のみ行い適用しない |
| `--skip-confirm` | 初期確認プロンプトをスキップする |
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: 終了コードの定義と stdout/stderr の使い分けルールを表形式で記述してください。ソースコードの process.exit() 呼び出しや出力パターンから抽出すること。}} -->

**終了コード**

| コード | 意味 | 発生条件 |
|---|---|---|
| `0` | 正常終了 | コマンドが成功した場合、ヘルプ表示（明示的なサブコマンド指定時） |
| `1` | エラー | 未知のコマンド、必須引数の不足、バリデーション失敗、未捕捉例外、`snapshot check` の差分検出 |
| `2` | ゲートチェック失敗 | `flow start` 内で `spec gate` が失敗した場合 |

`text` コマンドと `snapshot check` コマンドは、非同期処理の途中でエラーが発生した場合に `process.exitCode = 1` を使用します。これにより残りの処理を完了してから非ゼロで終了します。その他のコマンドは `process.exit(n)` で即座に終了するか、例外を `runIfDirect()` ラッパーが捕捉して終了コード 1 で終了します。

**stdout / stderr の使い分け**

| ストリーム | 用途 |
|---|---|
| stdout（`console.log`） | コマンドの実行結果、ヘルプテキスト、`--stdout` や `--dry-run` 時のデータ出力、ステータス表示 |
| stderr（`console.error`） | エラーメッセージ、ヘルプ表示（サブコマンド未指定時）、警告、AI 処理の進捗ログ |

ディスパッチャー（`docs.js`, `spec.js`, `flow.js`）はサブコマンド未指定時のヘルプを `console.error` で出力し、終了コード 1 で終了します。明示的に `-h` / `--help` が指定された場合は `console.log` で出力し、終了コード 0 で終了します。`flow start` はサブプロセスの出力を `process.stdout.write()` / `process.stderr.write()` でそのままパススルーします。
<!-- {{/text}} -->
