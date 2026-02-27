# 02. CLI コマンドリファレンス

## 説明

<!-- @text-fill: この章の概要を1〜2文で記述してください。コマンド総数・グローバルオプションの有無・サブコマンド体系を踏まえること。 -->

`SCRIPTS` オブジェクトから `scan:all` を含めると 19 コマンド（エントリは 18 だが `scan:all` は別処理）が確認できます。正確な数を数えます。

`SCRIPTS` のキー: help, add, default, scan, scan:ctrl, scan:model, scan:shell, scan:route, scan:extra, init, populate, tfill, readme, spec, gate, forge, flow = 17 コマンド。加えて `scan:all` = 合計 18 コマンド。

`--project` グローバルオプションと `-h`/`--help` があることも確認できました。

`sdd-forge` は 18 のサブコマンドを提供する Node.js CLI ツールで、プロジェクト管理・ソースコード解析・ドキュメント生成・SDD ワークフロー実行の 4 つのカテゴリに分類される。全コマンド共通のグローバルオプションとして `--project` および `--help`（`-h`）をサポートし、引数なしの実行でもヘルプを表示する。


## 内容

### コマンド一覧

<!-- @text-fill: 全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。 -->

| コマンド | 説明 | 主なオプション |
|---|---|---|
| `help` | コマンド一覧を表示して終了する | — |
| `add` | プロジェクトをワークスペースに登録し作業ディレクトリを初期化する | `<name> <path>`（位置引数、必須） |
| `default` | デフォルトプロジェクトの表示・変更 | `[<name>]` |
| `spec` | 連番 feature ブランチと `specs/NNN-<slug>/spec.md` を作成する | `--title <name>`（必須）、`--base <branch>`、`--dry-run`、`--allow-dirty` |
| `gate` | `spec.md` の未解決事項を検査し実装可否を判定する | `--spec <path>`（必須） |
| `init` | テンプレートを `docs/` にコピーして初期化する | `--type <type>`、`--force` |
| `populate` | `docs/` 内の `@data-fill` ディレクティブを `analysis.json` で解決する | `--dry-run`、`--stdout` |
| `tfill` | `docs/` 内の `@text-fill` ディレクティブを AI エージェントで解決する | `--agent <name>`（必須）、`--dry-run`、`--timeout <ms>` |
| `readme` | `docs/NN_*.md` から `README.md` を自動生成する | `--dry-run` |
| `scan` | ソースコードを全解析して `.sdd-forge/output/analysis.json` に保存する | `--only <type>`、`--stdout` |
| `scan:ctrl` | コントローラのみ解析する（`scan --only controllers` の短縮形） | — |
| `scan:model` | モデルのみ解析する（`scan --only models` の短縮形） | — |
| `scan:shell` | Shell のみ解析する（`scan --only shells` の短縮形） | — |
| `scan:route` | ルートのみ解析する（`scan --only routes` の短縮形） | — |
| `scan:extra` | 拡張情報のみ解析する（`scan --only extras` の短縮形） | — |
| `scan:all` | 全解析 → `populate` を順次実行するショートカット | — |
| `forge` | プロンプト起点で `docs/` を反復改善する | `--prompt <text>`（必須）、`--spec <path>`、`--max-runs <n>`、`--agent <name>`、`--mode <mode>`、`--review-cmd <cmd>`、`-v` |
| `flow` | `spec` → `gate` → `forge` を自動で順次実行する | `--request <text>`（必須）、`--title <text>`、`--spec <path>`、`--agent <name>`、`--max-runs <n>`、`--forge-mode <m>` |


### グローバルオプション

<!-- @text-fill: 全コマンドに共通するグローバルオプションを表形式で記述してください。 -->

| オプション | 短縮形 | 説明 |
|---|---|---|
| `--project <name>` | — | 使用するプロジェクトを名前で指定する。省略時はデフォルトプロジェクトを使用。`add` / `default` / `help` コマンドでは無視される |
| `--help` | `-h` | ヘルプテキストを表示して終了する（引数なし実行でも同様） |

`--project` はサブコマンドの前後どちらに記述しても認識される。指定されたプロジェクト名は内部で `SDD_SOURCE_ROOT`（解析対象パス）と `SDD_WORK_ROOT`（作業ディレクトリパス）に変換され、各サブコマンドに引き渡される。


### 各コマンドの詳細

<!-- @text-fill: 各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとにサブセクションを立てること。 -->

#### `add`

プロジェクトをワークスペースに登録し、`projects/<name>/` 配下の作業ディレクトリ（`.sdd-forge/`、`docs/`、`specs/` 等）を初期化する。ソースプロジェクトに `.sdd-forge/config.json` があればコピーし、なければデフォルト設定（`lang: "ja"`）で生成する。

```
sdd-forge add <name> <path>
```

| 引数 | 説明 |
|---|---|
| `<name>` | プロジェクト識別名（任意の文字列）|
| `<path>` | 解析対象ソースプロジェクトの絶対パスまたは相対パス（存在必須）|

```bash
sdd-forge add my-app /home/user/repos/my-app
```

#### `default`

