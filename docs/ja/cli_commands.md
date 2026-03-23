# CLI コマンドリファレンス

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。コマンド総数・サブコマンド体系を踏まえること。"})}} -->

sdd-forge は 3 階層のディスパッチ構造（`sdd-forge` → 名前空間ディスパッチャ → 個別コマンド）を持ち、`docs`・`spec`・`flow` の 3 名前空間と独立コマンドを合わせて 25 以上のサブコマンドを提供します。各コマンドは `--help` で個別ヘルプを表示でき、`--dry-run` による安全な事前確認にも広く対応しています。

<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text({prompt: "全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。ソースコードのコマンド定義・ルーティングから網羅的に抽出すること。", mode: "deep"})}} -->

| コマンド | 説明 | 主なオプション |
| --- | --- | --- |
| `sdd-forge help` | 利用可能な全コマンドを一覧表示します | — |
| `sdd-forge setup` | インタラクティブセットアップウィザードを実行し、`.sdd-forge/config.json` を生成します | `--name`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | テンプレート由来ファイル（スキル等）を現在のバージョンに合わせて更新します | `--dry-run` |
| `sdd-forge presets list` | プリセット継承ツリーを表示します | — |
| `sdd-forge docs build` | scan → enrich → init → data → text → readme → agents → translate のパイプラインを順次実行します | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | ソースコードを解析し `analysis.json` を生成します | — |
| `sdd-forge docs enrich` | AI で analysis エントリに役割・概要・章分類を付与します | — |
| `sdd-forge docs init` | プリセットテンプレートから `docs/` に章ファイルを生成します | `--type`, `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs data` | `docs/` 内の `{{data}}` ディレクティブを解決・レンダリングします | `--dry-run`, `--stdout`, `--docs-dir` |
| `sdd-forge docs text` | `docs/` 内の `{{text}}` ディレクティブを AI で充填します | `--dry-run` |
| `sdd-forge docs readme` | `docs/` 配下の章ファイルから `README.md` を自動生成します | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | AI によるドキュメント更新 → review → フィードバックの反復ループを実行します | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--dry-run` |
| `sdd-forge docs review` | docs 品質チェック（構造検証、ディレクティブ充填状況、出力整合性）を実行します | — |
| `sdd-forge docs translate` | デフォルト言語のドキュメントを他言語に翻訳します | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | `specs/` を走査して `change_log.md` を生成します | `--dry-run` |
| `sdd-forge docs agents` | `AGENTS.md` を生成・更新します（`{{data}}` 解決 + AI 精査） | `--dry-run` |
| `sdd-forge spec init` | 連番で feature ブランチと `specs/` ディレクトリを作成し、仕様書を初期化します | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge spec gate` | 仕様書の未解決項目を検出し、ガードレール AI コンプライアンスチェックを実行します | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | ガードレール（不変原則）の初期化・表示・AI 更新を行います | サブコマンド: `init`, `show`, `update` |
| `sdd-forge spec lint` | ガードレールの lint パターンを変更ファイルに対して機械的にチェックします | `--base` |
| `sdd-forge flow start` | spec init → gate → forge のパイプラインで SDD フローを自動起動します | `--request`, `--title`, `--worktree`, `--forge-mode`, `--dry-run` |
| `sdd-forge flow status` | フロー進捗の表示・更新を行います | `--step`, `--status`, `--summary`, `--all`, `--list` |
| `sdd-forge flow resume` | コンテキスト圧縮後の復元用サマリーを出力します | — |
| `sdd-forge flow review` | draft → final → apply の 3 フェーズでコード品質レビューを実行します | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow merge` | squash merge または GitHub PR 作成を実行します | `--pr`, `--auto`, `--dry-run` |
| `sdd-forge flow cleanup` | `.active-flow` エントリ削除とブランチ・worktree 削除を実行します | `--dry-run` |

<!-- {{/text}} -->

### グローバルオプション

<!-- {{text({prompt: "全コマンドに共通するグローバルオプションを表形式で記述してください。ソースコードの引数パース処理から抽出すること。", mode: "deep"})}} -->

| オプション | 説明 |
| --- | --- |
| `--help`, `-h` | コマンドのヘルプメッセージを表示して終了します。すべてのコマンド・サブコマンドで利用できます。 |
| `--version`, `-v`, `-V` | パッケージバージョンを表示して終了します（トップレベルの `sdd-forge` コマンドのみ）。 |
| `--dry-run` | 実際のファイル書き込みやコマンド実行を行わず、実行内容を表示します。多くのコマンドでサポートされています。 |

`--dry-run` はほぼすべてのコマンドで共通して利用可能ですが、`parseArgs()` による引数パースは各コマンドが個別に定義しているため、厳密にはコマンドごとにサポート状況が異なります。上記以外のオプションは各コマンド固有です。

<!-- {{/text}} -->

### 各コマンドの詳細

<!-- {{text({prompt: "各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとに #### サブセクションを立てること。ソースコードの引数定義・ヘルプメッセージから情報を抽出すること。", mode: "deep"})}} -->

#### sdd-forge setup

プロジェクトの初期セットアップを行います。対話式ウィザードまたは全オプション指定による非対話式実行が可能です。

```
sdd-forge setup [--name <名前>] [--type <プリセット>] [--lang <言語>] [--agent <エージェント>] [--dry-run]
```

| オプション | 説明 |
| --- | --- |
| `--name <名前>` | プロジェクト名 |
| `--path <パス>` | ソースコードのルートパス |
| `--work-root <パス>` | 作業ルートパス（省略時は `--path` と同じ） |
| `--type <プリセット>` | プリセットタイプ（例: `node-cli`, `cakephp2`） |
| `--purpose <目的>` | ドキュメントの目的（`user-guide` / `developer`） |
| `--tone <トーン>` | 文体（`polite` / `formal` / `casual`） |
| `--agent <エージェント>` | デフォルトエージェント名 |
| `--lang <言語>` | インターフェース言語（`ja` / `en` 等） |
| `--dry-run` | 設定内容を表示するのみで書き込まない |

セットアップでは `.sdd-forge/`・`docs/`・`specs/` ディレクトリの作成、`config.json` の生成、`.gitignore` の更新、スキルのデプロイ、`AGENTS.md` / `CLAUDE.md` の初期化が実行されます。

#### sdd-forge upgrade

```
sdd-forge upgrade [--dry-run]
```

現在インストールされている sdd-forge バージョンのテンプレートに合わせて、スキルファイル等を更新します。`config.json` には変更を加えません。

#### sdd-forge presets list

```
sdd-forge presets list
```

プリセットの継承ツリーをツリー形式で表示します。各ノードにはラベル、エイリアス、scan キー、テンプレートディレクトリの有無が表示されます。

#### sdd-forge docs build

```
sdd-forge docs build [--force] [--regenerate] [--verbose] [--dry-run]
```

| オプション | 説明 |
| --- | --- |
| `--force` | 既存ファイルを上書きして再生成します |
| `--regenerate` | init をスキップし、既存の章ファイルを前提として text 以降を再実行します |
| `--verbose` | 詳細な進捗ログを表示します |
| `--dry-run` | 実際のファイル書き込みを行いません |

エージェント設定がない場合、enrich と text ステップはスキップされ警告が表示されます。多言語設定時は translate またはパイプライン再実行で非デフォルト言語のドキュメントも生成されます。

#### sdd-forge docs init

```
sdd-forge docs init [--type <プリセット>] [--lang <言語>] [--force] [--dry-run] [--docs-dir <パス>]
```

| オプション | 説明 |
| --- | --- |
| `--type <プリセット>` | 使用するプリセットタイプ |
| `--lang <言語>` | 出力言語 |
| `--force` | 既存ファイルとの衝突時に上書きします |
| `--dry-run` | 書き込みを行いません |

プリセットの継承チェーンからテンプレートを解決し、AI による章の取捨選択を行った上で `docs/` に章ファイルを出力します。`config.chapters` が定義されている場合は AI フィルタリングをスキップします。

#### sdd-forge docs data

```
sdd-forge docs data [--dry-run] [--stdout] [--docs-dir <パス>]
```

`analysis.json` を読み込み、`docs/` 内の `{{data}}` ディレクティブをプリセットチェーンの DataSource メソッドで解決してレンダリングします。`{{text}}` ディレクティブはスキップされます。

#### sdd-forge docs readme

```
sdd-forge docs readme [--lang <言語>] [--output <パス>] [--dry-run]
```

テンプレート継承チェーンから README.md テンプレートを解決し、`{{data}}`・`{{text}}` ディレクティブを処理した上で `README.md` を生成します。既存ファイルとの差分がない場合はスキップします。

#### sdd-forge docs forge

```
sdd-forge docs forge --prompt <テキスト> [--spec <パス>] [--max-runs <数>] [--mode <モード>] [--dry-run] [--verbose]
```

| オプション | 説明 |
| --- | --- |
| `--prompt <テキスト>` | AI への改善指示 |
| `--prompt-file <パス>` | プロンプトをファイルから読み込み |
| `--spec <パス>` | 関連する仕様書のパス |
| `--max-runs <数>` | 最大反復回数（デフォルト: 3） |
| `--mode <モード>` | 実行モード（`local` / `assist` / `agent`） |
| `--review-cmd <コマンド>` | レビューコマンド（デフォルト: `sdd-forge docs review`） |

`agent` モードではエージェントが `systemPromptFlag` を持つ場合、ファイルごとの並列処理（per-file モード）で実行されます。

#### sdd-forge docs review

```
sdd-forge docs review [<ディレクトリ>]
```

章ファイルの構造検証（最小行数、H1 見出し、未充填ディレクティブ）、出力整合性チェック（露出ディレクティブ、壊れた HTML コメント、残留ブロックディレクティブ）、`analysis.json` と `README.md` の存在チェックを実行します。多言語設定時は非デフォルト言語のディレクトリも検査対象となります。検証失敗時は Error をスローします。

#### sdd-forge docs translate

```
sdd-forge docs translate [--lang <言語>] [--force] [--dry-run]
```

| オプション | 説明 |
| --- | --- |
| `--lang <言語>` | 翻訳先言語を指定（省略時は全非デフォルト言語） |
| `--force` | mtime に関係なく全ファイルを再翻訳します |
| `--dry-run` | 翻訳対象を表示するのみで実行しません |

出力モードが `translate` の場合のみ動作します。ソースファイルの mtime が翻訳先より新しいファイルのみ再翻訳します。

#### sdd-forge docs changelog

```
sdd-forge docs changelog [<出力パス>] [--dry-run]
```

`specs/` ディレクトリを走査し、各 `spec.md` からメタ情報を抽出して Latest Index テーブルと All Specs テーブルを含む `change_log.md` を生成します。

#### sdd-forge docs agents

```
sdd-forge docs agents [--dry-run]
```

`AGENTS.md` 内の `{{data("agents.sdd")}}` と `{{data("agents.project")}}` ディレクティブを解決し、PROJECT セクションを AI で精査します。`AGENTS.md` が存在しない場合はテンプレートから初期生成します。

#### sdd-forge spec init

```
sdd-forge spec init --title <タイトル> [--base <ブランチ>] [--worktree] [--no-branch] [--allow-dirty] [--dry-run]
```

| オプション | 説明 |
| --- | --- |
| `--title <タイトル>` | 仕様のタイトル（必須） |
| `--base <ブランチ>` | ベースブランチ（デフォルト: 現在のブランチ） |
| `--worktree` | git worktree モードで作業ツリーを作成します |
| `--no-branch` | ブランチ作成なしで spec ファイルのみ作成します |
| `--allow-dirty` | 未コミット変更がある状態でも実行を許可します |

`specs/` 配下とブランチ一覧から最大連番を検出し、次の連番で `specs/<連番>-<スラッグ>/spec.md` と `qa.md` を生成します。

#### sdd-forge spec gate

```
sdd-forge spec gate --spec <パス> [--phase <pre|post>] [--skip-guardrail]
```

| オプション | 説明 |
| --- | --- |
| `--spec <パス>` | 仕様書のパス（必須） |
| `--phase <フェーズ>` | チェックフェーズ（`pre`: 実装前、`post`: 実装後。デフォルト: `pre`） |
| `--skip-guardrail` | ガードレール AI コンプライアンスチェックをスキップします |

未解決トークン（TBD, TODO, FIXME 等）、未チェックタスク、必須セクションの欠如、User Confirmation の承認状態を検査します。

#### sdd-forge spec guardrail

```
sdd-forge spec guardrail <init|show|update> [--force]
```

`init` は `.sdd-forge/guardrail.md` をプリセットチェーンから生成します。`show` は統合されたガードレール記事を表示します。`update` は AI を使って新しい記事を提案・追記します。

#### sdd-forge spec lint

```
sdd-forge spec lint --base <ブランチ>
```

ガードレール記事の `phase: [lint]` で定義された RegExp パターンを、ベースブランチからの変更ファイルに対してチェックします。違反が検出されると終了コード 1 で終了します。

#### sdd-forge flow start

```
sdd-forge flow start --request <要望> [--title <タイトル>] [--spec <パス>] [--worktree] [--no-branch] [--forge-mode <モード>] [--max-runs <数>] [--dry-run]
```

| オプション | 説明 |
| --- | --- |
| `--request <要望>` | 実装要望テキスト（必須） |
| `--title <タイトル>` | spec タイトル（省略時は request から自動生成） |
| `--spec <パス>` | 既存の spec を指定（省略時は新規作成） |
| `--worktree` | git worktree モードで実行します |
| `--no-branch` | ブランチ作成なしで実行します |
| `--forge-mode <モード>` | forge の実行モード（`local` / `assist` / `agent`） |
| `--max-runs <数>` | forge の最大反復回数（デフォルト: 5） |

spec init → gate → forge のパイプラインを順次実行します。gate 失敗時は終了コード 2 で終了し、User Confirmation の承認を促すメッセージを表示します。

#### sdd-forge flow status

```
sdd-forge flow status [--step <id> --status <値>] [--summary '<JSON配列>'] [--req <index> --status <値>] [--request <テキスト>] [--note <テキスト>] [--issue <番号>] [--check <フェーズ>] [--list] [--all]
```

オプションなしで現在のフロー進捗を表示します。`--list` でアクティブフロー一覧、`--all` で全 spec 一覧を表示します。更新操作ではステップ状態・要件・リクエスト・ノート・Issue 番号を個別に設定できます。

#### sdd-forge flow resume

```
sdd-forge flow resume
```

`flow.json` と `spec.md` からコンテキスト復元用サマリーを stdout に出力します。Request、Current Progress、Spec Summary、Requirements、Next Action を含みます。複数のアクティブフローが検出された場合はエラーを表示します。

#### sdd-forge flow review

```
sdd-forge flow review [--dry-run] [--skip-confirm]
```

draft フェーズで AI がコード改善提案を生成し、final フェーズでシニアレビュアーとして検証します。結果は `review.md` にチェックリスト形式で出力されます。改善が不要な場合は `NO_PROPOSALS` と判定されます。

#### sdd-forge flow merge

```
sdd-forge flow merge [--pr] [--auto] [--dry-run]
```

| オプション | 説明 |
| --- | --- |
| `--pr` | squash merge の代わりに GitHub PR を作成します |
| `--auto` | `commands.gh=enable` かつ `gh` CLI が利用可能な場合に PR ルートを自動選択します |
| `--dry-run` | 実行するコマンドを表示するのみ |

spec-only モード（featureBranch === baseBranch）ではマージをスキップします。worktree モードでは `git -C <mainRepo> merge --squash` を実行します。

#### sdd-forge flow cleanup

```
sdd-forge flow cleanup [--dry-run]
```

3 つのモードを自動判定します。spec-only モードではクリーンアップ不要として `.active-flow` エントリのみ削除します。worktree モードでは worktree 削除後にブランチを削除します。branch モードではブランチのみ削除します。`flow.json` は `specs/` に保持されます。

<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text({prompt: "終了コードの定義と stdout/stderr の使い分けルールを表形式で記述してください。ソースコードの process.exit() 呼び出しや出力パターンから抽出すること。", mode: "deep"})}} -->

| 終了コード | 意味 | 発生するコマンド |
| --- | --- | --- |
| `0` | 正常終了 | 全コマンド |
| `1` | 一般的なエラー（引数不正、前提条件未達、検証失敗等） | 全コマンド（不明なサブコマンド、`--help` なしの引数なし実行、`flow status --check` の前提条件未達、`spec lint` の違反検出、`review` の品質チェック失敗等） |
| `2` | gate 失敗（User Confirmation 未承認等、ユーザー操作が必要） | `flow start`（gate チェック失敗時） |

**stdout / stderr の使い分け:**

| 出力先 | 用途 |
| --- | --- |
| **stdout** | コマンドの主要な出力結果（生成されたテキスト、ステータス表示、`--dry-run` の結果表示、`flow resume` のサマリー出力） |
| **stderr** | エラーメッセージ、警告（WARN）、進捗ログ（`[data]`・`[init]` 等のプレフィックス付きログ）、ヘルプ表示（名前空間ディスパッチャの Usage） |

`createLogger()` で生成されるロガーは `console.log`（stdout）を使用します。`forge` コマンドのティッカー（進捗ドット）は `process.stderr.write()` で出力されます。名前空間ディスパッチャ（`docs.js`、`spec.js`、`flow.js`）は引数なし実行時の Usage を `console.error`（stderr）に出力します。

<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← プロジェクト構成](project_structure.md) | [設定とカスタマイズ →](configuration.md)
<!-- {{/data}} -->
