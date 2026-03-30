<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../cli_commands.md) | **日本語**
<!-- {{/data}} -->

# CLI コマンドリファレンス

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。コマンド総数・サブコマンド体系を踏まえること。"})}} -->

この章で確認できる実行系コマンドは少なくとも33系統あり、トップレベルの `sdd-forge` から `docs` 名前空間と `flow` 名前空間、さらに個別コマンドへ段階的に振り分けられます。
`docs` はドキュメント生成パイプライン、`flow` は SDD ワークフローの状態参照・更新・実行を担い、`setup` `upgrade` `presets` `help` が独立コマンドとして提供されます。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text({prompt: "全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。ソースコードのコマンド定義・ルーティングから網羅的に抽出すること。", mode: "deep"})}} -->

| コマンド名 | 説明 | 主なオプション |
| --- | --- | --- |
| `sdd-forge` | トップレベルのエントリーポイントです。`docs` と `flow` の名前空間、および独立コマンドへ振り分けます。 | `-h`, `--help`, `-v`, `--version`, `-V` |
| `sdd-forge help` | 全体のヘルプを表示します。 | なし |
| `sdd-forge setup` | プロジェクトを初期設定し、`.sdd-forge/config.json` や作業ディレクトリ、エージェント設定ファイルを準備します。 | `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang`, `--dry-run` |
| `sdd-forge upgrade` | 既存プロジェクトのテンプレート管理ファイル、主にスキル群を更新します。 | `--dry-run` |
| `sdd-forge presets` / `sdd-forge presets list` | プリセット継承ツリーを表示します。 | `-h`, `--help` |
| `sdd-forge docs` | ドキュメント系サブコマンドの名前空間です。 | `-h`, `--help` |
| `sdd-forge docs build` | `scan` から `readme`、`agents`、必要に応じて `translate` までを順に実行する統合ビルドです。 | `--verbose`, `--dry-run`, `--force`, `--regenerate` |
| `sdd-forge docs scan` | ソースコードを走査して `.sdd-forge/output/analysis.json` を生成または更新します。 | `--reset`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | `analysis.json` の各項目に要約、詳細、章割り当て、役割などの補足情報を付与します。 | `--stdout`, `--dry-run` |
| `sdd-forge docs init` | テンプレートを解決して `docs/` の章ファイルを初期化します。 | `--type`, `--lang`, `--docs-dir`, `--force`, `--dry-run` |
| `sdd-forge docs data` | `{{data}}` ディレクティブを `analysis.json` から解決して章ファイルへ反映します。 | `--docs-dir`, `--stdout`, `--dry-run` |
| `sdd-forge docs text` | `{{text}}` ディレクティブを埋めて本文を生成します。 | `--per-directive`, `--timeout`, `--id`, `--lang`, `--docs-dir`, `--files`, `--dry-run` |
| `sdd-forge docs readme` | README テンプレートを解決し、`README.md` を再生成します。 | `--lang`, `--output`, `--dry-run` |
| `sdd-forge docs forge` | ユーザー指示とレビュー結果を使って文書を反復改善します。 | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--verbose`, `--dry-run` |
| `sdd-forge docs review` | 文書レビューを実行します。`docs forge` の既定レビューコマンド、および `flow run sync` の検証工程から呼び出されます。 | 解析対象に詳細な引数定義なし |
| `sdd-forge docs changelog` | `specs/` を走査して `docs/change_log.md` を生成します。 | `--dry-run` |
| `sdd-forge docs agents` | `AGENTS.md` を生成または更新し、`agents.project` ブロックをエージェントで整形します。 | `--dry-run` |
| `sdd-forge docs translate` | 既定言語の文書を追加言語へ翻訳します。 | `--lang`, `--force`, `--dry-run` |
| `sdd-forge flow` | SDD フロー系サブコマンドの名前空間です。 | `-h`, `--help` |
| `sdd-forge flow get` | フロー状態の参照系サブコマンドです。 | `-h`, `--help` |
| `sdd-forge flow get status` | 現在のフロー状態、進捗、ブランチ情報、要求一覧を JSON エンベロープで返します。 | なし |
| `sdd-forge flow get check <impl\|finalize\|dirty\|gh>` | 実装前提条件、最終化前提条件、ワークツリー汚れ、`gh` 利用可否を確認します。 | 対象引数が必須 |
| `sdd-forge flow get guardrail <draft\|spec\|impl\|lint>` | 指定フェーズに対応するガードレール記事を返します。 | フェーズ引数が必須 |
| `sdd-forge flow get issue <number>` | GitHub Issue を `gh issue view` で取得して JSON で返します。 | Issue 番号引数が必須 |
| `sdd-forge flow get qa-count` | アクティブフローで回答済み質問数を返します。 | なし |
| `sdd-forge flow set` | フロー状態の更新系サブコマンドです。 | `-h`, `--help` |
| `sdd-forge flow set issue <number>` | アクティブフローに Issue 番号を設定します。 | Issue 番号引数が必須 |
| `sdd-forge flow set metric <phase> <counter>` | メトリクス値を1件加算します。 | フェーズ・カウンタ引数が必須 |
| `sdd-forge flow set note "<text>"` | ノートを1件追記します。 | テキスト引数が必須 |
| `sdd-forge flow set redo --step ... --reason ...` | redo ログに再実施理由を追記します。 | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req <index> <status>` | 要件1件の状態を更新します。 | インデックス・状態引数が必須 |
| `sdd-forge flow set request "<text>"` | 元のユーザー要求文を保存します。 | テキスト引数が必須 |
| `sdd-forge flow set step <id> <status>` | ワークフローステップの状態を更新します。 | ステップID・状態引数が必須 |
| `sdd-forge flow set summary '<json-array>'` | 要件一覧を JSON 配列で置き換えます。 | JSON 配列引数が必須 |
| `sdd-forge flow run` | フロー実行系サブコマンドです。 | `-h`, `--help` |
| `sdd-forge flow run prepare-spec` | 新しい spec、branch/worktree、初期 flow 状態を作成します。 | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run review` | レビューコマンドを JSON エンベロープ付きで実行します。 | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | `docs build` と `docs review` を実行し、文書変更をコミットします。 | `--dry-run` |
| `sdd-forge flow run finalize` | commit → merge → cleanup → sync → record の最終化パイプラインを実行します。 | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text({prompt: "全コマンドに共通するグローバルオプションを表形式で記述してください。ソースコードの引数パース処理から抽出すること。", mode: "deep"})}} -->

この解析対象では、すべてのコマンドに一律で適用される共通オプションは定義されていません。共通に近い扱いとして確認できるものを示します。

| オプション | 適用範囲 | 役割 |
| --- | --- | --- |
| `-h`, `--help` | トップレベル、`docs` / `flow` ディスパッチャ、多くの個別コマンド | 使用方法とオプション一覧を表示します。 |
| `-v`, `--version`, `-V` | `sdd-forge` トップレベルのみ | パッケージのバージョンを表示して終了します。 |
| `--dry-run` | `setup`、`upgrade`、`docs build`、`docs scan`、`docs enrich`、`docs init`、`docs data`、`docs text`、`docs readme`、`docs forge`、`docs changelog`、`docs agents`、`docs translate`、`flow run prepare-spec`、`flow run review`、`flow run sync`、`flow run finalize`、`flow merge`、`flow cleanup` | 実際の書き込みや Git 操作を行わず、予定内容だけを表示します。 |

`--dry-run` は広く使われていますが、全コマンド共通ではありません。`parseArgs()` は各コマンドごとに許可されたフラグだけを受け付けるため、未対応オプションを渡すとエラーになります。
<!-- {{/text}} -->

### 各コマンドの詳細

<!-- {{text({prompt: "各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとに #### サブセクションを立てること。ソースコードの引数定義・ヘルプメッセージから情報を抽出すること。", mode: "deep"})}} -->

#### `sdd-forge`
使用方法: `sdd-forge <command>`
`docs` と `flow` の名前空間、`setup` `upgrade` `presets` `help` の独立コマンドへ振り分けます。`-h` / `--help` で全体ヘルプ、`-v` / `--version` / `-V` でバージョン表示を行います。
実行例: `sdd-forge docs build`

#### `sdd-forge help`
使用方法: `sdd-forge help`
セクション分けされた全体ヘルプを表示します。`Project` `Docs` `Flow` `Info` の各分類ごとにコマンド一覧を確認できます。
実行例: `sdd-forge help`

#### `sdd-forge setup`
使用方法: `sdd-forge setup [options]`
`--name` `--path` `--work-root` `--type` `--purpose` `--tone` `--agent` `--lang` `--dry-run` を受け付けます。必要な値が足りない場合は対話式ウィザードに入り、`.sdd-forge/config.json`、`docs/`、`specs/`、スキル、エージェント設定ファイルを準備します。
実行例: `sdd-forge setup --name my-project --type node-cli --lang ja --dry-run`

#### `sdd-forge upgrade`
使用方法: `sdd-forge upgrade [--dry-run]`
既存設定を読み込み、言語設定に応じてスキル群を再配備します。`--dry-run` では更新予定だけを表示します。
実行例: `sdd-forge upgrade --dry-run`

#### `sdd-forge presets`
使用方法: `sdd-forge presets [list]`
プリセット継承ツリーを表示します。`-h` / `--help` を付けると簡易ヘルプを表示します。
実行例: `sdd-forge presets list`

#### `sdd-forge docs`
使用方法: `sdd-forge docs <command>`
ドキュメント関連サブコマンドの入口です。コマンド未指定時は利用可能なサブコマンド一覧を表示します。
実行例: `sdd-forge docs build`

#### `sdd-forge docs build`
使用方法: `sdd-forge docs build [options]`
`scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` を順に実行し、多言語設定時は `translate` も処理します。主なオプションは `--verbose` `--dry-run` `--force` `--regenerate` です。
実行例: `sdd-forge docs build --verbose`

#### `sdd-forge docs scan`
使用方法: `sdd-forge docs scan [options]`
ソースファイルを集めて DataSource ごとに解析し、`.sdd-forge/output/analysis.json` を生成します。`--reset` で保存済みハッシュを消去し、`--stdout` `--dry-run` に対応します。
実行例: `sdd-forge docs scan --reset modules`

#### `sdd-forge docs enrich`
使用方法: `sdd-forge docs enrich [options]`
解析済み項目をバッチ分割し、要約、詳細説明、章、役割などを付加します。`--stdout` と `--dry-run` が利用できます。
実行例: `sdd-forge docs enrich --dry-run`

#### `sdd-forge docs init`
使用方法: `sdd-forge docs init [options]`
テンプレート継承を解決して `docs/` の章ファイルを作成します。`--type` `--lang` `--docs-dir` `--force` `--dry-run` を受け付けます。
実行例: `sdd-forge docs init --type cli --force`

#### `sdd-forge docs data`
使用方法: `sdd-forge docs data [options]`
`{{data}}` ディレクティブを `analysis.json` から解決します。`--docs-dir` で対象ディレクトリを変えられ、`--stdout` `--dry-run` に対応します。
実行例: `sdd-forge docs data --stdout`

#### `sdd-forge docs text`
使用方法: `sdd-forge docs text [options]`
`{{text}}` ディレクティブを LLM で埋めます。`--per-directive` `--timeout` `--id` `--lang` `--docs-dir` `--files` `--dry-run` が用意されています。
実行例: `sdd-forge docs text --files cli_commands.md --per-directive`

#### `sdd-forge docs readme`
使用方法: `sdd-forge docs readme [options]`
README テンプレートを解決し、必要に応じて `{{text}}` も埋めて `README.md` を更新します。`--lang` `--output` `--dry-run` を受け付けます。
実行例: `sdd-forge docs readme --output docs/ja/README.md`

#### `sdd-forge docs forge`
使用方法: `sdd-forge docs forge --prompt <text> [options]`
ユーザー指示、任意の spec、レビューコマンドを使って文書を反復改善します。`--prompt` `--prompt-file` `--spec` `--max-runs` `--review-cmd` `--mode` `--verbose` `--dry-run` が使えます。
実行例: `sdd-forge docs forge --prompt "CLI 章を改善" --mode assist`

#### `sdd-forge docs review`
使用方法: `sdd-forge docs review`
文書レビュー工程として利用されるコマンドです。`docs forge` の既定レビューコマンド、および `flow run sync` の検証工程から呼び出されます。
実行例: `sdd-forge docs review`

#### `sdd-forge docs changelog`
使用方法: `sdd-forge docs changelog [output] [--dry-run]`
`specs/` 配下の `spec.md` を集約し、最新シリーズ索引と全 spec 一覧を含む `docs/change_log.md` を生成します。
実行例: `sdd-forge docs changelog --dry-run`

#### `sdd-forge docs agents`
使用方法: `sdd-forge docs agents [--dry-run]`
`AGENTS.md` を作成または更新し、`agents.sdd` を保持したまま `agents.project` を生成・整形します。
実行例: `sdd-forge docs agents --dry-run`

#### `sdd-forge docs translate`
使用方法: `sdd-forge docs translate [options]`
既定言語の章ファイルと README を追加言語へ翻訳します。`--lang` で対象言語を絞り込み、`--force` で更新日時判定を無視できます。
実行例: `sdd-forge docs translate --lang ja --force`

#### `sdd-forge flow`
使用方法: `sdd-forge flow <get|set|run> ...`
SDD フロー関連の参照、更新、実行をまとめた名前空間です。未指定または `--help` で利用可能なサブコマンドを表示します。
実行例: `sdd-forge flow get status`

#### `sdd-forge flow get`
使用方法: `sdd-forge flow get <key> [options]`
フロー状態の参照専用サブコマンド群です。`status` `check` `guardrail` `issue` `qa-count` を選べます。
実行例: `sdd-forge flow get qa-count`

#### `sdd-forge flow get status`
使用方法: `sdd-forge flow get status`
現在の spec、base branch、feature branch、steps、requirements、notes、metrics を JSON エンベロープで返します。
実行例: `sdd-forge flow get status`

#### `sdd-forge flow get check`
使用方法: `sdd-forge flow get check <impl|finalize|dirty|gh>`
`impl` と `finalize` は前提ステップの達成状況、`dirty` は Git 作業ツリーの汚れ、`gh` は GitHub CLI の有無を調べます。
実行例: `sdd-forge flow get check finalize`

#### `sdd-forge flow get guardrail`
使用方法: `sdd-forge flow get guardrail <draft|spec|impl|lint>`
ガードレール記事をフェーズ別に抽出して JSON で返します。
実行例: `sdd-forge flow get guardrail impl`

#### `sdd-forge flow get issue`
使用方法: `sdd-forge flow get issue <number>`
`gh issue view` を使って title、body、labels、state を取得します。
実行例: `sdd-forge flow get issue 42`

#### `sdd-forge flow get qa-count`
使用方法: `sdd-forge flow get qa-count`
アクティブフローの `metrics.draft.question` を返します。
実行例: `sdd-forge flow get qa-count`

#### `sdd-forge flow set`
使用方法: `sdd-forge flow set <key> [args]`
フロー状態を書き換えるサブコマンド群です。`issue` `metric` `note` `redo` `req` `request` `step` `summary` を選べます。
実行例: `sdd-forge flow set note "仕様確認済み"`

#### `sdd-forge flow set issue`
使用方法: `sdd-forge flow set issue <number>`
アクティブフローに GitHub Issue 番号を保存します。
実行例: `sdd-forge flow set issue 42`

#### `sdd-forge flow set metric`
使用方法: `sdd-forge flow set metric <phase> <counter>`
`draft` `spec` `gate` `test` の各フェーズに対して、`question` `redo` `docsRead` `srcRead` のいずれかを加算します。
実行例: `sdd-forge flow set metric spec question`

#### `sdd-forge flow set note`
使用方法: `sdd-forge flow set note "<text>"`
ノート文字列を1件追記します。
実行例: `sdd-forge flow set note "レビュー指摘を確認した"`

#### `sdd-forge flow set redo`
使用方法: `sdd-forge flow set redo --step <id> --reason <text> [options]`
redo ログへ再実施記録を残します。`--trigger` `--resolution` `--guardrail-candidate` を追加できます。
実行例: `sdd-forge flow set redo --step gate --reason "要件漏れ" --resolution "要件を追記"`

#### `sdd-forge flow set req`
使用方法: `sdd-forge flow set req <index> <status>`
要件一覧の1件だけ状態を更新します。
実行例: `sdd-forge flow set req 0 done`

#### `sdd-forge flow set request`
使用方法: `sdd-forge flow set request "<text>"`
元の要求文を保存します。
実行例: `sdd-forge flow set request "CLI ガイドを整備したい"`

#### `sdd-forge flow set step`
使用方法: `sdd-forge flow set step <id> <status>`
ステップ ID を指定して状態を変更します。
実行例: `sdd-forge flow set step implement done`

#### `sdd-forge flow set summary`
使用方法: `sdd-forge flow set summary '<json-array>'`
要件説明の JSON 配列を渡し、各要件を `pending` 状態で置き換えます。
実行例: `sdd-forge flow set summary '["CLI 一覧を整理する","終了コードを文書化する"]'`

#### `sdd-forge flow run`
使用方法: `sdd-forge flow run <action> [options]`
フローを進める実行系サブコマンド群です。解析対象では `prepare-spec` `review` `sync` `finalize` が確認できます。
実行例: `sdd-forge flow run prepare-spec --title "CLI docs"`

#### `sdd-forge flow run prepare-spec`
使用方法: `sdd-forge flow run prepare-spec --title <name> [options]`
新しい spec ディレクトリ、必要なら branch または worktree、初期 `flow.json` を作成します。`--base` `--worktree` `--no-branch` `--dry-run` に対応します。
実行例: `sdd-forge flow run prepare-spec --title "CLI docs" --worktree`

#### `sdd-forge flow run review`
使用方法: `sdd-forge flow run review [options]`
レビュー実行結果を JSON エンベロープで包んで返します。`--dry-run` と `--skip-confirm` を受け付けます。
実行例: `sdd-forge flow run review --dry-run`

#### `sdd-forge flow run sync`
使用方法: `sdd-forge flow run sync [--dry-run]`
`docs build` と `docs review` を実行し、`docs/` `AGENTS.md` `CLAUDE.md` `README.md` をステージして `docs: sync documentation` でコミットします。
実行例: `sdd-forge flow run sync --dry-run`

#### `sdd-forge flow run finalize`
使用方法: `sdd-forge flow run finalize --mode <all|select> [options]`
最終化パイプラインを実行します。`--steps` で `3:commit` `4:merge` `5:cleanup` `6:sync` `7:record` を選択でき、`--merge-strategy` は `merge` `squash` `pr` を受け付けます。
実行例: `sdd-forge flow run finalize --mode select --steps 3,4,5 --merge-strategy pr`
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text({prompt: "終了コードの定義と stdout/stderr の使い分けルールを表形式で記述してください。ソースコードの process.exit() 呼び出しや出力パターンから抽出すること。", mode: "deep"})}} -->

| 区分 | stdout | stderr | 終了コード |
| --- | --- | --- | --- |
| `sdd-forge` トップレベルの通常ヘルプ・バージョン | ヘルプ本文、バージョン文字列を出力します。 | なし | `--help` / `--version` は `0` です。 |
| `sdd-forge` 未知コマンド | なし | `unknown command` と `Run: sdd-forge help` を出力します。 | `1` です。 |
| `sdd-forge docs` ディスパッチャ | `build --help` はヘルプ本文を出力します。 | コマンド未指定時の使用方法、利用可能コマンド一覧、未知サブコマンドエラーを出力します。 | コマンド未指定は `1`、明示的な `--help` は `0`、未知サブコマンドは `1`、`build` 失敗は `1` です。 |
| `sdd-forge flow` ディスパッチャ | ヘルプ本文を出力します。 | 未知サブコマンドエラーを出力します。 | コマンド未指定は `1`、明示的な `--help` は `0`、未知サブコマンドは `1` です。 |
| `docs build` の進捗表示 | 生成結果そのものは通常ファイルへ反映します。 | 進捗バー、各ステップ完了、警告は progress/logger 経由で出力します。 | 例外時は `1` で終了します。 |
| `docs scan` `docs data` `docs changelog` `docs agents` `docs readme` の dry-run / stdout モード | 生成本文や変更対象、ファイル差分情報を出力します。 | `changelog` は dry-run の出力先通知を stderr に出します。progress/logger 利用時のログも stderr です。 | 明示的な `process.exit()` は示されていません。 |
| `flow get` / `flow set` / `flow run` 系 | 成功・失敗ともに JSON エンベロープを出力します。 | 原則として使いません。内部 review ラッパでは下流コマンドの stderr を解析材料として使います。 | 各モジュールでは失敗もエンベロープ返却が中心で、明示的な `process.exit()` は限定的です。 |
| `flow commands/review.js` 本体 | 承認済み提案一覧や最終メッセージを出力します。 | 進捗、提案数、承認数、保存先を出力します。 | フローなし・設定失敗時は `1` です。 |
| `flow commands/merge.js` | dry-run の Git / `gh` コマンド列、完了メッセージを出力します。 | `gh` 未導入時やフロー未検出時のエラーを出力します。 | フローなし、`gh` 未導入の PR モードは `1` です。 |
| `flow commands/cleanup.js` | dry-run のコマンド列、完了メッセージ、skip メッセージを出力します。 | フロー未検出時のエラーを出力します。 | フローなしは `1` です。 |

`createLogger()` と `createProgress()` は通常 stderr を使うため、進捗・警告・詳細ログは stderr、生成本文や JSON 本体は stdout という使い分けが基本です。`flow` の JSON エンベロープ系は機械処理しやすいように stdout へ統一され、`docs` の生成系はファイル更新を主目的にしつつ、dry-run 時のみ stdout に内容を出す実装になっています。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← プロジェクト構成](project_structure.md) | [設定とカスタマイズ →](configuration.md)
<!-- {{/data}} -->
