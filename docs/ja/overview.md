# 01. ツール概要とアーキテクチャ

## Description

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases.}} -->

本章では `sdd-forge` について説明する。`sdd-forge` はソースコードを解析し、テンプレート・ディレクティブシステムを通じて構造化されたマークダウンを生成することで、プロジェクトドキュメントを自動化する CLI ツールである。また、実装を記述された仕様に沿って維持するための Spec-Driven Development (SDD) ワークフローについても説明する。

<!-- {{/text}} -->

## Content

### Purpose

<!-- {{text: Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README.}} -->

進化し続けるコードベースに合わせて正確な技術ドキュメントを維持することは、開発チームにとって継続的な負担である。手動で記述されたドキュメントは実際のソースとすぐに乖離し、新しいメンバーのオンボーディングにはプロジェクトのコンテキストを再構築するための繰り返しの手作業が必要となる。

`sdd-forge` はドキュメントを生成物として扱うことでこの課題を解決する。プロジェクトのソースファイル（コントローラー、モデル、エンティティ、マイグレーションなど）をスキャンして構造化されたメタデータを抽出し、テンプレート・ディレクティブパイプラインを通じて事前定義されたマークダウンの章にそのメタデータを展開する。開発者は各情報をどこに配置するかを一度定義するだけでよく、ツールが毎回の実行時に内容を自動的に補完する。

本ツールは、PHP Web アプリケーション（Symfony、CakePHP、Laravel）および Node.js CLI プロジェクトに携わり、手動メンテナンス不要のリビングドキュメントを求めるバックエンド開発者やテックリードを対象としている。SDD ワークフロー層はさらに、実装開始前に仕様レビューのゲートチェックを強制したいチームを支援する。

<!-- {{/text}} -->

### Architecture Overview

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

    Build --> Scan["scan\n(source → analysis.json)"]
    Scan --> Enrich["enrich\n(AI: 各エントリへの役割・概要付与)"]
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

### Key Concepts

<!-- {{text: Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code.}} -->

以下のテーブルは、本ツールおよびそのドキュメント全体で使用されるコアコンセプトを定義する。

| コンセプト | 説明 |
|---|---|
| **ディレクティブ** | マークダウンテンプレートに埋め込まれたマーカー。`{{data: source.method("Labels")}}` または `{{text: instruction}}` の形式をとる。ビルドパイプラインは各ディレクティブの内容を生成された出力に置き換えるが、マーカー行自体はそのまま残す。 |
| **DataSource** | 特定のカテゴリのソースファイル（コントローラー、エンティティなど）をスキャンし、`{{data}}` ディレクティブ向けにマークダウンテーブルを返す resolve メソッドを公開する JavaScript クラス。 |
| **プリセット** | 特定のプロジェクトタイプ向けに DataSource の定義、章テンプレート、スキャンルールをまとめた名前付き設定バンドル（例: `symfony`、`node-cli`、`cakephp2`）。プリセットは `preset.json` を通じて自動検出される。 |
| **analysis.json** | `sdd-forge scan` が生成する中間 JSON ファイル。抽出されたすべてのソースメタデータを格納し、その後のパイプラインステージすべての入力として機能する。 |
| **enrich** | AI を活用したパイプラインステージ。`analysis.json` の各エントリに役割、概要、章分類を付与し、下流の `{{text}}` 生成をより高度なものにする。 |
| **章** | `docs/` 内の 1 つのドキュメントセクションに対応する単一のマークダウンファイル。章の順序は `preset.json` の `chapters` 配列で定義され、プロジェクトごとに `config.json` で上書きできる。 |
| **SDD (Spec-Driven Development)** | 実装開始前に機能仕様を作成してゲートチェックでレビューする組み込みワークフロー。コードが記述された仕様に沿っていることを保証する。 |
| **flow-state** | 現在の SDD ワークフローのステップを追跡する永続化状態ファイル（`.sdd-forge/flow-state.json`）。`flow` コマンドがシェルセッションをまたいで再開できるようにする。 |

<!-- {{/text}} -->

### Typical Usage Flow

<!-- {{text: Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code.}} -->

以下のステップは、インストールから完全なドキュメントセットの生成までの流れを説明する。

1. **パッケージをグローバルにインストールする。**
   ```
   npm install -g sdd-forge
   ```

2. **プロジェクトルートでセットアップを実行する。** `.sdd-forge/config.json` を初期化し、プロジェクトタイプに適したプリセットを選択して、`docs/` テンプレート構造と `AGENTS.md` を作成する。
   ```
   sdd-forge setup
   ```

3. **ソースコードをスキャンする。** スキャナーがプロジェクトファイルを走査してメタデータ（クラス、ルート、カラム、リレーションなど）を抽出し、結果を `.sdd-forge/output/analysis.json` に書き出す。
   ```
   sdd-forge scan
   ```

4. **フルビルドパイプラインを実行する。** `scan → enrich → init → data → text → readme → agents` を順番に実行し、すべての章ファイルの `{{data}}` および `{{text}}` ディレクティブを埋める。
   ```
   sdd-forge build
   ```

5. **生成されたドキュメントを確認する。** マークダウンファイルは `docs/` ディレクトリに出力される。ディレクティブブロック内のコンテンツはビルドのたびに置き換えられるが、ディレクティブブロックの*外側*に記述したテキストは保持される。

6. *（オプション）* **ドキュメントを翻訳する。** 多言語出力が設定されている場合は次を実行する:
   ```
   sdd-forge translate
   ```

7. *（オプション）* **新機能に SDD ワークフローを使用する。** 機能や修正の開始時に `sdd-forge flow --request "<説明>"` を使用して、スペックブランチの作成、仕様の記述、ゲートチェックの通過、実装、クロージングゲートによる完了を行う。

<!-- {{/text}} -->
