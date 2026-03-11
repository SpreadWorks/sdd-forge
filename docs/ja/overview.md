# 01. システム概要

## 概要

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the project's architecture and whether it integrates with external systems.}} -->

この章では、Spec-Driven Development を通じてドキュメント生成を自動化する Node.js CLI ツール「sdd-forge」のハイレベルアーキテクチャについて説明します。3 層コマンドディスパッチシステムがビルドパイプラインを統括する仕組み、コンポーネントがローカルファイルシステムと連携する方法、および Claude CLI などの外部 AI エージェントとの統合についても解説します。
<!-- {{/text}} -->

## 内容

### アーキテクチャ図

<!-- {{text: Generate a mermaid flowchart showing the project architecture. Include data flows between major components. Output only the mermaid code block.}} -->

```mermaid
flowchart TD
    User["User: sdd-forge &lt;subcommand&gt;"]
    Entry["sdd-forge.js\n(エントリポイント & ルーター)"]
    Docs["docs.js\n(Docs ディスパッチャー)"]
    Spec["spec.js\n(Spec ディスパッチャー)"]
    Flow["flow.js\n(SDD フロー)"]

    subgraph DocsCmds["docs/commands/"]
        Scan["scan"]
        Enrich["enrich"]
        Init["init"]
        Data["data"]
        Text["text"]
        Readme["readme"]
        Agents["agents"]
        Forge["forge"]
        Review["review"]
    end

    subgraph SpecCmds["specs/commands/"]
        SpecInit["spec init"]
        Gate["gate"]
    end

    subgraph Storage[".sdd-forge/"]
        Config["config.json"]
        Analysis["output/analysis.json"]
        CurrentSpec["current-spec"]
        Snapshots["snapshots/"]
    end

    subgraph Output["プロジェクト出力"]
        DocsDir["docs/*.md"]
        ReadmeMd["README.md"]
        AgentsMd["AGENTS.md"]
    end

    AI["AI エージェント\n(Claude CLI / カスタム)"]

    User --> Entry
    Entry --> Docs
    Entry --> Spec
    Entry --> Flow
    Docs --> DocsCmds
    Spec --> SpecCmds
    Scan -->|"書き込み"| Analysis
    Analysis -->|"読み込み"| Enrich
    Enrich -->|"エンリッチ"| Analysis
    Init -->|"書き込み"| DocsDir
    Data -->|"{{data}} を解決"| DocsDir
    Text -->|"呼び出し"| AI
    AI -->|"{{text}} を埋める"| DocsDir
    Readme -->|"書き込み"| ReadmeMd
    Agents -->|"書き込み"| AgentsMd
    Config -->|"全コマンドが読み込み"| DocsCmds
    Flow -->|"管理"| CurrentSpec
```
<!-- {{/text}} -->

### コンポーネントの責務

<!-- {{text[mode=deep]: Describe the major components with their location, responsibilities, and I/O in table format.}} -->

