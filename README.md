# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

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

# 2. ドキュメントを一括生成（scan → init → data → text → readme）
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

### SDD ワークフロー

| コマンド | 説明 |
|---|---|
| `spec` | 仕様書 + feature ブランチを作成 |
| `gate` | 仕様書の実装前チェック |
| `flow` | SDD ワークフローを自動実行 |
| `changelog` | specs/ から変更履歴を生成 |
| `agents` | AGENTS.md を更新 |

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
| [01. ツール概要とアーキテクチャ](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/01_overview.md) | sdd-forge は、ソースコードを解析してプロジェクトドキュメントを自動生成する Node.js CLI ツールです。 |
| [02. CLI コマンドリファレンス](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/02_cli_commands.md) | sdd-forge は `help`・`setup`・`build`・`scan`・`data`・`text`・`init`・`forge`・`review`・`changelog`・`agents`・`readme`・`spec`・… |
| [03. 設定とカスタマイズ](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/03_configuration.md) | 本章では、sdd-forge が読み込む設定ファイルの構成と各設定項目の意味、AIプロバイダーやドキュメントスタイルといったカスタマイズポイントについて説明します。 |
| [04. 内部設計](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/04_internal_design.md) | 本章では sdd-forge の内部設計として、ディレクトリ・モジュール構成、モジュール間の依存関係、および代表的なコマンド実行時の処理フローを説明します。 |
| [05. 開発・テスト・配布](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/05_development.md) | 本章では、ローカル開発環境の構築方法からテストの実行手順、npm レジストリへのリリースまでの一連の開発サイクルを説明します。 |
<!-- {{/data}} -->

## License

MIT

<!-- MANUAL:START -->
<!-- MANUAL:END -->
