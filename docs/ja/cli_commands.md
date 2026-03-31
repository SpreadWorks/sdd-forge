<!-- {{data("base.docs.langSwitcher", {labels: "relative"})}} -->
[English](../cli_commands.md) | **日本語**
<!-- {{/data}} -->

# CLI コマンドリファレンス

## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。コマンド総数・サブコマンド体系を踏まえること。"})}} -->

`sdd-forge` はトップレベルで `help` `setup` `upgrade` `presets` `docs` `flow` を受け付け、`docs` は 12 個のサブコマンド、`flow` は `get` `set` `run` の 3 系統からさらに細分化されます。CLI 全体はディスパッチャ方式で構成されており、トップレベルや各名前空間のルーターが該当する実装ファイルへ引き渡します。
<!-- {{/text}} -->

## 内容

### コマンド一覧

<!-- {{text({prompt: "全コマンドの一覧を表形式で記述してください。コマンド名・説明・主なオプションを含めること。ソースコードのコマンド定義・ルーティングから網羅的に抽出すること。", mode: "deep"})}} -->

| コマンド名 | 説明 | 主なオプション |
| --- | --- | --- |
| `sdd-forge help` | トップレベルのヘルプを表示します。 | なし |
| `sdd-forge setup` | プロジェクトを初期設定し、`.sdd-forge/config.json`、作業用ディレクトリ、エージェント向けファイル、スキルを準備します。 | `--dry-run`, `--name`, `--path`, `--work-root`, `--type`, `--purpose`, `--tone`, `--agent`, `--lang` |
| `sdd-forge upgrade` | テンプレート由来のファイルとスキルを更新し、必要に応じて `chapters` の設定形式を移行します。 | `--dry-run` |
| `sdd-forge presets list` | 利用可能なプリセット継承ツリーを表示します。 | なし |
| `sdd-forge docs build` | `scan` から `agents`、多言語時の翻訳までをまとめて実行するドキュメント生成パイプラインです。 | `--verbose`, `--dry-run`, `--force`, `--regenerate` |
| `sdd-forge docs scan` | ソースコードと DataSource を走査し、`.sdd-forge/output/analysis.json` を生成または更新します。 | `--reset [categories]`, `--stdout`, `--dry-run` |
| `sdd-forge docs enrich` | 解析データの補強を行うサブコマンドです。ルーティングは確認できますが、この解析データには個別オプションの詳細がありません。 | ルーティングのみ確認 |
| `sdd-forge docs init` | プリセットのテンプレート継承を解決して `docs/` を初期化します。 | `--force`, `--dry-run`, `--type`, `--lang`, `--docs-dir` |
| `sdd-forge docs data` | `docs/` 内の `{{data}}` ディレクティブを `analysis.json` から展開します。 | `--dry-run`, `--stdout`, `--docs-dir` |
| `sdd-forge docs text` | `{{text}}` ディレクティブを AI エージェントで埋めます。 | `--dry-run`, `--per-directive`, `--force`, `--timeout`, `--id`, `--docs-dir`, `--files` |
| `sdd-forge docs readme` | README テンプレートを解決し、`README.md` を生成します。 | `--dry-run`, `--lang`, `--output` |
| `sdd-forge docs forge` | ユーザー指示とレビュー結果をもとに、ドキュメント改善を反復実行します。 | `--prompt`, `--prompt-file`, `--spec`, `--max-runs`, `--review-cmd`, `--mode`, `--dry-run`, `--verbose` |
| `sdd-forge docs review` | ドキュメントレビューを行うサブコマンドです。ルーティングは確認できますが、この解析データには個別オプションの詳細がありません。 | ルーティングのみ確認 |
| `sdd-forge docs changelog` | `specs/` を走査して `docs/change_log.md` を生成します。 | `--dry-run` |
| `sdd-forge docs agents` | `AGENTS.md` を生成または更新し、`agents.project` 部分を AI で整えます。 | `--dry-run` |
| `sdd-forge docs translate` | 既定言語の Markdown を他言語へ翻訳します。 | `--dry-run`, `--force`, `--lang` |
| `sdd-forge flow get` | フロー状態の参照系コマンド群への入り口です。 | `-h`, `--help` |
| `sdd-forge flow get check` | 実装前提条件、最終化前提条件、作業ツリーの汚れ、`gh` 利用可否を確認します。 | 対象引数: `impl`, `finalize`, `dirty`, `gh` |
| `sdd-forge flow get guardrail` | 指定フェーズ向けの guardrail 記事を返します。 | フェーズ引数: `draft`, `spec`, `impl`, `lint` |
| `sdd-forge flow get issue` | GitHub Issue を取得して主要項目を JSON で返します。 | Issue 番号 |
| `sdd-forge flow get prompt` | 計画・実装・終了処理用の構造化プロンプト定義を返します。 | 種別引数 |
| `sdd-forge flow get qa-count` | 下書きフェーズの質問数を返します。 | なし |
| `sdd-forge flow get status` | 現在の `flow.json` 状態を正規化した JSON で返します。 | なし |
| `sdd-forge flow set` | フロー状態の更新系コマンド群への入り口です。 | `-h`, `--help` |
| `sdd-forge flow set issue` | 現在のフローに GitHub Issue 番号を設定します。 | Issue 番号 |
| `sdd-forge flow set metric` | フェーズ別メトリクスを 1 増やします。 | `<phase> <counter>` |
| `sdd-forge flow set note` | `flow.json` の `notes` にメモを追記します。 | メモ文字列 |
| `sdd-forge flow set redo` | `redolog.json` にやり直し履歴を追加します。 | `--step`, `--reason`, `--trigger`, `--resolution`, `--guardrail-candidate` |
| `sdd-forge flow set req` | 要件の状態を更新します。 | `<index> <status>` |
| `sdd-forge flow set request` | 元のユーザー要求文を保存します。 | 要求文字列 |
| `sdd-forge flow set step` | ワークフローステップの状態を更新します。 | `<id> <status>` |
| `sdd-forge flow set summary` | 要件配列を JSON 配列でまとめて置き換えます。 | `'<json-array>'` |
| `sdd-forge flow run` | フロー実行系コマンド群への入り口です。 | `-h`, `--help` |
| `sdd-forge flow run prepare-spec` | 新しいフローを開始し、必要に応じてブランチや worktree と `specs/` を作成します。 | `--title`, `--base`, `--worktree`, `--no-branch`, `--dry-run` |
| `sdd-forge flow run review` | AI によるレビュー提案を実行し、結果を JSON 包装で返します。 | `--dry-run`, `--skip-confirm` |
| `sdd-forge flow run sync` | `docs build` と `docs review` を実行し、必要ならドキュメントをコミットします。 | `--dry-run` |
| `sdd-forge flow run finalize` | コミット、マージまたは PR、同期、後片付け、記録をまとめて実行します。 | `--mode`, `--steps`, `--merge-strategy`, `--message`, `--dry-run` |
<!-- {{/text}} -->

