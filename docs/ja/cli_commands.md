# 02. CLI コマンドリファレンス

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

`sdd-forge` は 22 個のコマンドを `docs`、`spec`、`flow`、および独立コマンドの 4 つの名前空間に整理して提供しており、いずれも単一のエントリポイント (`sdd-forge <command>`) から呼び出します。3 つの名前空間ディスパッチャー (`docs`、`spec`、`flow`) はそれぞれ最初の引数としてサブコマンドを受け取り、独立コマンド (`setup`、`upgrade`、`presets`、`help`) は名前空間プレフィックスなしで動作します。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| Command | 説明 | 主なオプション |
|---|---|---|
| `help` | 利用可能なすべてのコマンドを説明付きで表示する | — |
| `setup` | プロジェクトを sdd-forge 用に初期化する | — |
| `upgrade` | スキルファイルを現在の sdd-forge バージョンのテンプレートに更新する | `--dry-run` |
| `docs build` | ドキュメント生成の全パイプラインを実行する (scan→enrich→init→data→text→readme→agents→[translate]) | `--agent`, `--force`, `--dry-run`, `--verbose` |
| `docs scan` | ソースコードを走査して `analysis.json` を生成する | — |
| `docs enrich` | `analysis.json` に AI 生成の役割、要約、章分類を付与する | `--agent` |
| `docs init` | 有効なプリセットのテンプレートから `docs/` の章ファイルを初期化する | `--force`, `--dry-run` |
| `docs data` | 章ファイル内の `{{data}}` ディレクティブを展開する | `--dry-run` |
| `docs text` | 章ファイル内の `{{text}}` セクションを AI エージェントで生成する | `--agent`, `--dry-run` |
| `docs readme` | docs の内容から `README.md` を生成する | `--dry-run` |
| `docs forge` | AI の編集 → レビュー → フィードバックの反復サイクルで docs を改善する | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--agent`, `--mode`, `--dry-run`, `--verbose` |
| `docs review` | 生成済みドキュメントの品質上の問題をレビューする | — |
| `docs translate` | 既定言語の docs を設定済みの非既定言語へ翻訳する | `--lang`, `--force`, `--dry-run` |
| `docs changelog` | git 履歴から changelog を生成する | — |
| `docs agents` | `AGENTS.md` / `CLAUDE.md` を生成または更新する | `--sdd`, `--project`, `--dry-run` |
| `docs snapshot` | 現在の docs 状態のスナップショットを作成する | `--dry-run` |
| `spec init` | 番号付き feature ブランチを作成し、`spec.md` / `qa.md` を初期化する | `--title`, `--no-branch`, `--worktree`, `--allow-dirty`, `--dry-run` |
| `spec gate` | 未解決項目がないか `spec.md` を検証し、guardrail 準拠チェックを実行する | `--spec`, `--phase`, `--skip-guardrail` |
| `spec guardrail` | プロジェクトの `guardrail.md` を初期化または更新する | `init \| update`, `--agent`, `--force`, `--dry-run` |
| `flow start` | 完全な SDD フローを実行する: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `flow status` | 有効な SDD フロー状態を表示または更新する | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `presets list` | 利用可能なプリセット継承ツリーを表示する | — |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

以下のフラグは、サブコマンドのディスパッチ前にトップレベルのエントリポイント (`sdd-forge.js`) で認識されます。

| Option | エイリアス | 説明 |
|---|---|---|
| `--version` | `-v`, `-V` | インストール済みの sdd-forge バージョンを表示して終了します。 |
| `--help` | `-h` | コマンド一覧を表示し、終了コード 0 で終了します。引数を指定しない場合も同じ出力になります。 |

多くのサブコマンドは、サブコマンド名の後にローカルな `--help` / `-h` も受け付けます (例: `sdd-forge docs forge --help`)。このコマンド単位のヘルプは、トップレベルのエントリポイントではなく、それぞれのコマンド自身の引数パーサーで処理されます。
<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### help

```
sdd-forge help
sdd-forge          # help と同じ
sdd-forge -h
```

セクション別 (Project、Docs、Spec、Flow、Info) にまとめた完全なコマンド一覧を 1 行説明付きで表示します。表示言語は `.sdd-forge/config.json` の `lang` フィールドで制御され、既定値は `en` です。

#### setup

```
sdd-forge setup
```

新しいプロジェクトを sdd-forge 用に初期設定します。`.sdd-forge/` 設定ディレクトリを作成し、初期 `config.json` を書き込み、`AGENTS.md` を生成し、`CLAUDE.md` のシンボリックリンクを作成します。

#### upgrade

```
sdd-forge upgrade [--dry-run]
```

同梱されているスキルファイル (`.agents/skills/*/SKILL.md` と、それに対応する `.claude/skills/*/SKILL.md` のシンボリックリンク) を、現在インストールされている sdd-forge バージョンに含まれるテンプレートに合わせて更新します。既存のシンボリックリンクは、新しい内容を書き込む前に実体ファイルへ置き換えられます。`--dry-run` を指定した場合は、変更内容をファイルへ書き込まずコンソールに表示します。また、このコマンドは `config.json` に `systemPromptFlag` の設定漏れがないか確認し、不足している場合はヒントを表示します。

#### docs build

```
sdd-forge docs build [--agent <name>] [--force] [--dry-run] [--verbose]
```

完全なドキュメント生成パイプラインを順に実行します: `scan → enrich → init → data → text → readme → agents → [translate]`。各ステップの重みに応じて進捗バーが表示されます。config で `output.isMultiLang` が `true` の場合は `translate` ステップが追加され、既定以外の言語も生成されます。`defaultAgent` が設定されておらず、かつ `--agent` も指定されていない場合、`enrich` と `text` のステップは警告付きでスキップされます。

| Option | 説明 |
|---|---|
| `--agent <name>` | enrich と text ステップで使う AI エージェントを上書きします。 |
| `--force` | `init` ステップに `--force` を渡します (既存の章ファイルを上書き)。 |
| `--dry-run` | ファイルを書き込まずに全ステップを実行します。 |
| `--verbose` | エージェントの stdout/stderr をリアルタイムで表示します。 |

#### docs scan

```
sdd-forge docs scan
```

有効なプリセットの scanner 設定に従ってプロジェクトのソースツリーを解析し、結果を `.sdd-forge/output/analysis.json` に書き込みます。このファイルは後続のすべてのパイプラインステップで利用されます。

#### docs enrich

```
sdd-forge docs enrich [--agent <name>]
```

`scan` が生成した生の `analysis.json` を読み込み、全エントリを 1 回の呼び出しで AI エージェントに渡し、各エントリに role、summary、detail、chapter-classification の各フィールドを書き戻します。`text` ステップで正確な出力を生成するには、この enrich 処理が必要です。

#### docs init

```
sdd-forge docs init [--force] [--dry-run]
```

`docs/` ディレクトリを作成し、有効なプリセットのテンプレート群から生成した章 Markdown ファイルで埋めます。既存のファイルは、`--force` を指定しない限り変更されません。

#### docs data

```
sdd-forge docs data [--dry-run]
```

章ファイル内のすべての `{{data: <source>.<method>}}` ディレクティブを、現在の `analysis.json` を使って対応する `DataSource` メソッドを呼び出すことで解決します。結果はディレクティブと `{{/data}}` マーカーの間にその場で書き込まれます。

#### docs text

```
sdd-forge docs text [--agent <name>] [--dry-run]
```

章ファイル内で見つかった各 `{{text: <instruction>}}` ディレクティブについて、設定済みの AI エージェントを呼び出し、生成された内容をその場で書き込みます。まだ本文がないディレクティブ、または再生成対象として明示されたものだけが処理されます。

#### docs readme

```
sdd-forge docs readme [--dry-run]
```

生成済みの章ファイルからプロジェクトルートに `README.md` を組み立てます。管理対象セクションの外にある既存の `README.md` 内容は保持されます。

#### docs forge

```
sdd-forge docs forge [--prompt <text>] [--prompt-file <path>] [--spec <path>]
                     [--max-runs <n>] [--review-cmd <cmd>] [--agent <name>]
                     [--mode local|assist|agent] [--dry-run] [--verbose]
