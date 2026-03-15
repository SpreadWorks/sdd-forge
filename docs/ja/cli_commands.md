# 02. CLIコマンドリファレンス

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forgeは、`docs`、`spec`、`flow`、およびスタンドアロンコマンドの4つの名前空間に整理された22個のコマンドを提供しており、すべて単一のエントリポイント（`sdd-forge <command>`）から呼び出されます。3つの名前空間ディスパッチャー（`docs`、`spec`、`flow`）はそれぞれ最初の引数としてサブコマンドを受け取り、独立コマンド（`setup`、`upgrade`、`presets`、`help`）は名前空間プレフィックスなしで動作します。
<!-- {{/text}} -->

## Content

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| コマンド | 説明 | 主要オプション |
|---|---|---|
| `help` | 利用可能なすべてのコマンドと説明を表示する | — |
| `setup` | プロジェクトをsdd-forge用に初期化する | — |
| `upgrade` | スキルファイルを現在のsdd-forgeバージョンのテンプレートに更新する | `--dry-run` |
| `docs build` | ドキュメント生成パイプラインをフル実行する（scan→enrich→init→data→text→readme→agents→[translate]） | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `docs scan` | ソースコードを解析し `analysis.json` を生成する | — |
| `docs enrich` | AI生成による役割、概要、章分類で `analysis.json` をエンリッチする | `--agent` |
| `docs init` | プリセットテンプレートから `docs/` の章ファイルを初期化する | `--force`, `--dry-run` |
| `docs data` | 章ファイル内の `{{data}}` ディレクティブにデータを埋め込む | `--dry-run` |
| `docs text` | AIエージェントを使用して章ファイル内の `{{text}}` セクションを生成する | `--agent`, `--dry-run` |
| `docs readme` | docsの内容から `README.md` を生成する | `--dry-run` |
| `docs forge` | AI編集→レビュー→フィードバックの反復サイクルでdocsを改善する | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--agent`, `--mode`, `--dry-run`, `--verbose` |
| `docs review` | 生成されたドキュメントの品質問題をレビューする | — |
| `docs translate` | デフォルト言語のdocsを設定済みの非デフォルト言語に翻訳する | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | gitの履歴からchangelogを生成する | — |
| `docs agents` | `AGENTS.md` / `CLAUDE.md` を生成または更新する | `--sdd`, `--project`, `--dry-run` |
| `docs snapshot` | 現在のdocsの状態のスナップショットを作成する | `--dry-run` |
| `spec init` | 連番付きフィーチャーブランチを作成し `spec.md` / `qa.md` を初期化する | `--title`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `spec gate` | `spec.md` の未解決項目を検証し、ガードレール準拠チェックを実行する | `--spec`, `--phase`, `--skip-guardrail` |
| `spec guardrail` | プロジェクトの `guardrail.md` を初期化または更新する | `init \| update`, `--agent`, `--force`, `--dry-run` |
| `flow start` | SDDフロー全体を実行する: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `flow status` | アクティブなSDDフロー状態を表示または更新する | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `presets list` | 利用可能なプリセットの継承ツリーを表示する | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

以下のフラグは、サブコマンドのディスパッチが行われる前に、トップレベルのエントリポイント（`sdd-forge.js`）で認識されます。

| オプション | エイリアス | 説明 |
|---|---|---|
| `--version` | `-v`, `-V` | インストールされているsdd-forgeのバージョンを表示して終了する。 |
| `--help` | `-h` | コマンド一覧を表示し、終了コード0で終了する。引数なしで実行した場合も同じ出力が得られる。 |

ほとんどのサブコマンドは、サブコマンド名の後にローカルで `--help` / `-h` を受け付けます（例: `sdd-forge docs forge --help`）。このコマンドごとのヘルプは、トップレベルのエントリポイントではなく、各コマンド固有の引数パーサー内で処理されます。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### help

```
sdd-forge help
sdd-forge          # helpと同じ
sdd-forge -h
```

セクション別（Project、Docs、Spec、Flow、Info）にグループ化された完全なコマンド一覧を1行の説明付きで表示します。表示言語は `.sdd-forge/config.json` の `lang` フィールドで制御され、デフォルトは `en` です。

#### setup

```
sdd-forge setup
```

新しいプロジェクトをsdd-forge用にブートストラップします。`.sdd-forge/` 設定ディレクトリを作成し、初期 `config.json` を書き込み、`AGENTS.md` を生成し、`CLAUDE.md` シンボリックリンクを作成します。

#### upgrade

```
sdd-forge upgrade [--dry-run]
```

バンドルされたスキルファイル（`.agents/skills/*/SKILL.md` および対応する `.claude/skills/*/SKILL.md` シンボリックリンク）を、現在インストールされているバージョンのsdd-forgeに同梱されたテンプレートに合わせて更新します。既存のシンボリックリンクは新しい内容が書き込まれる前に実ファイルに置き換えられます。`--dry-run` を指定すると、変更はファイルに書き込まれずコンソールに出力されます。このコマンドは `config.json` に `systemPromptFlag` 設定が不足していないかもチェックし、不足がある場合はヒントを出力します。

#### docs build

```
sdd-forge docs build [--agent <name>] [--force] [--dry-run] [--verbose]
```

ドキュメント生成パイプラインを順次実行します: `scan → enrich → init → data → text → readme → agents → [translate]`。プログレスバーが各ステップの重みを追跡します。configで `output.isMultiLang` が `true` の場合、`translate` ステップが追加され、非デフォルト言語が生成されます。`defaultAgent` が設定されておらず `--agent` も指定されていない場合、`enrich` と `text` ステップは警告付きでスキップされます。

| オプション | 説明 |
|---|---|
| `--agent <name>` | enrichおよびtextステップのAIエージェントを上書きする。 |
| `--force` | `init` ステップに `--force` を渡す（既存の章ファイルを上書き）。 |
| `--dry-run` | ファイルを書き込まずにすべてのステップを実行する。 |
| `--verbose` | エージェントのstdout/stderr出力をリアルタイムで表示する。 |

#### docs scan

```
sdd-forge docs scan
```

アクティブなプリセットのスキャナー設定に従ってプロジェクトのソースツリーを解析し、結果を `.sdd-forge/output/analysis.json` に書き込みます。このファイルは後続のすべてのパイプラインステップで使用されます。

#### docs enrich

```
sdd-forge docs enrich [--agent <name>]
```

`scan` で生成された生の `analysis.json` を読み込み、すべてのエントリを1回のAIエージェント呼び出しで処理し、各エントリにrole、summary、detail、章分類フィールドを書き戻します。`text` ステップで正確な出力を生成するにはエンリッチメントが必要です。

#### docs init

```
sdd-forge docs init [--force] [--dry-run]
```

`docs/` ディレクトリを作成し、アクティブなプリセットのテンプレートセットから派生した章Markdownファイルを配置します。`--force` を指定しない限り、既存のファイルはそのまま残されます。

#### docs data

```
sdd-forge docs data [--dry-run]
```

現在の `analysis.json` を使用して、対応する `DataSource` メソッドを呼び出し、章ファイル内のすべての `{{data: <source>.<method>}}` ディレクティブを解決します。結果はディレクティブと `{{/data}}` マーカーの間にインプレースで書き込まれます。

#### docs text

```
sdd-forge docs text [--agent <name>] [--dry-run]
```

章ファイル内の各 `{{text: <instruction>}}` ディレクティブに対して設定済みのAIエージェントを呼び出し、生成された内容をインプレースで書き込みます。本文テキストがまだないディレクティブ（または明示的に再生成フラグが設定されたもの）のみが処理されます。

#### docs readme

```
sdd-forge docs readme [--dry-run]
```

生成された章ファイルからプロジェクトルートに `README.md` を組み立てます。管理対象セクション外の既存の `README.md` 内容は保持されます。

#### docs forge

```
sdd-forge docs forge [--prompt <text>] [--prompt-file <path>] [--spec <path>]
                     [--max-runs <n>] [--review-cmd <cmd>] [--agent <name>]
                     [--mode local|assist|agent] [--dry-run] [--verbose]
