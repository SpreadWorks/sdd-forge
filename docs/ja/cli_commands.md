<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../cli_commands.md) | **日本語**
<!-- {{/data}} -->

# CLI コマンドリファレンス

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。コマンド総数・サブコマンド体系を踏まえること。"})}} -->

`sdd-forge` はトップレベルで `docs`・`spec`・`flow`・`setup`・`upgrade`・`presets`・`help` を持つ CLI です。解析データ上、`docs` は 11 個のサブコマンドをディスパッチし、`flow` は `set` 配下の状態更新コマンドと `run` 配下の実行コマンド、`spec` は仕様作成・ゲート・ガードレール管理・lint を提供します。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text({prompt: "全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。ソースコードのコマンド定義・ルーティングから網羅的に抽出すること。", mode: "deep"})}} -->

| コマンド | 説明 | 主なオプション |
| --- | --- | --- |
| `sdd-forge help` | 全サブコマンド一覧を表示します。 | なし |
| `sdd-forge setup` | 対話型または非対話で `.sdd-forge/config.json` を生成し、プロジェクトを登録します。 | `--name` `--path` `--work-root` `--type` `--purpose` `--tone` `--agent` `--lang` `--dry-run` |
| `sdd-forge upgrade` | スキルや `AGENTS.md` の SDD セクションなど、テンプレート由来ファイルを更新します。 | `--dry-run` |
| `sdd-forge presets list` | プリセットの継承ツリーを表示します。 | `-h` `--help` |
| `sdd-forge docs build` | `scan → enrich → init → data → text → readme → agents → [translate]` のパイプラインを順次実行します。 | `--force` `--regenerate` `--verbose` `--dry-run` |
| `sdd-forge docs scan` | `docs/commands/scan.js` にルーティングされます。 | 解析データに個別オプションの記載はありません。 |
| `sdd-forge docs enrich` | `docs/commands/enrich.js` にルーティングされ、`docs build` の enrich ステップでも使われます。 | 解析データに個別オプションの記載はありません。 |
| `sdd-forge docs init` | テンプレート継承チェーンを解決し、`docs/` 配下の章ファイルを初期生成します。 | `--type` `--lang` `--docs-dir` `--force` `--dry-run` |
| `sdd-forge docs data` | `analysis.json` をもとに `{{data}}` ディレクティブを解決して章ファイルへ反映します。 | `--docs-dir` `--dry-run` `--stdout` |
| `sdd-forge docs text` | `docs/commands/text.js` にルーティングされ、`docs build` の text ステップでも使われます。 | 解析データに個別オプションの記載はありません。 |
| `sdd-forge docs readme` | `docs/` 配下の章から `README.md` を自動生成します。 | `--lang` `--output` `--dry-run` |
| `sdd-forge docs forge` | AI エージェントで docs 改善を反復し、レビュー結果を次ラウンドへ反映します。 | `--prompt` `--prompt-file` `--spec` `--max-runs` `--review-cmd` `--mode` `--dry-run` `--verbose` |
| `sdd-forge docs review` | 章ファイルや `README.md` の構造、未充填ディレクティブ、出力整合性を検査します。 | 対象ディレクトリを位置引数で指定可能 |
| `sdd-forge docs changelog` | `specs/` を走査して `docs/change_log.md` を生成します。 | `--dry-run` |
| `sdd-forge docs agents` | `AGENTS.md` を生成・更新し、`agents.sdd` と `agents.project` のディレクティブを解決します。 | `--dry-run` |
| `sdd-forge docs translate` | `docs/commands/translate.js` にルーティングされ、`docs build` の多言語出力でも使われます。 | 解析データに個別オプションの記載はありません。 |
| `sdd-forge spec init` | 連番の feature ブランチと `specs/<番号>-<slug>/` を初期化し、`spec.md` と `qa.md` を作成します。 | `--title` `--base` `--dry-run` `--allow-dirty` `--no-branch` `--worktree` |
| `sdd-forge spec gate` | spec の未解決事項を検出し、必要に応じてガードレール AI チェックを実行します。 | `--spec` `--phase` `--skip-guardrail` |
| `sdd-forge spec guardrail init` | プリセットチェーンから `.sdd-forge/guardrail.md` を生成します。 | `--force` |
| `sdd-forge spec guardrail update` | 既存ガードレールへ AI でプロジェクト固有の条項を提案・追記します。 | 解析データに個別オプションの記載はありません。 |
| `sdd-forge spec guardrail show` | ガードレール条項を表示し、`--phase` で絞り込みます。 | `--phase` |
| `sdd-forge spec lint` | ベースブランチとの差分ファイルに対してガードレール lint パターンを適用します。 | `--base` |
| `sdd-forge flow set issue <number>` | `flow.json` の issue 番号を設定します。 | 位置引数 `<number>` |
| `sdd-forge flow set metric <phase> <counter>` | `flow.json` のメトリクスカウンターをインクリメントします。 | 位置引数 `<phase>` `<counter>` |
| `sdd-forge flow set note "<text>"` | `flow.json` の `notes` 配列へメモを追加します。 | 位置引数 `<text>` |
| `sdd-forge flow set redo` | `specs/<spec>/redolog.json` にやり直し記録を追加します。 | `--step` `--reason` `--trigger` `--resolution` `--guardrail-candidate` |
| `sdd-forge flow set req <index> <status>` | 要件一覧の個別ステータスを更新します。 | 位置引数 `<index>` `<status>` |
| `sdd-forge flow set request "<text>"` | `flow.json` の `request` を設定します。 | 位置引数 `<text>` |
| `sdd-forge flow set step <id> <status>` | ワークフローステップの状態を更新します。 | 位置引数 `<id>` `<status>` |
| `sdd-forge flow set summary '<json-array>'` | JSON 文字列配列から要件一覧を一括設定します。 | 位置引数 `<json-array>` |
| `sdd-forge flow run merge` | アクティブフローに基づいて squash merge または PR 作成を行います。 | `--dry-run` `--pr` `--auto` |
| `sdd-forge flow run cleanup` | `.active-flow` エントリ削除と worktree・ブランチ削除を行います。 | `--dry-run` |
| `sdd-forge flow run review` | 実装後レビューを draft → final → 承認の 3 フェーズで実行します。 | `--dry-run` `--skip-confirm` |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text({prompt: "全コマンドに共通するグローバルオプションを表形式で記述してください。ソースコードの引数パース処理から抽出すること。", mode: "deep"})}} -->

