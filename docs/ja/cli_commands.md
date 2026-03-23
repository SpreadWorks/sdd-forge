# CLI コマンドリファレンス

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。コマンド総数・サブコマンド体系を踏まえること。"})}} -->

sdd-forge は 3 段階ディスパッチ構造（トップレベル → 名前空間 → サブコマンド）を採用しており、`docs`・`spec`・`flow` の 3 名前空間と `setup`・`upgrade`・`presets`・`help` の独立コマンドを合わせて 30 以上のサブコマンドを提供します。各コマンドは `sdd-forge <名前空間> <サブコマンド> [オプション]` の形式で実行します。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text({prompt: "全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。ソースコードのコマンド定義・ルーティングから網羅的に抽出すること。", mode: "deep"})}} -->

| コマンド | 説明 | 主なオプション |
| --- | --- | --- |
| `sdd-forge help` | 利用可能なコマンド一覧を表示する | — |
| `sdd-forge setup` | インタラクティブセットアップウィザードを実行し、`.sdd-forge/config.json` を生成する | `--name`, `--type`, `--lang`, `--agent`, `--purpose`, `--tone`, `--dry-run` |
| `sdd-forge upgrade` | テンプレート由来ファイル（スキル等）を現在のバージョンに合わせて更新する | `--dry-run` |
| `sdd-forge presets list` | プリセット継承ツリーを表示する | — |
| `sdd-forge docs build` | scan → enrich → init → data → text → readme → agents → (translate) のパイプラインを順次実行する | `--force`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | ソースコードを静的解析して `analysis.json` を生成する | — |
| `sdd-forge docs enrich` | AI で analysis エントリに役割・概要・章分類を一括付与する | — |
| `sdd-forge docs init` | テンプレート継承チェーンからドキュメントテンプレートを `docs/` に出力する | `--type`, `--lang`, `--force`, `--dry-run`, `--docs-dir` |
| `sdd-forge docs data` | `docs/` 内の `{{data}}` ディレクティブを analysis データで解決する | `--dry-run`, `--stdout`, `--docs-dir` |
| `sdd-forge docs text` | `docs/` 内の `{{text}}` ディレクティブを AI 生成テキストで充填する | `--dry-run` |
| `sdd-forge docs readme` | `docs/` 配下の章ファイルから `README.md` を自動生成する | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | AI によるドキュメント更新 → review → フィードバックの反復改善ループを実行する | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | docs の品質チェック（構造検証、ディレクティブ充填状況、出力整合性）を行う | — |
| `sdd-forge docs translate` | デフォルト言語のドキュメントを他言語に翻訳する | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | `specs/` ディレクトリを走査して `change_log.md` を生成する | `--dry-run` |
| `sdd-forge docs agents` | `AGENTS.md` の `{{data}}` ディレクティブを解決し、PROJECT セクションを AI で精査する | `--dry-run` |
| `sdd-forge spec init` | 連番で feature ブランチと specs ディレクトリを作成し、仕様書テンプレートを初期化する | `--title`, `--base`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `sdd-forge spec gate` | 仕様書の未解決項目を検出し、ガードレール AI コンプライアンスチェックを実行する | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | ガードレール（不変原則）の初期化・表示・AI による更新を行う | サブコマンド: `show`, `init`, `update` |
| `sdd-forge spec lint` | ガードレール記事の lint パターンを変更ファイルに対してチェックする | `--base` |
| `sdd-forge flow start` | spec init → gate → forge のパイプラインを順次実行して SDD フローを自動起動する | `--request`, `--title`, `--spec`, `--forge-mode`, `--max-runs`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow status` | フロー進捗の表示・ステップ更新・要件管理・一覧表示を行う | `--step`, `--status`, `--summary`, `--req`, `--request`, `--note`, `--issue`, `--check`, `--all`, `--list` |
| `sdd-forge flow resume` | `flow.json` と `spec.md` からコンテキスト復元用サマリーを出力する | — |
| `sdd-forge flow review` | draft → final → apply の 3 フェーズでコード品質レビューを実行する | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow merge` | flow.json に基づく squash merge または GitHub PR 作成を実行する | `--pr`, `--auto`, `--dry-run` |
| `sdd-forge flow cleanup` | `.active-flow` エントリ削除とブランチ・worktree 削除を実行する | `--dry-run` |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text({prompt: "全コマンドに共通するグローバルオプションを表形式で記述してください。ソースコードの引数パース処理から抽出すること。", mode: "deep"})}} -->

以下のオプションは多くのコマンドで共通して利用できます。

