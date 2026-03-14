# 02. CLIコマンドリファレンス

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forge は22のコマンドを4つの名前空間（`docs`、`spec`、`flow`、およびスタンドアロンコマンド）に整理して公開しており、すべて単一のエントリポイント（`sdd-forge <command>`）から呼び出します。3つの名前空間ディスパッチャー（`docs`、`spec`、`flow`）は最初の引数としてサブコマンドを受け取り、独立コマンド（`setup`、`upgrade`、`presets`、`help`）は名前空間プレフィックスなしで動作します。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| コマンド | 説明 | 主要オプション |
|---|---|---|
| `help` | 利用可能な全コマンドを説明付きで表示する | — |
| `setup` | sdd-forge 用にプロジェクトを初期化する | — |
| `upgrade` | スキルファイルを現在の sdd-forge バージョンのテンプレートに更新する | `--dry-run` |
| `docs build` | ドキュメント生成パイプライン全体を実行する（scan→enrich→init→data→text→readme→agents→[translate]） | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `docs scan` | ソースコードを解析して `analysis.json` を生成する | — |
| `docs enrich` | AI が生成した役割・概要・章分類フィールドで `analysis.json` を補完する | `--agent` |
| `docs init` | プリセットテンプレートから `docs/` の章ファイルを初期化する | `--force`, `--dry-run` |
| `docs data` | 章ファイル内の `{{data}}` ディレクティブを展開する | `--dry-run` |
| `docs text` | AI エージェントを使って章ファイル内の `{{text}}` セクションを生成する | `--agent`, `--dry-run` |
| `docs readme` | docs の内容から `README.md` を生成する | `--dry-run` |
| `docs forge` | AI による編集→レビュー→フィードバックサイクルでドキュメントを反復改善する | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--agent`, `--mode`, `--dry-run`, `--verbose` |
| `docs review` | 生成されたドキュメントの品質問題をレビューする | — |
| `docs translate` | デフォルト言語の docs を設定済みの非デフォルト言語へ翻訳する | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | git 履歴からチェンジログを生成する | — |
| `docs agents` | `AGENTS.md` / `CLAUDE.md` を生成または更新する | `--sdd`, `--project`, `--dry-run` |
| `docs snapshot` | 現在の docs 状態のスナップショットを作成する | `--dry-run` |
| `spec init` | 連番付きフィーチャーブランチを作成し、`spec.md` / `qa.md` を初期化する | `--title`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `spec gate` | `spec.md` の未解決項目とガードレール準拠チェックを検証する | `--spec`, `--phase`, `--skip-guardrail` |
| `spec guardrail` | プロジェクトの `guardrail.md` を初期化または更新する | `init \| update`, `--agent`, `--force`, `--dry-run` |
| `flow start` | SDD フロー全体を実行する: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `flow status` | アクティブな SDD フロー状態を表示または更新する | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `presets list` | 利用可能なプリセットの継承ツリーを表示する | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

以下のフラグは、サブコマンドのディスパッチが行われる前にトップレベルエントリポイント（`sdd-forge.js`）で認識されます。

| オプション | エイリアス | 説明 |
|---|---|---|
| `--version` | `-v`, `-V` | インストール済みの sdd-forge バージョンを表示して終了する。 |
| `--help` | `-h` | コマンド一覧を表示してコード 0 で終了する。引数なしで実行した場合も同じ出力になる。 |

ほとんどのサブコマンドでは、サブコマンド名の後に `--help` / `-h` をローカルで指定できます（例: `sdd-forge docs forge --help`）。このコマンドごとのヘルプは、トップレベルエントリポイントではなく各コマンド自身の引数パーサーが処理します。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### help

```
sdd-forge help
sdd-forge          # help と同じ
sdd-forge -h
```

コマンド一覧をセクション別（Project、Docs、Spec、Flow、Info）に一行の説明付きで表示します。表示言語は `.sdd-forge/config.json` の `lang` フィールドで制御され、デフォルトは `en` です。

#### setup

```
sdd-forge setup
```

新規プロジェクトを sdd-forge 用にブートストラップします。`.sdd-forge/` 設定ディレクトリを作成し、スターター `config.json` を書き込み、`AGENTS.md` を生成して、`CLAUDE.md` シンボリックリンクを作成します。

#### upgrade

```
sdd-forge upgrade [--dry-run]
```

バンドルされたスキルファイル（`.agents/skills/*/SKILL.md` および対応する `.claude/skills/*/SKILL.md` シンボリックリンク）を、現在インストールされている sdd-forge バージョンに同梱のテンプレートと一致するように更新します。既存のシンボリックリンクは新しい内容が書き込まれる前に実ファイルに置き換えられます。`--dry-run` を指定すると、変更内容はファイルに書き込まれずコンソールに出力されます。このコマンドは `config.json` の `systemPromptFlag` 設定の欠落もチェックし、未設定のものがあればヒントを表示します。

#### docs build

```
sdd-forge docs build [--agent <name>] [--force] [--dry-run] [--verbose]
```

ドキュメント生成パイプラインを順番に実行します: `scan → enrich → init → data → text → readme → agents → [translate]`。プログレスバーが各ステップの重みを追跡します。設定で `output.isMultiLang` が `true` の場合、`translate` ステップが追加されて非デフォルト言語が生成されます。`defaultAgent` が設定されておらず `--agent` も指定されていない場合、`enrich` と `text` ステップは警告付きでスキップされます。

| オプション | 説明 |
|---|---|
| `--agent <name>` | enrich および text ステップ用の AI エージェントを上書きする。 |
| `--force` | `init` ステップに `--force` を渡す（既存の章ファイルを上書きする）。 |
| `--dry-run` | ファイルを書き込まずに全ステップを実行する。 |
| `--verbose` | エージェントの stdout/stderr 出力をリアルタイムで表示する。 |

#### docs scan

```
sdd-forge docs scan
```

アクティブなプリセットのスキャナー設定に従ってプロジェクトのソースツリーを解析し、`.sdd-forge/output/analysis.json` に結果を書き込みます。このファイルはその後の全パイプラインステップで使用されます。

#### docs enrich

```
sdd-forge docs enrich [--agent <name>]
```

`scan` が生成した生の `analysis.json` を読み込み、全エントリーを1回の呼び出しで AI エージェントに渡し、各エントリーに役割・概要・詳細・章分類フィールドを書き戻します。`text` ステップが正確な出力を生成するためには enrich が必要です。

#### docs init

```
sdd-forge docs init [--force] [--dry-run]
```

`docs/` ディレクトリを作成し、アクティブなプリセットのテンプレートセットから派生した章 Markdown ファイルを配置します。`--force` を指定しない限り、既存ファイルはそのまま保持されます。

#### docs data

```
sdd-forge docs data [--dry-run]
```

現在の `analysis.json` を使って対応する `DataSource` メソッドを呼び出し、章ファイル内の `{{data: <source>.<method>}}` ディレクティブをすべて解決します。結果はディレクティブと `{{/data}}` マーカーの間にインプレースで書き込まれます。

#### docs text

```
sdd-forge docs text [--agent <name>] [--dry-run]
```

章ファイル内で見つかった各 `{{text: <instruction>}}` ディレクティブに対して設定済みの AI エージェントを呼び出し、生成されたコンテンツをインプレースで書き込みます。本文テキストがまだないディレクティブ（または明示的に再生成フラグが立っているもの）のみ処理されます。

#### docs readme

```
sdd-forge docs readme [--dry-run]
```

生成された章ファイルからプロジェクトルートの `README.md` を組み立てます。管理セクション外の既存 `README.md` の内容は保持されます。

#### docs forge

```
sdd-forge docs forge [--prompt <text>] [--prompt-file <path>] [--spec <path>]
                     [--max-runs <n>] [--review-cmd <cmd>] [--agent <name>]
                     [--mode local|assist|agent] [--dry-run] [--verbose]
