# 02. CLI コマンドリファレンス

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

sdd-forge は 22 個のコマンドを公開しており、`docs`、`spec`、`flow`、および独立コマンドの 4 つの名前空間に整理されています。いずれも単一のエントリポイント（`sdd-forge <command>`）から呼び出し、3 つの名前空間ディスパッチャー（`docs`、`spec`、`flow`）は第 1 引数にサブコマンドを受け取り、独立コマンド（`setup`、`upgrade`、`presets`、`help`）は名前空間プレフィックスなしで動作します。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| Command | 説明 | 主なオプション |
|---|---|---|
| `help` | 利用可能なすべてのコマンドを説明付きで表示する | — |
| `setup` | プロジェクトを sdd-forge 用に初期化する | — |
| `upgrade` | スキルファイルを現在の sdd-forge バージョンのテンプレートに更新する | `--dry-run` |
| `docs build` | 完全なドキュメント生成パイプラインを実行する（scan→enrich→init→data→text→readme→agents→[translate]） | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `docs scan` | ソースコードを走査して `analysis.json` を生成する | — |
| `docs enrich` | `analysis.json` に AI 生成のロール、要約、章分類を追加する | `--agent` |
| `docs init` | プリセットテンプレートから `docs/` の章ファイルを初期化する | `--force`, `--dry-run` |
| `docs data` | 章ファイル内の `{{data}}` ディレクティブを埋める | `--dry-run` |
| `docs text` | 章ファイル内の `{{text}}` セクションを AI エージェントで生成する | `--agent`, `--dry-run` |
| `docs readme` | docs の内容から `README.md` を生成する | `--dry-run` |
| `docs forge` | AI による編集 → レビュー → フィードバックの反復で docs を改善する | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--agent`, `--mode`, `--dry-run`, `--verbose` |
| `docs review` | 生成されたドキュメントの品質上の問題をレビューする | — |
| `docs translate` | 既定言語の docs を設定済みの非既定言語に翻訳する | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | git の履歴から changelog を生成する | — |
| `docs agents` | `AGENTS.md` / `CLAUDE.md` を生成または更新する | `--sdd`, `--project`, `--dry-run` |
| `docs snapshot` | 現在の docs の状態をスナップショットとして保存する | `--dry-run` |
| `spec init` | 番号付きの feature ブランチを作成し、`spec.md` / `qa.md` を初期化する | `--title`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `spec gate` | `spec.md` の未解決項目を検証し、guardrail 準拠チェックを実行する | `--spec`, `--phase`, `--skip-guardrail` |
| `spec guardrail` | プロジェクトの `guardrail.md` を初期化または更新する | `init \| update`, `--agent`, `--force`, `--dry-run` |
| `flow start` | 完全な SDD フローを実行する: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `flow status` | 現在の SDD フロー状態を表示または更新する | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `presets list` | 利用可能なプリセット継承ツリーを表示する | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

以下のフラグは、サブコマンドのディスパッチ前にトップレベルのエントリポイント（`sdd-forge.js`）で認識されます。

| Option | Aliases | 説明 |
|---|---|---|
| `--version` | `-v`, `-V` | インストールされている sdd-forge のバージョンを表示して終了します。 |
| `--help` | `-h` | コマンド一覧を表示し、終了コード 0 で終了します。引数を指定しない場合も同じ出力になります。 |

多くのサブコマンドは、サブコマンド名の後ろでも `--help` / `-h` を受け付けます（例: `sdd-forge docs forge --help`）。このコマンドごとのヘルプは、トップレベルのエントリポイントではなく、各コマンド自身の引数パーサーで処理されます。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### help

```
sdd-forge help
sdd-forge          # help と同じ
sdd-forge -h
```

セクションごと（Project、Docs、Spec、Flow、Info）にまとめた完全なコマンド一覧と、それぞれの 1 行説明を表示します。表示言語は `.sdd-forge/config.json` の `lang` フィールドで制御され、既定値は `en` です。

#### setup

```
sdd-forge setup
```

新しいプロジェクトを sdd-forge 用にセットアップします。`.sdd-forge/` 設定ディレクトリを作成し、初期 `config.json` を書き出し、`AGENTS.md` を生成し、`CLAUDE.md` のシンボリックリンクを作成します。

#### upgrade

```
sdd-forge upgrade [--dry-run]
```

同梱されているスキルファイル（`.agents/skills/*/SKILL.md` と対応する `.claude/skills/*/SKILL.md` のシンボリックリンク）を、現在インストールされている sdd-forge バージョンに含まれるテンプレートに合わせて更新します。既存のシンボリックリンクは、新しい内容を書き込む前に実ファイルへ置き換えられます。`--dry-run` を指定した場合、変更内容は書き込まずにコンソールへ表示します。また、このコマンドは `config.json` に `systemPromptFlag` の未設定がないか確認し、欠けている場合はヒントを表示します。

#### docs build

```
sdd-forge docs build [--agent <name>] [--force] [--dry-run] [--verbose]
```

完全なドキュメント生成パイプラインを、`scan → enrich → init → data → text → readme → agents → [translate]` の順で実行します。各ステップの重みに応じた進捗バーが表示されます。設定で `output.isMultiLang` が `true` の場合は `translate` ステップが追加され、既定以外の言語も生成されます。`defaultAgent` が設定されておらず、かつ `--agent` も指定されていない場合は、`enrich` と `text` の両ステップは警告付きでスキップされます。

| Option | 説明 |
|---|---|
| `--agent <name>` | enrich と text ステップで使う AI エージェントを上書きします。 |
| `--force` | `init` ステップへ `--force` を渡します（既存の章ファイルを上書き）。 |
| `--dry-run` | ファイルを書き込まずに全ステップを実行します。 |
| `--verbose` | エージェントの stdout/stderr をリアルタイムで表示します。 |

#### docs scan

```
sdd-forge docs scan
```

有効なプリセットのスキャナー設定に従ってプロジェクトのソースツリーを解析し、その結果を `.sdd-forge/output/analysis.json` に書き出します。このファイルは後続のすべてのパイプラインステップで使用されます。

#### docs enrich

```
sdd-forge docs enrich [--agent <name>]
```

`scan` で生成された生の `analysis.json` を読み込み、全エントリを 1 回の呼び出しで AI エージェントへ渡し、各エントリに role、summary、detail、chapter-classification の各フィールドを書き戻します。`text` ステップで正確な出力を得るには、この enrich が必要です。

#### docs init

```
sdd-forge docs init [--force] [--dry-run]
```

`docs/` ディレクトリを作成し、有効なプリセットのテンプレート群から生成した章 Markdown ファイルを配置します。既存ファイルは、`--force` を指定しない限り変更されません。

#### docs data

```
sdd-forge docs data [--dry-run]
```

章ファイル内のすべての `{{data: <source>.<method>}}` ディレクティブを、現在の `analysis.json` を使って対応する `DataSource` メソッドを呼び出して解決します。結果は、ディレクティブと `{{/data}}` マーカーの間にその場で書き込まれます。

#### docs text

```
sdd-forge docs text [--agent <name>] [--dry-run]
```

章ファイル内にある各 `{{text: <instruction>}}` ディレクティブについて、設定された AI エージェントを呼び出し、生成結果をその場に書き込みます。まだ本文がないディレクティブ、または明示的に再生成対象として指定されたものだけが処理されます。

#### docs readme

```
sdd-forge docs readme [--dry-run]
```

生成済みの章ファイルをもとに、プロジェクトルートへ `README.md` を組み立てます。管理対象セクションの外にある既存の `README.md` 内容は保持されます。

#### docs forge

```
sdd-forge docs forge [--prompt <text>] [--prompt-file <path>] [--spec <path>]
                     [--max-runs <n>] [--review-cmd <cmd>] [--agent <name>]
                     [--mode local|assist|agent] [--dry-run] [--verbose]
