# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
**English** | [日本語](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/README.md)
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **アルファリリース:** 本ツールは現在アルファ版です。API・コマンド構造・設定フォーマットは予告なく変更される場合があります。本番環境での使用は推奨しません。

**ソースコード解析 + AI を活用してプロジェクトドキュメントを自動生成・維持管理する CLI ツールです。**

コードベースを静的解析し、テンプレートと AI を組み合わせて `docs/` を自動生成します。
Spec-Driven Development（SDD）ワークフローにより、機能追加・修正時のドキュメント更新も自動化できます。

## 特徴

- **ゼロ依存** — Node.js 18+ のみで動作。npm パッケージ不要
- **ソース自動解析** — コントローラー・モデル・ルート・設定ファイルを静的解析し、構造データを抽出
- **AI ドキュメント生成** — テンプレートの `{{text}}` ディレクティブを AI が自動展開
- **テンプレート継承** — 4 層継承（base → arch → preset → project-local）で柔軟なカスタマイズが可能
- **SDD ワークフロー** — spec → gate → 実装 → forge → review の開発サイクルをコマンドで管理
- **多言語対応** — translate / generate モードで複数言語のドキュメントを自動生成
- **AI エージェント統合** — Claude Code（スキル）および Codex CLI に対応
- **マルチプリセット** — Node.js CLI / CakePHP2 / Laravel / Symfony をサポート

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

### セットアップとドキュメント生成

<pre>
# 1. プロジェクトを登録する（対話式ウィザード）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. 全ドキュメントを生成する（scan → init → data → text → readme → agents → translate）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

これにより `docs/` と `README.md` が一括生成されます。

## コマンド

### ドキュメント生成

| コマンド | 説明 |
|---|---|
| `setup` | プロジェクト登録 + 設定ファイル生成 |
| `build` | ドキュメント生成パイプラインの全工程を実行 |
| `scan` | ソースコード解析 → `analysis.json` |
| `init` | テンプレートから `docs/` を初期化 |
| `data` | 解析データで `{{data}}` ディレクティブを解決 |
| `text` | AI で `{{text}}` ディレクティブを解決 |
| `readme` | `docs/` から `README.md` を自動生成 |
| `forge` | AI によるドキュメントの反復改善 |
| `review` | ドキュメント品質チェック |
| `translate` | 多言語翻訳（デフォルト言語 → その他言語） |
| `upgrade` | プリセットテンプレートを最新版に更新 |

### SDD ワークフロー

| コマンド | 説明 |
|---|---|
| `spec` | 仕様書 + フィーチャーブランチを作成 |
| `gate` | 仕様書の実装前ゲートチェック |
| `flow` | SDD ワークフローを自動実行 |
| `changelog` | specs/ から変更履歴を生成 |
| `agents` | AGENTS.md を更新 |

### プロジェクト管理

| コマンド | 説明 |
|---|---|
| `default` | デフォルトプロジェクトを設定 |
| `presets` | 利用可能なプリセット一覧を表示 |
| `help` | コマンド一覧を表示 |

## SDD ワークフロー

機能追加・修正時の開発フロー:

```
  spec          仕様書を作成（フィーチャーブランチ + spec.md）
    ↓
  gate          仕様書のゲートチェック（未解決事項がなければ PASS）
    ↓
  implement     gate PASS 後にコーディング開始
    ↓
  forge         ドキュメントを自動更新
    ↓
  review        品質チェック（PASS するまで繰り返す）
```

### AI エージェント統合

#### Claude Code

スキルを使って SDD ワークフローを実行:

```
/sdd-flow-start   — 仕様書作成 → gate → 実装を開始
/sdd-flow-close   — forge → review → コミット → マージで完了
```

#### Codex CLI

プロンプトからワークフローを実行:

```
$sdd-flow-start   — 仕様書作成 → gate → 実装を開始
$sdd-flow-close   — forge → review → コミット → マージで完了
```

## 設定

`sdd-forge setup` を実行すると `.sdd-forge/config.json` が生成されます。

```jsonc
{
  "type": "cli/node-cli",     // プロジェクトタイプ（プリセット選択）
  "lang": "en",               // ドキュメント言語
  "defaultAgent": "claude",   // AI エージェント
  "providers": { ... }        // エージェント設定
}
```

### カスタマイズ

プロジェクト固有のテンプレートやデータソースを追加できます:

```
.sdd-forge/
├── templates/{lang}/
│   ├── docs/      ← 章テンプレートと README のオーバーライド
│   └── specs/     ← spec.md / qa.md テンプレート
└── data/          ← カスタムデータソースモジュール
```

## ドキュメント

<!-- {{data: docs.chapters("Chapter|Overview")}} -->
| Chapter | Overview |
| --- | --- |
| [01. System Overview](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/01_overview.md) | This chapter describes the overall architecture of `sdd-forge`, a Node.js CLI tool that automates documentation gener… |
| [02. CLI Command Reference](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/02_cli_commands.md) | `sdd-forge` provides 19 subcommands organized across a three-level dispatch architecture: top-level commands route th… |
| [03. Configuration and Customization](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/03_configuration.md) |  |
| [04. Internal Design](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/04_internal_design.md) |  |
<!-- {{/data}} -->

## ライセンス

MIT