### グローバルオプション

<!-- {{text({prompt: "全コマンドに共通するグローバルオプションを表形式で記述してください。ソースコードの引数パース処理から抽出すること。", mode: "deep"})}} -->

| オプション | 適用範囲 | 説明 |
| --- | --- | --- |
| `-h` | `parseArgs()` を使う各コマンド、および `sdd-forge` / `docs` / `flow` / `flow get` / `flow set` / `flow run` の各ディスパッチャ | ヘルプ表示を有効にします。各コマンドはこれを検出すると使用方法を出力します。 |
| `--help` | `parseArgs()` を使う各コマンド、および `sdd-forge` / `docs` / `flow` / `flow get` / `flow set` / `flow run` の各ディスパッチャ | ヘルプ表示を有効にします。 |
| `--` | `parseArgs()` を使う各コマンド | オプション解析では無視されます。値の区切りとして解釈する専用処理はありません。 |

共通の業務オプションは定義されておらず、`--dry-run` や `--verbose` などは個別コマンド単位で定義されています。トップレベルの `-v` `--version` `-V` は `sdd-forge` 本体専用で、全コマンド共通ではありません。
<!-- {{/text}} -->

### 各コマンドの詳細

<!-- {{text({prompt: "各コマンドの使用方法・オプション・実行例を詳しく記述してください。コマンドごとに #### サブセクションを立てること。ソースコードの引数定義・ヘルプメッセージから情報を抽出すること。", mode: "deep"})}} -->

#### `sdd-forge`
使用方法: `sdd-forge <command>`
トップレベルでは `docs` と `flow` を名前空間として転送し、`setup` `upgrade` `presets` `help` は個別スクリプトへ転送します。`-v` `--version` `-V` はバージョンを表示し、引数なしまたは `-h` `--help` はヘルプを表示します。
実行例: `sdd-forge docs build`

#### `sdd-forge help`
使用方法: `sdd-forge help`
コマンド一覧をセクション付きで表示します。表示内容には `Project` `Docs` `Flow` `Info` のまとまりがあります。
実行例: `sdd-forge help`

