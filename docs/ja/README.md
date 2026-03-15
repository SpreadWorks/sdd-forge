# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
**English** | [日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md)
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha：** 本ツールは現在アルファ版です。API、コマンド体系、設定フォーマットは予告なく変更される場合があります。本番環境での使用は推奨しません。

**ソースコードのプログラム的解析からドキュメントを生成する CLI ツール — AI の推測ではなく、事実に基づきます。**

機械的なゲートチェックと構造化テンプレートにより、AI 単体では実現できない再現性と正確性を保証します。
Spec-Driven Development（SDD）ワークフローにより、機能の追加・変更に合わせてドキュメントを常に最新に保ちます。

## なぜ sdd-forge なのか？

多くの AI ドキュメントツールは、AI にコードを「読ませて」ドキュメントを書かせます。
sdd-forge は違います。

- **プログラム的解析** — 静的解析器がコントローラー、モデル、ルート、設定ファイルを解析します。AI に読ませるのではないため、ハルシネーションやファイルの見落としがありません
- **事実と生成の分離** — `{{data}}` ディレクティブはソースコードから機械的に抽出した事実を注入します。`{{text}}` ディレクティブは AI が生成した説明文を保持します。信頼できる情報と推論による情報が構造的に明確です
- **機械的ゲートチェック** — スペックの完全性はプログラムロジックで検証します。AI の判断ではありません。信頼できる品質ゲートです
- **構成の安定性** — ディレクティブが「何をどこに書くか」を定義します。AI が段落を並べ替えたり、ドキュメント構造を変更したりすることはできません

## 機能

### 解析

`scan` はソースコードを静的解析し、`analysis.json` を生成します。構造を読み取るのは AI ではなくプログラムです。

- コントローラー、モデル、ルート、設定ファイルを解析して構造データを抽出します
- `enrich` により AI が全体像を俯瞰し、各エントリに役割・概要・章分類を付与します
- プリセットシステムが多様なフレームワークやプロジェクト構造に対応します

### 生成

`{{data}}` が事実を、`{{text}}` が AI の説明文を、それぞれテンプレートに注入します。`build` コマンド一つで `docs/` と `README.md` を生成します。

- テンプレート継承 — base → arch → preset → project-local の4層オーバーライド
- 多言語対応 — translate / generate モードによる自動ローカライズ
- 外部依存なし — Node.js 18+ のみで動作し、npm パッケージは不要です

### 検証

`gate` がスペックを機械的に検証し、`review` がドキュメント品質をチェックします。SDD ワークフローによりドキュメントを常に最新に保ちます。

- gate — 未解決項目や承認漏れをプログラムで検出します。PASS するまで実装に進めません
- review — AI がドキュメントとソースコードの整合性をチェックします
- AI エージェント連携 — Claude Code（skills）および Codex CLI に対応しています

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

# 2. ドキュメントを一括生成（scan → enrich → init → data → text → readme → agents → translate）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

これだけで `docs/` と `README.md` が生成されます。

## コマンド

### ドキュメント生成

| コマンド | 説明 |
|---|---|
| `setup` | プロジェクト登録と設定ファイル生成 |
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
| `spec` | スペック作成 + フィーチャーブランチ作成 |
| `gate` | 実装前のスペックチェック |
| `flow` | SDD ワークフローを自動実行 |
| `changelog` | specs/ から変更履歴を生成 |
| `agents` | AGENTS.md を更新 |

### その他

| コマンド | 説明 |
|---|---|
| `presets` | 利用可能なプリセットを一覧表示 |
| `help` | コマンド一覧を表示 |

## SDD ワークフロー

機能開発のフロー：

```
  spec          スペック作成（フィーチャーブランチ + spec.md）
    ↓
  gate          スペックのゲートチェック ← プログラムで検証（AI ではない）
    ↓
  implement     ゲート PASS 後にコーディング
    ↓
  forge         AI がドキュメントを更新
    ↓
  review        AI による品質チェック（PASS するまで繰り返し）
```

### AI エージェント連携

#### Claude Code

skills 経由で SDD ワークフローを実行できます：

```
/sdd-flow-start   — スペック作成 → ゲート → 実装開始
/sdd-flow-close   — forge → review → コミット → マージ
```

#### Codex CLI

` プロンプトからワークフローを実行できます：

```
$sdd-flow-start   — スペック作成 → ゲート → 実装開始
$sdd-flow-close   — forge → review → コミット → マージ
```

## 設定

`sdd-forge setup` で `.sdd-forge/config.json` が生成されます：

```jsonc
{
  "type": "cli/node-cli",     // プロジェクトタイプ（プリセット選択）
  "lang": "en",               // ドキュメント言語
  "defaultAgent": "claude",   // AI エージェント
  "providers": { ... }        // エージェント設定
}
```

### カスタマイズ

プロジェクト固有のテンプレートやデータソースを追加できます：

```
.sdd-forge/
├── templates/{lang}/
│   ├── docs/      ← 章テンプレートと README のオーバーライド
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