```

docs の章ファイルに対して、AI による編集 → レビュー → フィードバックの反復サイクルを実行します。各ラウンドでは、まずエージェントが章を書き換え、その後 `review` を実行します。レビューに通らなかったファイルは次のラウンドでエージェントに差し戻されます。このサイクルは `--max-runs` 回まで繰り返されます (既定: 3)。`--spec` を指定した場合は、その spec に関係する章だけが対象になります。

| Option | 既定値 | 説明 |
|---|---|---|
| `--prompt` | `""` | エージェントへの自然文の指示です。 |
| `--prompt-file` | `""` | プロンプトを記載したファイルへのパスです。 |
| `--spec` | `""` | `spec.md` へのパスです。対象を関連する章に限定します。 |
| `--max-runs` | `3` | 編集とレビューの最大反復回数です。 |
| `--review-cmd` | `sdd-forge review` | レビューの実行に使うコマンドです。 |
| `--agent` | config default | エージェント名を上書きします。 |
| `--mode` | `local` | `local` は決定的なパッチ適用、`assist` は AI 提案を追加、`agent` は処理を全面的に AI に委ねます。 |
| `--dry-run` | `false` | ファイル書き込みを行いません。 |
| `--verbose` | `false` | エージェントの出力を stderr に流します。 |

#### docs review

```
sdd-forge docs review
```

現在の `docs/` 章ファイルの状態をプロジェクトの `review-checklist.md` と照合し、合格しない項目を報告します。レビューに失敗した場合、終了コードは非 0 になります。

#### docs translate

```
sdd-forge docs translate [--lang <code>] [--force] [--dry-run]
```

章ファイルと `README.md` を、既定言語から `output.languages` 設定配列に列挙されたすべての非既定言語へ翻訳します。翻訳では mtime 比較を使い、すでに最新のファイルはスキップします。`output.mode` が `"translate"` の場合にのみ有効です。

| Option | 説明 |
|---|---|
| `--lang <code>` | 翻訳対象を 1 つの言語コードに限定します。 |
| `--force` | mtime に関係なくすべてのファイルを再翻訳します。 |
| `--dry-run` | 書き込まず、翻訳対象になる内容だけを表示します。 |

#### docs changelog

```
sdd-forge docs changelog
```

git のコミット履歴から `docs/changelog.md` を生成または更新し、項目をバージョンタグごとにまとめます。

#### docs agents

```
sdd-forge docs agents [--sdd] [--project] [--dry-run]
```

SDD ワークフローの指示とプロジェクト固有の文脈を含む `AGENTS.md` (および `CLAUDE.md` のシンボリックリンク) を作成または更新します。`--sdd` と `--project` のどちらも指定しない場合は、両方のセクションを処理します。

| Option | 説明 |
|---|---|
| `--sdd` | `AGENTS.md` の SDD セクションだけを更新します。 |
| `--project` | `AGENTS.md` の PROJECT セクションだけを更新します。 |
| `--dry-run` | 書き込まずに出力だけを表示します。 |

#### docs snapshot

```
sdd-forge docs snapshot [--dry-run]
```

現在の `docs/` ディレクトリのタイムスタンプ付きスナップショットを `.sdd-forge/snapshots/` に書き出します。大きな forge 実行前に docs の状態を保存したい場合に便利です。

#### spec init

```
sdd-forge spec init --title <title> [--no-branch] [--worktree] [--allow-dirty] [--dry-run]
```

連番付きの feature ブランチ (`feat/NNN-<slug>`) を作成し、プリセットテンプレートから `specs/NNN-<slug>/spec.md` と `qa.md` を書き込みます。数値インデックスは既存の `specs/` サブディレクトリと git ブランチ名から算出されます。

| Option | 説明 |
|---|---|
| `--title <text>` | 人が読めるタイトルです。slug 化してブランチ名とディレクトリ名に使います。 |
| `--no-branch` | git ブランチを切り替えずに spec ファイルだけを作成します。 |
| `--worktree` | 分離した開発用に新しい git worktree を作成します。 |
| `--allow-dirty` | ワーキングツリーのクリーンさ確認を省略します。 |
| `--dry-run` | ファイルやブランチを作成せず、実行内容だけを表示します。 |

#### spec gate

```
sdd-forge spec gate --spec <path> [--phase pre|post] [--skip-guardrail]
```

実装の前後で `spec.md` を検証します。未解決トークン (`[NEEDS CLARIFICATION]`, `TBD`, `TODO`, `FIXME`)、未チェックのタスク項目 (`- [ ]`)、必須セクション (`## Clarifications`, `## Open Questions`, `## User Confirmation`, `## Acceptance Criteria`) を確認します。`guardrail.md` が存在する場合は、その条項に対する AI 準拠チェックも実行します。いずれかに失敗すると終了コード 1 で終了します。

