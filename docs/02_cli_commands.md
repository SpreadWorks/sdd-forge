# 02. CLI コマンドリファレンス

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。 -->

`sdd-forge` は 18 のサブコマンドを提供し、Project / Build / Docs / Scan / Spec / Flow の 6 グループに分類されます。全コマンドに共通して `-h, --help` オプションが利用でき、マルチプロジェクト環境では `--project <name>` グローバルオプションで対象プロジェクトを切り替えられます。

## 内容

### コマンド一覧

<!-- @text: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。 -->

| グループ | コマンド | 説明 | 主なオプション |
|---|---|---|---|
| — | `help` | コマンド一覧を表示する | なし |
| Project | `setup` | プロジェクト登録と設定ファイル生成（対話式ウィザード） | `--name`, `--path`, `--type`, `--agent`, `--lang`, `--dry-run` |
| Project | `upgrade` | プロジェクト設定を最新テンプレートにアップグレードする | `--dry-run` |
| Project | `default` | デフォルトプロジェクトを設定する | なし |
| Build | `build` | ドキュメントを一括生成する（scan → init → data → text → readme） | なし |
| Docs | `init` | テンプレートから `docs/` を初期化する | `--type`, `--force`, `--dry-run` |
| Docs | `forge` | `docs/` を AI で反復改善する | `--prompt`, `--spec`, `--agent`, `--mode`, `--max-runs`, `--dry-run` |
| Docs | `review` | `docs/` の品質チェックを行う | なし |
| Docs | `changelog` | `specs/` から `change_log.md` を生成する | `--dry-run` |
| Docs | `agents` | `AGENTS.md` の PROJECT セクションを更新する | `--sdd`, `--project`, `--dry-run` |
| Docs | `readme` | `README.md` を自動生成する | `--dry-run` |
| Scan | `scan` | ソースコードを解析して `analysis.json` / `summary.json` を生成する | `--stdout`, `--dry-run` |
| Scan | `data` | `@data` ディレクティブを解析データで解決する | `--dry-run` |
| Scan | `text` | `@text` ディレクティブを AI で解決する | `--agent`, `--timeout`, `--id`, `--dry-run` |
| Spec | `spec` | spec を初期化して feature ブランチを作成する | `--title`（必須）, `--base`, `--no-branch`, `--worktree`, `--dry-run` |
| Spec | `gate` | spec のゲートチェックを行う | `--spec`（必須） |
| Flow | `flow` | SDD フロー（spec → gate → forge）を自動実行する | `--request`（必須）, `--spec`, `--agent`, `--no-branch`, `--worktree`, `--dry-run` |
| Info | `presets list` | 利用可能なプリセット一覧を表示する | なし |

### グローバルオプション

<!-- @text: 全コマンドに共通するグローバルオプションを表形式で記述してください。 -->

| オプション | 説明 |
|---|---|
| `-h, --help` | コマンドのヘルプを表示して終了する |
| `--project <name>` | 操作対象のプロジェクトを指定する（`projects.json` に登録済みのプロジェクト名）。省略時はデフォルトプロジェクトまたはカレントディレクトリを使用する |

### 各コマンドの詳細

<!-- @text: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。 -->

#### help

コマンド一覧とバージョンを標準出力に表示します。UI 言語は `.sdd-forge/config.json` の `uiLang` フィールドに従います（デフォルト: `en`）。

```
sdd-forge help
```

#### setup

対話式ウィザードでプロジェクトを登録し、`.sdd-forge/config.json` と `AGENTS.md` を生成します。`--name` などのオプションを渡すと対話をスキップできます。

```
sdd-forge setup
sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2 --agent claude
```

| オプション | 説明 |
|---|---|
| `--name <name>` | プロジェクト名 |
| `--path <path>` | ソースコードのルートパス |
| `--work-root <path>` | 作業ルート（`.sdd-forge/` の配置先） |
| `--type <type>` | プロジェクト種別（例: `webapp/cakephp2`, `cli/node-cli`） |
| `--agent <name>` | デフォルト AI エージェント名 |
| `--lang <ja\|en>` | ドキュメント出力言語 |
| `--ui-lang <ja\|en>` | UI メッセージ言語 |
| `--purpose <purpose>` | ドキュメントスタイル（目的） |
| `--tone <tone>` | ドキュメントスタイル（トーン） |
| `--project-context <text>` | プロジェクト概要テキスト |
| `--set-default` | このプロジェクトをデフォルトに設定する |
| `--dry-run` | 設定内容を表示するが書き込まない |

