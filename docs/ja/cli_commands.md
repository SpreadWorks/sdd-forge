# 02. CLIコマンドリファレンス

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forge は22のコマンドを4つの名前空間（`docs`、`spec`、`flow`、およびスタンドアロンコマンド）に整理して公開しており、すべて単一のエントリーポイント（`sdd-forge <command>`）から呼び出します。3つの名前空間ディスパッチャー（`docs`、`spec`、`flow`）はそれぞれ最初の引数としてサブコマンドを受け取り、独立コマンド（`setup`、`upgrade`、`presets`、`help`）は名前空間プレフィックスなしで動作します。
<!-- {{/text}} -->

## Content

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `help` | 利用可能な全コマンドを説明付きで表示 | — |
| `setup` | プロジェクトを sdd-forge 用に初期化 | — |
| `upgrade` | スキルファイルを現在の sdd-forge バージョンのテンプレートに更新 | `--dry-run` |
| `docs build` | ドキュメント生成パイプライン全体を実行（scan→enrich→init→data→text→readme→agents→[translate]） | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `docs scan` | ソースコードを解析して `analysis.json` を生成 | — |
| `docs enrich` | AI が生成した役割・サマリー・章分類を `analysis.json` に付与 | `--agent` |
| `docs init` | プリセットテンプレートから `docs/` の章ファイルを初期化 | `--force`, `--dry-run` |
| `docs data` | 章ファイル内の `{{data}}` ディレクティブにデータを展開 | `--dry-run` |
| `docs text` | AI エージェント経由で章ファイルの `{{text}}` セクションを生成 | `--agent`, `--dry-run` |
| `docs readme` | docs の内容から `README.md` を生成 | `--dry-run` |
| `docs forge` | AI 編集→レビュー→フィードバックのサイクルでドキュメントを反復改善 | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--agent`, `--mode`, `--dry-run`, `--verbose` |
| `docs review` | 生成されたドキュメントの品質問題をレビュー | — |
| `docs translate` | デフォルト言語のドキュメントを設定済みの非デフォルト言語に翻訳 | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | git 履歴からチェンジログを生成 | — |
| `docs agents` | `AGENTS.md` / `CLAUDE.md` を生成または更新 | `--sdd`, `--project`, `--dry-run` |
| `docs snapshot` | 現在の docs 状態のスナップショットを作成 | `--dry-run` |
| `spec init` | 連番付きフィーチャーブランチを作成し `spec.md` / `qa.md` を初期化 | `--title`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `spec gate` | `spec.md` の未解決項目とガードレール準拠チェックを検証 | `--spec`, `--phase`, `--skip-guardrail` |
| `spec guardrail` | プロジェクトの `guardrail.md` を初期化または更新 | `init \| update`, `--agent`, `--force`, `--dry-run` |
| `flow start` | SDD フロー全体を実行: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `flow status` | アクティブな SDD フローの状態を表示または更新 | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `presets list` | 利用可能なプリセットの継承ツリーを表示 | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

以下のフラグは、サブコマンドのディスパッチが行われる前に、トップレベルのエントリーポイント（`sdd-forge.js`）が認識します。

| オプション | エイリアス | 説明 |
|---|---|---|
| `--version` | `-v`, `-V` | インストール済みの sdd-forge バージョンを表示して終了。 |
| `--help` | `-h` | コマンド一覧を表示してコード 0 で終了。引数なしで実行した場合も同じ出力になります。 |

ほとんどのサブコマンドでは、サブコマンド名の後に `--help` / `-h` をローカルで指定することもできます（例: `sdd-forge docs forge --help`）。コマンドごとのヘルプは、トップレベルのエントリーポイントではなく、各コマンド独自の引数パーサーで処理されます。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### help

```
sdd-forge help
sdd-forge          # help と同じ
sdd-forge -h
```

コマンド一覧をセクション別（Project、Docs、Spec、Flow、Info）にグループ化し、各コマンドの1行説明とともに表示します。表示言語は `.sdd-forge/config.json` の `lang` フィールドで制御され、デフォルトは `en` です。

#### setup

```
sdd-forge setup
```

プロジェクトを sdd-forge 用にブートストラップします。`.sdd-forge/` 設定ディレクトリを作成し、スターター `config.json` を書き込み、`AGENTS.md` を生成して `CLAUDE.md` シンボリックリンクを作成します。

#### upgrade

```
sdd-forge upgrade [--dry-run]
```

バンドルされたスキルファイル（`.agents/skills/*/SKILL.md` および対応する `.claude/skills/*/SKILL.md` シンボリックリンク）を、現在インストールされている sdd-forge バージョンに同梱のテンプレートと一致するように更新します。既存のシンボリックリンクは、新しい内容が書き込まれる前に実ファイルに置き換えられます。`--dry-run` を指定すると、変更内容はファイルに書き込まれず、コンソールに表示されます。また、`config.json` の `systemPromptFlag` 設定が欠落していないかチェックし、不足している場合はヒントを表示します。

#### docs build

```
sdd-forge docs build [--agent <name>] [--force] [--dry-run] [--verbose]
```

ドキュメント生成パイプライン全体を順番に実行します: `scan → enrich → init → data → text → readme → agents → [translate]`。プログレスバーで各ステップの重みを追跡します。設定の `output.isMultiLang` が `true` の場合、`translate` ステップが追加され、非デフォルト言語が生成されます。`defaultAgent` が設定されておらず `--agent` も指定されていない場合、`enrich` および `text` ステップは警告付きでスキップされます。

| オプション | 説明 |
|---|---|
| `--agent <name>` | enrich および text ステップで使用する AI エージェントを上書き。 |
| `--force` | `init` ステップに `--force` を渡す（既存の章ファイルを上書き）。 |
| `--dry-run` | ファイルへの書き込みを行わずに全ステップを実行。 |
| `--verbose` | エージェントの stdout/stderr 出力をリアルタイムで表示。 |

#### docs scan

```
sdd-forge docs scan
```

アクティブなプリセットのスキャナー設定に従ってプロジェクトのソースツリーを解析し、結果を `.sdd-forge/output/analysis.json` に書き込みます。このファイルは後続のすべてのパイプラインステップで使用されます。

#### docs enrich

```
sdd-forge docs enrich [--agent <name>]
```

`scan` が生成した生の `analysis.json` を読み込み、すべてのエントリーを1回の呼び出しで AI エージェントに渡し、各エントリーに役割・サマリー・詳細・章分類フィールドを書き戻します。`text` ステップで正確な出力を得るには enrich の実行が必要です。

#### docs init

```
sdd-forge docs init [--force] [--dry-run]
```

`docs/` ディレクトリを作成し、アクティブなプリセットのテンプレートセットから派生した章 Markdown ファイルを配置します。`--force` を指定しない限り、既存ファイルは変更されません。

#### docs data

```
sdd-forge docs data [--dry-run]
```

現在の `analysis.json` を使って対応する `DataSource` メソッドを呼び出し、章ファイル内のすべての `{{data: <source>.<method>}}` ディレクティブを解決します。結果はディレクティブと `{{/data}}` マーカーの間にインプレースで書き込まれます。

#### docs text

```
sdd-forge docs text [--agent <name>] [--dry-run]
```

章ファイル内の各 `{{text: <instruction>}}` ディレクティブに対して設定済みの AI エージェントを呼び出し、生成されたコンテンツをインプレースで書き込みます。本文テキストがまだないディレクティブ（または明示的に再生成フラグが立っているもの）のみ処理されます。

#### docs readme

```
sdd-forge docs readme [--dry-run]
```

生成された章ファイルからプロジェクトルートの `README.md` を組み立てます。管理セクション外の既存 `README.md` コンテンツは保持されます。

#### docs forge

```
sdd-forge docs forge [--prompt <text>] [--prompt-file <path>] [--spec <path>]
                     [--max-runs <n>] [--review-cmd <cmd>] [--agent <name>]
                     [--mode local|assist|agent] [--dry-run] [--verbose]