| オプション | 説明 |
| --- | --- |
| `--help`, `-h` | コマンドのヘルプメッセージを表示して終了します |
| `--dry-run` | 実際のファイル書き込みや外部コマンド実行を行わず、実行内容を表示のみします |
| `--verbose`, `-v` | 詳細なログ出力を有効にします（`docs build`, `docs forge` 等で利用可能） |
| `-v`, `--version`, `-V` | sdd-forge のバージョン番号を表示して終了します（トップレベルのみ） |
<!-- {{/text}} -->

### 各コマンドの詳細

<!-- {{text({prompt: "各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとに #### サブセクションを立てること。ソースコードの引数定義・ヘルプメッセージから情報を抽出すること。", mode: "deep"})}} -->

#### setup

プロジェクトの初期セットアップを行います。対話式ウィザードで言語・プリセット・エージェント等を設定し、`.sdd-forge/config.json` を生成します。全オプションを指定すると非対話モードで実行できます。

```
sdd-forge setup
sdd-forge setup --name myapp --type webapp --lang ja --agent claude
```

| オプション | 説明 |
| --- | --- |
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースディレクトリのパス |
| `--work-root <path>` | 作業ルートのパス（省略時はソースパスと同一） |
| `--type <type>` | プリセットタイプ（例: `node-cli`, `cakephp2`） |
| `--purpose <purpose>` | ドキュメントの目的（`user-guide` または `developer`） |
| `--tone <tone>` | 文体（`polite`, `formal`, `casual`） |
| `--agent <agent>` | デフォルトエージェント名 |
| `--lang <lang>` | UI 言語コード（例: `ja`, `en`） |
| `--dry-run` | 実行内容を表示のみ |

セットアップ完了時に `.sdd-forge/` ディレクトリ、`docs/`、`specs/`、`AGENTS.md`、スキルファイルが作成されます。

#### upgrade

インストール済みの sdd-forge バージョンに合わせて、テンプレート由来のファイル（スキル等）を更新します。`config.json` や `context.json` には変更を加えません。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 更新対象を表示のみ |

#### docs build

ドキュメント生成の全パイプラインを一括実行します。各ステップにはプログレスバーが表示されます。エージェント未設定時は `enrich` と `text` がスキップされます。

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

| オプション | 説明 |
| --- | --- |
| `--force` | 既存ファイルを上書き（`init` ステップに影響） |
| `--verbose` | 詳細ログを表示 |
| `--dry-run` | 実行内容を表示のみ |

多言語設定が有効な場合、デフォルト言語の生成完了後に翻訳ステップまたは言語別の生成が追加実行されます。

#### docs init

プリセットの継承チェーンに基づきテンプレートをマージし、`docs/` ディレクトリに章ファイルを出力します。AI エージェントが設定されている場合、プロジェクトの analysis データに基づいて不要な章を自動的に除外します。

```
sdd-forge docs init
sdd-forge docs init --type node-cli --force
```

| オプション | 説明 |
| --- | --- |
| `--type <type>` | プリセットタイプを指定（config.json のデフォルトを上書き） |
| `--lang <lang>` | 出力言語 |
| `--docs-dir <dir>` | 出力先ディレクトリ |
| `--force` | 既存ファイルを上書き |
| `--dry-run` | 実行内容を表示のみ |

`config.chapters` が定義されている場合、AI フィルタリングはスキップされ、指定された章リストが使用されます。

#### docs data

`docs/` 内の `{{data}}` ディレクティブを `analysis.json` のデータで解決・レンダリングします。`{{text}}` ディレクティブはスキップされます。

