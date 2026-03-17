# 02. CLI コマンドリファレンス

## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。コマンド総数・サブコマンド体系を踏まえること。}} -->

sdd-forge は 3 層ディスパッチ構造（トップレベル → 名前空間ディスパッチャー → コマンド実装）を持つ CLI ツールで、docs（11 サブコマンド + build パイプライン）、spec（3 サブコマンド）、flow（6 サブコマンド）の名前空間と 4 つの独立コマンドを合わせ、計 25 以上のコマンドを提供します。すべてのコマンドは `sdd-forge <名前空間> <サブコマンド>` の形式で呼び出し、`--help` オプションで個別のヘルプを表示できます。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text[mode=deep]: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。ソースコードのコマンド定義・ルーティングから網羅的に抽出すること。}} -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `sdd-forge help` | 全コマンドの一覧をセクション別に表示します | — |
| `sdd-forge setup` | インタラクティブセットアップウィザードで `.sdd-forge/config.json` を生成します | `--name`, `--type`, `--purpose`, `--tone`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | テンプレート由来ファイル（スキル、AGENTS.md）を最新バージョンに更新します | `--dry-run` |
| `sdd-forge presets list` | プリセット継承ツリーをツリー形式で表示します | — |
| `sdd-forge docs build` | scan → enrich → init → data → text → readme → agents → translate のフルパイプラインを実行します | `--force`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | ソースコードをスキャンして `analysis.json` を生成します | `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | AI で `analysis.json` の各エントリーに summary/detail/chapter/role を付与します | `--dry-run`, `--stdout` |
| `sdd-forge docs init` | テンプレート継承チェーンを解決・マージし、docs/ に章ファイルを初期化します | `--type`, `--force`, `--dry-run` |
| `sdd-forge docs data` | 章ファイル内の `{{data}}` ディレクティブを解決してデータを埋め込みます | `--dry-run` |
| `sdd-forge docs text` | AI を使って `{{text}}` ディレクティブの本文を生成します | `--dry-run` |
| `sdd-forge docs readme` | docs/ の章ファイルから README.md を自動生成します | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | AI エージェントと review を組み合わせ、docs 改善を反復実行します | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | docs の品質チェック（構造検証・ディレクティブ充足・出力整合性）を実行します | — |
| `sdd-forge docs translate` | デフォルト言語のドキュメントを非デフォルト言語に AI 翻訳します | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | specs/ ディレクトリを走査して `change_log.md` を自動生成します | `--dry-run` |
| `sdd-forge docs agents` | AGENTS.md の `{{data}}` ディレクティブを解決し、PROJECT セクションを AI で精査します | `--dry-run` |
| `sdd-forge spec init` | 連番 feature ブランチと specs ディレクトリを作成し、spec.md テンプレートを配置します | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `sdd-forge spec gate` | spec.md の未解決項目を検出し、ガードレール準拠を AI で検証するゲートチェックを実行します | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | プロジェクトガードレールの初期化（init）または AI 追記（update）を行います | `--force`, `--dry-run`, `--agent` |
| `sdd-forge flow start` | spec init → gate → forge の SDD フローを順次実行します | `--request`, `--title`, `--spec`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | フロー進捗の表示・ステップ更新・要件管理・アーカイブを行います | `--step`, `--status`, `--summary`, `--req`, `--request`, `--note`, `--check`, `--archive`, `--dry-run` |
| `sdd-forge flow resume` | compaction 復元用のコンテキストサマリーを生成して stdout に出力します | — |
| `sdd-forge flow review` | AI による draft → final の 2 フェーズでコード品質レビューを実施します | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow merge` | flow.json に基づいて feature ブランチを base ブランチに squash マージします | `--dry-run` |
| `sdd-forge flow cleanup` | flow.json に基づいてブランチ・worktree を削除します | `--dry-run` |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: 全コマンドに共通するグローバルオプションを表形式で記述してください。ソースコードの引数パース処理から抽出すること。}} -->

以下のオプションはトップレベルルーター（`sdd-forge.js`）および各コマンドの `parseArgs()` で共通的に処理されます。

