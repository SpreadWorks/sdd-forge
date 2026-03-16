# 02. CLI コマンドリファレンス

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。コマンド総数・サブコマンド体系を踏まえること。}} -->

sdd-forge は 3 層ディスパッチ構造（トップレベル → 名前空間ディスパッチャー → サブコマンド実装）を持つ CLI ツールで、`docs`（12 サブコマンド）、`spec`（3 サブコマンド）、`flow`（5 サブコマンド）の名前空間コマンドと、`setup`・`upgrade`・`presets`・`help` の 4 つの独立コマンドを提供します。すべてのコマンドは `sdd-forge <command> [subcommand] [options]` の形式で呼び出します。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text[mode=deep]: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。ソースコードのコマンド定義・ルーティングから網羅的に抽出すること。}} -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `sdd-forge help` | 利用可能な全コマンドを一覧表示する | — |
| `sdd-forge setup` | インタラクティブセットアップウィザードを実行し、`.sdd-forge/config.json` を生成する | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | テンプレート由来ファイル（スキル等）を最新バージョンに更新する | `--dry-run` |
| `sdd-forge presets list` | プリセットの継承ツリーをツリー形式で表示する | — |
| `sdd-forge docs build` | scan→enrich→init→data→text→readme→agents→translate のパイプラインを一括実行する | `--force`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | ソースコードを解析し `analysis.json` を生成する | — |
| `sdd-forge docs enrich` | AI で `analysis.json` の各エントリーに summary/detail/chapter/role を付与する | `--dry-run`, `--stdout` |
| `sdd-forge docs init` | テンプレート継承チェーンをマージして `docs/` に章ファイルを出力する | `--type`, `--force`, `--dry-run` |
| `sdd-forge docs data` | `{{data}}` ディレクティブを解決してテンプレートにデータを挿入する | `--dry-run` |
| `sdd-forge docs text` | `{{text}}` ディレクティブを LLM エージェントで解決し説明文を挿入する | `--dry-run`, `--per-directive` |
| `sdd-forge docs readme` | `docs/` 配下の章ファイルから `README.md` を自動生成する | `--dry-run`, `--output` |
| `sdd-forge docs forge` | AI エージェントで docs を反復改善し、review で品質検証する | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | docs の品質レビューを実行する | — |
| `sdd-forge docs translate` | デフォルト言語のドキュメントを非デフォルト言語に AI 翻訳する | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | `specs/` ディレクトリを走査して `change_log.md` を自動生成する | `--dry-run` |
| `sdd-forge docs agents` | `AGENTS.md` の `{{data}}` ディレクティブを解決し、PROJECT セクションを AI で精査する | `--dry-run` |
| `sdd-forge docs snapshot` | ドキュメントのスナップショットを取得する | — |
| `sdd-forge spec init` | 連番 feature ブランチと `specs/` ディレクトリを作成し、spec.md テンプレートを配置する | `--title`, `--base`, `--dry-run`, `--allow-dirty`, `--no-branch`, `--worktree` |
| `sdd-forge spec gate` | 実装開始前に spec.md の未解決項目を検出し、ガードレール準拠を検証する | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail init` | プリセットからガードレールテンプレートを生成する | `--force`, `--dry-run` |
| `sdd-forge spec guardrail update` | AI で プロジェクト固有のガードレール条項を追加提案する | `--agent`, `--dry-run` |
| `sdd-forge flow start` | SDD フロー（spec init → gate → forge）を自動実行する | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | フロー進捗の表示・ステップ状態の更新を行う | `--step`, `--status`, `--summary`, `--req`, `--check`, `--archive`, `--dry-run` |
| `sdd-forge flow review` | AI による draft → final の 2 フェーズでコード品質レビューを実施する | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow merge` | flow.json に基づいて feature ブランチを base ブランチに squash マージする | `--dry-run` |
| `sdd-forge flow cleanup` | フロー完了後のブランチ・worktree を削除する | `--dry-run` |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: 全コマンドに共通するグローバルオプションを表形式で記述してください。ソースコードの引数パース処理から抽出すること。}} -->

以下のオプションは複数のコマンドで共通して利用できます。各コマンドの `parseArgs()` 呼び出しで定義されています。

| オプション | 説明 |
|---|---|
| `-h`, `--help` | コマンドのヘルプメッセージを表示して終了します。すべてのコマンドで利用可能です。 |
| `-v`, `--version` | sdd-forge のバージョン番号を表示して終了します。トップレベル（`sdd-forge -v`）でのみ利用可能です。 |
| `--dry-run` | ファイルの書き込みや破壊的な操作をスキップし、実行内容のプレビューのみ行います。多くのコマンドで利用可能です。 |

