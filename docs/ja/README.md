# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
**English** | [日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md)
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha:** このツールは現在アルファ版です。API、コマンド構造、設定フォーマットは予告なく変更される場合があります。本番環境での使用は推奨しません。

**プログラムによるソースコード解析からドキュメントを生成する CLI ツール — AI の推測ではなく、事実に基づいて。**

機械的なゲートチェックと構造化テンプレートが、AI 単独では実現できない再現性と正確性を保証します。
Spec-Driven Development (SDD) ワークフローが、機能の追加・変更に合わせてドキュメントを常に最新の状態に保ちます。

## なぜ sdd-forge なのか？

多くの AI ドキュメントツールは、AI にコードを「読ませて」ドキュメントを書かせます。
sdd-forge は違います。

- **プログラムによる解析** — 静的アナライザーがコントローラー・モデル・ルート・設定ファイルを解析します。AI に読ませません。ハルシネーションなし、ファイルの見落としなし
- **事実 vs. 生成** — `{{data}}` ディレクティブはソースコードから機械的に抽出した事実を注入します。`{{text}}` ディレクティブは AI が生成した説明を保持します。何が信頼できる情報で、何が推測かが構造的に明確です
- **機械的なゲートチェック** — Spec の完全性は AI の判断ではなくプログラムロジックで検証されます。信頼できる品質ゲートです
- **構成の安定性** — ディレクティブが「どこに何を書くか」を定義します。AI が段落を並べ替えたりドキュメント構造を変えたりすることはできません

## 機能

### 解析

`scan` がソースコードを静的解析して `analysis.json` を生成します。構造を読み取るのは AI ではなくプログラムです。

- コントローラー・モデル・ルート・設定ファイルを解析して構造データを抽出
- `enrich` が AI に全体像を俯瞰させ、各エントリーに役割・概要・章分類を一括付与
- プリセットシステムが様々なフレームワークやプロジェクト構造に対応

### 生成

`{{data}}` が事実を、`{{text}}` が AI の説明を、それぞれテンプレートに注入します。`build` コマンド一発で `docs/` と `README.md` を生成します。

- テンプレート継承 — 4 層のオーバーライド: base → arch → preset → project-local
- 多言語対応 — translate / generate モードで自動ローカライズ
- ゼロ依存 — Node.js 18+ のみで動作、npm パッケージ不要

### 強制

`gate` が Spec を機械的に検証し、`review` がドキュメント品質をチェックします。SDD ワークフローがドキュメントを常に新鮮な状態に保ちます。

- gate — 未解決項目や承認漏れをプログラムで検出します。PASS するまで実装ブロック
- review — AI がドキュメントとソースコードの整合性をチェック
- AI エージェント連携 — Claude Code (スキル) と Codex CLI をサポート

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
# 1. プロジェクトを登録する（対話式ウィザード）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. すべてのドキュメントを生成する（scan → enrich → init → data → text → readme → agents → translate）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

これだけです — `docs/` と `README.md` が生成されます。

## コマンド

### ドキュメント生成

| コマンド | 説明 |
|---|---|
| `setup` | プロジェクトの登録 + 設定ファイルの生成 |
| `build` | ドキュメント生成パイプライン全体を実行 |
| `scan` | ソースコードを解析 → `analysis.json` |
| `init` | テンプレートから `docs/` を初期化 |
| `data` | `{{data}}` ディレクティブを解析データで解決 |
| `text` | `{{text}}` ディレクティブを AI で解決 |
| `readme` | `docs/` から `README.md` を生成 |
| `forge` | AI でドキュメントを反復改善 |
| `review` | ドキュメント品質をチェック |
| `translate` | ドキュメントを翻訳（デフォルト言語 → その他） |
| `upgrade` | プリセットテンプレートを最新バージョンに更新 |

### SDD ワークフロー

| コマンド | 説明 |
|---|---|
| `spec` | Spec の作成 + フィーチャーブランチ |
| `gate` | 実装前の Spec ゲートチェック |
| `flow` | SDD ワークフローを自動実行 |
| `changelog` | `specs/` から変更ログを生成 |
| `agents` | AGENTS.md を更新 |

### その他

| コマンド | 説明 |
|---|---|
| `presets` | 利用可能なプリセットを一覧表示 |
| `help` | コマンド一覧を表示 |

## SDD ワークフロー

機能開発のフロー:

```
  spec          Spec の作成（フィーチャーブランチ + spec.md）
    ↓
  gate          Spec ゲートチェック ← プログラムによる検証（AI ではない）
    ↓
  implement     ゲート PASS 後にコーディング
    ↓
  forge         AI がドキュメントを更新
    ↓
  review        AI による品質チェック（PASS になるまで繰り返す）
```

### AI エージェント連携

#### Claude Code

スキルで SDD ワークフローを実行:

```
/sdd-flow-start   — Spec 作成 → gate → 実装開始
/sdd-flow-close   — forge → review → コミット → マージ
```

#### Codex CLI

プロンプトからワークフローを実行:

```
$sdd-flow-start   — Spec 作成 → gate → 実装開始
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
│   ├── docs/      ← 章テンプレート & README オーバーライド
│   └── specs/     ← spec.md / qa.md テンプレート
└── data/          ← カスタムデータソースモジュール
```

## ドキュメント

<!-- {{data: docs.chapters("Chapter|Summary")}} -->
| Chapter | Summary |
| --- | --- |
| [01. Tool Overview and Architecture](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/overview.md) | This chapter describes `sdd-forge`, a CLI tool that automates project documentation by analyzing source code and rend… |
| [02. CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/cli_commands.md) | sdd-forge exposes 22 commands organized into four namespaces — `docs`, `spec`, `flow`, and standalone commands — all … |
| [03. Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/configuration.md) | sdd-forge is configured primarily through a single JSON file (`.sdd-forge/config.json`) that controls output language… |
<!-- {{/data}} -->

## ライセンス

MIT
