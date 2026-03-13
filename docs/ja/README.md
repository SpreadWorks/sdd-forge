# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
**English** | [日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md)
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha:** このツールは現在アルファ版です。API・コマンド構造・設定フォーマットは予告なく変更される場合があります。本番環境での使用は推奨しません。

**プログラムによるソースコード解析からドキュメントを生成する CLI ツール — AI の推測ではなく、事実に基づいて動作します。**

機械的なゲートチェックと構造化されたテンプレートにより、AI 単独では実現できない再現性と正確性を保証します。
Spec-Driven Development (SDD) ワークフローにより、機能の追加・変更に合わせてドキュメントを常に最新の状態に保ちます。

## なぜ sdd-forge なのか？

ほとんどの AI ドキュメントツールは、AI にコードを「読ませて」ドキュメントを生成します。
sdd-forge はそれとは異なります。

- **プログラムによる解析** — 静的アナライザーがコントローラー・モデル・ルート・設定ファイルを解析します。AI にコードを読ませる必要はなく、ハルシネーションもファイルの見落としもありません
- **事実と生成の分離** — `{{data}}` ディレクティブはソースコードから機械的に抽出した事実を注入します。`{{text}}` ディレクティブは AI が生成した説明を保持します。何が信頼できる情報で、何が推論されたものかが構造的に明確です
- **機械的なゲートチェック** — スペックの完全性は AI の判断ではなくプログラムロジックで検証されます。信頼性の高いクオリティゲートを実現します
- **構成の安定性** — ディレクティブが「どこに何を書くか」を定義します。AI が段落を並べ替えたり、ドキュメント構造を変更することはできません

## 機能

### 解析（Analyze）

`scan` はソースコードを静的解析し、`analysis.json` を生成します。構造を読み取るのは AI ではなくプログラムです。

- コントローラー・モデル・ルート・設定ファイルを解析して構造データを抽出
- `enrich` により AI が全体像を俯瞰し、各エントリーに役割・概要・章分類を付与
- プリセットシステムにより、様々なフレームワークやプロジェクト構造に対応

### 生成（Generate）

`{{data}}` が事実を、`{{text}}` が AI による説明をテンプレートに注入します。`build` コマンド一発で `docs/` と `README.md` が生成されます。

- テンプレート継承 — 4 層のオーバーライド: base → arch → preset → project-local
- 多言語対応 — 自動ローカライズのための translate / generate モード
- ゼロ依存 — Node.js 18+ のみで動作、npm パッケージは不要

### 強制（Enforce）

`gate` がスペックを機械的に検証し、`review` がドキュメント品質をチェックします。SDD ワークフローによりドキュメントを常に最新に保ちます。

- gate — 未解決項目や承認漏れをプログラムで検出。PASS になるまで実装をブロック
- review — AI がドキュメントとソースコードの整合性を確認
- AI エージェント連携 — Claude Code（スキル）および Codex CLI に対応

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

# 2. すべてのドキュメントを生成する (scan → enrich → init → data → text → readme → agents → translate)
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

以上で完了です — `docs/` と `README.md` が生成されます。

## コマンド

### ドキュメント生成

| コマンド | 説明 |
|---|---|
| `setup` | プロジェクトを登録して設定を生成する |
| `build` | ドキュメント生成パイプライン全体を実行する |
| `scan` | ソースコードを解析して `analysis.json` を生成する |
| `init` | テンプレートから `docs/` を初期化する |
| `data` | 解析データで `{{data}}` ディレクティブを解決する |
| `text` | AI で `{{text}}` ディレクティブを解決する |
| `readme` | `docs/` から `README.md` を生成する |
| `forge` | AI によるドキュメントの反復的改善を行う |
| `review` | ドキュメント品質をチェックする |
| `translate` | ドキュメントを翻訳する（デフォルト言語 → 他言語） |
| `upgrade` | プリセットテンプレートを最新バージョンに更新する |

### SDD ワークフロー

| コマンド | 説明 |
|---|---|
| `spec` | スペックとフィーチャーブランチを作成する |
| `gate` | 実装前のスペックゲートチェックを行う |
| `flow` | SDD ワークフローを自動実行する |
| `changelog` | specs/ から変更ログを生成する |
| `agents` | AGENTS.md を更新する |

### プロジェクト管理

| コマンド | 説明 |
|---|---|
| `default` | デフォルトプロジェクトを設定する |
| `presets` | 利用可能なプリセットを一覧表示する |
| `help` | コマンド一覧を表示する |

## SDD ワークフロー

機能開発のフロー:

```
  spec          スペックを作成する（フィーチャーブランチ + spec.md）
    ↓
  gate          スペックゲートチェック ← プログラムによる検証（AI ではない）
    ↓
  implement     ゲート PASS 後にコードを実装する
    ↓
  forge         AI がドキュメントを更新する
    ↓
  review        AI による品質チェック（PASS になるまで繰り返す）
```

### AI エージェント連携

#### Claude Code

スキル経由で SDD ワークフローを実行する:

```
/sdd-flow-start   — スペック作成 → ゲート → 実装開始
/sdd-flow-close   — forge → review → コミット → マージ
```

#### Codex CLI

プロンプトからワークフローを実行する:

```
$sdd-flow-start   — スペック作成 → ゲート → 実装開始
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

プロジェクト固有のテンプレートとデータソースを追加する:

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
| [01. Tool Overview and Architecture](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/overview.md) | This chapter introduces `sdd-forge`, a CLI tool that automates documentation generation from source code analysis and… |
| [02. CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/cli_commands.md) | This chapter documents all 20 CLI commands available in sdd-forge, covering project setup, documentation generation, … |
| [03. Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/configuration.md) | This chapter covers the configuration files that sdd-forge reads to tailor its behavior to your project, including th… |
<!-- {{/data}} -->

## ライセンス

MIT
