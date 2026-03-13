# 01. ツール概要とアーキテクチャ

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases.}} -->

本章では、ソースコード解析からドキュメントを自動生成し、Spec-Driven Development（SDD）ワークフローを提供する CLI ツール `sdd-forge` を紹介する。ツールのコアとなる目的、3層ディスパッチアーキテクチャ、基本概念、そしてインストールから実際のドキュメント生成までの典型的な手順を解説する。
<!-- {{/text}} -->

## 内容

### 目的

<!-- {{text: Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README.}} -->

ソフトウェアプロジェクトでは、一度書かれたドキュメントがコードベースと乖離していくという問題が頻繁に発生する。コードが進化するにつれてドキュメントは忘れられ、陳腐化してしまう。`sdd-forge` はソースファイルの静的解析から構造化されたドキュメントを直接生成することでこの問題に対処し、記憶や推測ではなく実際の実装に基づいたドキュメントを維持する。

このツールは、CakePHP・Laravel・Symfony などのフレームワークで構築された PHP ウェブアプリケーションをはじめとする、非自明なコードベースを管理する開発者やチームを対象としている。こうした環境ではアーキテクチャドキュメントを最新に保つために多大な手作業が必要となるが、`sdd-forge` はコントローラー・モデル・エンティティ・マイグレーション・その他のソース成果物をスキャンすることで、開発者がすでにコード内に存在する内容を説明する手間なく、正確な Markdown ドキュメントを生成する。

ドキュメント生成にとどまらず、`sdd-forge` は Spec-Driven Development の規律も強制する。新機能や修正はすべて、実装開始前にゲートチェックを通過しなければならない機械検証可能な仕様書から始まる。これにより、要件からマージされたコードまでの追跡可能なパスが生まれ、曖昧さや計画外のスコープ変更を減らすことができる。
<!-- {{/text}} -->

### アーキテクチャ概要

