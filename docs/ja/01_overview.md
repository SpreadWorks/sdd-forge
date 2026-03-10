# 01. システム概要

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the project's architecture and whether it integrates with external systems.}} -->

この章では、Spec-Driven Development を通じてドキュメント生成を自動化する Node.js CLI ツール `sdd-forge` の全体アーキテクチャについて説明します。本システムは 3 層ディスパッチモデルに従い、ソースコード解析からドキュメントを生成・改善するために外部 AI エージェントと連携します。

<!-- {{/text}} -->

## Content

### アーキテクチャ図

<!-- {{text: Generate a mermaid flowchart showing the project architecture. Include data flows between major components. Output only the mermaid code block.}} -->

```mermaid
flowchart TD
    CLI["sdd-forge.js\n(エントリポイント)"]
    CLI --> DOCS["docs.js\n(Docs ディスパッチャー)"]
    CLI --> SPEC["spec.js\n(Spec ディスパッチャー)"]
    CLI --> FLOW["flow.js\n(SDD フロー)"]
    CLI --> HELP["help.js"]

    DOCS --> SCAN["scan"]
    DOCS --> INIT["init"]
    DOCS --> DATA["data"]
    DOCS --> TEXT["text"]
    DOCS --> FORGE["forge"]
    DOCS --> REVIEW["review"]
    DOCS --> README["readme"]
    DOCS --> AGENTS["agents"]

    SPEC --> SINIT["spec init"]
    SPEC --> GATE["gate"]

    SCAN -->|analysis.json| OUTPUT[".sdd-forge/output/"]
    DATA -->|{{data}} を解決| DOCS_DIR["docs/*.md"]
    TEXT -->|{{text}} を解決| DOCS_DIR
    TEXT -->|呼び出し| AI["外部 AI エージェント\n(providers で設定)"]
    FORGE -->|反復改善| AI
    OUTPUT -->|ソースデータ| DATA
    OUTPUT -->|ソースデータ| TEXT
```

<!-- {{/text}} -->

### コンポーネントの責務

<!-- {{text: Describe the major components with their location, responsibilities, and I/O in table format.}} -->

| コンポーネント | 場所 | 責務 | 入力 | 出力 |
|---|---|---|---|---|
| CLI エントリポイント | `src/sdd-forge.js` | トップレベルのサブコマンドルーティング。環境変数を通じてプロジェクトコンテキストを解決 | CLI 引数、`.sdd-forge/projects.json` | ディスパッチャーまたは直接コマンドへのルーティング |
| Docs ディスパッチャー | `src/docs.js` | docs 関連サブコマンド（`build`、`scan`、`init`、`data`、`text` 等）をルーティング | サブコマンド名 + 引数 | `src/docs/commands/*.js` へ委譲 |
| Spec ディスパッチャー | `src/spec.js` | spec 関連サブコマンド（`spec`、`gate`）をルーティング | サブコマンド名 + 引数 | `src/specs/commands/*.js` へ委譲 |
| SDD フロー | `src/flow.js` | SDD ワークフロー全体をエンドツーエンドで統括 | ユーザーリクエスト文字列、フロー状態 | `.sdd-forge/current-spec` の更新、ブランチ操作 |
| スキャナー | `src/docs/lib/scanner.js` | ソースファイルを解析し、構造メタデータを抽出 | ソースファイルツリー | `analysis.json` |
| ディレクティブパーサー | `src/docs/lib/directive-parser.js` | ドキュメントテンプレート内の `{{data}}` / `{{text}}` ディレクティブを解析 | Markdown テンプレートファイル | ディレクティブ AST |
| data コマンド | `src/docs/commands/data.js` | 解析データを使って `{{data}}` ディレクティブを解決 | `analysis.json`、テンプレート | `docs/*.md` セクションへの反映 |
| text コマンド | `src/docs/commands/text.js` | 設定済み AI エージェントを呼び出して `{{text}}` ディレクティブを解決 | テンプレート、`analysis.json`、ソースコード | `docs/*.md` への AI 生成テキスト |
| 設定ローダー | `src/lib/config.js` | `.sdd-forge/config.json` の読み込みとバリデーション、パス解決 | `.sdd-forge/config.json` | 型付き設定オブジェクト、解決済みパス |
| エージェント呼び出し | `src/lib/agent.js` | 外部 AI エージェントを同期または非同期で呼び出す | プロンプト文字列、エージェント設定 | AI エージェントの標準出力テキスト |
| プリセットシステム | `src/presets/` + `src/lib/presets.js` | プリセット定義を自動探索し、プロジェクトタイプをテンプレートにマッピング | `preset.json` ファイル | プリセットレジストリ、型エイリアスマップ |
| ゲートチェック | `src/specs/commands/gate.js` | 実装前後に spec ファイルを検証 | `spec.md`、`config.json` | PASS/FAIL レポート |