```
sdd-forge docs data
sdd-forge docs data --dry-run --stdout
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | ファイルに書き込まず差分情報を表示 |
| `--stdout` | 処理結果を標準出力に表示 |
| `--docs-dir <dir>` | 対象ディレクトリ |

#### docs text

`docs/` 内の `{{text}}` ディレクティブを AI エージェントで充填します。`docs data` の実行後に使用します。

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### docs readme

`docs/` 配下の章ファイルと README テンプレートから `README.md` を自動生成します。`{{data}}` と `{{text}}` の両方のディレクティブを解決します。

```
sdd-forge docs readme
sdd-forge docs readme --output docs/ja/README.md --lang ja
```

| オプション | 説明 |
| --- | --- |
| `--lang <lang>` | 出力言語 |
| `--output <path>` | 出力先ファイルパス |
| `--dry-run` | 実行内容を表示のみ |

#### docs forge

AI によるドキュメント改善を反復的に実行します。各ラウンドで review を実行し、不合格のファイルにフィードバックを返して再生成します。

```
sdd-forge docs forge --prompt "APIセクションを充実させて" --mode agent
sdd-forge docs forge --spec specs/001-feature/spec.md --max-runs 5
```

| オプション | 説明 |
| --- | --- |
| `--prompt <text>` | 改善指示テキスト |
| `--prompt-file <path>` | 改善指示をファイルから読み込み |
| `--spec <path>` | 関連する spec ファイルのパス |
| `--max-runs <n>` | 最大反復回数（デフォルト: 3） |
| `--review-cmd <cmd>` | レビューコマンド（デフォルト: `sdd-forge docs review`） |
| `--mode <mode>` | 実行モード: `local`, `assist`, `agent` |
| `--verbose` | 詳細ログを表示 |
| `--dry-run` | 実行内容を表示のみ |

#### docs review

ドキュメントの品質チェックを行います。最小行数、見出し構造、未充填ディレクティブ、出力整合性（露出ディレクティブ、壊れた HTML コメント、残留ブロック）を検査します。

```
sdd-forge docs review
sdd-forge docs review docs/
```

多言語設定が有効な場合、非デフォルト言語のディレクトリについても検証を実行します。

#### docs translate

デフォルト言語のドキュメントを他言語に翻訳します。ソースファイルの mtime と翻訳先ファイルの mtime を比較し、更新が必要なファイルのみ再翻訳します。

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| オプション | 説明 |
| --- | --- |
| `--lang <lang>` | 翻訳先の言語を指定（省略時は全非デフォルト言語） |
| `--force` | mtime に関係なく全ファイルを再翻訳 |
| `--dry-run` | 翻訳対象を表示のみ |

`config.json` の `docs.languages` に複数言語が設定されており、モードが `translate` の場合にのみ動作します。

#### docs changelog

`specs/` ディレクトリを走査して `docs/change_log.md` を生成します。各 spec のメタ情報（タイトル、ステータス、作成日）を抽出し、シリーズごとの最新インデックスと全 spec の一覧テーブルを出力します。

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

#### docs agents

`AGENTS.md` 内の `{{data}}` ディレクティブを解決し、PROJECT セクションを AI で精査・更新します。ファイルが存在しない場合は SDD テンプレートを含む初期ファイルを生成します。

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### spec init

連番で feature ブランチと `specs/` ディレクトリを作成し、仕様書テンプレート（`spec.md`, `qa.md`）を初期化します。

```
sdd-forge spec init --title "contact-form"
sdd-forge spec init --title "login" --worktree --base main
```

| オプション | 説明 |
| --- | --- |
| `--title <title>` | 機能タイトル（必須） |
| `--base <branch>` | ベースブランチ（デフォルト: 現在のブランチ） |
| `--no-branch` | ブランチを作成せず spec ファイルのみ作成 |
| `--worktree` | git worktree で新しい作業ツリーを作成 |
| `--allow-dirty` | 未コミット変更があっても実行を許可 |
| `--dry-run` | 実行内容を表示のみ |

#### spec gate

実装開始前に仕様書の品質を検証します。未解決トークン（TBD, TODO, FIXME 等）、未チェックタスク、必須セクションの欠如、User Confirmation の承認状態をチェックします。ガードレール AI コンプライアンスチェックも実行されます。

```
sdd-forge spec gate --spec specs/001-feature/spec.md
sdd-forge spec gate --spec specs/001-feature/spec.md --phase post --skip-guardrail
```

| オプション | 説明 |
| --- | --- |
| `--spec <path>` | 対象の spec ファイルパス（必須） |
| `--phase <phase>` | チェックフェーズ: `pre`（デフォルト）または `post` |
| `--skip-guardrail` | ガードレール AI チェックをスキップ |

#### spec guardrail

プロジェクトのガードレール（不変原則）を管理します。`show`、`init`、`update` の 3 つのサブコマンドを持ちます。

```
sdd-forge spec guardrail show
sdd-forge spec guardrail init --force
sdd-forge spec guardrail update
```

#### spec lint

ガードレール記事の `lint` パターンを、ベースブランチからの変更ファイルに対して機械的にチェックします。

```
sdd-forge spec lint --base main
```

| オプション | 説明 |
| --- | --- |
| `--base <branch>` | diff の基準ブランチ（必須） |

#### flow start

SDD フローを自動起動します。内部で `spec init` → `gate` → `forge` のパイプラインを順次実行します。

```
sdd-forge flow start --request "ログイン機能を追加"
sdd-forge flow start --request "バグ修正" --worktree --forge-mode agent
```

| オプション | 説明 |
| --- | --- |
| `--request <text>` | 要望テキスト（必須） |
| `--title <title>` | spec タイトル（省略時はリクエストから自動生成） |
| `--spec <path>` | 既存の spec ファイルを指定（spec init をスキップ） |
| `--forge-mode <mode>` | forge の実行モード: `local`, `assist`, `agent` |
| `--max-runs <n>` | forge の最大反復回数（デフォルト: 5） |
| `--agent <agent>` | エージェント名 |
| `--no-branch` | ブランチ作成をスキップ |
| `--worktree` | git worktree モードで実行 |
| `--dry-run` | 実行内容を表示のみ |

#### flow status

フロー進捗の表示と更新を行います。オプションなしで現在のフローの詳細を表示します。

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --summary '["要件1", "要件2"]'
sdd-forge flow status --req 0 --status done
sdd-forge flow status --note "設計方針を変更"
sdd-forge flow status --issue 42
sdd-forge flow status --list
sdd-forge flow status --all
```