| Option | 説明 |
|---|---|
| `--spec <path>` | 検証対象の `spec.md` へのパスです (必須)。 |
| `--phase` | `pre` (既定) ではステータスや受け入れ条件の未チェック項目を無視し、`post` ではすべて確認します。 |
| `--skip-guardrail` | guardrail の AI 準拠チェックをスキップします。 |

#### spec guardrail

```
sdd-forge spec guardrail init  [--force] [--dry-run]
sdd-forge spec guardrail update [--agent <name>] [--dry-run]
```

プロジェクトの `guardrail.md` を管理します。このファイルには、`spec gate` が spec を検証する際に使う不変のアーキテクチャ原則が記載されます。`init` はテンプレートを書き込みます (ファイルがすでに存在する場合は `--force` がない限り拒否)。`update` は現在の `analysis.json` と既存の guardrail 内容を AI エージェントに渡し、新たに提案された条項を追記します。

#### flow start

```
sdd-forge flow start --request <text> [--title <text>] [--spec <path>]
                     [--agent <name>] [--max-runs <n>] [--forge-mode local|assist|agent]
                     [--no-branch] [--worktree] [--dry-run]
```

完全な SDD フローを統括します。spec を作成し (`--spec` を指定した場合を除く)、`spec gate` を実行し、フロー状態を `.sdd-forge/flow.json` に保存したうえで、指定されたリクエストをプロンプトとして `docs forge` を呼び出します。gate に失敗した場合は、失敗理由 (`- ` で始まる行を最大 8 件) を表示して終了コード 2 で終了します。

