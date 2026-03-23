<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../cli_commands.md) | **日本語**
<!-- {{/data}} -->

# CLI コマンドリファレンス

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。コマンド総数・サブコマンド体系を踏まえること。"})}} -->

sdd-forge は `docs`・`spec`・`flow` の 3 つの名前空間ディスパッチャと独立コマンドを含む、合計 30 以上のサブコマンドを持つ CLI ツールです。エントリポイント `sdd-forge.js` が第 1 段階のルーティングを行い、各名前空間ディスパッチャが第 2 段階、個別コマンドファイルが第 3 段階として 3 段階ディスパッチ構造で動作します。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text({prompt: "全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。ソースコードのコマンド定義・ルーティングから網羅的に抽出すること。", mode: "deep"})}} -->

| コマンド | 説明 | 主なオプション |
| --- | --- | --- |
| `sdd-forge help` | 利用可能な全コマンドの一覧を表示する | — |
| `sdd-forge setup` | インタラクティブセットアップウィザードを実行し `.sdd-forge/config.json` を生成する | `--name`, `--path`, `--type`, `--lang`, `--agent`, `--dry-run` |
| `sdd-forge upgrade` | テンプレート由来ファイル（スキル等）を最新バージョンに更新する | `--dry-run` |
| `sdd-forge presets list` | プリセット継承ツリーを表示する | — |
| `sdd-forge docs build` | scan → enrich → init → data → text → readme → agents → translate のパイプラインを順次実行する | `--force`, `--regenerate`, `--verbose`, `--dry-run` |
| `sdd-forge docs scan` | ソースコードを静的解析して analysis.json を生成する | — |
| `sdd-forge docs enrich` | AI で analysis エントリに役割・概要・章分類を付与する | — |
| `sdd-forge docs init` | プリセットテンプレートから docs/ 章ファイルを初期化する | `--force`, `--dry-run` |
| `sdd-forge docs data` | docs/ 内の `{{data}}` ディレクティブを analysis.json から解決する | `--dry-run`, `--stdout`, `--docs-dir` |
| `sdd-forge docs text` | docs/ 内の `{{text}}` ディレクティブを AI で充填する | `--dry-run` |
| `sdd-forge docs readme` | docs/ 章ファイルから README.md を自動生成する | `--dry-run`, `--lang`, `--output` |
| `sdd-forge docs forge` | AI によるドキュメント改善を反復実行する（更新 → review → フィードバックのループ） | `--prompt`, `--spec`, `--max-runs`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | docs の品質チェック（構造検証・ディレクティブ充填状況・出力整合性）を実行する | — |
| `sdd-forge docs translate` | デフォルト言語のドキュメントを他言語に翻訳する | `--dry-run`, `--force`, `--lang` |
| `sdd-forge docs changelog` | specs/ ディレクトリを走査して change_log.md を生成する | `--dry-run` |
| `sdd-forge docs agents` | AGENTS.md を生成・更新する（`{{data}}` 解決 + AI 精査） | `--dry-run` |
| `sdd-forge spec init` | 連番で feature ブランチと specs ディレクトリを作成し仕様書テンプレートを初期化する | `--title`, `--base`, `--dry-run`, `--allow-dirty`, `--no-branch`, `--worktree` |
| `sdd-forge spec gate` | 仕様書の未解決項目を検出しガードレール AI コンプライアンスチェックを実行する | `--spec`, `--phase`, `--skip-guardrail` |
| `sdd-forge spec guardrail` | ガードレール（不変原則）の初期化・表示・AI 更新を管理する | サブコマンド: `show`, `init`, `update` |
| `sdd-forge spec lint` | ガードレール lint パターンを変更ファイルに機械的にチェックする | `--base` |
| `sdd-forge flow start` | SDD フローを自動起動する（spec init → gate → forge パイプライン） | `--request`, `--title`, `--spec`, `--max-runs`, `--forge-mode`, `--no-branch`, `--worktree`, `--dry-run` |
| `sdd-forge flow status` | フロー進捗の表示・更新・一覧表示を行う | `--step`, `--status`, `--summary`, `--req`, `--request`, `--note`, `--issue`, `--check`, `--list`, `--all` |
| `sdd-forge flow resume` | flow.json と spec.md からコンテキスト復元用サマリーを出力する | — |
| `sdd-forge flow review` | コード品質レビューを draft → final → apply の 3 フェーズで実行する | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow merge` | flow.json に基づく squash merge または GitHub PR 作成を実行する | `--dry-run`, `--pr`, `--auto` |
| `sdd-forge flow cleanup` | .active-flow エントリ削除とブランチ・worktree 削除を実行する | `--dry-run` |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text({prompt: "全コマンドに共通するグローバルオプションを表形式で記述してください。ソースコードの引数パース処理から抽出すること。", mode: "deep"})}} -->

以下のオプションは多くのコマンドで共通して使用できます。各コマンドの `parseArgs()` 呼び出しで定義されています。

| オプション | 説明 |
| --- | --- |
| `--help`, `-h` | コマンドのヘルプメッセージを表示して終了します |
| `--dry-run` | 実際のファイル書き込みや外部コマンド実行を行わず、実行内容を表示のみします |
| `-v`, `--version` | トップレベル（`sdd-forge -v`）でパッケージバージョンを表示します |

`--help` はすべてのコマンドで利用可能です。`--dry-run` は `build`, `data`, `text`, `readme`, `forge`, `changelog`, `agents`, `translate`, `spec init`, `flow start`, `flow merge`, `flow cleanup`, `flow status`, `upgrade` で利用可能です。
<!-- {{/text}} -->

### 各コマンドの詳細

<!-- {{text({prompt: "各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとに #### サブセクションを立てること。ソースコードの引数定義・ヘルプメッセージから情報を抽出すること。", mode: "deep"})}} -->

#### sdd-forge setup

プロジェクトの初期セットアップを実行します。対話式ウィザードで言語・プリセット・エージェント設定を行い、`.sdd-forge/config.json` を生成します。

```
sdd-forge setup
sdd-forge setup --name myapp --type cakephp2 --lang ja --agent claude
```

| オプション | 説明 |
| --- | --- |
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースコードのパス |
| `--work-root <path>` | 作業ルートディレクトリ |
| `--type <type>` | プリセットタイプ（leaf 名で指定: `cakephp2`, `laravel` 等） |
| `--purpose <text>` | ドキュメントの目的 |
| `--tone <tone>` | 文体（polite, formal, casual） |
| `--agent <agent>` | デフォルトエージェント |
| `--lang <lang>` | プロジェクト言語コード |
| `--dry-run` | 実行内容を表示のみ |

全オプションを指定した場合は非対話モードで動作します。

#### sdd-forge upgrade

インストール済みの sdd-forge バージョンに合わせてスキルファイル等を更新します。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 変更対象を表示のみ |

#### sdd-forge presets list

プリセット継承ツリーを表示します。各プリセットの label、aliases、scan キー、テンプレート有無が確認できます。

```
sdd-forge presets list
```

#### sdd-forge docs build

ドキュメント生成パイプライン全体を順次実行します。実行順序は scan → enrich → init → data → text → readme → agents → translate です。

```
sdd-forge docs build
sdd-forge docs build --force --verbose
sdd-forge docs build --regenerate
```

| オプション | 説明 |
| --- | --- |
| `--force` | 既存ファイルを強制上書き |
| `--regenerate` | init をスキップし既存の docs/ 章ファイルを前提に再生成 |
| `--verbose` | 詳細ログを出力 |
| `--dry-run` | 実行内容を表示のみ |

エージェント設定がない場合、enrich と text のステップはスキップされ警告が表示されます。

#### sdd-forge docs scan

ソースコードを静的解析し `.sdd-forge/output/analysis.json` を生成します。

```
sdd-forge docs scan
```

#### sdd-forge docs data

docs/ 章ファイル内の `{{data}}` ディレクティブを analysis.json の情報で解決します。

```
sdd-forge docs data
sdd-forge docs data --dry-run --stdout
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | ファイルを書き換えずに差分を表示 |
| `--stdout` | 結果を標準出力に表示 |
| `--docs-dir <path>` | 対象の docs ディレクトリを指定 |