| オプション | 説明 |
|---|---|
| `-h`, `--help` | コマンドのヘルプメッセージを表示して終了します。すべてのコマンド・サブコマンドで利用可能です。 |
| `-v`, `--version`, `-V` | sdd-forge のバージョン番号を表示して終了します。トップレベルでのみ有効です。 |
| `--dry-run` | ファイルへの書き込みを行わず、実行内容を表示のみします。大半のコマンドでサポートされています。 |

`parseArgs()` ユーティリティ（`src/lib/cli.js`）はフラグ（`--flag`）とオプション（`--key value`）を汎用的にパースし、`--help` / `-h` の検出を自動で行います。各コマンドは固有のフラグ・オプションを `flags` / `options` 配列で宣言し、`defaults` で初期値を定義します。
<!-- {{/text}} -->

### 各コマンドの詳細

<!-- {{text[mode=deep]: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとに #### サブセクションを立てること。ソースコードの引数定義・ヘルプメッセージから情報を抽出すること。}} -->

#### sdd-forge help

全コマンドを Project / Docs / Spec / Flow / Info の 5 セクションに分類して一覧表示します。i18n 対応で、`config.json` の `lang` 設定に応じた言語でコマンド説明を出力します。

```
sdd-forge help
```

#### sdd-forge setup

インタラクティブウィザードでプロジェクトを登録し、`.sdd-forge/config.json` を生成します。対話モードでは操作言語・プロジェクト名・ソースパス・アーキテクチャタイプ・フレームワーク・ドキュメント目的・トーン・エージェントを順に質問します。全オプションを指定すると非対話モードで動作します。

```
sdd-forge setup
sdd-forge setup --name myapp --type webapp/laravel --purpose developer --tone polite
```

| オプション | 説明 |
|---|---|
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースコードのパス |
| `--work-root <path>` | 作業ディレクトリのパス（省略時はソースパスと同一） |
| `--type <type>` | アーキテクチャタイプ（例: `webapp/cakephp2`, `cli/node-cli`） |
| `--purpose <purpose>` | ドキュメント目的（`developer-guide`, `user-guide`, `api-reference`） |
| `--tone <tone>` | 文体（`polite`, `formal`, `casual`） |
| `--agent <agent>` | エージェント名（`claude`, `codex`） |
| `--lang <lang>` | 操作言語コード |
| `--dry-run` | 実際のファイル生成をスキップ |

セットアップ時に `.sdd-forge/`, `docs/`, `specs/` ディレクトリの作成、`.gitignore` の更新、AGENTS.md テンプレートの生成、CLAUDE.md の作成、スキルテンプレートの配置を行います。

#### sdd-forge upgrade

テンプレート由来のファイルを現在インストール済みバージョンに合わせて更新します。スキルファイルの差分を検出して更新し、`config.json` の推奨設定（`systemPromptFlag` 等）をヒントとして表示します。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 変更内容を表示するのみで実際の書き込みを行わない |

#### sdd-forge presets list

プリセットの継承ツリーをツリー形式で表示します。各ノードに label, axis, lang, aliases, scan 設定キー、テンプレートディレクトリの有無を表示します。

```
sdd-forge presets list
```

#### sdd-forge docs build

scan → enrich → init → data → text → readme → agents → translate の全パイプラインを順次実行します。プログレスバーで進捗を表示し、エージェント未設定時は enrich と text をスキップします。多言語設定時は translate モード（翻訳コマンド実行）または generate モード（言語ごとに init→data→text→readme を再実行）を自動判定します。モノレポ検出時は docs 生成をスキップします。

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

| オプション | 説明 |
|---|---|
| `--force` | 既存の章ファイルを上書き |
| `--verbose` | 詳細ログを表示 |
| `--dry-run` | ファイル書き込みをスキップ |

#### sdd-forge docs scan

DataSource ベースのスキャンパイプラインを実行し、`analysis.json` を生成します。include/exclude glob パターンでファイルを収集し、各 DataSource の `match()` で振り分けて `scan()` を実行します。差分スキャン機能により、ハッシュが変わっていないファイルはスキップし、既存の enrichment フィールドを保持します。

```
sdd-forge docs scan
sdd-forge docs scan --stdout
```

| オプション | 説明 |
|---|---|
| `--stdout` | 結果を標準出力に出力（ファイル書き込みなし） |
| `--dry-run` | `analysis.json` への書き込みをスキップ |

#### sdd-forge docs enrich

AI を使って `analysis.json` の各エントリーに summary, detail, chapter, role のメタデータを付与します。合計行数ベース（デフォルト 3000 行）またはアイテム数ベース（デフォルト 20 件）でバッチ分割し、バッチ完了ごとに `analysis.json` を保存するレジューム対応設計です。

```
sdd-forge docs enrich
sdd-forge docs enrich --dry-run --stdout
```

| オプション | 説明 |
|---|---|
| `--dry-run` | `analysis.json` への書き込みをスキップ |
| `--stdout` | 結果を標準出力に出力 |

#### sdd-forge docs init

プリセットのテンプレート継承チェーンをボトムアップ方式で解決・マージし、docs/ に章ファイルを初期化します。`config.chapters` が定義されている場合はその順序に従い、未定義時は AI エージェントが `analysis.json` の要約をもとに章の取捨選択を行います。

```
sdd-forge docs init
sdd-forge docs init --type cli/node-cli --force
```

| オプション | 説明 |
|---|---|
| `--type <type>` | プリセットタイプを明示指定 |
| `--force` | 既存ファイルを上書き |
| `--dry-run` | ファイル書き込みをスキップ |

#### sdd-forge docs data

章ファイル内の `{{data}}` ディレクティブを DataSource リゾルバで解決し、マークダウンテーブルやリストを埋め込みます。

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイル書き込みをスキップ |

#### sdd-forge docs text

AI エージェントを使って章ファイル内の `{{text}}` ディレクティブの本文を生成します。`documentStyle` 設定に基づくシステムプロンプトを構築し、`analysis.json` の enriched データをコンテキストとして渡します。

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイル書き込みをスキップ |

#### sdd-forge docs readme

docs/ の章ファイルと README.md テンプレートから README.md を自動生成します。テンプレートのボトムアップ解決、`{{data}}` ディレクティブの解決、`{{text}}` ディレクティブの AI 処理を行います。既存 README.md との差分チェックで変更がなければスキップします。

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

| オプション | 説明 |
|---|---|
| `--lang <lang>` | 出力言語を指定 |
| `--output <path>` | 出力先パスを指定 |
| `--dry-run` | ファイル書き込みをスキップ |

#### sdd-forge docs forge

AI エージェントと review コマンドを組み合わせ、review が通るまで最大 `maxRuns` 回ドキュメント改善を反復実行します。local（エージェントなし）、assist（エージェント失敗時にローカルフォールバック）、agent（エージェント必須）の 3 つの実行モードをサポートします。

```
sdd-forge docs forge --prompt "Fix overview section" --mode agent
sdd-forge docs forge --spec specs/001-feature/spec.md --max-runs 5
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善指示のプロンプト |
| `--prompt-file <path>` | プロンプトをファイルから読み込み |
| `--spec <path>` | spec.md のパス |
| `--max-runs <n>` | 最大反復回数（デフォルト: 3） |
| `--review-cmd <cmd>` | review コマンド（デフォルト: `sdd-forge docs review`） |
| `--mode <mode>` | 実行モード（`local`, `assist`, `agent`） |
| `--verbose` | 詳細ログを表示 |
| `--dry-run` | ファイル書き込みをスキップ |

#### sdd-forge docs review

docs の品質チェックを実行します。章ファイルの最小行数（15 行）、H1 見出しの存在、未充填の `{{text}}` / `{{data}}` ディレクティブ、出力整合性（露出ディレクティブ、HTML コメント開閉不一致、残存ブロックディレクティブ）、`analysis.json` の存在、README.md の存在を検証します。多言語モードでは非デフォルト言語ディレクトリも検証対象になります。

```
sdd-forge docs review
sdd-forge docs review docs/
```

#### sdd-forge docs translate

デフォルト言語のドキュメントを非デフォルト言語に AI 翻訳します。ソースファイルとターゲットファイルの mtime を比較し、変更があるファイルのみを翻訳する差分翻訳方式です。`documentStyle.tone` に応じた文体指示（です/ます体、である体、口語体）を AI に渡します。

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| オプション | 説明 |
|---|---|
| `--lang <lang>` | 対象言語を絞り込み |
| `--force` | 全ファイルを再翻訳 |
| `--dry-run` | ファイル書き込みをスキップ |

#### sdd-forge docs changelog

specs/ ディレクトリを走査して `change_log.md` を自動生成します。spec.md からタイトル・作成日・ステータス・ブランチ・Input 行を抽出し、シリーズごとの最新 spec インデックスと全 spec 一覧の 2 つのテーブルを生成します。既存ファイルの MANUAL ブロックは保持されます。

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイル書き込みをスキップし stdout に出力 |

#### sdd-forge docs agents

AGENTS.md 内の `{{data: agents.sdd}}` / `{{data: agents.project}}` ディレクティブを解決し、PROJECT セクションを AI で精査・追記します。生成済み docs と README.md を AI のコンテキストとして渡します。

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイル書き込みをスキップし stdout に出力 |

#### sdd-forge spec init

連番 feature ブランチと `specs/NNN-<slug>/` ディレクトリを作成し、spec.md / qa.md テンプレートを配置します。3 つの動作モード（デフォルト: git checkout -b、`--worktree`: git worktree add、`--no-branch`: ブランチ作成なし）をサポートします。

```
sdd-forge spec init --title "contact-form"
sdd-forge spec init --title "login-feature" --base development --worktree
```

| オプション | 説明 |
|---|---|
| `--title <title>` | spec のタイトル（必須） |
| `--base <branch>` | ベースブランチ（デフォルト: 現在のブランチ） |
| `--no-branch` | ブランチ作成をスキップ |
| `--worktree` | git worktree で隔離されたワークツリーを作成 |
| `--allow-dirty` | ワークツリーが dirty でも続行 |
| `--dry-run` | 実際のファイル・ブランチ作成をスキップ |

#### sdd-forge spec gate

spec.md の未解決項目を検出し、実装開始前のゲートチェックを実行します。未解決トークン（TBD, TODO, FIXME）、未チェックタスク、必須セクションの欠落、ユーザー承認チェックボックスの未チェックを検出します。ガードレールが存在する場合は AI でコンプライアンスチェックも実行します。

```
sdd-forge spec gate --spec specs/001-feature/spec.md
sdd-forge spec gate --spec specs/001-feature/spec.md --phase post
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | spec.md のパス（必須） |
| `--phase <phase>` | チェックフェーズ（`pre`: 実装前、`post`: 実装後） |
| `--skip-guardrail` | ガードレール AI コンプライアンスチェックをスキップ |

`--phase pre` では Status / Acceptance Criteria / User Scenarios セクションの未チェック項目がスキップされます。

#### sdd-forge spec guardrail

プロジェクトガードレール（不変の設計原則）を管理します。`init` サブコマンドでプリセット階層からテンプレートを生成し、`update` サブコマンドで AI が `analysis.json` に基づいて追加記事を提案します。

```
sdd-forge spec guardrail init
sdd-forge spec guardrail init --force
sdd-forge spec guardrail update --agent claude
```

| サブコマンド | 説明 |
|---|---|
| `init` | テンプレートからガードレールを生成（`--force` で上書き、`--dry-run` で stdout 出力） |
| `update` | AI でプロジェクト固有の記事を追記（`--agent`, `--dry-run`） |

#### sdd-forge flow start

spec init → gate → forge の SDD フロー全体を自動実行します。`--request` で要求を指定し、spec 生成・ゲートチェック・forge 実行を順次行います。ゲート失敗時は終了コード 2 で停止し、ユーザー承認が必要な場合はその旨を表示します。

```
sdd-forge flow start --request "add login feature"
sdd-forge flow start --request "fix bug" --forge-mode agent --max-runs 5
```

| オプション | 説明 |
|---|---|
| `--request <text>` | 要求テキスト（必須） |
| `--title <title>` | spec タイトル（省略時は request から自動生成） |
| `--spec <path>` | 既存 spec.md を使用 |
| `--agent <agent>` | エージェントを指定 |
| `--max-runs <n>` | forge の最大反復回数（デフォルト: 5） |
| `--forge-mode <mode>` | forge の実行モード（`local`, `assist`, `agent`） |
| `--no-branch` | ブランチ作成をスキップ |
| `--worktree` | git worktree を使用 |
| `--dry-run` | 実際の実行をスキップ |

#### sdd-forge flow status

フロー進捗の表示と各種更新操作を行います。オプションなしで現在の状態（spec パス、ブランチ名、ステップ進捗、要件進捗）を装飾付きで表示します。

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --summary '["Implement API", "Add tests"]'
sdd-forge flow status --req 0 --status done
sdd-forge flow status --check impl
sdd-forge flow status --archive
```

| オプション | 説明 |
|---|---|
| `--step <id> --status <val>` | ステップの状態を更新 |
| `--summary '<JSON>'` | 要件リストを一括設定（JSON 文字列配列） |
| `--req <index> --status <val>` | 個別要件の状態を更新 |
| `--request <text>` | リクエストテキストを設定 |
| `--note <text>` | メモを追加 |
| `--check <phase>` | 前提条件チェック（例: `impl`） |
| `--archive` | flow.json を spec ディレクトリにコピーして削除 |
| `--dry-run` | `--check` と併用時に終了コード 0 を強制 |

#### sdd-forge flow resume

compaction 復元用のコンテキストサマリーを生成して stdout に出力します。flow.json と spec.md を読み込み、Request, Current Progress, Spec Summary, Requirements, Notes, Next Action の各セクションを構造化して出力します。

```
sdd-forge flow resume
```

#### sdd-forge flow review

AI エージェントによる draft（提案生成）→ final（検証）の 2 フェーズでコード品質レビューを実施します。draft フェーズでは重複コード除去・命名改善・デッドコード削除等の提案を生成し、final フェーズで保守的な検証を行います。結果は review.md に書き出されます。

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 提案を表示するが適用しない |
| `--skip-confirm` | 初期確認プロンプトをスキップ |

#### sdd-forge flow merge

flow.json の状態に基づいて feature ブランチを base ブランチに squash マージします。spec-only モード（featureBranch === baseBranch）の場合はスキップ、worktree モードでは `git -C mainRepoPath` で実行、branch モードでは checkout → merge → commit を実行します。

```
sdd-forge flow merge
sdd-forge flow merge --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 実行されるコマンドを表示するのみ |

#### sdd-forge flow cleanup

flow.json の状態に基づいてブランチ・worktree を削除します。spec-only モードではスキップ、worktree モードでは `git worktree remove` + `git branch -D` を実行、branch モードでは `git branch -D` のみを実行します。

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 実行されるコマンドを表示するのみ |
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: 終了コードの定義と stdout/stderr の使い分けルールを表形式で記述してください。ソースコードの process.exit() 呼び出しや出力パターンから抽出すること。}} -->