| オプション | 説明 |
| --- | --- |
| `--step <id> --status <val>` | ステップのステータスを更新 |
| `--summary '<JSON>'` | 要件リストを JSON 配列で設定 |
| `--req <index> --status <val>` | 個別要件のステータスを更新 |
| `--request <text>` | リクエストテキストを設定 |
| `--note <text>` | ノートを追記 |
| `--issue <number>` | GitHub Issue 番号を紐付け |
| `--check <phase>` | 前提条件チェック（`impl`, `finalize`） |
| `--list` | アクティブなフロー一覧を表示 |
| `--all` | 完了済みを含む全 spec の一覧を表示 |

#### flow resume

コンテキストコンパクション後の復元用サマリーを標準出力に出力します。`flow.json` と `spec.md` から進捗・要件・次のアクションを再構築します。

```
sdd-forge flow resume
```

フローの探索は 3 段階で実行されます: (1) 現在のブランチ/worktree、(2) `.active-flow` のアクティブフロー、(3) 全 spec のスキャン。

#### flow review

コード品質レビューを draft（提案生成）→ final（検証）→ apply（適用）の 3 フェーズで実行します。spec の Scope セクションからレビュー対象ファイルを特定します。

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 提案を表示のみ（適用しない） |
| `--skip-confirm` | 確認プロンプトをスキップ |

#### flow merge

flow.json に基づいて squash merge または GitHub PR 作成を実行します。

```
sdd-forge flow merge
sdd-forge flow merge --pr
sdd-forge flow merge --auto
```

| オプション | 説明 |
| --- | --- |
| `--pr` | squash merge の代わりに PR を作成 |
| `--auto` | `commands.gh=enable` かつ `gh` が利用可能なら PR、それ以外は squash merge |
| `--dry-run` | コマンドを表示のみ |

spec-only モード（featureBranch === baseBranch）の場合、マージはスキップされます。

#### flow cleanup

`.active-flow` エントリの削除とブランチ・worktree の削除を実行します。worktree モード・branch モード・spec-only モードを自動判定します。

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```

#### presets list

プリセットの継承ツリーを表示します。各プリセットのラベル、エイリアス、scan キー、テンプレートディレクトリの有無を確認できます。

```
sdd-forge presets list
```
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text({prompt: "終了コードの定義と stdout/stderr の使い分けルールを表形式で記述してください。ソースコードの process.exit() 呼び出しや出力パターンから抽出すること。", mode: "deep"})}} -->

#### 終了コード

| 終了コード | 意味 | 発生するコマンド |
| --- | --- | --- |
| `0` | 正常終了 | 全コマンド |
| `1` | エラー終了（一般的なエラー、引数不正、前提条件未充足） | 全コマンド |
| `2` | ゲートチェック失敗（ユーザー入力が必要） | `flow start`（gate 失敗時） |

#### stdout / stderr の使い分け

| 出力先 | 用途 |
| --- | --- |
| `stdout` | コマンドの主要出力（生成結果、ステータス表示、`--dry-run` 時のプレビュー、`flow resume` のサマリー） |
| `stderr` | ヘルプメッセージ、警告（`WARN:`）、エラーメッセージ、進捗ログ（`[data]`、`[init]` 等のプレフィックス付き）、`forge` のプログレスティッカー |

`--dry-run` 指定時は、実際の出力内容は `stdout` に、「dry-run である」旨のメッセージは `stderr` に出力されます。`spec lint` は違反検出時に `process.exitCode = 1` を設定して終了します。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← project_structure](project_structure.md) | [設定とカスタマイズ →](configuration.md)
<!-- {{/data}} -->