#### upgrade

`AGENTS.md` の SDD セクションを最新テンプレートに更新します。手動記述の `MANUAL` ブロックは保持されます。

```
sdd-forge upgrade
sdd-forge upgrade --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 差分を表示するが書き込まない |

#### default

デフォルトプロジェクトを設定します。`projects.json` に登録済みのプロジェクト名を指定します。

```
sdd-forge default <project-name>
```

#### build

`scan → init → data → text → readme` を順に実行し、ドキュメントを一括生成します。初回セットアップ後や大きな変更後に使用します。

```
sdd-forge build
```

#### init

プリセットのテンプレートチェーンをマージして `docs/` に章ファイルを出力します。`analysis.json` が存在する場合、AI による章選別も行われます。

```
sdd-forge init
sdd-forge init --force
sdd-forge init --type webapp/laravel --dry-run
```

| オプション | 説明 |
|---|---|
| `--type <type>` | プロジェクト種別を明示指定する（省略時は `config.json` の `type` を使用） |
| `--force` | 既存の章ファイルを上書きする |
| `--dry-run` | 出力内容を表示するが書き込まない |

#### forge

`docs/` の章ファイルを AI で改善します。`--prompt` に変更内容の要約を渡し、`review` が PASS するまで最大 `--max-runs` 回反復します。

```
sdd-forge forge --prompt "ユーザー認証機能を追加した"
sdd-forge forge --prompt "API 設計を更新" --spec specs/001-api-update/spec.md --mode agent
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 開始プロンプト（必須） |
| `--prompt-file <path>` | プロンプトをファイルから読み込む |
| `--spec <path>` | 参照する spec.md のパス |
| `--agent <name>` | 使用する AI エージェント名 |
| `--mode <mode>` | 実行モード: `local`（デフォルト）/ `assist` / `agent` |
| `--max-runs <n>` | 最大反復回数（デフォルト: 3） |
| `--review-cmd <cmd>` | レビューコマンド（デフォルト: `sdd-forge review`） |
| `--auto-update-context` | review 成功後に `context.json` を確認なしで自動更新する |
| `-v, --verbose` | エージェント実行ログを逐次表示する |
| `--dry-run` | ファイル書き込み・review・エージェント呼び出しをスキップする |

#### review

`docs/` 配下の章ファイル（`NN_*.md`）を検証します。H1 見出しの有無・行数・未解決ディレクティブ・`analysis.json` の鮮度などをチェックし、問題があれば詳細を出力して終了コード 1 で終了します。

```
sdd-forge review
sdd-forge review path/to/docs
```

#### changelog

`specs/` 配下の `spec.md` を走査して `change_log.md` を生成します。既存ファイルの `MANUAL` ブロックは保持されます。

```
sdd-forge changelog
sdd-forge changelog --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 生成内容を表示するが書き込まない |

#### agents

`AGENTS.md` の PROJECT セクションを `analysis.json` の情報をもとに更新します。デフォルトでは SDD テンプレート差し替えと PROJECT テンプレート生成の両方を実行し、AI による精査・追記も行います。

```
sdd-forge agents
sdd-forge agents --sdd
sdd-forge agents --project --dry-run
```

| オプション | 説明 |
|---|---|
| `--sdd` | SDD セクションのみテンプレートで差し替える（AI なし） |
| `--project` | PROJECT セクションのみ生成・AI 精査する |
| `--dry-run` | 生成内容を表示するが書き込まない |

#### readme

`docs/` の章ファイルをもとに `README.md` を自動生成します。`forge` 実行後の review 成功時にも自動的に呼び出されます。

```
sdd-forge readme
sdd-forge readme --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 差分を表示するが書き込まない |

#### scan

ソースコードを解析して `.sdd-forge/output/analysis.json` と `.sdd-forge/output/summary.json` を生成します。プリセットの DataSource チェーン（親 preset → 子 preset → プロジェクトローカル）を順にロードして実行します。

```
sdd-forge scan
sdd-forge scan --stdout
```

| オプション | 説明 |
|---|---|
| `--stdout` | 結果を標準出力に出力する（ファイル書き込みなし） |
| `--dry-run` | `--stdout` と同じ（ファイル書き込みなし） |

#### data

`docs/` の章ファイルに含まれる `@data` ディレクティブを `analysis.json` の解析データで解決・置換します。`@text` ディレクティブはスキップされます。

