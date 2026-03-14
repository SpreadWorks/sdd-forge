# 01. ツール概要とアーキテクチャ

## 概要

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases.}} -->

この章では、ソースコードを解析してテンプレートディレクティブシステムを通じて構造化されたマークダウンを生成することでプロジェクトドキュメントを自動化する CLI ツール `sdd-forge` について説明します。また、実装を記述された仕様に沿わせるためにツールが提供する Spec-Driven Development（SDD）ワークフローについても解説します。

<!-- {{/text}} -->

## 内容

### 目的

<!-- {{text: Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README.}} -->

進化し続けるコードベースと並行して正確な技術ドキュメントを維持することは、開発チームにとって継続的な負担です。手書きで作成されたドキュメントは実際のソースからすぐに乖離し、新しい貢献者のオンボーディングにはプロジェクトのコンテキストを再構築するための繰り返しの手動作業が必要になります。

`sdd-forge` は、ドキュメントを生成された成果物として扱うことでこの問題に対処します。プロジェクトのソースファイル（コントローラー、モデル、エンティティ、マイグレーションなど）をスキャンして構造化メタデータを抽出し、テンプレートディレクティブパイプラインを通じて事前定義されたマークダウン章にそのメタデータを描画します。各情報の配置場所を一度だけ定義すれば、あとはツールが実行のたびに内容を自動的に埋めます。

このツールは、手動メンテナンスなしに生きたドキュメントを求める PHP Web アプリケーション（Symfony、CakePHP、Laravel）や Node.js CLI プロジェクトに携わるバックエンド開発者やテックリードを対象としています。SDD ワークフロー層は、実装開始前に仕様レビューゲートを強制したいチームをさらに支援します。

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
    Scan --> Enrich["enrich\n(AI: エントリごとに役割・概要を付与)"]
    Enrich --> Init["init\n(テンプレートマージ)"]
    Init --> Data["data\n({{data}} ディレクティブ → テーブル)"]
    Data --> Text["text\n({{text}} ディレクティブ → AI 文章)"]
    Text --> Readme["readme\n(README.md 生成)"]
    Readme --> Agents["agents\n(AGENTS.md 生成)"]

    SpecDispatcher --> SpecInit["spec\n(ブランチ + spec.md)"]
    SpecDispatcher --> Gate["gate\n(実装前後チェック)"]

    FlowDirect --> SddFlow["SDD 自動化\n(spec → gate → build)"]
```

<!-- {{/text}} -->

### 主要概念

<!-- {{text: Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code.}} -->

以下の表は、このツールとそのドキュメント全体で使用されるコアコンセプトを定義します。

| 概念 | 説明 |
|---|---|
| **ディレクティブ** | マークダウンテンプレートに埋め込まれたマーカー。`{{data: source.method("Labels")}}` または `{{text: instruction}}` の形式をとります。ビルドパイプラインは、マーカー行自体を保持しながら、各ディレクティブの内容を生成された出力に置き換えます。 |
| **DataSource** | 特定カテゴリのソースファイル（コントローラー、エンティティなど）をスキャンし、`{{data}}` ディレクティブ用のマークダウンテーブルを返す resolve メソッドを公開する JavaScript クラス。 |
| **プリセット** | 特定のプロジェクトタイプ向けに DataSource 定義、章テンプレート、スキャンルールをまとめた名前付き設定バンドル（例: `symfony`、`node-cli`、`cakephp2`）。プリセットは `preset.json` を通じて自動探索されます。 |
| **analysis.json** | `sdd-forge scan` が生成する中間 JSON ファイル。抽出されたすべてのソースメタデータを格納し、後続のすべてのパイプラインステージへの単一入力として機能します。 |
| **enrich** | AI 支援によるパイプラインステージ。`analysis.json` の各エントリに役割、概要、章分類を付与し、下流での `{{text}}` 生成をより高度に行えるようにします。 |
| **章** | `docs/` 内の 1 つのドキュメントセクションに対応する単一のマークダウンファイル。章の順序は `preset.json` の `chapters` 配列で定義され、`config.json` でプロジェクトごとに上書きできます。 |
| **SDD（Spec-Driven Development）** | 実装開始前に機能仕様を作成してゲートチェックでレビューする組み込みワークフロー。コードが記述された仕様と一致していることを保証します。 |
| **flow-state** | 現在の SDD ワークフローステップを追跡する永続化状態ファイル（`.sdd-forge/flow-state.json`）。`flow` コマンドがシェルセッションをまたいで再開できるようにします。 |

<!-- {{/text}} -->

### 典型的な使用フロー

<!-- {{text: Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code.}} -->

以下のステップは、インストールから完全なドキュメントセット生成までの流れを説明します。

1. **パッケージをグローバルにインストールする。**
   ```
   npm install -g sdd-forge
   ```

2. **プロジェクトルートでセットアップを実行する。** `.sdd-forge/config.json` を初期化し、プロジェクトタイプに適したプリセットを選択して、`docs/` テンプレート構造と `AGENTS.md` を作成します。
   ```
   sdd-forge setup
   ```

3. **ソースコードをスキャンする。** スキャナーがプロジェクトファイルを走査してメタデータ（クラス、ルート、カラム、リレーションなど）を抽出し、結果を `.sdd-forge/output/analysis.json` に書き出します。
   ```
   sdd-forge scan
   ```

4. **フルビルドパイプラインを実行する。** `scan → enrich → init → data → text → readme → agents` を順番に実行し、すべての章ファイルにわたる `{{data}}` および `{{text}}` ディレクティブをすべて埋めます。
   ```
   sdd-forge build
   ```

5. **生成されたドキュメントを確認する。** マークダウンファイルは `docs/` ディレクトリに書き出されます。ディレクティブブロック内の内容はビルドのたびに置き換えられますが、ディレクティブブロック*外*に記述したテキストは保持されます。

6. *（任意）* **ドキュメントを翻訳する。** 多言語出力が設定されている場合は、次のコマンドを実行します。
   ```
   sdd-forge translate
   ```

7. *（任意）* **新機能に SDD ワークフローを使用する。** 機能や修正を開始する際は、`sdd-forge flow --request "<説明>"` を使用して仕様ブランチを作成し、仕様を記述してゲートチェックを通過し、実装後にクロージングゲートで完了させます。

<!-- {{/text}} -->
