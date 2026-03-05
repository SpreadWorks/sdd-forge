# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->.svg)](https://www.npmjs.com/package/<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->)

**ソースコード解析 + AI で、プロジェクトドキュメントを自動生成・維持する CLI ツール。**

コードベースを静的解析し、テンプレートと AI を組み合わせて `docs/` を自動生成します。
さらに Spec-Driven Development（SDD）ワークフローにより、機能追加・修正時のドキュメント更新も自動化します。

## Features

- **ゼロ依存** — Node.js 18+ のみで動作。npm 依存パッケージなし
- **ソースコード自動解析** — コントローラ・モデル・ルート・設定ファイルを静的解析し、構造データを抽出
- **AI ドキュメント生成** — テンプレートの `{{text}}` ディレクティブを AI が自動展開
- **テンプレート継承** — base → arch → preset → project-local の 4 層継承でカスタマイズ可能
- **SDD ワークフロー** — spec → gate → 実装 → forge → review の開発サイクルをコマンドで管理
- **Claude Code 連携** — `/sdd-flow-start` `/sdd-flow-close` スキルでワークフローを自動実行
- **マルチプリセット** — Node.js CLI / CakePHP2 / Laravel / Symfony に対応

## クイックスタート

### インストール

```bash
# npm
npm install -g <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

# yarn
yarn global add <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

# pnpm
pnpm add -g <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->
```

### セットアップ & ドキュメント生成

```bash
# 1. プロジェクトを登録（インタラクティブウィザード）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> setup

# 2. ドキュメントを一括生成（scan → init → data → text → readme）
<!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} --> build
```

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

### Claude Code との連携

Claude Code の設定後、スキルで SDD ワークフローを実行できます:

```
/sdd-flow-start   — spec 作成 → gate → 実装を開始
/sdd-flow-close   — forge → review → commit → merge で終了
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
| [01. ツール概要とアーキテクチャ](docs/01_overview.md) | 本章では、`sdd-forge` が何を解決するツールであるか、その全体アーキテクチャ、および利用者が最初の成果物を得るまでの典型的なフローを説明します。 |
| [02. CLI コマンドリファレンス](docs/02_cli_commands.md) | `sdd-forge` は 18 のサブコマンドを提供し、Project / Build / Docs / Scan / Spec / Flow の 6 グループに分類されます。 |
| [03. 設定とカスタマイズ](docs/03_configuration.md) | sdd-forge は `.sdd-forge/` ディレクトリ配下の JSON ファイル群によって動作を制御します。 |
| [04. 内部設計](docs/04_internal_design.md) | 本章では、sdd-forge の内部アーキテクチャとして、CLI エントリポイントから各コマンド実装への3段階ルーティング構造・モジュール間の依存方向・代表的な処理フロー（scan / forge）を解説します。 |
| [05. 開発・テスト・配布](docs/05_development.md) | 本章では、sdd-forge 自身の開発に必要なローカル環境のセットアップ・テスト実行・npm パッケージのリリース手順を説明します。 |
<!-- {{/data}} -->

## License

MIT

<!-- MANUAL:START -->
<!-- MANUAL:END -->