sdd-forge はサブコマンドごとに個別のオプションセットを定義する設計であり、全コマンド横断のグローバルフラグは上記に限られます。`--verbose` や `--force` は対応するコマンドでのみ使用できます。
<!-- {{/text}} -->

### 各コマンドの詳細

<!-- {{text[mode=deep]: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとに #### サブセクションを立てること。ソースコードの引数定義・ヘルプメッセージから情報を抽出すること。}} -->

#### sdd-forge setup

プロジェクト登録と `.sdd-forge/config.json` の生成を行うインタラクティブセットアップウィザードです。必要な値がすべてオプションで指定された場合は非対話モードで実行されます。

```
sdd-forge setup [options]
```

| オプション | 説明 |
|---|---|
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースコードのパス |
| `--work-root <path>` | 出力先パス（省略時はソースパスと同じ） |
| `--type <type>` | プロジェクトタイプ（例: `webapp/cakephp2`, `cli/node-cli`） |
| `--purpose <purpose>` | ドキュメントの用途（`user-guide` または `developer`） |
| `--tone <tone>` | 文体（`polite`, `formal`, `casual`） |
| `--agent <agent>` | AI エージェント名 |
| `--lang <lang>` | 操作言語 |
| `--dry-run` | 設定内容の表示のみ行い、ファイルは書き込まない |

セットアップでは以下のディレクトリ・ファイルが作成されます: `.sdd-forge/`、`docs/`、`specs/`、`AGENTS.md`、`CLAUDE.md`、`.agents/skills/`、`.claude/skills/`。

#### sdd-forge upgrade

インストール済み sdd-forge バージョンのテンプレートに合わせてスキルファイル等を更新します。繰り返し実行しても安全です。

```
sdd-forge upgrade [--dry-run]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 変更内容を表示するだけで実際の更新は行わない |

スキルファイルの差分を検出して上書きし、`config.json` の `systemPromptFlag` 未設定プロバイダーに対して設定提案を表示します。

#### sdd-forge presets list

プリセットの継承ツリーを表示します。`base/` をルートとし、アーキテクチャ層・リーフ層の階層をツリー形式で出力します。

```
sdd-forge presets list
```

各ノードには label、aliases、scan キーが表示されます。

#### sdd-forge docs build

ドキュメント生成パイプラインを一括実行します。実行順序: `scan → enrich → init → data → text → readme → agents`。多言語設定がある場合は `translate` ステップも追加されます。

```
sdd-forge docs build [options]
```

| オプション | 説明 |
|---|---|
| `--force` | 既存ファイルを強制的に上書きする（init ステップに影響） |
| `--verbose` | 詳細ログを表示する |
| `--dry-run` | ファイルの書き込みをスキップする |

エージェントが未設定の場合、`enrich` と `text` ステップはスキップされます。多言語出力では `translate` モードと `generate` モードで処理が分岐します。

#### sdd-forge docs enrich

AI を使って `analysis.json` の各エントリーに `summary`、`detail`、`chapter`、`role` メタデータを付与します。

```
sdd-forge docs enrich [options]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 結果を表示するだけでファイルには書き込まない |
| `--stdout` | 結果を標準出力に出力する |

エントリーは合計行数ベース（デフォルト 3000 行）またはアイテム数ベース（デフォルト 20 件）でバッチ分割されます。レジューム対応で、既に `summary` を持つエントリーはスキップされます。

#### sdd-forge docs init

プリセットのテンプレート継承チェーン（`base → arch → leaf → projectLocal`）を解決・マージして、`docs/` ディレクトリに章ファイルを出力します。

```
sdd-forge docs init [options]
```

| オプション | 説明 |
|---|---|
| `--type <type>` | プロジェクトタイプ（config.json の設定を上書き） |
| `--force` | 既存ファイルを強制的に上書きする |
| `--dry-run` | ファイルの書き込みをスキップする |

AI エージェントが設定されている場合、プロジェクトの analysis データに基づいて不要な章を自動除外します。`config.chapters` が定義されている場合は AI フィルタリングを無視します。

#### sdd-forge docs text

`{{text}}` ディレクティブを LLM エージェントで解決し、テンプレートファイルに説明文を挿入します。

```
sdd-forge docs text [options]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 結果を表示するだけでファイルには書き込まない |
| `--per-directive` | ディレクティブ単位で個別に LLM を呼び出す（デフォルトはファイル単位バッチ） |

バッチモードでは品質検証として行数縮小チェック（閾値 50%）と filled 率チェックを行い、基準を満たさない場合は元のコンテンツを保持します。

#### sdd-forge docs readme

`docs/` 配下の章ファイルとテンプレートから `README.md` を自動生成します。`{{data}}` ディレクティブの解決、`{{text}}` ディレクティブの AI 処理、多言語対応を含みます。

```
sdd-forge docs readme [options]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 結果を表示するだけでファイルには書き込まない |
| `--output <path>` | 出力先パスを指定する（非デフォルト言語用） |

差分チェックにより変更がない場合は書き込みをスキップします。

#### sdd-forge docs forge

AI エージェントを使って docs を反復的に改善するコマンドです。AI による更新 → review → フィードバック のサイクルを最大 `--max-runs` 回繰り返します。

```
sdd-forge docs forge [options]
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | AI への指示テキスト |
| `--prompt-file <path>` | AI への指示テキストをファイルから読み込む |
| `--spec <path>` | spec ファイルのパスを指定する |
| `--max-runs <n>` | 最大反復回数（デフォルト: 3） |
| `--review-cmd <cmd>` | レビューコマンド（デフォルト: `sdd-forge docs review`） |
| `--mode <mode>` | 動作モード: `local`（決定論的パッチのみ）、`assist`（AI + フォールバック）、`agent`（AI 必須） |
| `--verbose` | 詳細ログを表示する |
| `--dry-run` | ファイルの書き込みをスキップする |

AI が `NEEDS_INPUT` を出力した場合、終了コード 2 で中断します。

#### sdd-forge docs translate

デフォルト言語のドキュメントを非デフォルト言語に AI で翻訳します。ソースとターゲットの mtime を比較し、差分翻訳を行います。

```
sdd-forge docs translate [options]
```

| オプション | 説明 |
|---|---|
| `--lang <lang>` | 対象言語を絞り込む |
| `--force` | 全ファイルを再翻訳する |
| `--dry-run` | 翻訳対象の表示のみ行い、実際の翻訳は行わない |

出力モードが `translate` でない場合やエージェント未設定の場合はスキップされます。

#### sdd-forge docs changelog

`specs/` ディレクトリを走査し、spec.md ファイルからメタ情報を抽出して `change_log.md` を自動生成します。

```
sdd-forge docs changelog [--dry-run] [output-file]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 結果を stdout に出力し、ファイルへの書き込みをスキップする |
| `[output-file]` | 出力先ファイルパス（デフォルト: `docs/change_log.md`） |

出力にはシリーズごとの最新 spec インデックスと全 spec の一覧テーブルが含まれます。既存ファイルの `AUTO-GEN:START/END` ブロック内のみ上書きされます。

#### sdd-forge docs agents

`AGENTS.md` 内の `{{data: agents.sdd}}` / `{{data: agents.project}}` ディレクティブを解決し、PROJECT セクションを AI で精査・更新します。

```
sdd-forge docs agents [--dry-run]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 結果を stdout に出力し、ファイルへの書き込みをスキップする |

生成済み docs と `package.json` の scripts を AI のコンテキストとして渡し、PROJECT セクションの内容を精査します。

#### sdd-forge spec init

連番 feature ブランチと `specs/` ディレクトリを作成し、`spec.md` / `qa.md` テンプレートを配置します。

```
sdd-forge spec init [options]
```

| オプション | 説明 |
|---|---|
| `--title <title>` | spec のタイトル（必須） |
| `--base <branch>` | ベースブランチ（デフォルト: 現在のブランチ） |
| `--dry-run` | 実行内容の表示のみ |
| `--allow-dirty` | ワークツリーが dirty でも実行を許可する |
| `--no-branch` | ブランチ作成なしで spec ファイルのみ作成する |
| `--worktree` | `git worktree add` で隔離されたワークツリーを作成する |

3 つの動作モードがあります: デフォルト（`git checkout -b`）、`--worktree`（隔離ワークツリー）、`--no-branch`（spec ファイルのみ）。

#### sdd-forge spec gate

実装開始前に spec.md の未解決項目を検出し、ガードレール準拠を AI で検証するゲートチェックを実行します。

```
sdd-forge spec gate [options]
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | spec ファイルのパス（必須） |
| `--phase <pre\|post>` | チェックフェーズ（デフォルト: `pre`）。`pre` では Status/Acceptance Criteria セクションの未チェック項目をスキップする |
| `--skip-guardrail` | ガードレール AI コンプライアンスチェックをスキップする |

検出対象: 未解決トークン（TBD, TODO, FIXME, NEEDS CLARIFICATION）、未チェックタスク、必須セクションの欠落、ユーザー承認チェックボックスの未チェック。

#### sdd-forge spec guardrail

プロジェクトのガードレール（不変原則）を管理します。`init` と `update` の 2 つのサブコマンドがあります。

```
sdd-forge spec guardrail init [--force] [--dry-run]
sdd-forge spec guardrail update [--agent <name>] [--dry-run]
```

| サブコマンド | 説明 |
|---|---|
| `init` | プリセットの階層（base → arch → leaf）からガードレールテンプレートを読み込み `.sdd-forge/guardrail.md` に生成する |
| `update` | AI エージェントに既存 guardrail と analysis.json を渡し、プロジェクト固有の追加条項を提案させる |

#### sdd-forge flow start

SDD フローを自動実行します。`spec init → gate → forge` の 3 ステップを順次実行し、フロー状態を `flow.json` に保存します。

```
sdd-forge flow start --request "<要望>" [options]
```

| オプション | 説明 |
|---|---|
| `--request <text>` | 実装要望（必須） |
| `--title <title>` | spec タイトル（省略時は request から自動生成） |
| `--spec <path>` | 既存の spec ファイルを指定する（省略時は自動生成） |
| `--agent <name>` | AI エージェント名 |
| `--max-runs <n>` | forge の最大反復回数（デフォルト: 5） |
| `--forge-mode <mode>` | forge の動作モード: `local`, `assist`, `agent`（デフォルト: `local`） |
| `--no-branch` | ブランチ作成をスキップする |
| `--worktree` | git worktree を使用する |
| `--dry-run` | 実行内容の表示のみ |

gate チェックに失敗した場合は終了コード 2 で中断し、未解決項目を表示します。

#### sdd-forge flow status

フロー進捗の表示・更新を行います。引数なしで実行するとステップ状態・要件一覧を表示します。

```
sdd-forge flow status [options]
```

| オプション | 説明 |
|---|---|
| `--step <id> --status <val>` | 特定ステップのステータスを更新する |
| `--summary '<JSON array>'` | 要件リストを JSON 配列文字列で設定する |
| `--req <index> --status <val>` | 特定要件のステータスを更新する |
| `--check <phase>` | フェーズの前提条件を確認する（例: `--check impl`） |
| `--archive` | `flow.json` を spec ディレクトリにコピーして元ファイルを削除する |
| `--dry-run` | `--check` と組み合わせて常に exit 0 にする |

#### sdd-forge flow review

AI エージェントによる 2 フェーズ（draft → final）のコード品質レビューを実施します。

```
sdd-forge flow review [options]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 提案の表示のみ行い、適用はしない |
| `--skip-confirm` | 初期確認プロンプトをスキップする |

draft フェーズで改善提案を生成し、final フェーズで別の AI エージェントが提案を検証します。各提案に APPROVED/REJECTED の判定が付与され、`review.md` に出力されます。

#### sdd-forge flow merge

`flow.json` の状態に基づいて feature ブランチを base ブランチに squash マージします。

```
sdd-forge flow merge [--dry-run]
```

3 つのモードを自動判定します: spec-only（`featureBranch === baseBranch` ならスキップ）、worktree（`git -C mainRepoPath merge --squash`）、branch（`git checkout` → `merge --squash`）。

#### sdd-forge flow cleanup

フロー完了後のブランチ・worktree を削除します。

```
sdd-forge flow cleanup [--dry-run]
```

`flow.json` の状態から 3 つのモードを自動判定します: spec-only（スキップ）、worktree（`git worktree remove` + `git branch -D`）、branch（`git branch -D` のみ）。
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: 終了コードの定義と stdout/stderr の使い分けルールを表形式で記述してください。ソースコードの process.exit() 呼び出しや出力パターンから抽出すること。}} -->

#### 終了コード

| 終了コード | 意味 | 発生元 |
|---|---|---|
| `0` | 正常終了 | すべてのコマンド |
| `1` | 一般エラー（不明なサブコマンド、設定不備、必須引数の欠落、ファイル未検出、サブコマンド未指定） | `sdd-forge.js`、`docs.js`、`spec.js`、`flow.js`、各コマンド実装 |
| `2` | ゲートチェック失敗または `NEEDS_INPUT` 検出による中断 | `flow start`（gate 失敗時）、`forge`（NEEDS_INPUT 検出時） |

#### stdout / stderr の使い分け

| 出力先 | 用途 | 例 |
|---|---|---|
| stdout | コマンドの主要な出力結果。パイプラインやリダイレクトで利用される正規の出力 | `--dry-run` 時のファイル内容プレビュー、`changelog` の生成結果、`status` の表示、`spec init` の作成報告 |
| stderr | 進捗表示、警告メッセージ、エラーメッセージ、ヘルプ表示（サブコマンド未指定時） | `[build] ERROR:` メッセージ、`[enrich] WARN:` メッセージ、`[text] WARN:` メッセージ、ディスパッチャーの使用方法表示 |

`createLogger()` によるロガー出力は `console.log`（stdout）を使用します。`build` パイプラインの `progress` オブジェクトは進捗バーとステップログを表示します。エラー発生時は `progress.done()` で進捗バーを終了してからエラーメッセージを stderr に出力し `process.exit(1)` で終了します。
<!-- {{/text}} -->