| Option | 既定値 | 説明 |
|---|---|---|
| `--request <text>` | — | ユーザーのリクエスト本文です (必須)。 |
| `--title <text>` | `--request` から導出 | spec とブランチのタイトルです。 |
| `--spec <path>` | `""` | 既存の spec パスです。指定すると `spec init` を省略します。 |
| `--agent <name>` | config default | forge 用エージェントを上書きします。 |
| `--max-runs <n>` | `5` | forge の最大反復回数です。 |
| `--forge-mode` | `local` | Forge モード: `local`、`assist`、`agent`。 |
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

`.sdd-forge/flow.json` に保存された有効な SDD フロー状態を表示または変更します。オプションなしでは、spec パス、ブランチ、ステップ進捗 (✓ done / > in_progress / - skipped / space pending)、要件進捗を含む整形済みの要約を表示します。`--archive` フラグを指定すると、`flow.json` をアクティブな spec ディレクトリにコピーし、`.sdd-forge/` から削除します。

| Option | 説明 |
|---|---|
| `--step <id> --status <val>` | 名前付きステップの状態を更新します。有効なステップ ID は `FLOW_STEPS` で定義されています。 |
| `--summary '<JSON>'` | 要件一覧を説明文字列の JSON 配列で置き換えます。 |
| `--req <index> --status <val>` | 0 始まりのインデックスで指定した 1 件の要件を更新します。 |
| `--archive` | `flow.json` を spec ディレクトリへ移動し、`.sdd-forge/` から消去します。 |

#### presets list

```
sdd-forge presets list
```

プリセット継承ツリー全体を stdout に表示します。ツリーは `base/` から始まり、その下にアーキテクチャレベルのノード (`cli/`, `webapp/`, `library/`) と、それぞれのリーフプリセットが続きます。各ノードにはラベル、エイリアス、scan category key が表示されます。
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

#### 終了コード

| Code | 意味 | 主な発生元 |
|---|---|---|
| `0` | 成功 | いずれかのコマンドが正常終了した場合。 |
| `1` | 一般的なエラー | 不明なサブコマンド、必須オプション不足、ファイル未検出、AI エージェントエラー、または `spec gate` の gate チェック失敗。 |
| `2` | Gate によるブロック | `flow start` で `spec gate` が非 0 を返した場合 (未解決の spec 項目または guardrail 失敗)。 |

#### stdout / stderr の規約

sdd-forge は各コマンドで一貫した出力規約に従います。

| Stream | 内容 |
|---|---|
| **stdout** | 整形済みテーブル、生成されたファイルパス、進捗要約、ヘルプテキスト、バージョン文字列など、利用者向けの構造化された出力。 |
| **stderr** | `[<command>]` 接頭辞付きの運用ログ行 (例: `[forge]`, `[build]`, `[translate]`)、進捗バー更新、ステップごとの警告 (例: `WARN: no defaultAgent configured`)、エラーメッセージ。 |

進捗バー (`docs build` で使用) は stdout をパイプした際にも機械可読性を保てるよう、stderr に書き出されます。長時間かかる AI 呼び出しの間に出力されるエージェントのティッカードット (`.`) も stderr に送られます。`--verbose` を受け付けるコマンドでは、生のエージェント stdout と stderr がリアルタイムでストリーミングされます。

**`--dry-run` の動作:** `--dry-run` が有効な場合、書き込み操作は抑止され、作成または変更されるはずだった各ファイルについて `DRY-RUN:` 接頭辞付きの行が stdout に出力されます。
<!-- {{/text}} -->
