# 02. CLIコマンドリファレンス

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forgeは、`docs`・`spec`・`flow`・スタンドアロンの4つの名前空間に整理された22個のコマンドを、単一のエントリポイント（`sdd-forge <command>`）から提供します。3つの名前空間ディスパッチャー（`docs`・`spec`・`flow`）はそれぞれ第1引数としてサブコマンドを受け取り、独立コマンド（`setup`・`upgrade`・`presets`・`help`）は名前空間プレフィックスなしで動作します。
<!-- {{/text}} -->

## Content

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `help` | 利用可能な全コマンドの一覧と説明を表示する | — |
| `setup` | プロジェクトをsdd-forge用に初期化する | — |
| `upgrade` | スキルファイルを現在のsdd-forgeバージョンのテンプレートに更新する | `--dry-run` |
| `docs build` | ドキュメント生成パイプライン全体を実行する（scan→enrich→init→data→text→readme→agents→[translate]） | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `docs scan` | ソースコードを解析し`analysis.json`を生成する | — |
| `docs enrich` | `analysis.json`にAI生成の役割・概要・章分類を付与する | `--agent` |
| `docs init` | プリセットテンプレートから`docs/`の章ファイルを初期化する | `--force`, `--dry-run` |
| `docs data` | 章ファイル内の`{{data}}`ディレクティブを解決・展開する | `--dry-run` |
| `docs text` | AIエージェント経由で章ファイル内の`{{text}}`セクションを生成する | `--agent`, `--dry-run` |
| `docs readme` | docsの内容から`README.md`を生成する | `--dry-run` |
| `docs forge` | AI編集→レビュー→フィードバックの反復サイクルでdocsを改善する | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--agent`, `--mode`, `--dry-run`, `--verbose` |
| `docs review` | 生成されたドキュメントの品質問題をチェックする | — |
| `docs translate` | デフォルト言語のdocsを設定済みの他言語に翻訳する | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | gitの履歴から変更履歴を生成する | — |
| `docs agents` | `AGENTS.md` / `CLAUDE.md`を生成・更新する | `--sdd`, `--project`, `--dry-run` |
| `docs snapshot` | 現在のdocsの状態のスナップショットを作成する | `--dry-run` |
| `spec init` | 連番付きフィーチャーブランチを作成し、`spec.md` / `qa.md`を初期化する | `--title`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `spec gate` | `spec.md`の未解決項目を検証し、ガードレール準拠チェックを実行する | `--spec`, `--phase`, `--skip-guardrail` |
| `spec guardrail` | プロジェクトの`guardrail.md`を初期化・更新する | `init \| update`, `--agent`, `--force`, `--dry-run` |
| `flow start` | SDDフロー全体を実行する：spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `flow status` | アクティブなSDDフロー状態を表示・更新する | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `presets list` | 利用可能なプリセットの継承ツリーを表示する | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

以下のフラグは、サブコマンドのディスパッチ前にトップレベルのエントリポイント（`sdd-forge.js`）で認識されます。

| オプション | エイリアス | 説明 |
|---|---|---|
| `--version` | `-v`, `-V` | インストール済みのsdd-forgeバージョンを表示して終了します。 |
| `--help` | `-h` | コマンド一覧を表示し、終了コード0で終了します。引数なしで実行した場合も同じ出力になります。 |

多くのサブコマンドは、サブコマンド名の後にローカルの`--help` / `-h`も受け付けます（例：`sdd-forge docs forge --help`）。このコマンド固有のヘルプは、トップレベルのエントリポイントではなく、各コマンド内部の引数パーサーで処理されます。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### help

```
sdd-forge help
sdd-forge          # help と同等
sdd-forge -h
```

コマンド一覧をセクション別（Project、Docs、Spec、Flow、Info）にグループ化し、1行の説明付きで表示します。表示言語は`.sdd-forge/config.json`の`lang`フィールドで制御され、デフォルトは`en`です。

#### setup

```
sdd-forge setup
```

プロジェクトをsdd-forge用に初期セットアップします。`.sdd-forge/`設定ディレクトリを作成し、初期`config.json`を書き込み、`AGENTS.md`を生成し、`CLAUDE.md`シンボリックリンクを作成します。

#### upgrade

```
sdd-forge upgrade [--dry-run]
```

同梱のスキルファイル（`.agents/skills/*/SKILL.md`および対応する`.claude/skills/*/SKILL.md`シンボリックリンク）を、現在インストールされているsdd-forgeバージョンのテンプレートに合わせて更新します。既存のシンボリックリンクは、新しい内容の書き込み前に実ファイルに置き換えられます。`--dry-run`を指定すると、変更内容はコンソールに出力されるだけで、ファイルへの書き込みは行われません。また、`config.json`に`systemPromptFlag`設定が不足していないかチェックし、不足がある場合はヒントを表示します。

#### docs build

```
sdd-forge docs build [--agent <name>] [--force] [--dry-run] [--verbose]
```

ドキュメント生成パイプライン全体を順番に実行します：`scan → enrich → init → data → text → readme → agents → [translate]`。進捗バーが各ステップの重みを追跡します。configで`output.isMultiLang`が`true`の場合、`translate`ステップが追加され、デフォルト以外の言語が生成されます。`defaultAgent`が未設定で`--agent`も指定されていない場合、`enrich`と`text`のステップは警告付きでスキップされます。

| オプション | 説明 |
|---|---|
| `--agent <name>` | enrichおよびtextステップで使用するAIエージェントを上書きします。 |
| `--force` | `init`ステップに`--force`を渡します（既存の章ファイルを上書き）。 |
| `--dry-run` | ファイルを書き込まずに全ステップを実行します。 |
| `--verbose` | エージェントのstdout/stderr出力をリアルタイムで表示します。 |

#### docs scan

```
sdd-forge docs scan
```

アクティブなプリセットのスキャナー設定に従ってプロジェクトのソースツリーを解析し、結果を`.sdd-forge/output/analysis.json`に書き込みます。このファイルは後続のすべてのパイプラインステップで使用されます。

#### docs enrich

```
sdd-forge docs enrich [--agent <name>]
```

`scan`で生成された未加工の`analysis.json`を読み込み、すべてのエントリーをAIエージェントに一括で渡して、各エントリーに役割・概要・詳細・章分類フィールドを付与します。`text`ステップが正確な出力を生成するには、事前のenrich処理が必要です。

#### docs init

```
sdd-forge docs init [--force] [--dry-run]
```

`docs/`ディレクトリを作成し、アクティブなプリセットのテンプレートセットから章のMarkdownファイルを配置します。`--force`を指定しない限り、既存のファイルは変更されません。

#### docs data

```
sdd-forge docs data [--dry-run]
```

現在の`analysis.json`を使用して、章ファイル内のすべての`{{data: <source>.<method>}}`ディレクティブを対応する`DataSource`メソッドを呼び出して解決します。結果はディレクティブと`{{/data}}`マーカーの間にインプレースで書き込まれます。

#### docs text

```
sdd-forge docs text [--agent <name>] [--dry-run]
```

章ファイル内の各`{{text: <instruction>}}`ディレクティブに対して、設定済みのAIエージェントを呼び出し、生成された内容をインプレースで書き込みます。本文がまだ存在しないディレクティブ、または再生成フラグが明示的に設定されたディレクティブのみが処理対象です。

#### docs readme

```
sdd-forge docs readme [--dry-run]
```

生成された章ファイルからプロジェクトルートに`README.md`を組み立てます。管理セクション外の既存の`README.md`の内容は保持されます。

#### docs forge

```
sdd-forge docs forge [--prompt <text>] [--prompt-file <path>] [--spec <path>]
                     [--max-runs <n>] [--review-cmd <cmd>] [--agent <name>]
                     [--mode local|assist|agent] [--dry-run] [--verbose]