<!-- {{/text}} -->

### 外部連携

<!-- {{text: If there are external system integrations, describe their purpose and connection method in table format.}} -->

| システム | 目的 | 接続方法 | 設定 |
|---|---|---|---|
| AI エージェント（例: Claude CLI） | ソースコードと解析データを読み込んでドキュメントの文章を生成・改善 | `execFileSync`（同期）または `spawn`（非同期）で子プロセスとして起動。引数リスト内の `{{PROMPT}}` プレースホルダーにプロンプトを注入 | `.sdd-forge/config.json` の `providers` と `defaultAgent` で定義。`command`、`args`、`timeoutMs`、`systemPromptFlag` をサポート |
| Git | SDD フロー中のブランチ作成、worktree 管理、コミット操作 | `child_process` 経由のシェル呼び出し（`git` CLI） | 現在のリポジトリから取得。`config.json` の `flow.merge` でマージ戦略（`squash` / `ff-only` / `merge`）を制御 |

> **注意:** `sdd-forge` 自体には npm の実行時依存関係がありません。すべての外部通信は AI エージェントの CLI プロセスまたはローカルの `git` バイナリを通じて行われます。

<!-- {{/text}} -->

### 環境別の差異

<!-- {{text: Describe the configuration differences across environments (local/staging/production).}} -->

`sdd-forge` はローカル開発ツールであり、従来の意味でのステージングや本番デプロイ環境を区別しません。環境ごとの設定の違いは、プロジェクトごとの `.sdd-forge/config.json` と、呼び出し時の環境変数によって表現されます。

| 観点 | ローカル（単一プロジェクト） | マルチプロジェクト構成 | CI / 自動化 |
|---|---|---|---|
| プロジェクト解決 | カレントディレクトリまたは `git rev-parse` ルートを暗黙的に使用 | `.sdd-forge/projects.json` に名前付きプロジェクトを登録。`--project <name>` フラグで対象を選択 | `SDD_SOURCE_ROOT` と `SDD_WORK_ROOT` 環境変数でパス解決をオーバーライド |
| AI エージェント | 開発者が対話的に呼び出す CLI（例: `claude`） | 同上。プロジェクトごとに `providers` で設定 | `stdin: "ignore"` の非対話型エージェントコマンド。ハングを防ぐため `CLAUDECODE` 環境変数を削除 |
| 出力言語 | `config.json` の `output.languages` と `output.default` で制御 | プロジェクトごとの `config.json` で設定 | 同上。`translate` モードはプライマリ出力から副次言語を生成 |
| 並列処理数 | `limits.concurrency` のデフォルトは 5 並列ファイル操作 | 同上 | CI ランナーのリソースに合わせて `limits.concurrency` で調整可能 |
| タイムアウト | `DEFAULT_AGENT_TIMEOUT_MS` = 120 秒。`limits.designTimeoutMs` でオーバーライド可能 | 同上 | 大規模コードベースや低速な CI 環境では `limits.designTimeoutMs` を延長することを推奨 |

<!-- {{/text}} -->
