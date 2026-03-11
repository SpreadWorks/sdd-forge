# 01. システム概要

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the project's architecture and whether it integrates with external systems.}} -->

この章では、Spec-Driven Development を通じてドキュメント生成を自動化する Node.js CLI ツール「sdd-forge」の高レベルアーキテクチャについて説明します。3 層のコマンドディスパッチシステムがビルドパイプラインをどのようにオーケストレーションするか、各コンポーネントがローカルファイルシステムとどのように連携するか、そして Claude CLI などの外部 AI エージェントとのインテグレーション方法を解説します。
<!-- {{/text}} -->

## 内容

### アーキテクチャ図

<!-- {{text: Generate a mermaid flowchart showing the project architecture. Include data flows between major components. Output only the mermaid code block.}} -->

```mermaid
flowchart TD
    User["ユーザー: sdd-forge &lt;subcommand&gt;"]
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
    AI -->|"{{text}} を補完"| DocsDir
    Readme -->|"書き込み"| ReadmeMd
    Agents -->|"書き込み"| AgentsMd
    Config -->|"全コマンドが参照"| DocsCmds
    Flow -->|"管理"| CurrentSpec
```
<!-- {{/text}} -->

### コンポーネントの責務

<!-- {{text[mode=deep]: Describe the major components with their location, responsibilities, and I/O in table format.}} -->

| コンポーネント | 場所 | 責務 | 入力 | 出力 |
|---|---|---|---|---|
| **エントリポイント** | `src/sdd-forge.js` | CLI 引数解析、プロジェクトコンテキスト解決、ディスパッチャーへのサブコマンドルーティング | 生の `process.argv`、`.sdd-forge/projects.json` | `SDD_SOURCE_ROOT` / `SDD_WORK_ROOT` 環境変数を設定し、ディスパッチャーに委譲 |
| **Docs ディスパッチャー** | `src/docs.js` | docs サブコマンドのルーティング、進捗追跡付きのフルビルドパイプラインのオーケストレーション | サブコマンド名 + 引数 | 個別の `docs/commands/*.js` スクリプトに委譲 |
| **Spec ディスパッチャー** | `src/spec.js` | `spec` および `gate` サブコマンドのルーティング | サブコマンド名 + 引数 | `specs/commands/init.js` または `gate.js` に委譲 |
| **フローランナー** | `src/flow.js` | エンドツーエンドの SDD ワークフロー（spec → gate → 実装 → forge → review）を自動化 | `--request` フラグとフロー状態 | `.sdd-forge/current-spec` 状態ファイル; AI エージェント呼び出し |
| **スキャナー** | `src/docs/commands/scan.js` | プリセット設定に従いソースファイルを再帰的にスキャンして構造メタデータを抽出 | `srcRoot` 配下のソースファイル | `.sdd-forge/output/analysis.json` |
| **エンリッチ** | `src/docs/commands/enrich.js` | AI エージェントを呼び出して各解析エントリに `summary`、`detail`、`chapter`、`role` フィールドを付与。バッチ再開に対応 | `analysis.json` | エンリッチフィールドがインプレースで追加された更新済み `analysis.json` |
| **Init** | `src/docs/commands/init.js` | プリセットテンプレートを `docs/` にコピーして初期章ファイル構造を作成 | `src/presets/{key}/templates/{lang}/` のプリセットテンプレート | `docs/*.md` 章ファイル |
| **データリゾルバー** | `src/docs/commands/data.js` | `analysis.json` の構造化データを使って章ファイル内の `{{data}}` ディレクティブを解決 | `docs/*.md`、`analysis.json` | データテーブルが注入された更新済み `docs/*.md` |
| **テキストジェネレーター** | `src/docs/commands/text.js` | ソースコンテキストと共に AI エージェントを呼び出して `{{text}}` ディレクティブを解決。light モードと deep モードに対応 | `docs/*.md`、ソースファイル、`analysis.json` | AI 生成テキストが補完された更新済み `docs/*.md` |
| **Readme ジェネレーター** | `src/docs/commands/readme.js` | 生成された章ファイルから `README.md` を組み立て | `docs/*.md` | `README.md` |
| **Agents アップデーター** | `src/docs/commands/agents.js` | プリセットテンプレートと `analysis.json` をもとに `AGENTS.md` の SDD セクションと PROJECT セクションを再生成 | プリセット AGENTS テンプレート、`analysis.json` | `AGENTS.md`; `CLAUDE.md` シンボリックリンクを作成 |
| **Forge** | `src/docs/commands/forge.js` | AI フィードバックループを使って既存の `docs/*.md` ファイルを反復的に改善 | `docs/*.md`、変更サマリーのプロンプト | 更新済み `docs/*.md` |
| **レビュー** | `src/docs/commands/review.js` | チェックリストに対してドキュメントの品質を評価し、合否を報告 | `docs/*.md`、レビューチェックリスト | コンソールレポート; 構造化された合否結果 |
| **Gate** | `src/specs/commands/gate.js` | 実装前（pre）または実装後（post）に spec ファイルの完全性を検証 | `specs/NNN-xxx/spec.md` | PASS/FAIL コンソールレポート; FAIL 時はフローをブロック |
| **エージェント呼び出し** | `src/lib/agent.js` | 外部 AI CLI 呼び出しをラップ。同期・非同期モード、大きなプロンプト向けの stdin フォールバック、タイムアウト管理を処理 | プロンプト文字列、`config.json` のエージェント設定 | 文字列として返される AI 生成テキスト |
| **設定ローダー** | `src/lib/config.js` | `.sdd-forge/config.json` を読み込んで検証; sdd-forge が管理するすべてのファイルのパスを解決 | `.sdd-forge/config.json` | 検証済み設定オブジェクト; 解決済みファイルパス |
| **コマンドコンテキスト** | `src/docs/lib/command-context.js` | すべてのパイプラインコマンドが使用する共有 `CommandContext` オブジェクトを構築 | CLI 引数、環境変数、`config.json` | `root`、`srcRoot`、`config`、`lang`、`agent`、`t()` などを持つ `CommandContext` |
| **プリセットシステム** | `src/lib/presets.js` + `src/presets/` | `preset.json` ファイルを自動探索し、プロジェクトタイプをスキャン対象とテンプレートセットにマッピング | `src/presets/**/preset.json` | `PRESETS` 定数; 型エイリアスマップ |
<!-- {{/text}} -->