ソースコード上、すべてのコマンドで共通に解釈されるグローバルオプションは定義されていません。複数の入口で繰り返し使われている主なオプションは次のとおりです。

| オプション | 主に使われるコマンド | 内容 |
| --- | --- | --- |
| `-h`, `--help` | `sdd-forge`、`docs` ディスパッチャ、`flow` ディスパッチャ、`presets list`、多くの個別コマンド | 使用方法とオプションを表示します。 |
| `--dry-run` | `docs build` `docs init` `docs data` `docs readme` `docs forge` `docs changelog` `docs agents` `setup` `upgrade` `spec init` `flow run merge` `flow run cleanup` `flow run review` | 実際の書き込みや実行を行わず、予定内容を表示します。 |
| `--verbose` | `docs build` `docs forge` | 進捗や詳細ログを増やします。 |
| `--force` | `docs build` `docs init` `spec guardrail init` | 既存ファイルの上書きや強制処理に使います。 |
| `--lang` | `setup` `docs init` `docs readme` | 出力言語またはセットアップ言語を指定します。 |
| 位置引数 | `flow set` 系、`docs review` など | コマンドによって ID、番号、対象ディレクトリ、JSON 文字列などを受け取ります。 |
<!-- {{/text}} -->

### 各コマンドの詳細