引数なしで登録済みプロジェクト一覧とデフォルトプロジェクトを表示する。名前を指定するとデフォルトプロジェクトを変更する。

```
sdd-forge default [<name>]
```

```bash
sdd-forge default           # 一覧表示
sdd-forge default my-app    # デフォルトをmy-appに変更
```

#### `scan` / `scan:ctrl` / `scan:model` / `scan:shell` / `scan:route` / `scan:extra`

対象プロジェクトの `app/` ディレクトリを静的解析し、結果を `.sdd-forge/output/analysis.json` に保存する。`scan` は全カテゴリを一括解析する。各 `scan:<type>` は `--only <type>` を自動注入して対象を絞る。

```
sdd-forge scan [options]
sdd-forge scan:ctrl | scan:model | scan:shell | scan:route | scan:extra
```

| オプション | 説明 |
|---|---|
| `--only <type>` | `controllers` / `models` / `shells` / `routes` / `extras` のいずれか |
| `--stdout` | `analysis.json` に書き込まず stdout に JSON を出力 |

```bash
sdd-forge scan               # 全解析 → .sdd-forge/output/analysis.json
sdd-forge scan:ctrl          # コントローラのみ解析
sdd-forge scan --stdout      # stdout に JSON 出力（パイプ用途）
```

#### `scan:all`

`scan`（全解析）を実行後に `populate` を続けて実行するショートカット。内部で `scan.js` と `populate.js` を順次 `import` する。

```bash
sdd-forge scan:all
```

#### `init`

テンプレートを `docs/` にコピーする。テンプレートタイプは `--type` オプション、または `.sdd-forge/config.json` の `type` フィールドから解決する。`.sdd-forge/project-overrides.json` が存在する場合、コピー時に `replace-directive` / `insert-after` / `insert-before` アクションを適用する。

```
sdd-forge init [options]
```

| オプション | 説明 |
|---|---|
| `--type <type>` | テンプレートタイプ（例: `php-mvc`、`node-cli`）。省略時は `config.json` の `type` を使用 |
| `--force` | `docs/` に既存ファイルがある場合でも上書きする |

```bash
sdd-forge init                   # config.json の type を使用
sdd-forge init --type node-cli   # テンプレートタイプを明示指定
sdd-forge init --force           # 既存 docs/ を上書き
```

#### `populate`

`docs/` 配下の `NN_*.md` ファイル内の `<!-- @data-fill: ... -->` ディレクティブを `analysis.json` の解析データで解決し、上書き保存する。`@text-fill` ディレクティブはスキップして stderr にログを出力する。

```
sdd-forge populate [options]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | ファイル書き込みを行わず、変更行数のみ表示 |
| `--stdout` | 各ファイルの変更行数を stdout に出力 |

```bash
sdd-forge populate               # @data-fill を解決してファイル更新
sdd-forge populate --dry-run     # 変更プレビューのみ
```

事前に `sdd-forge scan` を実行して `.sdd-forge/output/analysis.json` を生成しておく必要がある。

#### `tfill`

`docs/` 配下の `NN_*.md` ファイル内の `<!-- @text-fill: ... -->` ディレクティブを LLM エージェントで解決し、ディレクティブ直後に生成テキストを挿入する。エージェントの設定は `.sdd-forge/config.json` の `providers` から解決する。

```
sdd-forge tfill --agent <name> [options]
```

| オプション | 説明 |
|---|---|
| `--agent <name>` | 使用するエージェント名（必須）。`config.json` の `providers` キーに一致する値を指定 |
| `--dry-run` | ファイル書き込みを行わず、プロンプト長のみ表示 |
| `--timeout <ms>` | エージェント呼び出しのタイムアウト（デフォルト: `120000`）|

```bash
sdd-forge tfill --agent claude
sdd-forge tfill --agent claude --dry-run
sdd-forge tfill --agent claude --timeout 60000
```

#### `readme`

`docs/NN_*.md` を番号順に読み取り、各章のタイトルと `## 説明` セクションを抽出して `README.md` を生成する。既存 `README.md` 内の `<!-- MANUAL:START --> ... <!-- MANUAL:END -->` ブロックは保持される。テンプレートタイプが `config.json` に未設定の場合はスキップする。

```
sdd-forge readme [options]
```

| オプション | 説明 |
|---|---|
| `--dry-run` | 差分を表示するが `README.md` への書き込みを行わない |

```bash
sdd-forge readme
sdd-forge readme --dry-run
```

#### `spec`

連番の feature ブランチを作成し、`specs/NNN-<slug>/` ディレクトリと `spec.md` / `qa.md` を生成する。連番は既存 `specs/` ディレクトリのサブディレクトリ名と `feature/NNN-*` ブランチ名の最大値 + 1 で決定する。デフォルトではワークツリーが clean でなければ終了する。

```
sdd-forge spec --title <name> [options]
```

| オプション | 説明 |
|---|---|
| `--title <name>` | ブランチ名・ディレクトリ名のスラッグ部分（必須）。英数字以外は `-` に変換され 48 文字で切り詰め |
| `--base <branch>` | ブランチの作成元（デフォルト: `master`）|
| `--dry-run` | 変更せず作成予定のパスのみ表示 |
| `--allow-dirty` | ワークツリーが dirty でも続行する |

