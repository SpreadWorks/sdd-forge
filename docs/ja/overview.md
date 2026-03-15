# 01. ツール概要とアーキテクチャ

## 説明

<!-- {{text: Write a 1-2 sentence overview of this chapter. Include the tool's purpose, the problem it solves, and its primary use cases.}} -->

この章では、ソースコードを解析し、テンプレートディレクティブ方式で構造化された markdown を生成することで、プロジェクト文書を自動化する CLI ツール `sdd-forge` について説明します。あわせて、実装内容を文書化された仕様と一致させ続けるために、このツールが備える Spec-Driven Development（SDD）ワークフローも取り上げます。

<!-- {{/text}} -->

## 内容

### 目的

<!-- {{text: Describe the problem this CLI tool solves and its target users. Derive the purpose from package.json and README.}} -->

変化し続けるコードベースに合わせて技術文書を正確に保つことは、開発チームにとって継続的な負担です。手作業で書かれた文書は実際のソースとすぐにずれ始め、新しい参加者がプロジェクトの全体像をつかむたびに、同じ説明や確認作業が繰り返し発生します。

`sdd-forge` は、この課題に対して、文書を生成物として扱うことで対応します。controllers、models、entities、migrations などのプロジェクト内ソースを走査し、構造化されたメタデータを抽出し、それをテンプレートディレクティブの処理パイプラインによって、あらかじめ定義された markdown の各章へ反映します。開発者は、それぞれの情報を *どこに* 出すかを一度決めればよく、あとの内容は実行のたびにツールが自動で埋めます。

このツールは、Symfony、CakePHP、Laravel といった PHP Web アプリケーションや、Node.js 製 CLI プロジェクトに携わるバックエンド開発者、テクニカルリードを主な対象としています。手作業で保守しなくても常に更新される文書を求めるチームに向いています。さらに SDD ワークフロー層により、実装前に仕様レビューの通過を必須にしたいチームも支援します。

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
    Scan --> Enrich["enrich\n(AI: 各項目ごとの役割と要約)"]
    Enrich --> Init["init\n(テンプレートのマージ)"]
    Init --> Data["data\n({{data}} ディレクティブ → 表)"]
    Data --> Text["text\n({{text}} ディレクティブ → AI による本文)"]
    Text --> Readme["readme\n(README.md の生成)"]
    Readme --> Agents["agents\n(AGENTS.md の生成)"]

    SpecDispatcher --> SpecInit["spec\n(ブランチ + spec.md)"]
    SpecDispatcher --> Gate["gate\n(実装前後のチェック)"]

    FlowDirect --> SddFlow["SDD 自動化\n(spec → gate → build)"]
```

<!-- {{/text}} -->

### 主要概念

<!-- {{text: Explain the key concepts and terminology needed to understand this tool in table format. Extract the main concepts from source code.}} -->

以下の表では、このツールとその文書全体で使われる中核的な概念を定義します。

| 概念 | 説明 |
|---|---|
| **Directive** | markdown テンプレート内に埋め込むマーカーで、形式は `{{data: source.method("Labels")}}` または `{{text: instruction}}` です。ビルドパイプラインは、このマーカー行自体は残したまま、各ディレクティブの内容を生成結果で置き換えます。 |
| **DataSource** | 特定種類のソースファイル（controllers や entities など）を走査し、`{{data}}` ディレクティブ向けに markdown の表を返す resolve メソッドを提供する JavaScript クラスです。 |
| **Preset** | `symfony`、`node-cli`、`cakephp2` などの名前付き設定セットです。特定のプロジェクト種別向けに、DataSource 定義、章テンプレート、走査ルールをまとめています。Preset は `preset.json` を通じて自動検出されます。 |
| **analysis.json** | `sdd-forge scan` が生成する中間 JSON ファイルです。抽出したソースメタデータをすべて保持し、後続の各パイプライン段階に対する唯一の入力として使われます。 |
| **enrich** | `analysis.json` の各項目に役割、要約、章分類を付与する AI 支援のパイプライン段階です。これにより、後続の `{{text}}` 生成がより適切になります。 |
| **Chapter** | `docs/` 内にある、文書の 1 セクションに対応する単一の markdown ファイルです。章の順序は `preset.json` の `chapters` 配列で定義され、プロジェクトごとに `config.json` で上書きできます。 |
| **SDD (Spec-Driven Development)** | 実装を始める *前に* 機能仕様を作成し、gate チェックで確認する組み込みワークフローです。これにより、コードを文書化された仕様と一致させたまま進められます。 |
| **flow-state** | 現在の SDD ワークフロー段階を追跡する永続状態ファイル（`.sdd-forge/flow-state.json`）です。これにより、`flow` コマンドはシェルセッションをまたいで再開できます。 |

<!-- {{/text}} -->

### 一般的な利用の流れ

<!-- {{text: Describe the typical steps from installation to first output in step format. Derive the steps from help output and command definitions in the source code.}} -->

以下の手順は、インストールから完全に生成された文書一式を得るまでの一般的な流れを示しています。

1. **パッケージをグローバルインストールします。**
   ```
   npm install -g sdd-forge
   ```

2. **プロジェクトのルートで setup を実行します。** これにより `.sdd-forge/config.json` が初期化され、プロジェクト種別に合った preset が選ばれ、`docs/` のテンプレート構成と `AGENTS.md` が作成されます。
   ```
   sdd-forge setup
   ```

3. **ソースコードを走査します。** スキャナーがプロジェクト内ファイルをたどり、メタデータ（classes、routes、columns、relations など）を抽出して、その結果を `.sdd-forge/output/analysis.json` に書き出します。
   ```
   sdd-forge scan
   ```

4. **ビルドパイプライン全体を実行します。** これにより `scan → enrich → init → data → text → readme → agents` が順に実行され、各章ファイル内のすべての `{{data}}` と `{{text}}` ディレクティブが埋められます。
   ```
   sdd-forge build
   ```

5. **生成された文書を確認します。** markdown ファイルは `docs/` ディレクトリに出力されます。ディレクティブブロック内の内容はビルドのたびに置き換えられますが、ディレクティブブロックの *外側* に書いた文章は保持されます。

6. *(任意)* **文書を翻訳します。** 多言語出力が設定されている場合は、次を実行します。
   ```
   sdd-forge translate
   ```

7. *(任意)* **新機能では SDD ワークフローを使います。** 機能追加や修正を始めるときは、`sdd-forge flow --request "<description>"` を使って spec 用ブランチを作成し、仕様を書き、gate チェックを通し、実装し、最後にクローズ用 gate で完了させます。

<!-- {{/text}} -->