<!-- {{text({prompt: "各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとに #### サブセクションを立てること。ソースコードの引数定義・ヘルプメッセージから情報を抽出すること。", mode: "deep"})}} -->

#### `sdd-forge help`
使用方法: `sdd-forge help`
利用可能なトップレベルコマンドをセクション付きで表示します。
主なオプションはありません。
実行例: `sdd-forge help`

#### `sdd-forge setup`
使用方法: `sdd-forge setup [--name <name>] [--path <path>] [--work-root <path>] [--type <type>] [--purpose <purpose>] [--tone <tone>] [--agent <agent>] [--lang <lang>] [--dry-run]`
対話型ではプロジェクト名、出力言語、プリセット、ドキュメント目的、トーン、エージェント設定を収集します。
非対話では引数から設定を受け取り、`.sdd-forge/config.json`、`docs/`、`specs/`、スキル、`AGENTS.md` などを準備します。
実行例: `sdd-forge setup --name myapp --path /path/to/src --type webapp/cakephp2`

#### `sdd-forge upgrade`
使用方法: `sdd-forge upgrade [--dry-run]`
テンプレート管理対象のスキルや `AGENTS.md` の SDD セクションを現在のバージョンに合わせて更新します。
`config.json` や `context.json` は変更しません。
実行例: `sdd-forge upgrade --dry-run`

#### `sdd-forge presets list`
使用方法: `sdd-forge presets list`
`base` を起点に、プリセットの継承ツリー、別名、scan キー、テンプレート有無を表示します。
ヘルプは `-h` または `--help` で表示します。
実行例: `sdd-forge presets list`

#### `sdd-forge docs build`
使用方法: `sdd-forge docs build [--force] [--regenerate] [--verbose] [--dry-run]`
`scan`、`enrich`、`init`、`data`、`text`、`readme`、`agents`、必要に応じて `translate` を順に実行します。
`--regenerate` 指定時は既存 `docs/` を前提に `init` を省略し、章ファイルがない場合はエラー終了します。
実行例: `sdd-forge docs build --verbose`

#### `sdd-forge docs scan`
使用方法: `sdd-forge docs scan --help`
`src/docs.js` から `docs/commands/scan.js` へルーティングされます。
本解析データには個別オプションの詳細は含まれていません。
実行例: `sdd-forge docs scan --help`

#### `sdd-forge docs enrich`
使用方法: `sdd-forge docs enrich --help`
`docs build` の enrich ステップでも使われるサブコマンドです。
エージェント未設定時は `docs build` からの呼び出しでスキップされます。
実行例: `sdd-forge docs enrich --help`

#### `sdd-forge docs init`
使用方法: `sdd-forge docs init [--type <type>] [--lang <lang>] [--docs-dir <dir>] [--force] [--dry-run]`
テンプレート継承チェーンを解決し、`README.md` を除く章テンプレートを `docs/` 配下へ展開します。
`config.chapters` 未定義かつ分析とエージェントがある場合は AI による章選別を行います。
実行例: `sdd-forge docs init --type cli --force`

#### `sdd-forge docs data`
使用方法: `sdd-forge docs data [--docs-dir <dir>] [--dry-run] [--stdout]`
`analysis.json` を読み込み、`docs/` 内の `{{data}}` ディレクティブを解決します。
`{{text}}` はこのコマンドでは埋めず、スキップとして扱います。
実行例: `sdd-forge docs data --dry-run`

#### `sdd-forge docs text`
使用方法: `sdd-forge docs text --help`
`src/docs.js` から `docs/commands/text.js` へルーティングされます。
本解析データでは、`docs build` の text ステップとして使われることが確認できます。
実行例: `sdd-forge docs text --help`