#### sdd-forge docs text

docs/ 章ファイル内の `{{text}}` ディレクティブを AI エージェントで充填します。

```
sdd-forge docs text
sdd-forge docs text --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | ファイルを書き換えずに実行 |

#### sdd-forge docs readme

docs/ 章ファイルとテンプレートから README.md を生成します。`{{data}}` および `{{text}}` ディレクティブを解決し、差分がある場合のみ書き込みます。

```
sdd-forge docs readme
sdd-forge docs readme --lang ja --output docs/ja/README.md
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 生成結果を標準出力に表示 |
| `--lang <lang>` | 出力言語を指定 |
| `--output <path>` | 出力先パスを指定 |

#### sdd-forge docs forge

AI によるドキュメント改善を反復実行します。各ラウンドで review を実行し、不合格なら再実行します。

```
sdd-forge docs forge --prompt "APIセクションを充実させる" --mode assist
sdd-forge docs forge --spec specs/001-feature/spec.md --max-runs 5
```

| オプション | 説明 |
| --- | --- |
| `--prompt <text>` | 改善指示テキスト |
| `--prompt-file <path>` | 改善指示をファイルから読み込み |
| `--spec <path>` | 仕様書パス |
| `--max-runs <n>` | 最大ラウンド数（デフォルト: 3） |
| `--review-cmd <cmd>` | レビューコマンド（デフォルト: `sdd-forge docs review`） |
| `--mode <mode>` | 実行モード: `local`, `assist`, `agent` |
| `--dry-run` | 実行内容を表示のみ |
| `--verbose` | 詳細ログを出力 |