| コンポーネント | 場所 | 責務 | 入力 | 出力 |
|---|---|---|---|---|
| **エントリポイント** | `src/sdd-forge.js` | CLI 引数解析、プロジェクトコンテキスト解決、ディスパッチャーへのサブコマンドルーティング | 生の `process.argv`、`.sdd-forge/projects.json` | `SDD_SOURCE_ROOT` / `SDD_WORK_ROOT` 環境変数をセット; ディスパッチャーに委譲 |
| **Docs ディスパッチャー** | `src/docs.js` | docs サブコマンドのルーティング; 進捗トラッキングを伴うフルビルドパイプラインの統括 | サブコマンド名 + 引数 | 個々の `docs/commands/*.js` スクリプトに委譲 |
| **Spec ディスパッチャー** | `src/spec.js` | `spec` および `gate` サブコマンドのルーティング | サブコマンド名 + 引数 | `specs/commands/init.js` または `gate.js` に委譲 |
| **フローランナー** | `src/flow.js` | エンドツーエンドの SDD ワークフロー（spec → gate → 実装 → forge → review）の自動化 | `--request` フラグとフロー状態 | `.sdd-forge/current-spec` 状態ファイル; AI エージェント呼び出し |
| **スキャナー** | `src/docs/commands/scan.js` | プリセット設定に従いソースファイルを再帰スキャンして構造メタデータを抽出 | `srcRoot` 配下のソースファイル | `.sdd-forge/output/analysis.json` |
| **エンリッチ** | `src/docs/commands/enrich.js` | AI エージェントを呼び出して各 analysis エントリに `summary`、`detail`、`chapter`、`role` フィールドを付与; バッチ再開に対応 | `analysis.json` | エンリッチフィールドをインプレースで追加した更新済み `analysis.json` |
| **Init** | `src/docs/commands/init.js` | プリセットテンプレートを `docs/` にコピーして初期章ファイル構造を作成 | `src/presets/{key}/templates/{lang}/` のプリセットテンプレート | `docs/*.md` 章ファイル |
| **データリゾルバー** | `src/docs/commands/data.js` | `analysis.json` の構造化データを使用して章ファイル内の `{{data}}` ディレクティブを解決 | `docs/*.md`、`analysis.json` | データテーブルを注入した更新済み `docs/*.md` |
| **テキストジェネレーター** | `src/docs/commands/text.js` | ソースコンテキストを伴い AI エージェントを呼び出して `{{text}}` ディレクティブを解決; light モードと deep モードに対応 | `docs/*.md`、ソースファイル、`analysis.json` | AI 生成散文を挿入した更新済み `docs/*.md` |
| **README ジェネレーター** | `src/docs/commands/readme.js` | 生成された章ファイルから `README.md` を組み立て | `docs/*.md` | `README.md` |
| **Agents アップデーター** | `src/docs/commands/agents.js` | プリセットテンプレートと `analysis.json` から `AGENTS.md` の SDD セクションと PROJECT セクションを再生成 | プリセット AGENTS テンプレート、`analysis.json` | `AGENTS.md`; `CLAUDE.md` シンボリックリンクを作成 |
| **Forge** | `src/docs/commands/forge.js` | AI フィードバックループを用いて既存の `docs/*.md` ファイルを反復改善 | `docs/*.md`、変更サマリープロンプト | 更新済み `docs/*.md` |
| **Review** | `src/docs/commands/review.js` | チェックリストに照らしてドキュメント品質を評価し、合否を報告 | `docs/*.md`、レビューチェックリスト | コンソールレポート; 構造化された合否結果 |
| **Gate** | `src/specs/commands/gate.js` | 実装前（pre）または実装後（post）に spec ファイルの完全性を検証 | `specs/NNN-xxx/spec.md` | PASS/FAIL コンソールレポート; FAIL 時はフローをブロック |
| **エージェント呼び出し** | `src/lib/agent.js` | 外部 AI CLI 呼び出しをラップ; 同期/非同期モード、大きなプロンプト向けの stdin フォールバック、タイムアウト管理を処理 | プロンプト文字列、`config.json` のエージェント設定 | 文字列として返された AI 生成テキスト |
| **設定ローダー** | `src/lib/config.js` | `.sdd-forge/config.json` の読み込みとバリデーション; sdd-forge が管理する全ファイルのパスを解決 | `.sdd-forge/config.json` | バリデーション済み設定オブジェクト; 解決済みファイルパス |
| **コマンドコンテキスト** | `src/docs/lib/command-context.js` | 全パイプラインコマンドが使用する共有 `CommandContext` オブジェクトを構築 | CLI 引数、環境変数、`config.json` | `root`、`srcRoot`、`config`、`lang`、`agent`、`t()` 等を持つ `CommandContext` |
| **プリセットシステム** | `src/lib/presets.js` + `src/presets/` | `preset.json` ファイルを自動探索し、プロジェクトタイプをスキャン対象およびテンプレートセットにマッピング | `src/presets/**/preset.json` | `PRESETS` 定数; タイプエイリアスマップ |
<!-- {{/text}} -->