```
sdd-forge data
sdd-forge data --dry-run
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 置換結果を表示するが書き込まない |

#### text

`docs/` の章ファイルに含まれる `@text` ディレクティブを AI エージェントで解決し、ディレクティブ直後に本文を挿入します。`--agent` の指定がない場合は `config.json` の `defaultAgent` を使用します。

```
sdd-forge text --agent claude
sdd-forge text --agent claude --dry-run
sdd-forge text --agent claude --id 02_cli_commands.md
```

| オプション | 説明 |
|---|---|
| `--agent <name>` | 使用する AI エージェント名 |
| `--timeout <ms>` | エージェントタイムアウト（ミリ秒、デフォルト: 180000） |
| `--id <id>` | 処理対象ファイルを絞り込む |
| `--per-directive` | ディレクティブごとに個別にエージェントを呼び出す |
| `--dry-run` | 解決結果を表示するが書き込まない |

#### spec

連番の feature ブランチと `specs/NNN-<slug>/spec.md` を作成します。worktree 内で実行した場合は自動的に `--no-branch` が付与されます。

```
sdd-forge spec --title "user-auth"
sdd-forge spec --title "api-redesign" --worktree
sdd-forge spec --title "hotfix" --no-branch --dry-run
```

| オプション | 説明 |
|---|---|
| `--title <name>` | spec のスラッグ名（必須） |
| `--base <branch>` | ブランチ作成元（デフォルト: 現在のブランチ） |
| `--no-branch` | ブランチを作成せず spec ファイルのみ作成する |
| `--worktree` | git worktree を作成して spec を配置する |
| `--allow-dirty` | ワーキングツリーが dirty でも続行する |
| `--dry-run` | 実行内容を表示するが変更しない |

#### gate

`spec.md` の未解決項目を検出します。未チェックのタスク・`TBD`/`TODO` トークン・ユーザー承認チェックの有無・必須セクションの存在を検証し、問題があれば一覧を出力して終了コード 1 で終了します。

```
sdd-forge gate --spec specs/001-user-auth/spec.md
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | 検証対象の spec.md パス（必須） |

#### flow

spec 作成 → gate → forge を連続実行する SDD フロー自動実行コマンドです。gate が FAIL した場合は未解決事項を出力して終了コード 2 で停止し、実装を開始しません。

```
sdd-forge flow --request "ユーザー認証機能を追加する"
sdd-forge flow --request "API を改修する" --spec specs/002-api/spec.md --agent claude
```

| オプション | 説明 |
|---|---|
| `--request <text>` | 実装要求テキスト（必須） |
| `--title <text>` | spec 用スラッグ名（省略時は `--request` の先頭から生成） |
| `--spec <path>` | 既存 spec.md を使用する |
| `--agent <name>` | 使用する AI エージェント名 |
| `--max-runs <n>` | `forge` の最大反復回数（デフォルト: 5） |
| `--forge-mode <mode>` | `forge` の実行モード: `local` / `assist` / `agent`（デフォルト: `local`） |
| `--no-branch` | ブランチを作成せず spec のみ作成する |
| `--worktree` | git worktree を作成して spec を配置する |
| `--dry-run` | 全サブコマンドを dry-run モードで実行する |

#### presets list

登録済みプリセットの一覧を表示します。`src/presets/*/preset.json` から自動検出されたプリセット名・アーキテクチャ・対応 type 値が出力されます。

```
sdd-forge presets list
```

### 終了コードと出力

<!-- @text: 終了コードの定義（0=成功 等）と、stdout/stderr の使い分けルールを表形式で記述してください。 -->

**終了コード**

| 終了コード | 意味 | 主な発生コマンド |
|---|---|---|
| `0` | 正常終了 | すべてのコマンド |
| `1` | エラー終了（設定ファイル不在・検証失敗・ファイル未検出など） | `review`, `gate`, `scan`, `forge` など |
| `2` | 入力待ち状態（NEEDS_INPUT）：gate 失敗またはユーザー承認未取得 | `flow`, `forge`（local モードで review 失敗時） |

**stdout / stderr の使い分け**

| 出力先 | 使用内容 |
|---|---|
| stdout | コマンドの進捗メッセージ・生成ファイルパス・dry-run 結果・ヘルプテキスト |
| stderr | エラーメッセージ・gate の失敗理由・スタックトレース |