```

docs 章ファイルに対して AI による編集→レビュー→フィードバックサイクルを反復実行します。各ラウンドでエージェントが章を書き直した後、`review` が実行され、レビューに失敗したファイルが次のラウンドのためにエージェントに返されます。サイクルは `--max-runs` 回（デフォルト: 3）まで繰り返されます。`--spec` を指定した場合、その spec に関連する章のみが対象になります。

| オプション | デフォルト | 説明 |
|---|---|---|
| `--prompt` | `""` | エージェントへの自然言語指示。 |
| `--prompt-file` | `""` | プロンプトを含むファイルのパス。 |
| `--spec` | `""` | `spec.md` のパス。関連する章にスコープを限定する。 |
| `--max-runs` | `3` | 最大編集-レビューサイクル数。 |
| `--review-cmd` | `sdd-forge review` | レビューステップで使用するコマンド。 |
| `--agent` | config のデフォルト | エージェント名の上書き。 |
| `--mode` | `local` | `local` は決定論的なパッチ適用を使用。`assist` は AI の提案を追加。`agent` は AI に完全に委任。 |
| `--dry-run` | `false` | ファイル書き込みをスキップする。 |
| `--verbose` | `false` | エージェントの出力を stderr にストリームする。 |

#### docs review

```
sdd-forge docs review
```

現在の `docs/` 章ファイルの状態をプロジェクトの `review-checklist.md` と照合し、合格しない項目を報告します。レビューに失敗した場合、終了コードは非ゼロになります。

#### docs translate

```
sdd-forge docs translate [--lang <code>] [--force] [--dry-run]
```

`output.languages` 設定配列に列挙された非デフォルト言語すべてに対して、章ファイルと `README.md` をデフォルト言語から翻訳します。mtime の比較により最新のファイルはスキップされます。`output.mode` が `"translate"` の場合のみ有効です。

| オプション | 説明 |
|---|---|
| `--lang <code>` | 翻訳を単一のターゲット言語に限定する。 |
| `--force` | mtime に関係なく全ファイルを再翻訳する。 |
| `--dry-run` | 書き込みを行わずに翻訳対象を表示する。 |

#### docs changelog

```
sdd-forge docs changelog
```

git コミット履歴からバージョンタグ別にエントリーをグループ化して `docs/changelog.md` を生成または更新します。

#### docs agents

```
sdd-forge docs agents [--sdd] [--project] [--dry-run]
```

SDD ワークフロー指示とプロジェクト固有のコンテキストを含む `AGENTS.md`（および `CLAUDE.md` シンボリックリンク）を作成または更新します。`--sdd` も `--project` も指定しない場合、両方のセクションが処理されます。

| オプション | 説明 |
|---|---|
| `--sdd` | `AGENTS.md` の SDD セクションのみ更新する。 |
| `--project` | `AGENTS.md` の PROJECT セクションのみ更新する。 |
| `--dry-run` | 書き込みを行わずに出力を表示する。 |

#### docs snapshot

```
sdd-forge docs snapshot [--dry-run]
```

現在の `docs/` ディレクトリのタイムスタンプ付きスナップショットを `.sdd-forge/snapshots/` に書き込みます。大規模な forge 実行前に docs の状態を保存するのに便利です。

#### spec init

```
sdd-forge spec init --title <title> [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

連番付きフィーチャーブランチ（`feat/NNN-<slug>`）を作成し、プリセットテンプレートから `specs/NNN-<slug>/spec.md` と `qa.md` を書き込みます。数値インデックスは既存の `specs/` サブディレクトリと git ブランチ名から算出されます。

| オプション | 説明 |
|---|---|
| `--title <text>` | 人が読める形式のタイトル。ブランチ名とディレクトリ名を形成するためにスラッグ化される。 |
| `--no-branch` | git ブランチを切り替えずに spec ファイルを作成する。 |
| `--worktree` | 隔離された開発のために新しい git ワークツリーを作成する。 |
| `--allow-dirty` | ワーキングツリーのクリーンさチェックをスキップする。 |
| `--dry-run` | ファイルやブランチを作成せずにアクションを表示する。 |

#### spec gate

```
sdd-forge spec gate --spec <path> [--phase pre|post] [--skip-guardrail]
```

実装の前後に `spec.md` を検証します。未解決トークン（`[NEEDS CLARIFICATION]`、`TBD`、`TODO`、`FIXME`）、未チェックのタスク項目（`- [ ]`）、および必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）を確認します。`guardrail.md` が存在する場合、その条項に対して AI 準拠チェックも実行します。いずれかの失敗でコード 1 で終了します。

| オプション | 説明 |
|---|---|
| `--spec <path>` | 検証する `spec.md` のパス（必須）。 |
| `--phase` | `pre`（デフォルト）はステータス/受け入れの未チェック項目をスキップ。`post` はすべてをチェック。 |
| `--skip-guardrail` | ガードレール AI 準拠チェックをスキップする。 |

#### spec guardrail

```
sdd-forge spec guardrail init  [--force] [--dry-run]
sdd-forge spec guardrail update [--agent <name>] [--dry-run]
```

`spec gate` が spec を検証するために使用する不変のアーキテクチャ原則を列挙したプロジェクトの `guardrail.md` を管理します。`init` はテンプレートを書き込みます（`--force` なしでファイルが既に存在する場合はブロックされます）。`update` は現在の `analysis.json` と既存のガードレール内容を AI エージェントに渡し、新たに提案された条項を追記します。

#### flow start

```
sdd-forge flow start --request <text> [--title <text>] [--spec <path>]
                     [--agent <name>] [--max-runs <n>] [--forge-mode local|assist|agent]
                     [--no-branch] [--worktree] [--dry-run]
```

SDD フロー全体をオーケストレーションします: spec を作成し（`--spec` が指定された場合はスキップ）、`spec gate` を実行し、フロー状態を `.sdd-forge/flow.json` に保存した後、指定されたリクエストをプロンプトとして `docs forge` を呼び出します。ゲートが失敗した場合、失敗理由（最大 8 件の `- ` 行）が表示されてコード 2 で終了します。

| オプション | デフォルト | 説明 |
|---|---|---|
| `--request <text>` | — | ユーザーリクエストテキスト（必須）。 |
| `--title <text>` | `--request` から派生 | spec とブランチのタイトル。 |
| `--spec <path>` | `""` | 既存の spec パス。`spec init` をスキップする。 |
| `--agent <name>` | config のデフォルト | forge 用のエージェント上書き。 |
| `--max-runs <n>` | `5` | 最大 forge サイクル数。 |
| `--forge-mode` | `local` | forge モード: `local`、`assist`、または `agent`。 |
| `--no-branch` | `false` | 新しいブランチなしで spec を作成する。 |
| `--worktree` | `false` | フィーチャーブランチに git ワークツリーを使用する。 |
| `--dry-run` | `false` | 変更を加えずに実行する。 |

#### flow status

```
sdd-forge flow status
sdd-forge flow status --step <id> --status <value>
sdd-forge flow status --summary '<JSON array>'
sdd-forge flow status --req <index> --status <value>
sdd-forge flow status --archive
```

`.sdd-forge/flow.json` に保存されたアクティブな SDD フロー状態を表示または変更します。オプションなしで実行すると、spec パス、ブランチ、ステップの進捗（✓ 完了 / > 進行中 / - スキップ / スペース 保留）、要件の進捗を示すフォーマット済みサマリーが表示されます。`--archive` フラグは `flow.json` をアクティブな spec ディレクトリにコピーして `.sdd-forge/` から削除します。

| オプション | 説明 |
|---|---|
| `--step <id> --status <val>` | 指定したステップの名前付きステータスを更新する。有効なステップ ID は `FLOW_STEPS` で定義される。 |
| `--summary '<JSON>'` | 要件リストを説明文字列の JSON 配列で置き換える。 |
| `--req <index> --status <val>` | ゼロ始まりのインデックスで単一の要件を更新する。 |
| `--archive` | `flow.json` を spec ディレクトリに移動して `.sdd-forge/` からクリアする。 |

#### presets list

```
sdd-forge presets list
```

プリセットの完全な継承ツリーを stdout に表示します。ツリーは `base/` から始まり、アーキテクチャレベルのノード（`cli/`、`webapp/`、`library/`）とそのリーフプリセットが続きます。各ノードにはラベル、エイリアス、スキャンカテゴリキーが表示されます。
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

#### 終了コード

| コード | 意味 | 典型的な発生源 |
|---|---|---|
| `0` | 成功 | 任意コマンドの正常完了。 |
| `1` | 一般エラー | 不明なサブコマンド、必須オプションの欠落、ファイルが見つからない、AI エージェントエラー、または `spec gate` のゲートチェック失敗。 |
| `2` | ゲートブロック | `spec gate` が非ゼロを返した場合（未解決の spec 項目またはガードレール失敗）の `flow start`。 |

#### stdout / stderr の規約

sdd-forge は全コマンドで一貫した出力規約に従います。

| ストリーム | 内容 |
|---|---|
| **stdout** | 構造化されたユーザー向け出力: フォーマット済みテーブル、生成されたファイルパス、進捗サマリー、ヘルプテキスト、バージョン文字列。 |
| **stderr** | `[<command>]` プレフィックス付きの操作ログ行（例: `[forge]`、`[build]`、`[translate]`）、プログレスバーの更新、ステップごとの警告（例: `WARN: no defaultAgent configured`）、エラーメッセージ。 |

プログレスバー（`docs build` で使用）は、パイプ時に stdout の出力を機械可読なまま保つために stderr に書き込まれます。長時間の AI 呼び出し中に書き込まれるエージェントのティッカードット（`.`）も stderr に出力されます。`--verbose` を受け付けるコマンドは、エージェントの生の stdout と stderr をリアルタイムでストリームします。

**`--dry-run` の動作:** `--dry-run` が有効な場合、書き込み操作は抑制され、作成または変更されるはずだったファイルごとに `DRY-RUN:` プレフィックス付きの行が stdout に表示されます。
<!-- {{/text}} -->
