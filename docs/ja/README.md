# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
**English** | [日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md)
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **アルファ版:** 本ツールは現在アルファ版です。API、コマンド体系、設定フォーマットは予告なく変更される場合があります。本番環境での使用は推奨しません。

**プログラム的なソースコード解析からドキュメントを生成する CLI ツール — AI の推測ではなく、事実に基づきます。**

機械的なゲートチェックと構造化テンプレートにより、AI 単体では実現できない再現性と正確性を保証します。
Spec-Driven Development (SDD) ワークフローにより、機能の追加・変更に合わせてドキュメントを常に最新に保ちます。

## なぜ sdd-forge なのか？

多くの AI ドキュメントツールは、AI にコードを「読ませて」ドキュメントを書かせます。
sdd-forge は異なります。

- **プログラム的解析** — 静的アナライザがコントローラー、モデル、ルート、設定ファイルを解析します。AI に読ませるのではありません。ハルシネーションなし、ファイルの見落としなし
- **事実 vs. 生成** — `{{data}}` ディレクティブはソースコードから機械的に抽出された事実を注入します。`{{text}}` ディレクティブは AI が生成した説明文を保持します。信頼できる情報と推論された情報が構造的に明確です
- **機械的ゲートチェック** — スペックの完全性は AI の判断ではなく、プログラムロジックで検証されます。信頼できる品質ゲートです
- **構成の安定性** — ディレクティブが「どこに何を書くか」を定義します。AI が段落を並べ替えたり、ドキュメント構造を変更したりすることはできません

## 機能

### 解析

`scan` はソースコードを静的解析し、`analysis.json` を生成します。構造を読み取るのは AI ではなくプログラムです。

- コントローラー、モデル、ルート、設定ファイルを解析して構造データを抽出
- `enrich` により AI が全体像を俯瞰し、各エントリーに役割・概要・章分類を付与
- プリセットシステムが様々なフレームワークやプロジェクト構造に対応

### 生成

`{{data}}` は事実を、`{{text}}` は AI の説明文を、それぞれテンプレートに注入します。`build` コマンド一つで `docs/` と `README.md` が生成されます。

- テンプレート継承 — 4層オーバーライド: base → arch → preset → プロジェクトローカル
- 多言語対応 — translate / generate モードによる自動ローカライズ
- 外部依存なし — Node.js 18+ のみで動作、npm パッケージ不要

### 品質保証

`gate` がスペックを機械的に検証し、`review` がドキュメント品質をチェックします。SDD ワークフローによりドキュメントを常に最新に保ちます。

- gate — 未解決項目や承認漏れをプログラムで検出。PASS するまで実装をブロック
- review — AI がドキュメントとソースコードの整合性をチェック
- AI エージェント統合 — Claude Code（スキル）および Codex CLI に対応

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
# 1. プロジェクトを登録（対話型ウィザード）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. 全ドキュメントを生成（scan → enrich → init → data → text → readme → agents → translate）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

以上で `docs/` と `README.md` が生成されます。

## コマンド

### ドキュメント生成

| コマンド | 説明 |
|---|---|
| `setup` | プロジェクト登録 + 設定ファイル生成 |
| `build` | ドキュメント生成パイプラインを一括実行 |
| `scan` | ソースコード解析 → `analysis.json` |
| `init` | テンプレートから `docs/` を初期化 |
| `data` | `{{data}}` ディレクティブを解析データで解決 |
| `text` | `{{text}}` ディレクティブを AI で解決 |
| `readme` | `docs/` から `README.md` を生成 |
| `forge` | AI によるドキュメントの反復改善 |
| `review` | ドキュメント品質チェック |
| `translate` | ドキュメント翻訳（デフォルト言語 → 他言語） |
| `upgrade` | プリセットテンプレートを最新版に更新 |

### SDD ワークフロー

| コマンド | 説明 |
|---|---|
| `spec` | スペック作成 + フィーチャーブランチ |
| `gate` | 実装前スペックチェック |
| `flow` | SDD ワークフローを自動実行 |
| `changelog` | specs/ から変更履歴を生成 |
| `agents` | AGENTS.md を更新 |

### その他

| コマンド | 説明 |
|---|---|
| `presets` | 利用可能なプリセット一覧 |
| `help` | コマンド一覧を表示 |

## SDD ワークフロー

機能開発フロー:

```
  spec          スペック作成（フィーチャーブランチ + spec.md）
    ↓
  gate          スペックゲートチェック ← AI ではなくプログラムが検証
    ↓
  implement     ゲート PASS 後にコーディング
    ↓
  forge         AI がドキュメントを更新
    ↓
  review        AI 品質チェック（PASS するまで繰り返し）
```

### AI エージェント統合

#### Claude Code

スキル経由で SDD ワークフローを実行:

```
/sdd-flow-start   — スペック作成 → ゲート → 実装開始
/sdd-flow-close   — forge → review → コミット → マージ
```

#### Codex CLI

プロンプトからワークフローを実行:

```
$sdd-flow-start   — スペック作成 → ゲート → 実装開始
$sdd-flow-close   — forge → review → コミット → マージ
```

## 設定

`sdd-forge setup` で `.sdd-forge/config.json` が生成されます:

```jsonc
{
  "type": "cli/node-cli",     // プロジェクトタイプ（プリセット選択）
  "lang": "en",               // ドキュメント言語
  "defaultAgent": "claude",   // AI エージェント
  "providers": { ... }        // エージェント設定
}
```

### カスタマイズ

プロジェクト固有のテンプレートやデータソースを追加:

```
.sdd-forge/
├── templates/{lang}/
│   ├── docs/      ← 章テンプレート & README オーバーライド
│   └── specs/     ← spec.md / qa.md テンプレート
└── data/          ← カスタムデータソースモジュール
```

## ドキュメント

<!-- {{data: docs.chapters("Chapter|Summary")}} -->
| 章 | 概要 |
| --- | --- |
| [01. Tool Overview and Architecture](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/overview.md) | This chapter describes `sdd-forge`, a CLI tool that automates project documentation by analyzing source code and rend… |
| [02. CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/cli_commands.md) | sdd-forge exposes 22 commands organized into four namespaces — `docs`, `spec`, `flow`, and standalone commands — all … |
| [03. Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/configuration.md) | sdd-forge is configured primarily through a single JSON file (`.sdd-forge/config.json`) that controls output language… |
<!-- {{/data}} -->

## ライセンス

MIT
