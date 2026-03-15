# 02. CLI コマンドリファレンス

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the total number of commands and subcommand structure.}} -->

`sdd-forge` は 20 を超えるコマンドを備え、3 層のディスパッチ構造（`sdd-forge <namespace> <subcommand>`）で整理されています。ドキュメント生成、spec 管理、開発フローのオーケストレーション、プロジェクト設定を扱い、各コマンドは `docs`、`spec`、`flow`、および独立コマンドの 4 つの区分に分かれ、それぞれ専用の実装ファイルへ振り分けられます。

<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text[mode=deep]: List all commands in table format. Include command name, description, and key options. Extract comprehensively from command definitions and routing in the source code.}} -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `sdd-forge help` | 利用可能なすべてのコマンドを区分ごとに表示 | — |
| `sdd-forge setup` | 対話式セットアップウィザード。プロジェクトを登録し、`.sdd-forge/config.json` を生成 | `--name`, `--path`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | テンプレート由来のファイル（skills など）を、インストール済みの sdd-forge のバージョンに合わせて更新 | `--dry-run` |
| `sdd-forge presets list` | preset の継承ツリーを表示 | — |
| `sdd-forge docs build` | ドキュメント生成の全パイプラインを実行: scan → enrich → init → data → text → readme → agents → translate | `--force`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | ソースコードを走査し、`analysis.json` を生成 | — |
| `sdd-forge docs enrich` | `analysis.json` の各エントリに summary、detail、chapter、role のメタデータを AI で付与 | `--dry-run`, `--stdout` |
| `sdd-forge docs init` | preset テンプレートから章ファイルを初期化 | `--force`, `--dry-run` |
| `sdd-forge docs data` | 章ファイル内の `{{data}}` ディレクティブを解決 | `--dry-run` |
| `sdd-forge docs text` | 章ファイル内の `{{text}}` ディレクティブを AI で補完 | `--dry-run` |
| `sdd-forge docs readme` | 章ファイルとテンプレートから `README.md` を生成 | `--dry-run`, `--lang`, `--output` |
| `sdd-forge docs forge` | AI エージェントとレビューのフィードバックループを使って docs を反復的に改善 | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | ドキュメント品質のレビューを実行 | — |
| `sdd-forge docs translate` | デフォルト言語の docs を AI により非デフォルト言語へ翻訳 | `--lang`, `--force`, `--dry-run` |
| `sdd-forge docs changelog` | changelog を生成 | — |
| `sdd-forge docs agents` | `{{data: agents.*}}` ディレクティブを解決し、AGENTS.md を更新 | `--dry-run` |
| `sdd-forge docs snapshot` | ドキュメントのスナップショットを作成 | — |
| `sdd-forge spec init` | 連番付き feature ブランチと、`spec.md` / `qa.md` テンプレートを含む spec ディレクトリを作成 | `--title`, `--base`, `--dry-run`, `--allow-dirty`, `--no-branch`, `--worktree` |
| `sdd-forge spec gate` | 実装前の gate チェックを行い、spec の完全性と guardrail への準拠を確認 | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | 不変の原則をまとめた project guardrail（`guardrail.md`）を初期化または更新 | サブコマンド: `init`, `update`; `--force`, `--dry-run`, `--agent` |
| `sdd-forge flow start` | SDD フロー全体を実行: spec init → gate → forge | `--request`, `--title`, `--spec`, `--agent`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | `flow.json` に保存されたフロー進捗を表示または更新 | `--step`, `--status`, `--summary`, `--req`, `--archive` |
| `sdd-forge flow review` | 実装後にコード品質レビューを実行（draft → final → apply） | `--dry-run`, `--skip-confirm` |

<!-- {{/text}} -->

### グローバルオプション

<!-- {{text[mode=deep]: Describe global options shared by all commands in table format. Extract from argument parsing logic in the source code.}} -->

以下のオプションは、`src/lib/cli.js` の共通ユーティリティ `parseArgs` を通して、多くのコマンドで認識されます。

| オプション | 説明 |
|---|---|
| `--help`, `-h` | コマンドごとのヘルプを表示して終了 |
| `--dry-run` | ファイルを書き込まずにコマンドを実行し、結果を stdout にプレビュー出力 |
| `--verbose`, `-v` | 詳細出力を有効化（`docs build` と `docs forge` で利用可能） |

トップレベルのエントリポイント（`sdd-forge.js`）では、次のオプションも受け付けます。

| オプション | 説明 |
|---|---|
| `--version`, `-v`, `-V` | インストール済みの sdd-forge のバージョンを表示して終了 |

なお、`--help` と `--dry-run` は各コマンドで個別に実装されており、`parseArgs` に渡すコマンド固有の `flags` と `options` 配列によって制御されます。すべてのコマンドがすべてのグローバルオプションに対応しているわけではありません。受け付ける正確なオプションは、各コマンドの詳細を参照してください。