### 外部インテグレーション

<!-- {{text: If there are external system integrations, describe their purpose and connection method in table format.}} -->

| 外部システム | 目的 | 接続方法 | 設定 |
|---|---|---|---|
| **Claude CLI** | `{{text}}` ディレクティブの AI テキスト生成、エンリッチアノテーション、forge による改善、AGENTS.md 生成 | `execFileSync`（同期）または `spawn`（非同期）で子プロセスとして起動 | `.sdd-forge/config.json` の `providers.claude`: `command`、`args`、オプションの `timeoutMs` および `systemPromptFlag` |
| **カスタム AI エージェント** | Claude の代替となる任意の AI CLI ツール（ローカルモデルラッパーなど） | 同じ子プロセス機構を使用。コマンドと引数は完全に設定可能 | `config.json` の `providers.<name>` エントリ; `defaultAgent` でアクティブなプロバイダーを選択 |
| **npm レジストリ** | パッケージ配布; sdd-forge は npmjs.com に `sdd-forge` として公開 | `npm publish` CLI; タグ管理には `npm dist-tag` | `package.json` の `files`、`bin`、`version` フィールド |
| **Git** | SDD フロー中のブランチおよびワークツリー管理; コミットおよびマージ操作 | システムの `git` バイナリへの `child_process` 呼び出し | `config.json` の `flow.merge`（`squash` / `ff-only` / `merge`）で設定 |

すべての外部インテグレーションはオペレーティングシステムのプロセスモデルを通じて呼び出されます。sdd-forge 自体には **npm の実行時依存関係はなく**、Node.js 組み込みモジュールのみを使用しています。
<!-- {{/text}} -->

### 環境の違い

<!-- {{text: Describe the configuration differences across environments (local/staging/production).}} -->

sdd-forge はローカルの開発者向け CLI ツールであり、従来のステージングやプロダクションサーバー環境はありません。代わりに「環境」は、異なるプロジェクト設定やオペレーターのコンテキストに対応します。

| コンテキスト | 説明 | 主な設定 |
|---|---|---|
| **シングルプロジェクト（ローカル）** | 開発者がプロジェクトリポジトリ内で直接 sdd-forge を実行 | `.sdd-forge/config.json` がプロジェクトルートに存在; `projects.json` は不要 |
| **マルチプロジェクト（グローバル）** | `--project <name>` を使って一箇所から複数プロジェクトを管理 | `.sdd-forge/projects.json` に各プロジェクトの `path` と `workRoot` をリスト; `SDD_WORK_ROOT` / `SDD_SOURCE_ROOT` 環境変数はプロジェクトごとに自動設定 |
| **ワークツリーモード** | 分離された機能開発のため Git ワークツリー内で SDD フローを実行 | フロー状態は `.sdd-forge/current-spec` に保存; `isInsideWorktree()` 検出がブランチ処理を自動調整 |
| **CI / 非インタラクティブ** | インタラクティブなプロンプトを想定しない自動実行（パイプラインなど） | エージェントタイムアウトが適用される（`DEFAULT_AGENT_TIMEOUT_MS` = 120 秒、最大 `LONG_AGENT_TIMEOUT_MS` = 300 秒）; CLI のハングを防ぐため `CLAUDECODE` 環境変数をクリア |
| **多言語出力** | 複数の出力言語（例: `["en", "ja"]`）で設定されたプロジェクト | `config.json` の `output.languages`、`output.default`、`output.mode`; ビルドパイプラインに `translate` ステップが自動追加 |

`config.json` の `lang` フィールドは CLI のインタラクション言語および生成される AGENTS.md とスキルファイルの言語を制御します。これはドキュメント出力の言語を管理する `output.languages` とは独立しています。
<!-- {{/text}} -->