```

docs の章ファイルに対して、AI による編集 → レビュー → フィードバックの反復サイクルを実行します。各ラウンドでは、まずエージェントが章を書き換え、その後 `review` を実行します。レビューに通らなかったファイルは、次のラウンドで再度エージェントへ渡されます。このサイクルは `--max-runs` 回（既定値: 3）まで繰り返されます。`--spec` を指定した場合は、その spec に関係する章だけが対象になります。

| Option | Default | 説明 |
|---|---|---|
| `--prompt` | `""` | エージェントへの自然言語の指示です。 |
| `--prompt-file` | `""` | プロンプトを含むファイルへのパスです。 |
| `--spec` | `""` | `spec.md` へのパスです。対象を関連章に限定します。 |
| `--max-runs` | `3` | 編集とレビューの最大反復回数です。 |
| `--review-cmd` | `sdd-forge review` | レビューステップの実行に使うコマンドです。 |
| `--agent` | config default | エージェント名を上書きします。 |
| `--mode` | `local` | `local` は決定的なパッチ適用、`assist` は AI の提案を追加、`agent` は全面的に AI へ委譲します。 |
| `--dry-run` | `false` | ファイルの書き込みを行いません。 |
| `--verbose` | `false` | エージェント出力を stderr にストリームします。 |

#### docs review

```
sdd-forge docs review
```

現在の `docs/` の章ファイルを、プロジェクトの `review-checklist.md` に照らして確認し、合格しない項目を報告します。レビューが失敗した場合、終了コードは非 0 になります。

#### docs translate

```
sdd-forge docs translate [--lang <code>] [--force] [--dry-run]
```

章ファイルと `README.md` を、既定言語から `output.languages` 設定配列に含まれるすべての非既定言語へ翻訳します。翻訳では mtime の比較を使い、すでに最新のファイルはスキップします。動作するのは `output.mode` が `"translate"` のときだけです。

| Option | 説明 |
|---|---|
| `--lang <code>` | 翻訳対象を 1 つの言語に限定します。 |
| `--force` | mtime に関係なくすべてのファイルを再翻訳します。 |
| `--dry-run` | 書き込まずに、何を翻訳するかを表示します。 |

#### docs changelog

```
sdd-forge docs changelog
```

git のコミット履歴から `docs/changelog.md` を生成または更新し、エントリをバージョンタグごとにまとめます。

#### docs agents

```
sdd-forge docs agents [--sdd] [--project] [--dry-run]
```

SDD ワークフローの手順とプロジェクト固有の文脈を含む `AGENTS.md`（および `CLAUDE.md` のシンボリックリンク）を作成または更新します。`--sdd` と `--project` のどちらも指定しない場合は、両方のセクションを処理します。

| Option | 説明 |
|---|---|
| `--sdd` | `AGENTS.md` の SDD セクションだけを更新します。 |
| `--project` | `AGENTS.md` の PROJECT セクションだけを更新します。 |
| `--dry-run` | 書き込まずに出力内容を表示します。 |

#### docs snapshot

```
sdd-forge docs snapshot [--dry-run]
```

現在の `docs/` ディレクトリのタイムスタンプ付きスナップショットを `.sdd-forge/snapshots/` に書き出します。大規模な forge 実行前に docs の状態を保存しておく用途に向いています。

#### spec init

```
sdd-forge spec init --title <title> [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

連番付き feature ブランチ（`feat/NNN-<slug>`）を作成し、プリセットテンプレートから `specs/NNN-<slug>/spec.md` と `qa.md` を書き出します。数値インデックスは、既存の `specs/` サブディレクトリと git ブランチ名から算出されます。

| Option | 説明 |
|---|---|
| `--title <text>` | 人が読めるタイトルです。slug 化されてブランチ名とディレクトリ名に使われます。 |
| `--no-branch` | git ブランチを切り替えずに spec ファイルだけを作成します。 |
| `--worktree` | 分離した開発用に新しい git worktree を作成します。 |
| `--allow-dirty` | ワーキングツリーのクリーン状態チェックを省略します。 |
| `--dry-run` | ファイルやブランチを作成せずに実行内容を表示します。 |

#### spec gate

```
sdd-forge spec gate --spec <path> [--phase pre|post] [--skip-guardrail]
```

実装前後の `spec.md` を検証します。未解決トークン（`[NEEDS CLARIFICATION]`、`TBD`、`TODO`、`FIXME`）、未チェックのタスク項目（`- [ ]`）、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）を確認します。`guardrail.md` が存在する場合は、その条項に対する AI 準拠チェックも実行します。いずれかに失敗すると終了コード 1 で終了します。

| Option | 説明 |
|---|---|
| `--spec <path>` | 検証対象の `spec.md` のパスです（必須）。 |
| `--phase` | `pre`（既定）は status/acceptance の未チェック項目を除外し、`post` はすべてを確認します。 |
| `--skip-guardrail` | guardrail の AI 準拠チェックをスキップします。 |

#### spec guardrail

```
sdd-forge spec guardrail init  [--force] [--dry-run]
sdd-forge spec guardrail update [--agent <name>] [--dry-run]
```

`spec gate` が spec を検証する際に使う、不変のアーキテクチャ原則を列挙したプロジェクトの `guardrail.md` を管理します。`init` はテンプレートを書き出します（ファイルがすでに存在する場合は `--force` がない限り中断）。`update` は現在の `analysis.json` と既存の guardrail 内容を AI エージェントへ渡し、新たに提案された条項を追記します。

#### flow start

```
sdd-forge flow start --request <text> [--title <text>] [--spec <path>]
                     [--agent <name>] [--max-runs <n>] [--forge-mode local|assist|agent]
                     [--no-branch] [--worktree] [--dry-run]
```

完全な SDD フローを統括します。spec を作成し（`--spec` 指定時は省略）、`spec gate` を実行し、フロー状態を `.sdd-forge/flow.json` に保存したうえで、指定された request をプロンプトとして `docs forge` を呼び出します。gate に失敗した場合は、失敗理由（最大 8 行の `- ` 行）を表示し、終了コード 2 で終了します。

| Option | Default | 説明 |
|---|---|---|
| `--request <text>` | — | ユーザー要求の本文です（必須）。 |
| `--title <text>` | derived from `--request` | spec とブランチのタイトルです。 |
| `--spec <path>` | `""` | 既存の spec パスです。指定すると `spec init` を省略します。 |
| `--agent <name>` | config default | forge 用エージェントを上書きします。 |
| `--max-runs <n>` | `5` | forge の最大反復回数です。 |
| `--forge-mode` | `local` | forge モードです。`local`、`assist`、`agent` のいずれかです。 |
| `--no-branch` | `false` | 新しいブランチを作らずに spec を作成します。 |
| `--worktree` | `false` | feature ブランチ用に git worktree を使います。 |
| `--dry-run` | `false` | 変更を加えずに実行します。 |

#### flow status

```
sdd-forge flow status
sdd-forge flow status --step <id> --status <value>
sdd-forge flow status --summary '<JSON array>'
sdd-forge flow status --req <index> --status <value>
sdd-forge flow status --archive
```

`.sdd-forge/flow.json` に保存されている現在の SDD フロー状態を表示または変更します。オプションなしでは、spec パス、ブランチ、ステップ進捗（✓ done / > in_progress / - skipped / 空白 pending）、要件進捗を含む整形済みの要約を表示します。`--archive` フラグを指定すると、`flow.json` を現在の spec ディレクトリへコピーし、`.sdd-forge/` から削除します。

| Option | 説明 |
|---|---|
| `--step <id> --status <val>` | 指定したステップの状態を更新します。有効な step ID は `FLOW_STEPS` で定義されます。 |
| `--summary '<JSON>'` | 要件一覧を説明文字列の JSON 配列で置き換えます。 |
| `--req <index> --status <val>` | 0 始まりのインデックスで指定した単一要件を更新します。 |
| `--archive` | `flow.json` を spec ディレクトリへ移動し、`.sdd-forge/` から消去します。 |

#### presets list

```
sdd-forge presets list
```

完全なプリセット継承ツリーを標準出力へ表示します。ツリーは `base/` から始まり、その後にアーキテクチャ層のノード（`cli/`、`webapp/`、`library/`）と、それぞれの末端プリセットが続きます。各ノードにはラベル、エイリアス、scan category のキーが表示されます。
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

#### 終了コード

| Code | 意味 | 典型的な発生元 |
|---|---|---|
| `0` | 成功 | いずれかのコマンドが正常に完了した場合。 |
| `1` | 一般エラー | 不明なサブコマンド、必須オプション不足、ファイル未検出、AI エージェントエラー、または `spec gate` の gate チェック失敗。 |
| `2` | Gate によるブロック | `flow start` で `spec gate` が非 0 を返した場合（未解決の spec 項目または guardrail 失敗）。 |

#### stdout / stderr の慣例

sdd-forge は、各コマンドで一貫した出力規約に従います。

| Stream | 内容 |
|---|---|
| **stdout** | 整形された表、生成ファイルのパス、進捗要約、ヘルプテキスト、バージョン文字列など、利用者向けの構造化出力。 |
| **stderr** | `[<command>]` で始まる運用ログ（例: `[forge]`, `[build]`, `[translate]`）、進捗バー更新、各ステップの警告（例: `WARN: no defaultAgent configured`）、エラーメッセージ。 |

進捗バー（`docs build` で使用）は stdout を機械可読に保つため、stderr に書き出されます。長時間の AI 呼び出し中に表示されるエージェントのティッカードット（`.`）も stderr に出力されます。`--verbose` を受け付けるコマンドでは、生のエージェント stdout と stderr がリアルタイムでストリームされます。

**`--dry-run` の動作:** `--dry-run` が有効な場合、書き込み操作は抑止され、作成または更新されるはずだった各ファイルについて、`DRY-RUN:` で始まる行が stdout に表示されます。
<!-- {{/text}} -->