### 外部統合

<!-- {{text: If there are external system integrations, describe their purpose and connection method in table format.}} -->

| 外部システム | 目的 | 接続方法 | 設定 |
|---|---|---|---|
| **Claude CLI** | `{{text}}` ディレクティブの AI テキスト生成、エンリッチアノテーション、forge による改善、AGENTS.md 生成 | `execFileSync`（同期）または `spawn`（非同期）で子プロセスとして起動 | `.sdd-forge/config.json` の `providers.claude`: `command`、`args`、オプションの `timeoutMs` および `systemPromptFlag` |
| **カスタム AI エージェント** | Claude の代替として任意の AI CLI ツール（例: ローカルモデルラッパー）を使用可能 | 同じ子プロセス機構; コマンドと引数は完全設定可能 | `config.json` の `providers.<name>` エントリ; `defaultAgent` でアクティブなプロバイダーを選択 |
| **npm レジストリ** | パッケージ配布; sdd-forge は npmjs.com に `sdd-forge` として公開 | `npm publish` CLI; タグ管理には `npm dist-tag` を使用 | `package.json` の `files`、`bin`、`version` フィールド |
| **Git** | SDD フロー中のブランチおよびワークツリー管理; コミットとマージ操作 | システムの `git` バイナリへの `child_process` 呼び出し | `config.json` の `flow.merge`（`squash` / `ff-only` / `merge`）で設定 |

全ての外部統合はオペレーティングシステムのプロセスモデルを通じて呼び出されます。sdd-forge 自体は **npm ランタイム依存を一切持たず**、Node.js 組み込みモジュールのみを使用します。
<!-- {{/text}} -->

### 環境の違い

<!-- {{text: Describe the configuration differences across environments (local/staging/production).}} -->

sdd-forge はローカル開発者向け CLI ツールであり、従来のステージングやプロダクションサーバー環境は存在しません。代わりに「環境」はプロジェクトのセットアップと操作コンテキストの違いに対応します。

| コンテキスト | 説明 | 主要な設定 |
|---|---|---|
| **シングルプロジェクト（ローカル）** | 開発者がプロジェクトリポジトリ内で直接 sdd-forge を実行する | プロジェクトルートに `.sdd-forge/config.json` が存在; `projects.json` は不要 |
| **マルチプロジェクト（グローバル）** | `--project <name>` を使用して中央拠点から複数プロジェクトを sdd-forge が管理する | `.sdd-forge/projects.json` に各プロジェクトの `path` と `workRoot` を列挙; `SDD_WORK_ROOT` / `SDD_SOURCE_ROOT` 環境変数がプロジェクトごとに自動設定される |
| **ワークツリーモード** | 独立した機能開発のために Git ワークツリー内で SDD フローを実行する | フロー状態は `.sdd-forge/current-spec` に保存; `isInsideWorktree()` による検出でブランチ処理を自動調整 |
| **CI / 非インタラクティブ** | インタラクティブなプロンプトを想定しない自動実行（パイプライン内など） | エージェントタイムアウトが適用される（`DEFAULT_AGENT_TIMEOUT_MS` = 120 秒、最大 `LONG_AGENT_TIMEOUT_MS` = 300 秒）; CLI のハングを防ぐために `CLAUDECODE` 環境変数をクリア |
| **多言語出力** | 複数の出力言語（例: `["en", "ja"]`）で設定されたプロジェクト | `config.json` の `output.languages`、`output.default`、`output.mode`; ビルドパイプラインが自動的に `translate` ステップを追加 |

`config.json` の `lang` フィールドは、ドキュメント出力言語を管理する `output.languages` とは独立して、CLI のインタラクション言語および生成される AGENTS.md とスキルファイルの言語を制御します。
<!-- {{/text}} -->