#### sdd-forge docs review

docs の品質チェックを実行します。最小行数、H1 見出し、未充填ディレクティブ、出力整合性、多言語対応を検査します。

```
sdd-forge docs review
sdd-forge docs review docs/ja
```

#### sdd-forge docs translate

デフォルト言語のドキュメントを他言語に翻訳します。ソースファイルの mtime が翻訳先より新しい場合のみ再翻訳します。

```
sdd-forge docs translate
sdd-forge docs translate --lang ja --force
```

| オプション | 説明 |
| --- | --- |
| `--lang <lang>` | 翻訳先言語を指定（省略時は全非デフォルト言語） |
| `--force` | mtime に関わらず全ファイルを再翻訳 |
| `--dry-run` | 翻訳対象を表示のみ |

#### sdd-forge docs changelog

specs/ ディレクトリを走査し、各 spec.md からメタ情報を抽出して change_log.md を生成します。

```
sdd-forge docs changelog
sdd-forge docs changelog --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 生成結果を標準出力に表示 |

#### sdd-forge docs agents

AGENTS.md を生成・更新します。`{{data}}` ディレクティブを解決し、PROJECT セクションを AI で精査します。

```
sdd-forge docs agents
sdd-forge docs agents --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 生成結果を標準出力に表示 |

#### sdd-forge spec init

連番で feature ブランチと specs ディレクトリを作成し、仕様書テンプレートを初期化します。

```
sdd-forge spec init --title "contact-form"
sdd-forge spec init --title "login" --base main --worktree
```

| オプション | 説明 |
| --- | --- |
| `--title <title>` | 仕様のタイトル（必須） |
| `--base <branch>` | ベースブランチ（デフォルト: 現在のブランチ） |
| `--no-branch` | ブランチを作成せず spec ファイルのみ作成 |
| `--worktree` | git worktree モードで新しい作業ツリーを作成 |
| `--allow-dirty` | 未コミット変更があっても実行を許可 |
| `--dry-run` | 実行内容を表示のみ |

#### sdd-forge spec gate

仕様書の未解決項目を検出し、ガードレール AI コンプライアンスチェックを実行します。

```
sdd-forge spec gate --spec specs/001-feature/spec.md
sdd-forge spec gate --spec specs/001-feature/spec.md --phase post --skip-guardrail
```

| オプション | 説明 |
| --- | --- |
| `--spec <path>` | 仕様書のパス（必須） |
| `--phase <phase>` | チェックフェーズ: `pre`（実装前、デフォルト）または `post`（実装後） |
| `--skip-guardrail` | ガードレール AI チェックをスキップ |

pre フェーズでは Status・Acceptance Criteria・User Scenarios セクションの未チェック項目を無視します。

#### sdd-forge spec guardrail

ガードレール（不変原則）の管理を行います。サブコマンド: `show`（表示）、`init`（初期化）、`update`（AI 更新）。

```
sdd-forge spec guardrail show
sdd-forge spec guardrail init --force
sdd-forge spec guardrail update
```

#### sdd-forge spec lint

ガードレール記事の lint パターンを git diff の変更ファイルに対してチェックします。

```
sdd-forge spec lint --base main
```

| オプション | 説明 |
| --- | --- |
| `--base <branch>` | ベースブランチ（必須） |

#### sdd-forge flow start

SDD フローを自動起動します。spec init → gate → forge のパイプラインを順次実行します。

```
sdd-forge flow start --request "ログイン機能を追加"
sdd-forge flow start --request "バグ修正" --worktree --forge-mode agent
```