```

docs 章ファイルに対して AI 編集→レビュー→フィードバックのサイクルを反復実行します。各ラウンドでエージェントが章を書き直し、その後 `review` が実行されます。レビューに失敗したファイルは次のラウンドでエージェントに渡されます。サイクルは `--max-runs` 回（デフォルト: 3）まで繰り返されます。`--spec` を指定すると、その spec に関連する章のみが対象になります。

| オプション | デフォルト | 説明 |
|---|---|---|
| `--prompt` | `""` | エージェントへの自然言語指示。 |
| `--prompt-file` | `""` | プロンプトを含むファイルへのパス。 |
| `--spec` | `""` | `spec.md` へのパス。関連する章にスコープを限定します。 |
| `--max-runs` | `3` | 編集-レビューサイクルの最大回数。 |
| `--review-cmd` | `sdd-forge review` | レビューステップで使用するコマンド。 |
| `--agent` | 設定のデフォルト | エージェント名の上書き。 |
| `--mode` | `local` | `local` は決定論的パッチ適用、`assist` は AI 提案を追加、`agent` は AI に完全委譲。 |
| `--dry-run` | `false` | ファイル書き込みをスキップ。 |
| `--verbose` | `false` | エージェントの出力を stderr にストリーム。 |

#### docs review

```
sdd-forge docs review
```

`docs/` 章ファイルの現在の状態をプロジェクトの `review-checklist.md` と照合し、通過しない項目を報告します。レビューが失敗した場合、終了コードはゼロ以外になります。

#### docs translate

```
sdd-forge docs translate [--lang <code>] [--force] [--dry-run]
```

`output.languages` 設定配列に記載されたすべての非デフォルト言語に、章ファイルと `README.md` をデフォルト言語から翻訳します。mtime 比較を使用して既に最新のファイルをスキップします。`output.mode` が `"translate"` の場合のみ有効です。

| オプション | 説明 |
|---|---|
| `--lang <code>` | 翻訳対象を単一のターゲット言語に限定。 |
| `--force` | mtime に関わらず全ファイルを再翻訳。 |
| `--dry-run` | 書き込みを行わずに翻訳対象を表示。 |

#### docs changelog

```
sdd-forge docs changelog
```

git コミット履歴から `docs/changelog.md` を生成または更新し、エントリーをバージョンタグでグループ化します。

#### docs agents

```
sdd-forge docs agents [--sdd] [--project] [--dry-run]
```

`AGENTS.md`（および `CLAUDE.md` シンボリックリンク）を、SDD ワークフロー手順とプロジェクト固有のコンテキストで作成または更新します。`--sdd` も `--project` も指定しない場合、両方のセクションが処理されます。

| オプション | 説明 |
|---|---|
| `--sdd` | `AGENTS.md` の SDD セクションのみ更新。 |
| `--project` | `AGENTS.md` の PROJECT セクションのみ更新。 |
| `--dry-run` | 書き込みを行わずに出力を表示。 |

#### docs snapshot

```
sdd-forge docs snapshot [--dry-run]
```

現在の `docs/` ディレクトリのタイムスタンプ付きスナップショットを `.sdd-forge/snapshots/` に書き込みます。大規模な forge 実行前に docs の状態を保存するのに便利です。

#### spec init

```
sdd-forge spec init --title <title> [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

連番付きフィーチャーブランチ（`feat/NNN-<slug>`）を作成し、プリセットテンプレートから `specs/NNN-<slug>/spec.md` と `qa.md` を書き込みます。数値インデックスは既存の `specs/` サブディレクトリと git ブランチ名から導出されます。

| オプション | 説明 |
|---|---|
| `--title <text>` | 人間が読めるタイトル。スラグ化されてブランチ名とディレクトリ名に使用されます。 |
| `--no-branch` | git ブランチを切り替えずに spec ファイルのみ作成。 |
| `--worktree` | 独立した開発のために新しい git ワークツリーを作成。 |
| `--allow-dirty` | ワーキングツリーのクリーン性チェックをスキップ。 |
| `--dry-run` | ファイルやブランチを作成せずにアクションを表示。 |

#### spec gate

```
sdd-forge spec gate --spec <path> [--phase pre|post] [--skip-guardrail]
```

実装前後に `spec.md` を検証します。未解決のトークン（`[NEEDS CLARIFICATION]`、`TBD`、`TODO`、`FIXME`）、未チェックのタスクアイテム（`- [ ]`）、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）を確認します。`guardrail.md` が存在する場合、そのアーティクルに対する AI 準拠チェックも実行します。失敗時は終了コード 1 で終了します。

| オプション | 説明 |
|---|---|
| `--spec <path>` | 検証する `spec.md` へのパス（必須）。 |
| `--phase` | `pre`（デフォルト）はステータス/承認の未チェック項目をスキップ。`post` はすべてを確認。 |
| `--skip-guardrail` | ガードレール AI 準拠チェックをスキップ。 |

#### spec guardrail

```
sdd-forge spec guardrail init  [--force] [--dry-run]
sdd-forge spec guardrail update [--agent <name>] [--dry-run]
```

`spec gate` が spec の検証に使用する不変のアーキテクチャ原則を一覧した、プロジェクトの `guardrail.md` を管理します。`init` はテンプレートを書き込みます（`--force` を指定しない限り、ファイルが既に存在する場合はブロックされます）。`update` は現在の `analysis.json` と既存のガードレールコンテンツを AI エージェントに渡し、新たに提案されたアーティクルを追記します。

#### flow start

```
sdd-forge flow start --request <text> [--title <text>] [--spec <path>]
                     [--agent <name>] [--max-runs <n>] [--forge-mode local|assist|agent]
                     [--no-branch] [--worktree] [--dry-run]
```

SDD フロー全体をオーケストレーションします: spec を作成し（`--spec` が指定されている場合はスキップ）、`spec gate` を実行し、フロー状態を `.sdd-forge/flow.json` に保存してから、指定されたリクエストをプロンプトとして `docs forge` を呼び出します。ゲートが失敗した場合、失敗理由（最大8行の `- ` 行）を表示して終了コード 2 で終了します。

| オプション | デフォルト | 説明 |
|---|---|---|
| `--request <text>` | — | ユーザーリクエストテキスト（必須）。 |
| `--title <text>` | `--request` から導出 | spec とブランチのタイトル。 |
| `--spec <path>` | `""` | 既存の spec パス。`spec init` をスキップします。 |
| `--agent <name>` | 設定のデフォルト | forge 用のエージェント上書き。 |
| `--max-runs <n>` | `5` | forge サイクルの最大回数。 |
| `--forge-mode` | `local` | forge モード: `local`、`assist`、または `agent`。 |
| `--no-branch` | `false` | 新しいブランチを作成せずに spec を作成。 |
| `--worktree` | `false` | フィーチャーブランチに git ワークツリーを使用。 |
| `--dry-run` | `false` | 変更を加えずに実行。 |

#### flow status

```
sdd-forge flow status
sdd-forge flow status --step <id> --status <value>
sdd-forge flow status --summary '<JSON array>'
sdd-forge flow status --req <index> --status <value>
sdd-forge flow status --archive
```

`.sdd-forge/flow.json` に保存されているアクティブな SDD フローの状態を表示または変更します。オプションなしで実行すると、spec パス、ブランチ、ステップの進捗（✓ 完了 / > 進行中 / - スキップ / スペース 保留）、および要件の進捗を示すフォーマット済みサマリーを表示します。`--archive` フラグは `flow.json` をアクティブな spec ディレクトリにコピーし、`.sdd-forge/` から削除します。

| オプション | 説明 |
|---|---|
| `--step <id> --status <val>` | 指定したステップの名前のステータスを更新。有効なステップ ID は `FLOW_STEPS` で定義されています。 |
| `--summary '<JSON>'` | 要件リストを JSON 文字列配列で置き換え。 |
| `--req <index> --status <val>` | ゼロベースのインデックスで単一の要件を更新。 |
| `--archive` | `flow.json` を spec ディレクトリに移動し、`.sdd-forge/` から削除。 |

#### presets list

```
sdd-forge presets list
```

プリセットの継承ツリー全体を stdout に表示します。ツリーは `base/` から始まり、アーキテクチャレベルのノード（`cli/`、`webapp/`、`library/`）、そしてそのリーフプリセットへと続きます。各ノードにはラベル、エイリアス、スキャンカテゴリキーが表示されます。
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

#### 終了コード

| コード | 意味 | 典型的な発生元 |
|---|---|---|
| `0` | 成功 | 任意のコマンドの正常完了。 |
| `1` | 一般エラー | 不明なサブコマンド、必須オプションの欠落、ファイルが見つからない、AI エージェントエラー、または `spec gate` でのゲートチェック失敗。 |
| `2` | ゲートブロック | `spec gate` がゼロ以外を返した場合（未解決の spec 項目またはガードレール失敗）の `flow start`。 |

#### stdout / stderr の規約

sdd-forge はコマンド間で一貫した出力規約に従います。

| ストリーム | コンテンツ |
|---|---|
| **stdout** | 構造化されたユーザー向け出力: フォーマット済みテーブル、生成されたファイルパス、進捗サマリー、ヘルプテキスト、バージョン文字列。 |
| **stderr** | `[<command>]` プレフィックス付きの操作ログ行（例: `[forge]`、`[build]`、`[translate]`）、プログレスバーの更新、ステップごとの警告（例: `WARN: no defaultAgent configured`）、エラーメッセージ。 |

プログレスバー（`docs build` で使用）は、パイプ経由の場合に stdout 出力が機械可読なままになるよう stderr に書き込まれます。長時間の AI 呼び出し中に書き込まれるエージェントのティッカードット（`.`）も stderr に出力されます。`--verbose` を受け付けるコマンドは、エージェントの生の stdout および stderr をリアルタイムでストリームします。

**`--dry-run` の動作:** `--dry-run` が有効な場合、書き込み操作は抑制され、作成または変更されるはずだったファイルごとに `DRY-RUN:` プレフィックス付きの行が stdout に表示されます。
<!-- {{/text}} -->
