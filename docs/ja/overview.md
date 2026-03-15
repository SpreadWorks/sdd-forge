# 01. ツール概要とアーキテクチャ

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases.}} -->

この章では、ソースコード解析とテンプレート・ディレクティブシステムによる構造化マークダウン生成を通じて、プロジェクトドキュメントを自動化する CLI ツール `sdd-forge` について説明します。また、実装と仕様書の整合性を保つために本ツールが提供する Spec-Driven Development（SDD）ワークフローについても解説します。

<!-- {{/text}} -->

## 内容

### 目的

<!-- {{text: Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README.}} -->

進化し続けるコードベースに対して正確な技術ドキュメントを維持し続けることは、開発チームにとって根強い負担です。手書きのドキュメントは実際のソースとすぐに乖離し、新しいメンバーのオンボーディングではプロジェクトの文脈を何度も手作業で再構築する必要があります。

`sdd-forge` は、ドキュメントを生成物として扱うことでこの問題を解決します。プロジェクトのソースファイル（コントローラー、モデル、エンティティ、マイグレーションなど）をスキャンして構造化メタデータを抽出し、テンプレート・ディレクティブパイプラインを通じてあらかじめ定義されたマークダウンの章に展開します。開発者は各情報の配置場所を一度定義するだけで、実行するたびにツールが自動的に内容を埋めます。

本ツールの主な対象は、PHP ウェブアプリケーション（Symfony、CakePHP、Laravel）や Node.js CLI プロジェクトに携わるバックエンド開発者やテックリードで、手作業なしに常に最新のドキュメントを維持したい方々です。SDD ワークフロー層は、実装前に仕様レビューのゲートチェックを義務付けたいチームをさらに支援します。

<!-- {{/text}} -->

### アーキテクチャ概要

<!-- {{text[mode=deep]: Generate a mermaid flowchart showing the tool's overall architecture. Include the dispatch structure from entry point to subcommands and the main processing flow (input → processing → output). Output only the mermaid code block.}} -->

```mermaid
flowchart TD
    Entry["sdd-forge.js\n(CLI エントリポイント)"]

    Entry --> DocsDispatcher["docs.js\n(ディスパッチャー)"]
    Entry --> SpecDispatcher["spec.js\n(ディスパッチャー)"]
    Entry --> FlowDirect["flow.js\n(直接コマンド)"]
    Entry --> PresetsDirect["presets-cmd.js\n(直接コマンド)"]

    DocsDispatcher --> Build["build\nパイプライン"]
    DocsDispatcher --> Individual["個別コマンド\nscan / enrich / init / data / text\nforge / review / readme / agents\nchangelog / translate / snapshot\nsetup / upgrade / default"]

    Build --> Scan["scan\n(ソース → analysis.json)"]
    Scan --> Enrich["enrich\n(AI: 各エントリに役割・概要を付与)"]
    Enrich --> Init["init\n(テンプレートマージ)"]
    Init --> Data["data\n({{data}} ディレクティブ → 表)"]
    Data --> Text["text\n({{text}} ディレクティブ → AI 文章生成)"]
    Text --> Readme["readme\n(README.md 生成)"]
    Readme --> Agents["agents\n(AGENTS.md 生成)"]

    SpecDispatcher --> SpecInit["spec\n(ブランチ + spec.md)"]
    SpecDispatcher --> Gate["gate\n(実装前後チェック)"]

    FlowDirect --> SddFlow["SDD 自動化\n(spec → gate → build)"]
```

<!-- {{/text}} -->

### 主要な概念

<!-- {{text: Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code.}} -->

以下の表は、本ツールとそのドキュメント全体で使用される主要な概念を定義したものです。

| 概念 | 説明 |
|---|---|
| **ディレクティブ** | マークダウンテンプレートに埋め込まれたマーカーです。`{{data: source.method("Labels")}}` または `{{text: instruction}}` の形式をとります。ビルドパイプラインはマーカー行自体を残したまま、各ディレクティブの内容を生成結果で置き換えます。 |
| **DataSource** | 特定カテゴリのソースファイル（コントローラー、エンティティなど）をスキャンし、`{{data}}` ディレクティブ向けにマークダウン表を返す resolve メソッドを公開する JavaScript クラスです。 |
| **プリセット** | 特定のプロジェクト種別向けに DataSource 定義、章テンプレート、スキャンルールをまとめた名前付き設定バンドルです（例: `symfony`、`node-cli`、`cakephp2`）。`preset.json` を通じて自動検出されます。 |
| **analysis.json** | `sdd-forge scan` が生成する中間 JSON ファイルです。抽出されたすべてのソースメタデータを格納し、後続のパイプライン各段階の唯一の入力となります。 |
| **enrich** | AI を活用したパイプライン段階で、`analysis.json` の各エントリに役割・概要・章分類を付与します。これにより、下流の `{{text}}` 生成がより的確になります。 |
| **章** | `docs/` 内の単一マークダウンファイルで、ドキュメントの 1 セクションに対応します。章の順序は `preset.json` の `chapters` 配列で定義され、`config.json` でプロジェクトごとに上書きできます。 |
| **SDD（Spec-Driven Development）** | 実装開始前に機能仕様を作成し、ゲートチェックでレビューする組み込みワークフローです。コードが仕様書と整合していることを担保します。 |
| **flow-state** | SDD ワークフローの現在のステップを追跡する永続化状態ファイル（`.sdd-forge/flow-state.json`）です。`flow` コマンドがシェルセッションをまたいで再開できるようにします。 |

<!-- {{/text}} -->

### 一般的な利用の流れ

<!-- {{text: Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code.}} -->

以下の手順は、インストールからドキュメント一式の生成完了までの流れを説明します。

1. **パッケージをグローバルにインストールします。**
   ```
   npm install -g sdd-forge
   ```

2. **プロジェクトルートでセットアップを実行します。** `.sdd-forge/config.json` の初期化、プロジェクト種別に応じた適切なプリセットの選択、`docs/` テンプレート構造と `AGENTS.md` の作成が行われます。
   ```
   sdd-forge setup
   ```

3. **ソースコードをスキャンします。** スキャナーがプロジェクトファイルを走査し、メタデータ（クラス、ルート、カラム、リレーションなど）を抽出して `.sdd-forge/output/analysis.json` に書き出します。
   ```
   sdd-forge scan
   ```

4. **ビルドパイプラインを一括実行します。** `scan → enrich → init → data → text → readme → agents` が順に実行され、すべての章ファイルの `{{data}}` および `{{text}}` ディレクティブが展開されます。
   ```
   sdd-forge build
   ```

5. **生成されたドキュメントを確認します。** マークダウンファイルは `docs/` ディレクトリに出力されます。ディレクティブブロック内の内容はビルドのたびに置き換えられますが、ディレクティブブロックの*外側*に記述した内容はそのまま保持されます。

6. *（任意）* **ドキュメントを翻訳します。** 多言語出力が設定されている場合は、以下を実行します:
   ```
   sdd-forge translate
   ```

7. *（任意）* **新機能の開発に SDD ワークフローを使用します。** 機能追加や修正を始める際は、`sdd-forge flow --request "<説明>"` を使って仕様ブランチの作成、仕様書の執筆、ゲートチェックの通過、実装、クロージングゲートによる完了処理を行います。

<!-- {{/text}} -->
