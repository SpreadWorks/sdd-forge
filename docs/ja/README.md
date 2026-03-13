# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
**English** | [日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md)
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha:** このツールは現在アルファ版です。API・コマンド構成・設定フォーマットは予告なく変更される場合があります。本番環境での使用は推奨しません。

**プログラムによるソースコード解析からドキュメントを生成する CLI ツール — AI の推測ではなく、事実に基づいて。**

機械的なゲートチェックと構造化テンプレートにより、AI 単独では実現できない再現性と正確性を保証します。
Spec-Driven Development（SDD）ワークフローが、機能の追加・変更に合わせてドキュメントを常に最新の状態に保ちます。

## なぜ sdd-forge なのか？

多くの AI ドキュメントツールは、AI にコードを「読ませて」ドキュメントを書かせます。
sdd-forge は違います。

- **プログラムによる解析** — AI にコードを読ませるのではなく、静的アナライザーがコントローラー・モデル・ルート・設定を解析します。ハルシネーションなし、見落としなし
- **事実 vs. 生成** — `{{data}}` ディレクティブはソースコードから機械的に抽出した事実を注入します。`{{text}}` ディレクティブは AI が生成した説明を保持します。何が信頼できる情報で何が推論なのかが構造的に明確です
- **機械的なゲートチェック** — Spec の完全性は AI の判断ではなくプログラムロジックで検証されます。信頼できる品質ゲートです
- **構成の安定性** — ディレクティブが「どこに何を書くか」を定義します。AI が段落を並び替えたりドキュメント構造を変更することはできません

## 機能

### 解析

`scan` はソースコードを静的解析し、`analysis.json` を生成します。構造を読み取るのは AI ではなくプログラムです。

- コントローラー・モデル・ルート・設定ファイルを解析して構造データを抽出
- `enrich` により AI が全体像を俯瞰し、各エントリーに役割・概要・章分類を付与
- プリセットシステムで様々なフレームワーク・プロジェクト構成に対応

### 生成

`{{data}}` は事実を、`{{text}}` は AI による説明をテンプレートに注入します。`build` コマンド一つで `docs/` と `README.md` を生成します。

- テンプレート継承 — 4層オーバーライド: base → arch → preset → project-local
- 多言語対応 — 自動ローカライズのための translate / generate モード
- 依存ゼロ — Node.js 18+ のみで動作、npm パッケージ不要

### 強制

`gate` が spec を機械的に検証し、`review` がドキュメント品質をチェックします。SDD ワークフローでドキュメントを常に最新に保ちます。

- gate — 未解決項目や承認漏れをプログラムで検出。PASS するまで実装をブロック
- review — AI がドキュメントとソースコードの整合性を確認
- AI エージェント統合 — Claude Code（スキル）と Codex CLI に対応

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

### セットアップ & 生成

<pre>
# 1. プロジェクトを登録する（対話型ウィザード）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. すべてのドキュメントを生成する（scan → enrich → init → data → text → readme → agents → translate）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

以上です — `docs/` と `README.md` が生成されます。

## コマンド

### ドキュメント生成

| コマンド | 説明 |
|---|---|
| `setup` | プロジェクトの登録 + 設定ファイルの生成 |
| `build` | ドキュメント生成パイプラインを全て実行 |
| `scan` | ソースコードを解析 → `analysis.json` |
| `init` | テンプレートから `docs/` を初期化 |
| `data` | `{{data}}` ディレクティブを解析データで解決 |
| `text` | `{{text}}` ディレクティブを AI で解決 |
| `readme` | `docs/` から `README.md` を生成 |
| `forge` | AI でドキュメントを反復的に改善 |
| `review` | ドキュメントの品質をチェック |
| `translate` | ドキュメントを翻訳（デフォルト言語 → 他言語） |
| `upgrade` | プリセットテンプレートを最新版に更新 |

### SDD ワークフロー

| コマンド | 説明 |
|---|---|
| `spec` | spec の作成 + フィーチャーブランチの作成 |
| `gate` | 実装前の spec ゲートチェック |
| `flow` | SDD ワークフローを自動実行 |
| `changelog` | specs/ から変更ログを生成 |
| `agents` | AGENTS.md を更新 |

### プロジェクト管理

| コマンド | 説明 |
|---|---|
| `default` | デフォルトプロジェクトを設定 |
| `presets` | 利用可能なプリセットを一覧表示 |
| `help` | コマンド一覧を表示 |

## SDD ワークフロー

機能開発のフロー:

```
  spec          spec の作成（フィーチャーブランチ + spec.md）
    ↓
  gate          spec ゲートチェック ← プログラムによる検証（AI ではない）
    ↓
  implement     gate PASS 後にコーディング
    ↓
  forge         AI がドキュメントを更新
    ↓
  review        AI による品質チェック（PASS するまで繰り返し）
```

### AI エージェント統合

#### Claude Code

スキルを使って SDD ワークフローを実行:

```
/sdd-flow-start   — spec 作成 → gate → 実装開始
/sdd-flow-close   — forge → review → コミット → マージ
```

#### Codex CLI

プロンプトからワークフローを実行:

```
$sdd-flow-start   — spec 作成 → gate → 実装開始
$sdd-flow-close   — forge → review → コミット → マージ
```

## 設定

`sdd-forge setup` が `.sdd-forge/config.json` を生成します:

```jsonc
{
  "type": "cli/node-cli",     // プロジェクトタイプ（プリセット選択）
  "lang": "en",               // ドキュメントの言語
  "defaultAgent": "claude",   // AI エージェント
  "providers": { ... }        // エージェント設定
}
```

### カスタマイズ

プロジェクト固有のテンプレートとデータソースを追加:

```
.sdd-forge/
├── templates/{lang}/
│   ├── docs/      ← 章テンプレートと README のオーバーライド
│   └── specs/     ← spec.md / qa.md テンプレート
└── data/          ← カスタムデータソースモジュール
```

## ドキュメント

<!-- {{data: docs.chapters("Chapter|Summary")}} -->
| Chapter | Summary |
| --- | --- |
| [01. Tool Overview and Architecture](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/overview.md) | This chapter introduces `sdd-forge`, a CLI tool that automates documentation generation from source code analysis and… |
| [02. CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/cli_commands.md) | This chapter documents all 20 CLI commands available in sdd-forge, covering project setup, documentation generation, … |
| [03. Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/configuration.md) | This chapter covers the configuration files that sdd-forge reads to tailor its behavior to your project, including th… |
<!-- {{/data}} -->

## ライセンス

MIT