| オプション | 説明 |
| --- | --- |
| `--request <text>` | 要望テキスト（必須） |
| `--title <title>` | spec タイトル（省略時は request から自動生成） |
| `--spec <path>` | 既存の spec パスを指定 |
| `--agent <agent>` | エージェントを指定 |
| `--max-runs <n>` | forge の最大ラウンド数（デフォルト: 5） |
| `--forge-mode <mode>` | forge の実行モード: `local`, `assist`, `agent`（デフォルト: `local`） |
| `--no-branch` | ブランチを作成しない |
| `--worktree` | git worktree モードで実行 |
| `--dry-run` | 実行内容を表示のみ |

#### sdd-forge flow status

フロー進捗の表示・更新を行います。オプションなしで現在のフローの詳細を表示します。

```
sdd-forge flow status
sdd-forge flow status --step gate --status done
sdd-forge flow status --list
sdd-forge flow status --all
sdd-forge flow status --request "要望テキスト"
sdd-forge flow status --issue 42
sdd-forge flow status --check impl
```

| オプション | 説明 |
| --- | --- |
| `--step <id> --status <val>` | ステップの状態を更新 |
| `--summary '<JSON>'` | 要件リストを JSON 配列で設定 |
| `--req <index> --status <val>` | 個別要件の状態を更新 |
| `--request <text>` | リクエストテキストを設定 |
| `--note <text>` | ノート（決定事項・メモ）を追記 |
| `--issue <number>` | GitHub Issue 番号を設定 |
| `--check <phase>` | 前提条件チェック（`impl` または `finalize`） |
| `--list` | アクティブフロー一覧を表示 |
| `--all` | 全 spec 一覧を表示 |

#### sdd-forge flow resume

flow.json と spec.md からコンテキスト復元用サマリーを出力します。コンパクション後の再開に使用します。

```
sdd-forge flow resume
```

複数のアクティブフローがある場合はエラーを表示します。worktree 内のフローも自動検出します。

#### sdd-forge flow review

コード品質レビューを 3 フェーズ（draft → final → apply）で実行します。

```
sdd-forge flow review
sdd-forge flow review --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 提案を表示のみ（適用しない） |
| `--skip-confirm` | 確認プロンプトをスキップ |

#### sdd-forge flow merge

flow.json に基づいて squash merge または GitHub PR 作成を実行します。

```
sdd-forge flow merge
sdd-forge flow merge --pr
sdd-forge flow merge --auto
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | コマンドを表示のみ |
| `--pr` | squash merge の代わりに PR を作成 |
| `--auto` | `commands.gh=enable` かつ gh 利用可能時に PR、それ以外は squash merge |

#### sdd-forge flow cleanup

.active-flow エントリの削除とブランチ・worktree の削除を実行します。spec-only / worktree / branch モードを自動判定します。

```
sdd-forge flow cleanup
sdd-forge flow cleanup --dry-run
```

| オプション | 説明 |
| --- | --- |
| `--dry-run` | 実行内容を表示のみ |
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text({prompt: "終了コードの定義と stdout/stderr の使い分けルールを表形式で記述してください。ソースコードの process.exit() 呼び出しや出力パターンから抽出すること。", mode: "deep"})}} -->

#### 終了コード

| コード | 意味 | 使用箇所 |
| --- | --- | --- |
| `0` | 正常終了 | すべてのコマンド |
| `1` | 一般エラー（引数不足、ファイル未検出、検証失敗等） | `sdd-forge.js`（不明コマンド）、`docs review`（品質チェック失敗）、`flow status --check`（前提条件未達）、`spec lint`（違反検出）、`flow merge`（gh 未利用可能）、名前空間ディスパッチャ（不明サブコマンド） |
| `2` | ゲートチェック失敗（ユーザー対応が必要） | `flow start`（gate 失敗時、User Confirmation 未承認を含む） |

#### 出力の使い分け

| 出力先 | 用途 |
| --- | --- |
| `stdout` | コマンドの主要出力（生成結果、ステータス表示、ヘルプメッセージ、`--dry-run` の実行プレビュー） |
| `stderr` | 進捗ログ（`[data]`, `[forge]` 等のプレフィックス付き）、警告メッセージ（`WARN:`）、エラーメッセージ、review の途中経過（`[draft]`, `[final]` 等） |

`createLogger()` を使用するコマンド（data, agents, readme, translate 等）はログ出力に `stderr` を使用します。`console.log()` による主要出力は `stdout` に、`console.error()` による診断情報は `stderr` に分離されているため、パイプやリダイレクトでの利用が可能です。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← プロジェクト構成](project_structure.md) | [設定とカスタマイズ →](configuration.md)
<!-- {{/data}} -->
