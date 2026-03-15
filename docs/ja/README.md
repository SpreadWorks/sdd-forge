# <!-- {{data: project.name("")}} -->sdd-forge<!-- {{/data}} -->

<!-- {{data: docs.langSwitcher("absolute")}} -->
[English](https://github.com/SpreadWorks/sdd-forge/blob/main/README.md) | **日本語**
<!-- {{/data}} -->

[![npm version](https://img.shields.io/npm/v/sdd-forge.svg)](https://www.npmjs.com/package/sdd-forge)

> **Alpha版:** このツールは現在アルファ版です。API・コマンド体系・設定フォーマットは予告なく変更される可能性があります。本番環境での利用はお控えください。

**ソースコードをプログラムで解析し、AI の推測ではなく事実に基づいたドキュメントを自動生成する CLI ツール。**

機械的なゲートチェックと構造化テンプレートにより、AI だけでは実現できない再現性と正確性を保証します。
Spec-Driven Development（SDD）ワークフローで、機能追加・修正時のドキュメント鮮度も維持します。

## Why sdd-forge?

多くの AI ドキュメント生成ツールは、AI にコードを「読ませて」ドキュメントを書かせます。
sdd-forge は違います。

- **プログラムによる解析** — AI にコードを読ませるのではなく、スタティックアナライザーがコントローラ・モデル・ルート・設定を解析。AI の幻覚や読み漏れがない
- **事実と生成の分離** — `{{data}}` はソースから機械的に抽出した事実。`{{text}}` は AI が生成した説明文。どこが信頼できてどこが推測かが構造的に明確
- **機械的なゲートチェック** — 仕様の完全性をプログラムが検証。AI の判断に依存しない品質ゲート
- **構成の安定性** — ディレクティブが「何をどこに書くか」を定義。AI が段落構成を勝手に変えない

## Features

### Analyze（解析）

`scan` でソースコードを静的解析し `analysis.json` を生成。AI ではなくプログラムが構造を読み取ります。

- コントローラ・モデル・ルート・設定ファイルを解析し、構造データを抽出
- `enrich` で AI が全体像を把握し、各エントリに役割・概要・章分類を付与
- プリセットシステムで様々なフレームワーク・プロジェクト構成に対応

### Generate（生成）

`{{data}}` で事実を、`{{text}}` で AI 説明を、テンプレートに注入。`build` 一発で `docs/` と `README.md` が完成します。

- テンプレート継承 — base → arch → preset → project-local の 4 層継承でカスタマイズ可能
- 多言語対応 — translate / generate モードで複数言語のドキュメントを自動生成
- ゼロ依存 — Node.js 18+ のみで動作。npm 依存パッケージなし

### Enforce（強制）

`gate` で仕様を機械チェック、`review` で品質チェック。SDD フローでドキュメントの鮮度を維持します。

- gate — 仕様書の未解決事項・未承認をプログラムで検出。PASS するまで実装に進めない
- review — AI がドキュメントとソースコードの整合性をチェック
- AI エージェント連携 — Claude Code（スキル）・Codex CLI に対応

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

### その他

| コマンド | 説明 |
|---|---|
| `presets` | 利用可能なプリセット一覧を表示 |
| `help` | コマンド一覧を表示 |

## SDD ワークフロー

機能追加・修正の流れ:

```
  spec          仕様書を作成（feature ブランチ + spec.md）
    ↓
  gate          仕様ゲートチェック ← プログラムが検証（AI ではない）
    ↓
  実装          gate PASS 後にコーディング
    ↓
  forge         AI がドキュメントを自動更新
    ↓
  review        AI が品質チェック（PASS するまで繰り返し）
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
| [01. ツール概要とアーキテクチャ](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/overview.md) | sdd-forge は、ソースコードの静的解析と AI を組み合わせて技術ドキュメントを自動生成する CLI ツールです。 |
| [02. CLI コマンドリファレンス](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/cli_commands.md) | sdd-forge は 20 以上のサブコマンドを提供する CLI ツールで、3 層ディスパッチ構造（`sdd-forge` → 名前空間ディスパッチャー → 個別コマンド）でルーティングされます。 |
| [03. 設定とカスタマイズ](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/configuration.md) | sdd-forge はプロジェクトルート直下の `.sdd-forge/config.json` を中心に、出力言語・プロジェクト種別・ドキュメントスタイル・AI エージェント・並列数などを設定できます。 |
| [04. 内部設計](https://github.com/SpreadWorks/sdd-forge/blob/main/docs/ja/internal_design.md) | sdd-forge は 3 層ディスパッチ（CLI エントリ → ドメインディスパッチャー → コマンド実装）を軸に構成され、共有ライブラリ層（`src/lib/`）とドキュメント生成ライブラリ層（`src/docs/lib/`）が全… |
<!-- {{/data}} -->

## License

MIT