#### `sdd-forge setup`
使用方法: `sdd-forge setup [options]`
`--name` `--path` `--work-root` `--type` `--purpose` `--tone` `--agent` `--lang` と `--dry-run` を受け付けます。必要な値が不足する場合は対話モードに入り、`.sdd-forge/config.json`、`docs/`、`specs/`、エージェント向けファイル、スキル配置まで行います。
実行例: `sdd-forge setup --name my-project --path . --type base --lang ja`

#### `sdd-forge upgrade`
使用方法: `sdd-forge upgrade [options]`
`--dry-run` を受け付けます。スキル再配置と、旧形式の `chapters: string[]` を新形式へ移行する処理を行います。
実行例: `sdd-forge upgrade --dry-run`

#### `sdd-forge presets list`
使用方法: `sdd-forge presets list`
プリセット継承ツリーを表示します。引数なしでも `list` と同じ動作です。
実行例: `sdd-forge presets list`

#### `sdd-forge docs build`
使用方法: `sdd-forge docs build [options]`
`--verbose` `--dry-run` `--force` `--regenerate` を受け付けます。`scan` → `enrich` → `init` → `data` → `text` → `readme` → `agents` を順に実行し、多言語設定時は翻訳または各言語生成も行います。
実行例: `sdd-forge docs build --verbose`

#### `sdd-forge docs scan`
使用方法: `sdd-forge docs scan [options]`
`--stdout` `--dry-run` と `--reset [categories]` を受け付けます。対象ファイルを走査して `analysis.json` を更新し、ハッシュ一致時は既存エントリを再利用します。
実行例: `sdd-forge docs scan --reset modules,commands`

#### `sdd-forge docs init`
使用方法: `sdd-forge docs init [options]`
`--force` `--dry-run` `--type` `--lang` `--docs-dir` を受け付けます。プリセット継承を解決した章テンプレートを `docs/` に展開し、設定に章一覧が未固定で解析データとエージェントがある場合は AI による章選別も行います。
実行例: `sdd-forge docs init --type base --force`

#### `sdd-forge docs data`
使用方法: `sdd-forge docs data [options]`
`--dry-run` `--stdout` `--docs-dir` を受け付けます。`analysis.json` を読み取り、各章の `{{data}}` ディレクティブをファイル文脈付きで展開します。
実行例: `sdd-forge docs data --dry-run`

#### `sdd-forge docs text`
使用方法: `sdd-forge docs text [options]`
`--dry-run` `--per-directive` `--force` `--timeout` `--id` `--docs-dir` `--files` を受け付けます。通常はファイル単位の一括生成を行い、`--id` 指定時は個別ディレクティブ処理に切り替わります。
実行例: `sdd-forge docs text --files cli_commands.md --force`

#### `sdd-forge docs readme`
使用方法: `sdd-forge docs readme [options]`
`--dry-run` `--lang` `--output` を受け付けます。README テンプレートを解決し、`{{data}}` 展開と必要な `{{text}}` 生成を行って `README.md` を出力します。
実行例: `sdd-forge docs readme --lang ja --output docs/ja/README.md`

#### `sdd-forge docs forge`
使用方法: `sdd-forge docs forge [options]`
`--prompt` `--prompt-file` `--spec` `--max-runs` `--review-cmd` `--mode` `--dry-run` `--verbose` を受け付けます。ユーザー指示とレビュー結果を使って複数回の改善ループを回し、成功後は README や翻訳の再生成も行います。
実行例: `sdd-forge docs forge --prompt "CLI の説明を改善" --mode assist`

#### `sdd-forge docs changelog`
使用方法: `sdd-forge docs changelog [output] [options]`
`--dry-run` を受け付けます。`specs/` を走査して最新仕様一覧と全仕様一覧を `docs/change_log.md` に生成します。出力先を位置引数で変更できます。
実行例: `sdd-forge docs changelog --dry-run`

#### `sdd-forge docs agents`
使用方法: `sdd-forge docs agents [options]`
`--dry-run` を受け付けます。`AGENTS.md` がなければ雛形を作成し、`{{data("agents.sdd")}}` と `{{data("agents.project")}}` を解決したうえで、`agents.project` 部分を AI で整えます。
実行例: `sdd-forge docs agents`