```

docsの章ファイルに対してAI編集→レビュー→フィードバックの反復サイクルを実行します。各ラウンドでエージェントが章を書き換え、その後 `review` が実行されます。レビューに不合格のファイルは次のラウンドでエージェントに戻されます。サイクルは最大 `--max-runs` 回（デフォルト: 3）繰り返されます。`--spec` を指定すると、そのspecに関連する章のみが対象になります。

| オプション | デフォルト | 説明 |
|---|---|---|
| `--prompt` | `""` | エージェントへの自然言語での指示。 |
| `--prompt-file` | `""` | プロンプトを含むファイルへのパス。 |
| `--spec` | `""` | `spec.md` へのパス。対象を関連する章に限定する。 |
| `--max-runs` | `3` | 編集–レビューサイクルの最大回数。 |
| `--review-cmd` | `sdd-forge review` | レビューステップで使用するコマンド。 |
| `--agent` | 設定デフォルト | エージェント名の上書き。 |
| `--mode` | `local` | `local` は決定論的パッチを使用。`assist` はAI提案を追加。`agent` はAIに完全に委譲。 |
| `--dry-run` | `false` | ファイル書き込みをスキップする。 |
| `--verbose` | `false` | エージェント出力をstderrにストリーミングする。 |

#### docs review

```
sdd-forge docs review
```

`docs/` の章ファイルの現在の状態をプロジェクトの `review-checklist.md` と照合し、不合格の項目を報告します。レビュー失敗時は終了コードがゼロ以外になります。

#### docs translate

```
sdd-forge docs translate [--lang <code>] [--force] [--dry-run]
```

章ファイルと `README.md` をデフォルト言語から `output.languages` 設定配列に記載されたすべての非デフォルト言語に翻訳します。翻訳はmtime比較を使用して、すでに最新のファイルをスキップします。`output.mode` が `"translate"` の場合のみ有効です。

| オプション | 説明 |
|---|---|
| `--lang <code>` | 翻訳対象を単一のターゲット言語に制限する。 |
| `--force` | mtimeに関係なくすべてのファイルを再翻訳する。 |
| `--dry-run` | ファイルを書き込まずに翻訳対象を表示する。 |

#### docs changelog

```
sdd-forge docs changelog
```

gitのコミット履歴から `docs/changelog.md` を生成または更新し、バージョンタグごとにエントリをグループ化します。

#### docs agents

```
sdd-forge docs agents [--sdd] [--project] [--dry-run]
```

SDDワークフロー指示とプロジェクト固有のコンテキストを含む `AGENTS.md`（および `CLAUDE.md` シンボリックリンク）を作成または更新します。`--sdd` も `--project` も指定されていない場合、両方のセクションが処理されます。

| オプション | 説明 |
|---|---|
| `--sdd` | `AGENTS.md` のSDDセクションのみを更新する。 |
| `--project` | `AGENTS.md` のPROJECTセクションのみを更新する。 |
| `--dry-run` | ファイルを書き込まずに出力を表示する。 |

#### docs snapshot

```
sdd-forge docs snapshot [--dry-run]
```

現在の `docs/` ディレクトリのタイムスタンプ付きスナップショットを `.sdd-forge/snapshots/` に書き込みます。大規模なforge実行の前にdocsの状態を保存するのに便利です。

#### spec init

```
sdd-forge spec init --title <title> [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

連番付きフィーチャーブランチ（`feat/NNN-<slug>`）を作成し、プリセットテンプレートから `specs/NNN-<slug>/spec.md` と `qa.md` を書き込みます。番号インデックスは既存の `specs/` サブディレクトリとgitブランチ名から導出されます。

| オプション | 説明 |
|---|---|
| `--title <text>` | 人間が読めるタイトル。スラグ化されてブランチ名とディレクトリ名になる。 |
| `--no-branch` | gitブランチを切り替えずにspecファイルを作成する。 |
| `--worktree` | 分離開発用に新しいgit worktreeを作成する。 |
| `--allow-dirty` | ワーキングツリーのクリーンチェックをスキップする。 |
| `--dry-run` | ファイルやブランチを作成せずにアクションを表示する。 |

#### spec gate

```
sdd-forge spec gate --spec <path> [--phase pre|post] [--skip-guardrail]
```

実装の前後に `spec.md` を検証します。未解決トークン（`[NEEDS CLARIFICATION]`、`TBD`、`TODO`、`FIXME`）、未チェックのタスク項目（`- [ ]`）、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）をチェックします。`guardrail.md` が存在する場合、その条項に対するAI準拠チェックも実行します。失敗がある場合は終了コード1で終了します。

| オプション | 説明 |
|---|---|
| `--spec <path>` | 検証する `spec.md` へのパス（必須）。 |
| `--phase` | `pre`（デフォルト）はステータス/受入基準の未チェック項目をスキップ。`post` はすべてをチェック。 |
| `--skip-guardrail` | ガードレールAI準拠チェックをスキップする。 |

#### spec guardrail

```
sdd-forge spec guardrail init  [--force] [--dry-run]
sdd-forge spec guardrail update [--agent <name>] [--dry-run]
```

`spec gate` でspecを検証するために使用される不変のアーキテクチャ原則を列挙した、プロジェクトの `guardrail.md` を管理します。`init` はテンプレートを書き込みます（ファイルが既に存在する場合は `--force` がない限りブロックされます）。`update` は現在の `analysis.json` と既存のガードレール内容をAIエージェントに渡し、新たに提案された条項を追加します。

#### flow start

```
sdd-forge flow start --request <text> [--title <text>] [--spec <path>]
                     [--agent <name>] [--max-runs <n>] [--forge-mode local|assist|agent]
                     [--no-branch] [--worktree] [--dry-run]
```

SDDフロー全体をオーケストレーションします: specを作成し（`--spec` が指定されていない場合）、`spec gate` を実行し、フロー状態を `.sdd-forge/flow.json` に保存してから、提供されたリクエストをプロンプトとして `docs forge` を呼び出します。ゲートが失敗した場合、失敗理由（最大8行の `- ` 行）が出力され、終了コード2でプロセスが終了します。

| オプション | デフォルト | 説明 |
|---|---|---|
| `--request <text>` | — | ユーザーリクエストテキスト（必須）。 |
| `--title <text>` | `--request` から導出 | specとブランチのタイトル。 |
| `--spec <path>` | `""` | 既存のspecパス。`spec init` をスキップする。 |
| `--agent <name>` | 設定デフォルト | forge用のエージェント上書き。 |
| `--max-runs <n>` | `5` | forgeサイクルの最大回数。 |
| `--forge-mode` | `local` | forgeモード: `local`、`assist`、または `agent`。 |
| `--no-branch` | `false` | 新しいブランチなしでspecを作成する。 |
| `--worktree` | `false` | フィーチャーブランチにgit worktreeを使用する。 |
| `--dry-run` | `false` | 変更を加えずに実行する。 |

#### flow status

```
sdd-forge flow status
sdd-forge flow status --step <id> --status <value>
sdd-forge flow status --summary '<JSON array>'
sdd-forge flow status --req <index> --status <value>
sdd-forge flow status --archive
```

`.sdd-forge/flow.json` に格納されたアクティブなSDDフロー状態を表示または変更します。オプションなしの場合、specパス、ブランチ、ステップ進捗（✓ done / > in_progress / - skipped / 空白 pending）、および要件進捗を示すフォーマット済みサマリーを表示します。`--archive` フラグは `flow.json` をアクティブなspecディレクトリにコピーし、`.sdd-forge/` から削除します。

| オプション | 説明 |
|---|---|
| `--step <id> --status <val>` | 名前付きステップのステータスを更新する。有効なステップIDは `FLOW_STEPS` で定義されている。 |
| `--summary '<JSON>'` | 要件リストを説明文字列のJSON配列で置き換える。 |
| `--req <index> --status <val>` | ゼロベースのインデックスで単一の要件を更新する。 |
| `--archive` | `flow.json` をspecディレクトリに移動し、`.sdd-forge/` からクリアする。 |

#### presets list

```
sdd-forge presets list
```

プリセットの完全な継承ツリーをstdoutに出力します。ツリーは `base/` から始まり、アーキテクチャレベルのノード（`cli/`、`webapp/`、`library/`）、そしてそのリーフプリセットが続きます。各ノードにはラベル、エイリアス、スキャンカテゴリキーが表示されます。
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

#### 終了コード

| コード | 意味 | 主な発生元 |
|---|---|---|
| `0` | 成功 | すべてのコマンドの正常完了。 |
| `1` | 一般エラー | 不明なサブコマンド、必須オプションの欠落、ファイル未検出、AIエージェントエラー、または `spec gate` でのゲートチェック失敗。 |
| `2` | ゲートブロック | `spec gate` がゼロ以外を返した場合の `flow start`（未解決のspec項目またはガードレール失敗）。 |

#### stdout / stderr 規約

sdd-forgeはコマンド全体で一貫した出力規約に従います。

| ストリーム | 内容 |
|---|---|
| **stdout** | 構造化されたユーザー向け出力: フォーマット済みテーブル、生成されたファイルパス、進捗サマリー、ヘルプテキスト、バージョン文字列。 |
| **stderr** | `[<command>]` プレフィックス付きの操作ログ行（例: `[forge]`、`[build]`、`[translate]`）、プログレスバー更新、ステップごとの警告（例: `WARN: no defaultAgent configured`）、およびエラーメッセージ。 |

プログレスバー（`docs build` で使用）はstderrに書き込まれるため、パイプ時にstdout出力が機械可読のまま維持されます。長時間のAI呼び出し中に書き込まれるエージェントティッカードット（`.`）もstderrに出力されます。`--verbose` を受け付けるコマンドは、生のエージェントstdoutとstderrをリアルタイムでストリーミングします。

**`--dry-run` の動作:** `--dry-run` が有効な場合、書き込み操作は抑制され、作成または変更されるはずの各ファイルについて `DRY-RUN:` プレフィックス付きの行がstdoutに出力されます。
<!-- {{/text}} -->