#### `sdd-forge docs readme`
使用方法: `sdd-forge docs readme [--lang <lang>] [--output <path>] [--dry-run]`
章ファイルから `README.md` テンプレートを構築し、`{{data}}` と `{{text}}` を処理して出力します。
`--output` は多言語出力時の `lang/README.md` 生成にも使われます。
実行例: `sdd-forge docs readme --output docs/ja/README.md`

#### `sdd-forge docs forge`
使用方法: `sdd-forge docs forge [--prompt <text>] [--prompt-file <file>] [--spec <spec.md>] [--max-runs <n>] [--review-cmd <cmd>] [--mode <local|assist|agent>] [--dry-run] [--verbose]`
AI エージェントで docs を改善し、各ラウンドの後にレビューコマンドを実行して再試行します。
`--mode` は `local`、`assist`、`agent` を受け付け、既定値は `local` です。
実行例: `sdd-forge docs forge --prompt "ユーザー向けに簡潔化" --max-runs 3`

#### `sdd-forge docs review`
使用方法: `sdd-forge docs review [<targetDir>]`
章ファイルの最小行数、H1 見出し、未充填の `{{text}}`・`{{data}}`、壊れたコメント、残留ブロックディレクティブなどを検査します。
多言語設定がある場合は非デフォルト言語ディレクトリも検査対象です。
実行例: `sdd-forge docs review docs`

#### `sdd-forge docs changelog`
使用方法: `sdd-forge docs changelog [outputFile] [--dry-run]`
`specs/` 配下の各 `spec.md` からタイトル、作成日、ステータス、ブランチ、概要を抽出してテーブル化します。
既定の出力先は `docs/change_log.md` です。
実行例: `sdd-forge docs changelog --dry-run`

#### `sdd-forge docs agents`
使用方法: `sdd-forge docs agents [--dry-run]`
`AGENTS.md` がなければテンプレートから新規作成し、`agents.sdd` と `agents.project` を解決します。
`project` セクションがある場合は AI で精査して差し替えます。
実行例: `sdd-forge docs agents --dry-run`

#### `sdd-forge docs translate`
使用方法: `sdd-forge docs translate --help`
`src/docs.js` から `docs/commands/translate.js` へルーティングされます。
`docs build` の多言語出力時に自動で呼ばれる場合があります。
実行例: `sdd-forge docs translate --help`

#### `sdd-forge spec init`
使用方法: `sdd-forge spec init --title <title> [--base <branch>] [--dry-run] [--allow-dirty] [--no-branch] [--worktree]`
連番付きの feature ブランチ名と spec ディレクトリ名を自動採番し、`spec.md` と `qa.md` を生成します。
`--no-branch` または worktree 内実行時は spec-only、`--worktree` 指定時は別 worktree を作成します。
実行例: `sdd-forge spec init --title "contact-form" --worktree`

#### `sdd-forge spec gate`
使用方法: `sdd-forge spec gate --spec <path> [--phase <pre|post>] [--skip-guardrail]`
未解決トークン、未チェック項目、必須セクション不足、ユーザー承認不足を検出します。
`--skip-guardrail` を付けない場合は、ガードレール条項に対する AI コンプライアンスチェックも実行します。
実行例: `sdd-forge spec gate --spec specs/001-feature/spec.md --phase pre`

#### `sdd-forge spec guardrail init`
使用方法: `sdd-forge spec guardrail init [--force]`
プリセットチェーンの guardrail テンプレートをマージして `.sdd-forge/guardrail.md` を作成します。
既存ファイルがある場合は `--force` で上書きします。
実行例: `sdd-forge spec guardrail init --force`

#### `sdd-forge spec guardrail update`
使用方法: `sdd-forge spec guardrail update`
`analysis.json` と既存ガードレールを AI に渡し、プロジェクト固有の追加条項を提案・追記します。
本解析データには個別オプションの記載はありません。
実行例: `sdd-forge spec guardrail update`