#### `sdd-forge docs translate`
使用方法: `sdd-forge docs translate [options]`
`--dry-run` `--force` `--lang` を受け付けます。既定言語の `docs/*.md` と `README.md` を、更新時刻にもとづいて必要な分だけ翻訳します。
実行例: `sdd-forge docs translate --lang ja`

#### `sdd-forge docs enrich` / `sdd-forge docs review`
どちらも `docs.js` のサブコマンドマップに登録されています。今回の解析データには各実装ファイルの引数定義やヘルプ本文が含まれていないため、利用可能なこと以外の詳細はこの章では確定できません。
実行例: `sdd-forge docs review`

#### `sdd-forge flow get`
使用方法: `sdd-forge flow get <key> [options]`
`check` `guardrail` `issue` `prompt` `qa-count` `status` を受け付けます。各コマンドは参照専用で、結果は機械可読な JSON 包装で返します。
実行例: `sdd-forge flow get status`

#### `sdd-forge flow get check`
使用方法: `sdd-forge flow get check <impl|finalize|dirty|gh>`
`impl` は `gate` と `test` の完了確認、`finalize` は `implement` の完了確認、`dirty` は `git status --short`、`gh` は `gh --version` を確認します。
実行例: `sdd-forge flow get check dirty`

#### `sdd-forge flow get guardrail`
使用方法: `sdd-forge flow get guardrail <draft|spec|impl|lint>`
指定フェーズに対応する guardrail 記事だけを返します。
実行例: `sdd-forge flow get guardrail impl`

#### `sdd-forge flow get issue` / `prompt` / `qa-count` / `status`
`issue` は `gh issue view` で Issue の主要項目を返し、`prompt` は対話フロー用の定義を返します。`qa-count` は質問数、`status` は現在の `flow.json` 全体像を返します。
実行例: `sdd-forge flow get issue 123`

#### `sdd-forge flow set`
使用方法: `sdd-forge flow set <key> [args]`
`issue` `metric` `note` `redo` `req` `request` `step` `summary` を受け付けます。いずれも `flow.json` または spec 配下の補助ファイルを書き換えます。
実行例: `sdd-forge flow set step implement done`

#### `sdd-forge flow set issue` / `request` / `note`
`issue` は Issue 番号、`request` は元要求文、`note` は自由記述メモを保存します。いずれも単一引数を受け取る薄い更新コマンドです。
実行例: `sdd-forge flow set request "CLI ガイドを追加する"`

#### `sdd-forge flow set metric` / `req` / `step` / `summary`
`metric` は `<phase> <counter>` 形式でメトリクスを増分し、`req` は要件番号ごとの状態更新、`step` はステップ状態更新、`summary` は JSON 配列で要件一覧を置き換えます。
実行例: `sdd-forge flow set metric draft question`

#### `sdd-forge flow set redo`
使用方法: `sdd-forge flow set redo --step <id> --reason <text> [--trigger <text>] [--resolution <text>] [--guardrail-candidate <text>]`
`redolog.json` にやり直し履歴を追加します。必須は `--step` と `--reason` です。
実行例: `sdd-forge flow set redo --step test --reason "期待値を見直した"`

#### `sdd-forge flow run`
使用方法: `sdd-forge flow run <action> [options]`
`prepare-spec` `review` `sync` `finalize` を受け付けます。実行系コマンドの多くは JSON 包装で結果を返します。
実行例: `sdd-forge flow run prepare-spec --title "CLI docs" --worktree`

#### `sdd-forge flow run prepare-spec`
使用方法: `sdd-forge flow run prepare-spec --title <name> [options]`
`--base` `--worktree` `--no-branch` `--dry-run` を受け付けます。汚れた worktree では失敗し、正常時は `spec.md` `qa.md` と初期 `flow.json` を作成します。
実行例: `sdd-forge flow run prepare-spec --title "新しいガイド" --dry-run`

#### `sdd-forge flow run review`
使用方法: `sdd-forge flow run review [options]`
`--dry-run` と `--skip-confirm` を受け付けます。内部のレビューコマンドを呼び出し、提案数や承認数を JSON で要約して返します。
実行例: `sdd-forge flow run review --dry-run`

#### `sdd-forge flow run sync`
使用方法: `sdd-forge flow run sync [options]`
`--dry-run` を受け付けます。`docs build` と `docs review` を実行し、変更があれば `docs: sync documentation` でコミットします。
実行例: `sdd-forge flow run sync`

