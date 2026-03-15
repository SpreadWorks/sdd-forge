# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
[English](https://github.com/SpreadWorks/sdd-forge/blob/main/README.md) | **日本語**
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha:** このツールは現在 alpha 版です。API、コマンド構成、設定フォーマットは予告なく変更される場合があります。本番利用は推奨していません。

**プログラムによるソースコード解析からドキュメントを生成する CLI ツールです。AI の推測ではなく、事実に基づきます。**

機械的なゲートチェックと構造化テンプレートにより、AI だけでは実現できない再現性と正確性を確保します。
また、Spec-Driven Development（SDD）ワークフローによって、機能の追加や変更に合わせてドキュメントを常に同期できます。

## なぜ sdd-forge なのか

多くの AI ドキュメントツールは、AI にコードを「読ませて」ドキュメントを書かせます。
sdd-forge はそこが違います。

- **プログラム解析** — AI に読ませるのではなく、静的アナライザーが controller、model、route、config を解析します。幻覚も、見落としもありません
- **事実と生成の分離** — `{{data}}` ディレクティブはソースコードから機械的に抽出した事実を埋め込みます。`{{text}}` ディレクティブには AI が生成した説明を入れます。信頼できる情報と推論による説明が、構造として明確に分かれます
- **機械的なゲートチェック** — spec の完全性は AI の判断ではなく、プログラムロジックで検証します。信頼できる品質ゲートです
- **構造の安定性** — ディレクティブが「何をどこに置くか」を定義します。AI が段落を並べ替えたり、文書構造を変えたりすることはできません

## 機能

### 解析

`scan` はソースコードを静的解析し、`analysis.json` を生成します。構造を読むのは AI ではなくプログラムです。

- controller、model、route、config ファイルを解析し、構造データを抽出します
- `enrich` では、AI が全体像を俯瞰し、各エントリに役割、要約、章分類を付与します
- プリセットシステムにより、さまざまなフレームワークやプロジェクト構成に対応できます

### 生成

`{{data}}` は事実を、`{{text}}` は AI による説明をテンプレートへ埋め込みます。`build` を 1 回実行するだけで `docs/` と `README.md` を生成できます。

- テンプレート継承 — base → arch → preset → project-local の 4 層オーバーライド
- 多言語対応 — translate / generate モードで自動ローカライズ
- 依存関係ゼロ — Node.js 18+ のみで動作し、npm パッケージは不要です

### 運用

`gate` は spec を機械的に検証し、`review` はドキュメント品質を確認します。SDD ワークフローによって、ドキュメントを常に最新に保てます。

- gate — 未解決項目や承認漏れをプログラムで検出します。PASS するまで実装は開始できません
- review — AI が docs とソースコードの整合性を確認します
- AI エージェント連携 — Claude Code（skills）と Codex CLI に対応しています

## クイックスタート

### インストール

<pre>
# npm
npm install -g <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

# yarn
yarn global add <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

# pnpm
pnpm add -g <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->
</pre>

### セットアップと生成

<pre>
# 1. プロジェクトを登録（対話ウィザード）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. すべてのドキュメントを生成（scan → enrich → init → data → text → readme → agents → translate）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

これで完了です。`docs/` と `README.md` が生成されます。

## コマンド

### ドキュメント生成

| コマンド | 説明 |
|---|---|
| `setup` | プロジェクトを登録し、config を生成 |
| `build` | ドキュメント生成パイプライン全体を実行 |
| `scan` | ソースコードを解析して `analysis.json` を生成 |
| `init` | テンプレートから `docs/` を初期化 |
| `data` | `{{data}}` ディレクティブを解析データで解決 |
| `text` | `{{text}}` ディレクティブを AI で解決 |
| `readme` | `docs/` から `README.md` を生成 |
| `forge` | AI でドキュメントを反復的に改善 |
| `review` | ドキュメント品質を確認 |
| `translate` | docs を翻訳（既定言語 → 他言語） |
| `upgrade` | プリセットテンプレートを最新バージョンに更新 |

### SDD ワークフロー

| コマンド | 説明 |
|---|---|
| `spec` | spec と feature branch を作成 |
| `gate` | 実装前の spec チェック |
| `flow` | SDD ワークフローを自動実行 |
| `changelog` | specs/ から変更履歴を生成 |
| `agents` | AGENTS.md を更新 |

### その他

| コマンド | 説明 |
|---|---|
| `presets` | 利用可能なプリセットを一覧表示 |
| `help` | コマンド一覧を表示 |

## SDD ワークフロー

機能開発の流れ:

```
  spec          Create spec (feature branch + spec.md)
    ↓
  gate          Spec gate check ← verified by program (not AI)
    ↓
  implement     Code after gate PASS
    ↓
  forge         AI updates documentation
    ↓
  review        AI quality check (repeat until PASS)
```

### AI エージェント連携

#### Claude Code

skills 経由で SDD ワークフローを実行します:

```
/sdd-flow-start   — create spec → gate → start implementation
/sdd-flow-close   — forge → review → commit → merge
```

#### Codex CLI

` prompt からワークフローを実行します:

```
$sdd-flow-start   — create spec → gate → start implementation
$sdd-flow-close   — forge → review → commit → merge
```

## 設定

`sdd-forge setup` は `.sdd-forge/config.json` を生成します:

```jsonc
{
  "type": "cli/node-cli",     // project type (preset selection)
  "lang": "en",               // documentation language
  "defaultAgent": "claude",   // AI agent
  "providers": { ... }        // agent settings
}
```

### カスタマイズ

プロジェクト固有のテンプレートや data source を追加できます:

```
.sdd-forge/
├── templates/{lang}/
│   ├── docs/      ← chapter template & README overrides
│   └── specs/     ← spec.md / qa.md templates
└── data/          ← custom data source modules
```

## ドキュメント

<!-- {{data: docs.chapters("Chapter|Summary")}} -->
| 章 | 概要 |
| --- | --- |
| [01. ツール概要とアーキテクチャ](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/overview.md) | この章では、技術ドキュメント生成を自動化する Spec-Driven Development 向け CLI ツール sdd-forge を紹介します… |
| [02. CLI コマンドリファレンス](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/cli_commands.md) | sdd-forge は、3 層のディスパッチ構成（`sdd-forge <namespace> <subco…`）に整理された 20 以上のコマンドを提供します |
| [03. 設定とカスタマイズ](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/configuration.md) | sdd-forge は主に `.sdd-forge/config.json` と `preset.json` によって設定します。 |
| [04. 内部設計](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/internal_design.md) | この章では、3 層のディレクトリ構造（`src/lib/` →…）を含む sdd-forge の内部アーキテクチャを説明します |
<!-- {{/data}} -->

## ライセンス

MIT