#### `sdd-forge spec guardrail show`
使用方法: `sdd-forge spec guardrail show [--phase <spec|impl|lint>]`
マージ済みガードレール条項を表示し、フェーズで絞り込みます。
`phase` が未指定の場合の既定動作は解析データに記載されていません。
実行例: `sdd-forge spec guardrail show --phase spec`

#### `sdd-forge spec lint`
使用方法: `sdd-forge spec lint --base <branch>`
`git diff --name-only <base>...HEAD` で取得した変更ファイルに、lint フェーズのガードレール正規表現を適用します。
違反があると `FAIL: [条項名] ファイル:行番号` 形式で報告します。
実行例: `sdd-forge spec lint --base development`

#### `sdd-forge flow set issue <number>`
使用方法: `sdd-forge flow set issue <number>`
`flow.json` の issue 番号を更新し、結果を JSON エンベロープで出力します。
数値でない場合は `INVALID_ISSUE` を返します。
実行例: `sdd-forge flow set issue 123`

#### `sdd-forge flow set metric <phase> <counter>`
使用方法: `sdd-forge flow set metric <phase> <counter>`
`phase` は `draft` `spec` `gate` `test`、`counter` は `question` `redo` `docsRead` `srcRead` を受け付けます。
対象カウンターを 1 増やし、更新後の値を返します。
実行例: `sdd-forge flow set metric spec docsRead`

#### `sdd-forge flow set note "<text>"`
使用方法: `sdd-forge flow set note "<text>"`
`flow.json` の `notes` 配列にテキストを追加します。
結果は JSON エンベロープで返されます。
実行例: `sdd-forge flow set note "仕様確認が必要です"`

#### `sdd-forge flow set redo`
使用方法: `sdd-forge flow set redo --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]`
現在のアクティブフローに対応する `specs/<spec>/redolog.json` へ再作業記録を追加します。
`--step` と `--reason` は必須です。
実行例: `sdd-forge flow set redo --step test --reason "期待値が不十分でした"`

#### `sdd-forge flow set req <index> <status>`
使用方法: `sdd-forge flow set req <index> <status>`
要件配列の指定インデックスの `status` を更新します。
インデックスが数値でない場合はエラーを返します。
実行例: `sdd-forge flow set req 0 done`

#### `sdd-forge flow set request "<text>"`
使用方法: `sdd-forge flow set request "<text>"`
`flow.json` の `request` フィールドを設定します。
結果は JSON エンベロープで返されます。
実行例: `sdd-forge flow set request "README を整理したいです"`

#### `sdd-forge flow set step <id> <status>`
使用方法: `sdd-forge flow set step <id> <status>`
ワークフローステップの状態を更新します。
不正なステップ ID の場合は `INVALID_STEP` エラーになります。
実行例: `sdd-forge flow set step merge done`

#### `sdd-forge flow set summary '<json-array>'`
使用方法: `sdd-forge flow set summary '<json-array>'`
JSON 文字列配列を `requirements` に変換し、各要素へ `status: pending` を付けて保存します。
配列でない JSON は受け付けません。
実行例: `sdd-forge flow set summary '["ログインできる","一覧を表示できる"]'`

#### `sdd-forge flow run merge`
使用方法: `sdd-forge flow run merge [--dry-run] [--pr] [--auto]`
アクティブフローを読み込み、spec-only ならスキップし、それ以外は squash merge または PR 作成を行います。
`--auto` は `commands.gh=enable` かつ `gh` 利用可能時に PR ルートへ切り替えます。
実行例: `sdd-forge flow run merge --auto`

#### `sdd-forge flow run cleanup`
使用方法: `sdd-forge flow run cleanup [--dry-run]`
`.active-flow` を削除し、必要に応じて worktree と feature ブランチを削除します。
worktree モードでは main リポジトリ側からの実行を案内します。
実行例: `sdd-forge flow run cleanup --dry-run`

