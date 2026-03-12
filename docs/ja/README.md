# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
[English](https://github.com/SpreadWorks/sdd-forge/blob/main/README.md) | **日本語**
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha版:** このツールは現在アルファ版です。API・コマンド体系・設定フォーマットは予告なく変更される可能性があります。本番環境での利用はお控えください。

**ソースコード解析 + AI で、プロジェクトドキュメントを自動生成・維持する CLI ツール。**

コードベースを静的解析し、テンプレートと AI を組み合わせて `docs/` を自動生成します。
さらに Spec-Driven Development（SDD）ワークフローにより、機能追加・修正時のドキュメント更新も自動化します。

## Features

- **ゼロ依存** — Node.js 18+ のみで動作。npm 依存パッケージなし
- **ソースコード自動解析** — コントローラ・モデル・ルート・設定ファイルを静的解析し、構造データを抽出
- **AI ドキュメント生成** — テンプレートの `{{text}}` ディレクティブを AI が自動展開
- **テンプレート継承** — base → arch → preset → project-local の 4 層継承でカスタマイズ可能
- **SDD ワークフロー** — spec → gate → 実装 → forge → review の開発サイクルをコマンドで管理
- **多言語対応** — translate / generate モードで複数言語のドキュメントを自動生成
- **AI エージェント連携** — Claude Code（スキル）・Codex CLI に対応
- **マルチプリセット** — Node.js CLI / CakePHP2 / Laravel / Symfony に対応

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

### セットアップ & ドキュメント生成

<pre>
# 1. プロジェクトを登録（インタラクティブウィザード）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. ドキュメントを一括生成（scan → enrich → init → data → text → readme → agents → translate）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
</pre>

これだけで `docs/` と `README.md` が生成されます。

## コマンド一覧

### ドキュメント生成

| コマンド | 説明 |
|---|---|
| `setup` | プロジェクト登録 + 設定ファイル生成 |
| `build` | ドキュメント生成パイプラインを一括実行 |
| `scan` | ソースコード解析 → `analysis.json` |
| `init` | テンプレートから `docs/` を初期化 |
| `data` | `{{data}}` ディレクティブを解析データで解決 |
| `text` | `{{text}}` ディレクティブを AI で解決 |
| `readme` | `docs/` から `README.md` を自動生成 |
| `forge` | AI によるドキュメント反復改善 |
| `review` | ドキュメント品質チェック |
| `translate` | 多言語翻訳（デフォルト言語 → 他言語） |
| `upgrade` | プリセットテンプレートを最新版に更新 |

### SDD ワークフロー

| コマンド | 説明 |
|---|---|
| `spec` | 仕様書 + feature ブランチを作成 |
| `gate` | 仕様書の実装前チェック |
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

機能追加・修正の流れ:

```
  spec          仕様書を作成（feature ブランチ + spec.md）
    ↓
  gate          仕様ゲートチェック（未解決事項がなければ PASS）
    ↓
  実装          gate PASS 後にコーディング
    ↓
  forge         ドキュメントを自動更新
    ↓
  review        品質チェック（PASS するまで繰り返し）
```

### AI エージェントとの連携

#### Claude Code

スキルで SDD ワークフローを実行できます:

```
/sdd-flow-start   — spec 作成 → gate → 実装を開始
/sdd-flow-close   — forge → review → commit → merge で終了
```

#### Codex CLI

`$` プロンプトからワークフローを実行できます:

```
$sdd-flow-start   — spec 作成 → gate → 実装を開始
$sdd-flow-close   — forge → review → commit → merge で終了
```

## 設定

`sdd-forge setup` で `.sdd-forge/config.json` が生成されます。

```jsonc
{
  "type": "cli/node-cli",     // プロジェクトタイプ（プリセット選択）
  "lang": "ja",               // ドキュメント言語
  "defaultAgent": "claude",   // AI エージェント
  "providers": { ... }        // エージェント設定
}
```

### カスタマイズ

プロジェクト固有のテンプレートやデータソースを追加できます:

```
.sdd-forge/
├── templates/{lang}/
│   ├── docs/      ← 章テンプレート・README のオーバーライド
│   └── specs/     ← spec.md / qa.md テンプレート
└── data/          ← カスタムデータソースモジュール
```

## ドキュメント

<!-- {{data: docs.chapters("章|概要")}} -->
| 章 | 概要 |
| --- | --- |
| [01. ツール概要とアーキテクチャ](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/overview.md) | この章では、ソースコード解析からドキュメントを自動生成し、Spec-Driven Development（SDD）ワークフローを提供する CLI ツール `sdd-forge` を紹介します。 |
| [02. CLIコマンドリファレンス](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/cli_commands.md) | 本章では、sdd-forge で利用可能な全20のCLIコマンドを解説します。 |
| [03. 設定とカスタマイズ](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/configuration.md) | 本章では、sdd-forge がプロジェクトに合わせた動作を行うために読み込む設定ファイルについて説明します。 |
<!-- {{/data}} -->

## License

MIT