```

docs章ファイルに対して、AI編集→レビュー→フィードバックの反復サイクルを実行します。各ラウンドでエージェントが章を書き換え、次に`review`が実行されます。レビューに不合格のファイルは次のラウンドでエージェントに再度渡されます。このサイクルは最大`--max-runs`回（デフォルト：3）繰り返されます。`--spec`を指定した場合、そのspecに関連する章のみが対象になります。

| オプション | デフォルト | 説明 |
|---|---|---|
| `--prompt` | `""` | エージェントへの自然言語指示。 |
| `--prompt-file` | `""` | プロンプトを含むファイルのパス。 |
| `--spec` | `""` | `spec.md`のパス。対象を関連する章に限定します。 |
| `--max-runs` | `3` | 編集→レビューサイクルの最大回数。 |
| `--review-cmd` | `sdd-forge review` | レビューステップで使用するコマンド。 |
| `--agent` | 設定のデフォルト | エージェント名の上書き。 |
| `--mode` | `local` | `local`は決定的パッチ適用、`assist`はAI提案を追加、`agent`はAIに全面委任。 |
| `--dry-run` | `false` | ファイル書き込みをスキップします。 |
| `--verbose` | `false` | エージェントの出力をstderrにストリーミングします。 |

#### docs review

```
sdd-forge docs review
```

`docs/`章ファイルの現在の状態をプロジェクトの`review-checklist.md`に照らしてチェックし、不合格の項目を報告します。レビューが不合格の場合、終了コードは0以外になります。

#### docs translate

```
sdd-forge docs translate [--lang <code>] [--force] [--dry-run]
```

章ファイルと`README.md`を、デフォルト言語から`output.languages`設定配列に列挙されたすべての非デフォルト言語に翻訳します。翻訳はmtime比較を使用して、すでに最新のファイルをスキップします。`output.mode`が`"translate"`の場合のみ有効です。

| オプション | 説明 |
|---|---|
| `--lang <code>` | 翻訳対象を単一のターゲット言語に限定します。 |
| `--force` | mtimeに関係なく、すべてのファイルを再翻訳します。 |
| `--dry-run` | 翻訳対象を表示するだけで、ファイルへの書き込みは行いません。 |

#### docs changelog

```
sdd-forge docs changelog
```

gitのコミット履歴から`docs/changelog.md`を生成・更新し、バージョンタグごとにエントリーをグループ化します。

#### docs agents

```
sdd-forge docs agents [--sdd] [--project] [--dry-run]
```

SDDワークフロー手順とプロジェクト固有のコンテキストを含む`AGENTS.md`（および`CLAUDE.md`シンボリックリンク）を作成・更新します。`--sdd`も`--project`も指定しない場合、両方のセクションが処理されます。

| オプション | 説明 |
|---|---|
| `--sdd` | `AGENTS.md`のSDDセクションのみを更新します。 |
| `--project` | `AGENTS.md`のPROJECTセクションのみを更新します。 |
| `--dry-run` | 出力を表示するだけで、ファイルへの書き込みは行いません。 |

#### docs snapshot

```
sdd-forge docs snapshot [--dry-run]
```

現在の`docs/`ディレクトリのタイムスタンプ付きスナップショットを`.sdd-forge/snapshots/`に書き込みます。大規模なforge実行前にdocsの状態を保存する際に便利です。

#### spec init

```
sdd-forge spec init --title <title> [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

連番付きフィーチャーブランチ（`feat/NNN-<slug>`）を作成し、プリセットテンプレートから`specs/NNN-<slug>/spec.md`と`qa.md`を書き込みます。番号は既存の`specs/`サブディレクトリとgitブランチ名から導出されます。

| オプション | 説明 |
|---|---|
| `--title <text>` | ブランチ名とディレクトリ名を構成するためにスラグ化される、人間向けのタイトル。 |
| `--no-branch` | gitブランチを切り替えずにspecファイルを作成します。 |
| `--worktree` | 隔離された開発用にgit worktreeを新規作成します。 |
| `--allow-dirty` | ワーキングツリーのクリーンチェックをスキップします。 |
| `--dry-run` | ファイルやブランチを作成せず、実行内容を表示します。 |

#### spec gate

```
sdd-forge spec gate --spec <path> [--phase pre|post] [--skip-guardrail]
```

実装前または実装後に`spec.md`を検証します。未解決トークン（`[NEEDS CLARIFICATION]`、`TBD`、`TODO`、`FIXME`）、未チェックのタスク項目（`- [ ]`）、および必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）をチェックします。`guardrail.md`が存在する場合、その条項に対するAI準拠チェックも実行します。いずれかの検証に失敗すると、終了コード1で終了します。

| オプション | 説明 |
|---|---|
| `--spec <path>` | 検証する`spec.md`のパス（必須）。 |
| `--phase` | `pre`（デフォルト）はステータス/受入基準の未チェック項目をスキップ、`post`はすべてをチェックします。 |
| `--skip-guardrail` | ガードレールAI準拠チェックをスキップします。 |

#### spec guardrail

```
sdd-forge spec guardrail init  [--force] [--dry-run]
sdd-forge spec guardrail update [--agent <name>] [--dry-run]
```

`spec gate`がspecの検証に使用する不変のアーキテクチャ原則を記載した、プロジェクトの`guardrail.md`を管理します。`init`はテンプレートを書き込みます（ファイルが既に存在する場合は`--force`がないとブロックされます）。`update`は現在の`analysis.json`と既存のガードレール内容をAIエージェントに渡し、新たに提案された条項を追記します。

#### flow start

```
sdd-forge flow start --request <text> [--title <text>] [--spec <path>]
                     [--agent <name>] [--max-runs <n>] [--forge-mode local|assist|agent]
                     [--no-branch] [--worktree] [--dry-run]
```

SDDフロー全体を統括します：specを作成し（`--spec`が指定された場合はスキップ）、`spec gate`を実行し、フロー状態を`.sdd-forge/flow.json`に保存した後、指定されたリクエストをプロンプトとして`docs forge`を呼び出します。gateが失敗した場合、失敗理由（最大8行の`- `行）が表示され、終了コード2でプロセスが終了します。

| オプション | デフォルト | 説明 |
|---|---|---|
| `--request <text>` | — | ユーザーのリクエスト文（必須）。 |
| `--title <text>` | `--request`から導出 | specとブランチのタイトル。 |
| `--spec <path>` | `""` | 既存のspecパス。`spec init`をスキップします。 |
| `--agent <name>` | 設定のデフォルト | forge用のエージェント上書き。 |
| `--max-runs <n>` | `5` | forgeサイクルの最大回数。 |
| `--forge-mode` | `local` | forgeモード：`local`、`assist`、または`agent`。 |
| `--no-branch` | `false` | 新しいブランチを作成せずにspecを作成します。 |
| `--worktree` | `false` | フィーチャーブランチにgit worktreeを使用します。 |
| `--dry-run` | `false` | 変更を加えずに実行します。 |

#### flow status

```
sdd-forge flow status
sdd-forge flow status --step <id> --status <value>
sdd-forge flow status --summary '<JSON array>'
sdd-forge flow status --req <index> --status <value>
sdd-forge flow status --archive
```

`.sdd-forge/flow.json`に保存されたアクティブなSDDフロー状態を表示・変更します。オプションなしの場合、specパス、ブランチ、ステップ進捗（✓ 完了 / > 進行中 / - スキップ / 空白 未着手）、要件進捗をフォーマットして表示します。`--archive`フラグは`flow.json`をアクティブなspecディレクトリにコピーし、`.sdd-forge/`から削除します。

| オプション | 説明 |
|---|---|
| `--step <id> --status <val>` | 指定されたステップのステータスを更新します。有効なステップIDは`FLOW_STEPS`で定義されています。 |
| `--summary '<JSON>'` | 要件リストを説明文字列のJSON配列で置き換えます。 |
| `--req <index> --status <val>` | 0始まりのインデックスで指定した単一の要件を更新します。 |
| `--archive` | `flow.json`をspecディレクトリに移動し、`.sdd-forge/`から削除します。 |

#### presets list

```
sdd-forge presets list
```

プリセットの完全な継承ツリーを標準出力に表示します。ツリーは`base/`から始まり、アーキテクチャレベルのノード（`cli/`、`webapp/`、`library/`）、およびそのリーフプリセットが続きます。各ノードにはラベル、エイリアス、スキャンカテゴリキーが表示されます。
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

#### 終了コード

| コード | 意味 | 主な発生元 |
|---|---|---|
| `0` | 成功 | すべてのコマンドの正常完了。 |
| `1` | 一般エラー | 不明なサブコマンド、必須オプションの不足、ファイル未検出、AIエージェントエラー、または`spec gate`のゲートチェック失敗。 |
| `2` | ゲートブロック | `spec gate`が0以外を返した場合の`flow start`（未解決のspec項目またはガードレール違反）。 |

#### stdout / stderr の規約

sdd-forgeはコマンド全体で一貫した出力規約に従います。

| ストリーム | 内容 |
|---|---|
| **stdout** | 構造化されたユーザー向け出力：フォーマット済みテーブル、生成されたファイルパス、進捗サマリー、ヘルプテキスト、バージョン文字列。 |
| **stderr** | `[<command>]`プレフィックス付きの操作ログ行（例：`[forge]`、`[build]`、`[translate]`）、進捗バーの更新、ステップごとの警告（例：`WARN: no defaultAgent configured`）、エラーメッセージ。 |

進捗バー（`docs build`で使用）はstderrに書き込まれるため、パイプ接続時にstdout出力の機械可読性が維持されます。長時間のAI呼び出し中に表示されるエージェントのティッカードット（`.`）もstderrに出力されます。`--verbose`を受け付けるコマンドは、エージェントの生のstdoutとstderrをリアルタイムでストリーミングします。

**`--dry-run`の動作：** `--dry-run`が有効な場合、書き込み操作は抑制され、作成・変更されるはずの各ファイルに対して`DRY-RUN:`プレフィックス付きの行がstdoutに出力されます。
<!-- {{/text}} -->