```bash
sdd-forge spec --title "add-export-api"
sdd-forge spec --title "fix-login" --base development
sdd-forge spec --title "my-feature" --dry-run
```

#### `gate`

`spec.md` を検査し、実装開始可能かを判定する。以下のいずれかが存在すると FAIL となる: `TBD` / `TODO` / `FIXME` / `[NEEDS CLARIFICATION]` トークン、未チェックのタスク行（`- [ ]`）、必須セクション（`## Clarifications`、`## Open Questions`、`## User Confirmation`、`## Acceptance Criteria`）の欠如、ユーザー承認チェックボックス（`- [x] User approved this spec`）の未設定。

```
sdd-forge gate --spec <path>
```

| オプション | 説明 |
|---|---|
| `--spec <path>` | 検査対象の `spec.md` パス（必須）|

```bash
sdd-forge gate --spec specs/001-add-export-api/spec.md
```

PASS 時は stdout に `gate: PASSED` を出力して終了コード 0。FAIL 時は stderr に `gate: FAILED` と検出項目一覧を出力して終了コード 1。

#### `forge`

`--prompt` で指定した内容をもとに `docs/` の改善を反復する。各ラウンドで `populate` / `tfill` の自動適用 → レビューコマンド実行 → フィードバック収集 → 次ラウンドへの引き渡しを繰り返す。レビューが PASS するか `--max-runs` に達すると終了する。

```
sdd-forge forge --prompt "<text>" [options]
```

| オプション | 説明 |
|---|---|
| `--prompt <text>` | 改善の起点となるプロンプト（`--prompt-file` との排他）|
| `--prompt-file <path>` | プロンプトをファイルから読み込む |
| `--spec <path>` | 入力仕様書（`spec.md`）をプロンプトに含める |
| `--max-runs <n>` | 最大反復回数（デフォルト: `5`）|
| `--review-cmd <cmd>` | docs レビューコマンド（デフォルト: `npm run sdd:review`）|
| `--agent <name>` | 使用する AI エージェント（`config.json` の `defaultAgent` を上書き）|
| `--mode <mode>` | 実行モード: `local`（デフォルト）/ `assist` / `agent` |
| `-v, --verbose` | エージェント実行ログを逐次表示 |

```bash
sdd-forge forge --prompt "コントローラ一覧を最新化する"
sdd-forge forge --prompt "仕様に従い docs を更新" --spec specs/001-foo/spec.md
sdd-forge forge --prompt "更新" --agent claude --mode agent --max-runs 3
```

AI が追加情報を要求した場合は `NEEDS_INPUT` を出力して終了コード 2 で停止する。

#### `flow`

`spec` → `gate` → `forge` を自動で順次実行する。`--spec` 未指定時は新たに spec を作成する。`gate` が FAIL した場合は `NEEDS_INPUT` を出力して終了コード 2 で停止する。`gate` PASS 後は `forge` を実行し、その終了コードをそのまま伝播する。

```
sdd-forge flow --request "<text>" [options]
```

| オプション | 説明 |
|---|---|
| `--request <text>` | 実装要求（必須）|
| `--title <text>` | spec 用スラッグ（省略時は `--request` 先頭 40 文字から生成）|
| `--spec <path>` | 既存 `spec.md` を使用する（spec 作成をスキップ）|
| `--agent <name>` | AI エージェント（`forge` に引き渡す）|
| `--max-runs <n>` | `forge` の最大反復回数（デフォルト: `5`）|
| `--forge-mode <m>` | `forge` の実行モード: `local` / `assist` / `agent`（デフォルト: `local`）|

```bash
sdd-forge flow --request "認証フローをドキュメント化する"
sdd-forge flow --request "DB設計を更新" --spec specs/003-db-update/spec.md
sdd-forge flow --request "API追加" --agent claude --forge-mode agent
```


### 終了コードと出力

<!-- @text-fill: 終了コードの定義（0=成功 等）と、stdout/stderr の使い分けルールを表形式で記述してください。 -->

| 終了コード | 意味 | 主な発生コマンド |
|---|---|---|
| `0` | 正常終了 | 全コマンド |
| `1` | エラー終了（設定不備・ファイル未存在・gate FAIL・実行失敗等） | 全コマンド |
| `2` | ユーザー入力待ち（NEEDS_INPUT 検出、未解決事項あり） | `flow`, `forge` |

`flow` は内部で呼び出したサブプロセスの終了コードをそのまま伝播する。

| 出力先 | 用途 | 出力例 |
|---|---|---|
| stdout | 主要な結果・ヘルプテキスト | JSON 解析結果（`--stdout`）、`gate: PASSED`、spec 作成完了メッセージ、ヘルプ表示 |
| stderr | 進捗ログ・エラー・警告 | `[analyze] controllers ...`、`gate: FAILED`、`[tfill] ERROR ...`、`[init] WARN ...` |

進捗ログはすべて `[コマンド名]` プレフィックス付きで stderr に出力されるため、stdout を他のプロセスにパイプしても混在しない。