#### 終了コード

| 終了コード | 意味 | 発生するコマンド |
|---|---|---|
| `0` | 正常終了 | 全コマンド |
| `1` | 一般エラー（設定不正、ファイル不在、引数不正、レビュー失敗等） | 全コマンド |
| `2` | ゲートチェック失敗（spec の未解決項目あり） | `flow start`（gate 失敗時） |

#### stdout / stderr の使い分け

| 出力先 | 内容 |
|---|---|
| **stdout** | コマンドの主要出力（生成されたドキュメント、ステータス表示、`--dry-run` 時のプレビュー、`--stdout` 指定時の `analysis.json`、ヘルプメッセージ） |
| **stderr** | 進捗ログ（`[scan]`, `[enrich]` 等のプレフィックス付きメッセージ）、警告（`WARN:` プレフィックス）、エラーメッセージ（`ERROR:` プレフィックス）、ヘルプメッセージ（サブコマンドなしの場合） |

`--verbose` オプションを指定した場合、エージェントの stdout/stderr がそのまま stderr に転送されます。`--dry-run` を指定すると、実際のファイル書き込みや git 操作は行わず、実行内容のプレビューを stdout に出力します。各ディスパッチャー（`docs.js`, `spec.js`, `flow.js`）はサブコマンドなしで呼び出された場合、利用可能なコマンド一覧を stderr に出力して終了コード 1 で終了します。
<!-- {{/text}} -->