#### `sdd-forge flow run review`
使用方法: `sdd-forge flow run review [--dry-run] [--skip-confirm]`
差分を対象に AI で改善提案を作成し、次に保守的な検証を行って `review.md` を生成します。
提案がない場合は空の `review.md` を出力して終了します。
実行例: `sdd-forge flow run review --dry-run`
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text({prompt: "終了コードの定義と stdout/stderr の使い分けルールを表形式で記述してください。ソースコードの process.exit() 呼び出しや出力パターンから抽出すること。", mode: "deep"})}} -->

| 種別 | 条件 | 終了コード | 根拠となる挙動 |
| --- | --- | --- | --- |
| 正常終了 | `sdd-forge -h` / `--help` / 引数なし | `0` | `src/sdd-forge.js` が `help.js` 実行後に `process.exit(0)` します。 |
| 正常終了 | `sdd-forge -v` / `--version` / `-V` | `0` | `src/sdd-forge.js` がバージョン出力後に `process.exit(0)` します。 |
| エラー終了 | 不明なトップレベルコマンド | `1` | `src/sdd-forge.js` が unknown command を表示して `process.exit(1)` します。 |
| 正常終了 | `sdd-forge docs --help` | `0` | `src/docs.js` は `-h` / `--help` 付きなら使用可能コマンドを表示して終了します。 |
| エラー終了 | `sdd-forge docs` だけを実行 | `1` | `src/docs.js` はサブコマンド未指定時に usage を表示して `process.exit(1)` します。 |
| エラー終了 | `docs build --regenerate` で章ファイルがない | `1` | `src/docs.js` はエラーメッセージを出して `process.exit(1)` します。 |
| 正常終了 | `sdd-forge flow --help` | `0` | `src/flow.js` はヘルプ表示後に `process.exit(0)` します。 |
| エラー終了 | `sdd-forge flow` だけを実行 | `1` | `src/flow.js` はサブコマンド未指定時に `process.exit(1)` します。 |
| エラー終了 | 不明な `flow` サブコマンド | `1` | `src/flow.js` は unknown command を表示して `process.exit(1)` します。 |
| エラー終了 | `flow run cleanup` でアクティブフローなし | `1` | `src/flow/commands/cleanup.js` は `no active flow` で `process.exit(1)` します。 |
| エラー終了 | `flow run merge` でアクティブフローなし、または `--pr` で `gh` 不在 | `1` | `src/flow/commands/merge.js` が `process.exit(1)` します。 |
| エラー扱い | `spec lint` で違反あり | `1` | `src/spec/commands/lint.js` は違反時に `process.exitCode = 1` を設定します。 |
| 例外終了 | 解析ファイル不足や必須引数不足など | 実装依存 | 複数コマンドが `throw new Error(...)` を使うため、Node.js の例外終了に委ねられます。 |

| 出力先 | 主な用途 | 具体例 |
| --- | --- | --- |
| `stdout` | 正常系の結果、生成物、JSON エンベロープ、ヘルプ本文 | `help` の一覧表示、`docs agents --dry-run` の内容出力、`flow set *` の JSON 出力 |
| `stderr` | エラーメッセージ、警告、進捗ドット、一部レビュー進捗 | `docs` / `flow` の usage エラー、`docs forge` の待機ドット、`flow run review` の draft ログ |
| `stdout` と `stderr` の併用 | 本文は `stdout`、補助メッセージは `stderr` | `docs changelog --dry-run` は生成内容を `stdout`、dry-run 通知を `stderr` に出します。 |
| `console.log` 中心 | 更新完了やスキップ通知 | `docs readme`、`docs agents`、`upgrade`、`spec lint` の PASS 表示 |
| `console.error` 中心 | 失敗通知や警告 | unknown command、guardrail 警告、`gh` 不在エラー |
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← プロジェクト構成](project_structure.md) | [設定とカスタマイズ →](configuration.md)
<!-- {{/data}} -->
