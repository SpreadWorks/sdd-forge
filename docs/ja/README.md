# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
[English](https://github.com/SpreadWorks/sdd-forge/blob/main/README.md) | **日本語**
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha:** このツールは現在 alpha 版です。API、コマンド構成、設定形式は予告なく変更される場合があります。本番利用は推奨していません。

**プログラムによるソースコード解析からドキュメントを生成する CLI ツールです。AI の推測ではなく、事実に基づいて生成します。**

機械的なゲートチェックと構造化テンプレートにより、AI だけでは実現できない再現性と正確性を担保します。
Spec-Driven Development (SDD) ワークフローによって、機能の追加や変更に合わせてドキュメントを常に同期できます。

## なぜ sdd-forge なのか

多くの AI ドキュメントツールは、AI にコードを「読ませて」ドキュメントを書かせます。
sdd-forge はそこが異なります。

- **プログラムによる解析** — 静的解析器が controllers、models、routes、config を解析し、AI に読ませるのではなく構造を抽出します。幻覚も、見落としもありません
- **事実と生成の分離** — `{{data}}` ディレクティブはソースコードから機械的に抽出した事実を埋め込みます。`{{text}}` ディレクティブには AI が生成した説明を入れます。信頼できる事実と推論された内容が、構造上はっきり分かれています
- **機械的なゲートチェック** — spec の完全性は AI の判断ではなく、プログラムロジックで検証します。信頼できる品質ゲートです
- **構造の安定性** — どこに何を書くかはディレクティブで定義されます。AI が段落を並べ替えたり、文書構造を変えたりすることはできません

## 機能

### 解析

`scan` はソースコードを静的解析し、`analysis.json` を生成します。構造を読むのは AI ではなくプログラムです。

- controllers、models、routes、config files を解析し、構造データを抽出します
- `enrich` では AI が全体像を俯瞰し、各項目に role、summary、chapter classification を付与します
- preset system により、さまざまなフレームワークやプロジェクト構成に対応できます

### 生成

`{{data}}` は事実を、`{{text}}` は AI による説明をテンプレートへ埋め込みます。`build` コマンド一つで `docs/` と `README.md` を生成できます。

- テンプレート継承 — 4 層オーバーライド: base → arch → preset → project-local
- 多言語対応 — translate / generate モードで自動的にローカライズします
- 依存関係なし — Node.js 18+ のみで動作し、npm packages は不要です

### 強制

`gate` は spec を機械的に検証し、`review` はドキュメント品質を確認します。SDD ワークフローによって、ドキュメントを常に最新に保てます。

- gate — unresolved items や missing approvals をプログラムで検出します。PASS するまで実装はブロックされます
- review — docs と source code の整合性を AI が確認します
- AI agent integration — Claude Code (skills) と Codex CLI に対応しています

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
# 1. プロジェクトを登録する（対話ウィザード）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. すべてのドキュメントを生成する（scan → enrich → init → data → text → readme → agents → translate）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

これで完了です。`docs/` と `README.md` が生成されます。

## コマンド

### ドキュメント生成

| コマンド | 説明 |
|---|---|
| `setup` | プロジェクトを登録し、config を生成します |
| `build` | ドキュメント生成パイプライン全体を実行します |
| `scan` | ソースコードを解析して `analysis.json` を生成します |
| `init` | テンプレートから `docs/` を初期化します |
| `data` | 解析データを使って `{{data}}` ディレクティブを解決します |
| `text` | AI を使って `{{text}}` ディレクティブを解決します |
| `readme` | `docs/` から `README.md` を生成します |
| `forge` | AI でドキュメントを反復的に改善します |
| `review` | ドキュメント品質を確認します |
| `translate` | ドキュメントを翻訳します（既定言語 → 他言語） |
| `upgrade` | preset templates を最新バージョンに更新します |

### SDD ワークフロー

| コマンド | 説明 |
|---|---|
| `spec` | spec と feature branch を作成します |
| `gate` | 実装前に spec を確認します |
| `flow` | SDD ワークフローを自動実行します |
| `changelog` | specs/ から変更履歴を生成します |
| `agents` | AGENTS.md を更新します |

### その他

| コマンド | 説明 |
|---|---|
| `presets` | 利用可能な presets を一覧表示します |
| `help` | コマンド一覧を表示します |

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

### AI Agent Integration

#### Claude Code

skills から SDD ワークフローを実行します:

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

プロジェクト固有の templates と data sources を追加できます:

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
| [01. Tool Overview and Architecture](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/overview.md) | この章では、ソースコードを解析してプロジェクトドキュメントを自動化する CLI ツール `sdd-forge` の概要とアーキテクチャについて説明します… |
| [02. CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/cli_commands.md) | sdd-forge は 22 個のコマンドを備えており、`docs`、`spec`、`flow`、および独立コマンドの 4 つの名前空間に整理されています… |
| [03. Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/configuration.md) | sdd-forge は主に単一の JSON ファイル（`.sdd-forge/config.json`）で設定し、出力言語などを制御します… |
<!-- {{/data}} -->

## ライセンス

MIT