#### `sdd-forge flow run finalize`
使用方法: `sdd-forge flow run finalize --mode <all|select> [options]`
`--steps` `--merge-strategy` `--message` `--dry-run` を受け付けます。対象ステップは 1:コミット、2:マージまたは PR、3:同期、4:後片付け、5:記録です。
実行例: `sdd-forge flow run finalize --mode select --steps 1,2,4 --merge-strategy squash`
<!-- {{/text}} -->

### 終了コードと出力

<!-- {{text({prompt: "終了コードの定義と stdout/stderr の使い分けルールを表形式で記述してください。ソースコードの process.exit() 呼び出しや出力パターンから抽出すること。", mode: "deep"})}} -->

| 対象 | 終了コード | stdout の使い方 | stderr の使い方 |
| --- | --- | --- | --- |
| `sdd-forge` | `-v`/`--version`/`-V` は `0`、引数なしや `-h`/`--help` はヘルプ表示後 `0`、未知のコマンドは `1` | バージョン番号とヘルプ本文を出力します。 | 未知のコマンド時にエラーメッセージを出力します。 |
| `sdd-forge docs` ディスパッチャ | 引数なしは `1`、`-h`/`--help` は `0`、未知のサブコマンドは `1`、`build` 成功は `0`、`build` 失敗は `1` | `build --help` はヘルプ本文を出力します。非 `build` サブコマンド本体の通常出力も stdout を使います。 | ルーター自身の使用方法、未知サブコマンド、`[build] ERROR` は stderr に出力します。進捗表示や logger 出力も基本的に stderr です。 |
| `sdd-forge flow` / `flow get` / `flow set` / `flow run` の各ディスパッチャ | 引数なしは `1`、`-h`/`--help` は `0`、未知のキーやアクションは `1` | ヘルプ本文を出力します。 | 未知のキーやアクション時にエラーを出力します。 |
| `docs` 系で `createLogger()` を使うコマンド | 多くは明示的な `process.exit()` を持たず、例外時は呼び出し側に委ねます | 生成物本体や dry-run の本文出力に使われます。例: `docs changelog --dry-run` の本文、`docs readme --dry-run` の README 本文。 | 進捗ログ、更新件数、警告、dry-run の対象パスなどに使われます。`createLogger()` はアクティブな progress がない場合 stderr へ書き込みます。 |
| `docs scan` | `--reset` は対象なしでも継続、通常実行は明示終了コードなし | `--stdout` 指定時は JSON を stdout へ出力します。 | ログ出力は logger 経由で stderr です。 |
| `docs data` | 明示終了コードなし | `--dry-run` または `--stdout` では各ファイルの行数差分を stdout に出力します。 | 完了件数や未解決ディレクティブのログは stderr です。 |
| `docs readme` | 明示終了コードなし | `--dry-run` では区切り行と生成後 README 本文を stdout に出力します。 | 更新・未変更・dry-run 通知は logger 経由で stderr です。 |
| `docs changelog` | 明示終了コードなし | 本文生成結果や通常の完了メッセージを出力します。 | `--dry-run` 時の対象パス通知は `console.error()` で stderr に出力します。 |
| `flow get/check` など `flow-envelope` を返すコマンド群 | 多くは明示終了コードなしで、成功・失敗を JSON 包装の内容で表現します | `output(ok(...))` または `output(fail(...))` により結果を返します。 | ソース上では envelope 出力のストリーム先はこの解析データだけでは確定できません。 |
| `flow cleanup` | アクティブフローがない場合は `1`、それ以外は明示終了コードなし | dry-run の実行予定コマンドや完了メッセージを出力します。 | `no active flow` は stderr に出力します。 |
| `flow merge` | アクティブフローがない場合は `1`、`--pr` で `gh` が無い場合は `1`、それ以外は明示終了コードなし | dry-run の実行予定コマンドや完了メッセージを出力します。 | `no active flow`、`gh` 未導入エラーは stderr に出力します。 |
| `flow/commands/review.js` | アクティブフローなし、設定読込失敗時は `1` | 提案なし、承認済み提案一覧、dry-run 通知を出力します。 | 進捗行や保存先、件数サマリーは `console.error()` で出力します。 |

明示的に `process.exitCode = 1` を設定するのは、解析対象では主に fixture の CLI コマンド群と一部のレビュー・エラー系コマンドです。利用者向けの本体 CLI では、ヘルプや生成物本文は stdout、エラーや進捗ログは stderr に寄せる実装が中心です。
<!-- {{/text}} -->

---

<!-- {{data("base.docs.nav")}} -->
[← プロジェクト構成](project_structure.md) | [設定とカスタマイズ →](configuration.md)
<!-- {{/data}} -->