<!-- {{text[mode=deep]: Generate a mermaid flowchart showing the tool's overall architecture. Include the dispatch structure from entry point to subcommands and the main processing flow (input → processing → output). Output only the mermaid code block.}} -->

```mermaid
flowchart TD
    CLI["sdd-forge.js\n(CLIエントリポイント)"]

    CLI --> DOCS["docs.js\n(docsディスパッチャー)"]
    CLI --> SPEC["spec.js\n(specディスパッチャー)"]
    CLI --> FLOW["flow.js\n(SDDフロー — 直接実行)"]
    CLI --> PRESETS["presets-cmd.js\n(presets list)"]

    DOCS --> SCAN["scan\nソースファイル → analysis.json"]
    DOCS --> ENRICH["enrich\nAIによる解析データの拡充"]
    DOCS --> INIT["init\nテンプレート → docs/"]
    DOCS --> DATA["data\n{{data}}ディレクティブの解決"]
    DOCS --> TEXT["text\nAIによる{{text}}ディレクティブの解決"]
    DOCS --> FORGE["forge\nドキュメントの反復的改善"]
    DOCS --> REVIEW["review\nドキュメント品質チェック"]
    DOCS --> README["readme\nREADME.md の生成"]
    DOCS --> AGENTS["agents\nAGENTS.md の生成"]
    DOCS --> CHANGELOG["changelog\nchange_log.md の生成"]
    DOCS --> SNAPSHOT["snapshot\nリグレッション検出"]

    SPEC --> SPEC_INIT["spec\nspec.md + ブランチの作成"]
    SPEC --> GATE["gate\n実装前後のゲートチェック"]

    SRC["ソースファイル\n(PHP / JS / etc.)"] -->|sdd-forge scan| ANALYSIS[".sdd-forge/output/\nanalysis.json"]
    ANALYSIS --> DATA
    INIT -->|docs/ スケルトン| DATA
    DATA -->|解決済みテーブル| TEXT
    TEXT -->|完成したdocs| FORGE
    FORGE -->|改善されたdocs| REVIEW
    REVIEW -->|PASS| OUT["docs/ — 生きたドキュメント"]
```
<!-- {{/text}} -->

### 主要概念

<!-- {{text: Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code.}} -->

| 概念 | 説明 |
|---|---|
| `analysis.json` | `sdd-forge scan` が生成する中核成果物。ソースファイルから抽出した構造化データ（クラス・メソッド・リレーション・カラム・ファイルメタデータ）を含み、すべての下流コマンドが消費する。 |
| `{{data}}` ディレクティブ | `sdd-forge data` によって解決されるテンプレートのプレースホルダー。指定した DataSource メソッド（例: `controllers.list(...)`）を呼び出し、`analysis.json` をもとに生成した Markdown テーブルでディレクティブブロックを置き換える。 |
| `{{text}}` ディレクティブ | `sdd-forge text` によって解決されるテンプレートのプレースホルダー。AI エージェントが周辺コンテキストと解析データを読み、説明的な文章でブロックを埋める。ディレクティブの枠組みは再生成をまたいで保持され、本文コンテンツのみが置き換えられる。 |
| DataSource | `scan()` メソッド（ソースファイルから構造化データを抽出）と、そのデータを Markdown 出力としてフォーマットする resolve メソッドを組み合わせたクラス。各プリセットは対象フレームワークの規約に合わせた DataSource を提供する。 |
| プリセット | DataSource・ドキュメント章テンプレート・`preset.json` マニフェストを含む自己完結型のバンドルで、特定のフレームワークやプロジェクト種別（`node-cli`・`symfony`・`cakephp2` など）を対象とする。実行時に自動検出される。 |
| `docs/` | 生成されたドキュメントのディレクトリ。章構成はプリセットの `chapters` 配列で定義され、`data` と `text` の解決パスを通じて内容が埋められる。 |
| `spec.md` | `sdd-forge spec --title` で作成される構造化された仕様書ファイル。SDD ワークフローを駆動し、実装開始前と完了後の両方で `sdd-forge gate` によって検証される。 |
| ゲートチェック | 仕様が完全であること・未解決の疑問点がすべて解消されていること、そして実装後モードでは実際の変更が要件と一致していることを確認するバリデーション手順（`sdd-forge gate`）。プレゲートを通過するまで実装はブロックされる。 |
| Forge | 反復的なドキュメント改善ループ（`sdd-forge forge`）。AI エージェントが現在の `docs/` 内容とソースを比較し、精度・完全性・一貫性を向上させるためにセクションを書き直す。 |
| SDD フロー | このツールが強制するエンドツーエンドの Spec-Driven Development プロセス: `spec → gate → implement → forge → review`。ガイド付き実行のために `/sdd-flow-start` および `/sdd-flow-close` スキルでサポートされる。 |
<!-- {{/text}} -->

### 典型的な利用フロー

<!-- {{text: Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code.}} -->

**ステップ 1 — パッケージのインストール**

```bash
npm install -g sdd-forge
```

**ステップ 2 — プロジェクトの登録**

プロジェクトルートで `sdd-forge setup` を実行する。これにより `.sdd-forge/config.json` が作成され、フレームワークに適したプリセットが選択され、AI エージェントにプロジェクトコンテキストを提供する初期 `AGENTS.md` が生成される。

**ステップ 3 — フルビルドパイプラインの実行**

```bash
sdd-forge build
```

`scan → enrich → init → data → text → readme → agents` の完全なパイプラインを順番に実行し、初回実行で内容が充填された `docs/` ディレクトリを生成する。

**ステップ 4 — 生成されたドキュメントのレビュー**

`docs/` ディレクトリを開き、生成された Markdown 章を確認する。`sdd-forge review` を実行して自動品質チェックを行い、改善が必要なセクションを特定する。

**ステップ 5 — forge による改善**

```bash
sdd-forge forge --prompt "Improve the database schema overview"
```

`sdd-forge forge` を使って特定のセクションを反復的に改善し、すべてのチェックが通過するまで `sdd-forge review` を再実行する。

**ステップ 6 — SDD ワークフローによる新機能の開始**

```bash
sdd-forge spec --title "add-export-command"
sdd-forge gate --spec specs/NNN-add-export-command/spec.md
```

コードを書く前に仕様書を作成し、プレゲートチェックを通過してから機能を実装し、最後に `sdd-forge forge` と `sdd-forge review` でサイクルを締めくくってドキュメントを最新に保つ。
<!-- {{/text}} -->