<!-- {{/text}} -->

### コマンド詳細

<!-- {{text[mode=deep]: Describe each command's usage, options, and examples in detail. Create a #### subsection for each command. Extract from argument definitions and help messages in the source code.}} -->

#### sdd-forge help

利用可能なすべてのコマンドを、Project、Docs、Spec、Flow、Info の各区分に整理して表示します。出力にはパッケージのバージョン、usage 行、および i18n の locale ファイルを元にした簡潔な説明付きコマンド一覧が含まれます。

```
sdd-forge help
```

#### sdd-forge setup

対話式のセットアップウィザードです。プロジェクトを登録し、`.sdd-forge/config.json` を生成します。プロジェクト名、ソースパス、出力言語、アーキテクチャ種別（webapp/cli/library とフレームワーク選択）、文書スタイル、デフォルトエージェントを順に尋ねます。必要なディレクトリ構造（`.sdd-forge/output/`、`docs/`、`specs/`）を作成し、`AGENTS.md`、`CLAUDE.md`、skill テンプレートも設定します。

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/laravel --agent claude
```

| オプション | 説明 |
|---|---|
| `--name <name>` | プロジェクト名（指定すると対話入力を省略） |
| `--path <path>` | ソースディレクトリのパス |
| `--work-root <path>` | 作業ルートディレクトリ（デフォルトはソースパス） |
| `--type <type>` | preset の種別（例: `webapp/cakephp2`, `cli/node-cli`, `library`） |
| `--purpose <purpose>` | 文書の目的設定 |
| `--tone <tone>` | 文書の文体（polite、formal、casual） |
| `--agent <agent>` | デフォルトの AI エージェント（claude、codex） |
| `--lang <lang>` | 操作言語 |
| `--dry-run` | ファイルを書き込まずに内容を確認 |

必要なオプションがすべて CLI 引数で与えられた場合、このコマンドは非対話モードで実行されます。

#### sdd-forge upgrade

テンプレート由来のファイルを、現在インストールされている sdd-forge のバージョンに合わせて更新します。`src/templates/skills/` にある skill テンプレートと、`.agents/skills/` にインストール済みのファイルを比較し、差分があるものを更新します。あわせて `.claude/skills/` のシンボリックリンクを再作成し、不足している設定があれば案内を表示します。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

繰り返し実行しても安全で、上書きされるのはテンプレート管理下の内容だけです。

#### sdd-forge presets list

preset の継承ツリーを、視覚的なツリー形式で表示します。root に base preset を置き、その下にアーキテクチャ層（cli、webapp、library）、さらに leaf preset（node-cli、cakephp2、laravel、symfony）を子として示します。各ノードにはラベル、aliases、scan keys が表示されます。

```
sdd-forge presets list
```

#### sdd-forge docs build

ドキュメント生成パイプラインを、`scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` → `translate` の順で一括実行します。各ステップには進捗バーが表示されます。`defaultAgent` が設定されていない場合は、`enrich` と `text` はスキップされます。多言語出力では、追加の `translate` または `generate` ステップが加わります。

```
sdd-forge docs build
sdd-forge docs build --force --verbose
```

| オプション | 説明 |
|---|---|
| `--force` | init 時に章ファイルを強制再生成 |
| `--verbose` | 各パイプラインステップの詳細出力を表示 |
| `--dry-run` | ファイルを書き込まずに内容を確認 |

#### sdd-forge docs enrich

`analysis.json` の各エントリに `summary`、`detail`、`chapter`、`role` のメタデータを AI で付与します。エントリは総行数（デフォルト 3000 行）または件数（デフォルト 20 件）を基準にバッチ分割されます。再開にも対応しており、すでに enrich 済みのエントリはスキップされ、進捗は各バッチ後に保存されます。

```
sdd-forge docs enrich
sdd-forge docs enrich --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | analysis.json を変更せずに確認 |
| `--stdout` | enrich 後のデータを stdout に出力 |

#### sdd-forge docs init

preset テンプレートから `docs/` 配下の章ファイルを初期化します。テンプレートは下位から上位へではなく、preset 階層（base → arch → leaf）をたどって統合され、`preset.json` で定義された順に章ファイルが書き出されます。

```
sdd-forge docs init
sdd-forge docs init --force
```

| オプション | 説明 |
|---|---|
| `--force` | 既存の章ファイルを上書き |
| `--dry-run` | ファイルを書き込まずに内容を確認 |

#### sdd-forge docs data

対応する DataSource メソッドを analysis data とともに呼び出し、章ファイル内の `{{data: source.method("labels")}}` ディレクティブを解決します。

```
sdd-forge docs data
sdd-forge docs data --dry-run
```

#### sdd-forge docs text

章ファイル内の `{{text: instruction}}` ディレクティブを AI で補完します。analysis data と章の文脈を読み取り、設定された AI エージェントを呼び出して、各ディレクティブ向けの本文を生成します。

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

#### sdd-forge docs readme

preset テンプレートから `README.md` を生成します。`{{data}}` ディレクティブ（`langSwitcher` を含む）を解決し、必要に応じて `{{text}}` ディレクティブも AI で補完します。対象言語を指定することで、多言語出力にも対応します。

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 生成される README を stdout にプレビュー出力 |
| `--lang <lang>` | 生成対象の言語 |
| `--output <path>` | 出力ファイルパス |

#### sdd-forge docs forge

AI エージェントとレビューのフィードバックループを用いて、ドキュメントを反復的に改善します。`local`（決定的なパッチ適用）、`assist`（AI 支援）、`agent`（AI による全面的な自律実行）の 3 つのモードを備えています。各ラウンドでエージェントを実行した後にレビューコマンドを起動し、レビューに失敗した場合は、そのフィードバックを抽出して次のラウンドに渡します。

```
sdd-forge docs forge --prompt "improve error handling docs"
sdd-forge docs forge --spec specs/001-feature/spec.md --mode agent --max-runs 5
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善指示のテキスト |
| `--prompt-file <path>` | ファイルから prompt を読み込む |
| `--spec <path>` | 文脈と対象ファイル特定のための spec ファイル |
| `--max-runs <n>` | 最大反復回数（デフォルト: 3） |
| `--review-cmd <cmd>` | 実行するレビューコマンド（デフォルト: `sdd-forge docs review`） |
| `--mode <mode>` | 実行モード: `local`、`assist`、`agent` |
| `--verbose` | エージェント出力をリアルタイム表示 |
| `--dry-run` | ファイルを変更せずに内容を確認 |

#### sdd-forge docs translate

デフォルト言語の docs を AI で非デフォルト言語へ翻訳します。ファイルの更新時刻を比較して差分翻訳を行い、source が target より新しいファイルだけを再翻訳します。

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| オプション | 説明 |
|---|---|
| `--lang <lang>` | 特定の言語だけを翻訳 |
| `--force` | mtime に関係なく全ファイルを再翻訳 |
| `--dry-run` | 実行せずに翻訳対象だけを確認 |

#### sdd-forge docs agents

`{{data: agents.sdd}}` と `{{data: agents.project}}` の各ディレクティブを解決して `AGENTS.md` を更新します。PROJECT セクションは、生成済み docs、`package.json` scripts、SDD context を入力に AI が整えます。

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

#### sdd-forge spec init

連番付きの feature ブランチ（`feature/NNN-slug`）と、`spec.md` および `qa.md` テンプレートを含む `specs/NNN-slug/` ディレクトリを作成します。通常のブランチ作成、git worktree による分離（`--worktree`）、ブランチを作らず spec のみ作成するモード（`--no-branch`）の 3 方式に対応しています。

```
sdd-forge spec init --title "add login feature"
sdd-forge spec init --title "refactor auth" --base development --worktree
sdd-forge spec init --title "fix bug" --no-branch
```

| オプション | 説明 |
|---|---|
| `--title <title>` | 機能タイトル（必須）。ブランチ名とディレクトリ slug の生成に使用 |
| `--base <branch>` | ベースブランチ（デフォルトは現在のブランチ） |
| `--allow-dirty` | worktree のクリーン状態チェックを省略 |
| `--no-branch` | ブランチを作成せず spec ファイルのみ作成 |
| `--worktree` | 機能用に分離した git worktree を作成 |
| `--dry-run` | ファイルやブランチを作成せずに確認 |

#### sdd-forge spec gate

spec ファイルが実装可能な状態かどうかを検証します。未解決トークン（TBD、TODO、FIXME）、未チェックのタスク、必須セクション（Clarifications、Open Questions、User Confirmation、Acceptance Criteria）の欠落、ユーザー承認の有無を確認します。必要に応じて、AI による guardrail 準拠チェックも実行できます。

```
sdd-forge spec gate --spec specs/001-feature/spec.md
sdd-forge spec gate --spec specs/001-feature/spec.md --phase post --skip-guardrail
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | spec.md のパス（必須） |
| `--phase <phase>` | `pre`（デフォルト）は Status / Acceptance Criteria の未チェック項目を除外し、`post` はすべて確認 |
| `--skip-guardrail` | AI による guardrail 準拠チェックを省略 |

#### sdd-forge spec guardrail

不変の設計原則をまとめた project guardrail ファイル（`.sdd-forge/guardrail.md`）を管理します。`init` サブコマンドは、言語フォールバック付きで preset 階層（base → arch → leaf）の guardrail テンプレートを統合します。`update` サブコマンドは `analysis.json` をもとに、プロジェクト固有の新しい条項を AI で提案します。

```
sdd-forge spec guardrail init
sdd-forge spec guardrail init --force
sdd-forge spec guardrail update --agent claude
```

| サブコマンド | オプション |
|---|---|
| `init` | `--force`, `--dry-run` |
| `update` | `--agent <name>`, `--dry-run` |

#### sdd-forge flow start

SDD フロー全体をオーケストレーションします。spec を作成し（`spec init`）、gate チェックを実行し、その後 `docs forge` を起動します。`--request` は必須で、`spec.md` に埋め込まれる機能要求の説明として使われます。

```
sdd-forge flow start --request "add user authentication"
sdd-forge flow start --request "refactor API layer" --forge-mode agent --max-runs 5
```

| オプション | 説明 |
|---|---|
| `--request <text>` | 機能要求の説明（必須） |
| `--title <title>` | 自動生成されるブランチタイトルを上書き |
| `--spec <path>` | 新規作成せず既存の spec を利用 |
| `--agent <name>` | デフォルト AI エージェントを上書き |
| `--max-runs <n>` | forge の最大反復回数（デフォルト: 5） |
| `--forge-mode <mode>` | Forge の実行モード: `local`、`assist`、`agent` |
| `--no-branch` | ブランチ作成を省略 |
| `--worktree` | 分離のため git worktree を利用 |
| `--dry-run` | 実行せずに内容を確認 |

#### sdd-forge flow status

`.sdd-forge/flow.json` に保存された SDD フローの進捗を表示または更新します。オプションなしでは、spec パス、ブランチ、ステップ進捗（ステータスアイコン付き）、requirements を整形して表示します。

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --summary '["implement auth", "add tests"]'
sdd-forge flow status --req 0 --status done
sdd-forge flow status --archive
```

| オプション | 説明 |
|---|---|
| `--step <id> --status <val>` | 特定ステップのステータスを更新 |
| `--summary '<JSON>'` | requirements 一覧を設定（文字列配列の JSON） |
| `--req <index> --status <val>` | 特定 requirement のステータスを更新 |
| `--archive` | `flow.json` を spec ディレクトリへコピーし、アクティブ状態を削除 |

#### sdd-forge flow review

現在のフローでの変更を対象に、コード品質レビューを実行します。処理は 3 段階で進みます。**draft** では AI が改善提案を作成し、**final** では各提案を AI が APPROVED または REJECTED として判定し、**apply** で結果を `review.md` として整形します。レビュー対象は spec の Scope セクションから導かれ、取得できない場合はベースブランチとの差分 `git diff` 全体を対象にします。

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 適用せず提案だけを表示 |
| `--skip-confirm` | 最初の確認プロンプトを省略 |

<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text[mode=deep]: Define exit codes and describe stdout/stderr conventions in table format. Extract from process.exit() calls and output patterns in the source code.}} -->

| 終了コード | 意味 | 使用箇所 |
|---|---|---|
| `0` | 成功 | すべてのコマンドで正常終了時 |
| `1` | 一般エラー | 不明なサブコマンド、必須オプション不足、設定不足、パイプライン失敗、アクティブな flow 不在 |
| `2` | Gate チェック失敗 | `spec gate` で未解決項目が見つかった場合、またはユーザー確認がない場合。`flow start` で gate に失敗した場合 |

**stdout / stderr の規約:**

| ストリーム | 内容 |
|---|---|
| **stdout** | コマンドの主出力。生成された内容、ステータス表示、`--dry-run` のプレビュー、`--help` の本文、バージョン情報 |
| **stderr** | 進捗表示（パイプラインステップ名、エージェント進捗ティッカー）、警告（`WARN:` 接頭辞付き。例: ステップのスキップや一部エラー）、エラーメッセージ（`ERROR:` 接頭辞付き） |

コードベースで確認できる主な出力パターンは次のとおりです。

- パイプライン進捗は `createProgress()` を通じて stderr に書き出され、stdout はパイプ用途に使いやすい状態に保たれます。
- 警告メッセージは `[command] WARN: <description>` の形式です（例: `[text] WARN: 3 file(s) had errors`）。
- エラーメッセージは `[command] ERROR: <message>` の形式で出力された後、`process.exit(1)` が呼ばれます。
- `--dry-run` フラグがある場合、コマンドは実際に書き込まれるはずの内容を stdout に出力し、`[dry-run]` ラベルまたは `---` 区切りを付けます。
- ヘルプ出力（`--help`）は stdout に表示され、プロセスは終了コード `0` で終了します。
- namespace ディスパッチャー（`docs`、`spec`、`flow`）にサブコマンドが指定されない場合、usage メッセージは stderr に表示され、プロセスは終了コード `1` で終了します。

<!-- {{/text}} -->
