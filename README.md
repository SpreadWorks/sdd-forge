# sdd-forge

Spec-Driven Development tooling for automated documentation generation

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| 言語 | Node.js (ES Modules) |
| 配布 | npm |
| テスト | — |

## クイックスタート

```bash
npm install -g sdd-forge
sdd-forge help
```

## ドキュメント

| 章 | 概要 |
|----|------|
| [01. ツール概要とアーキテクチャ](docs/01_overview.md) | 本章では、sdd-forge がどのような課題を解決するツールであるか、その全体的なアーキテクチャ、および利用を開始するまでの典型的なフローを説明します。ソースコードの自動解析によるドキュメント生成と、Spec-Driven Development ワークフローの両面からツールの役割を理解できます。 |
| [02. CLI コマンドリファレンス](docs/02_cli_commands.md) | `sdd-forge` は `sdd-forge <コマンド>` 形式のサブコマンド体系を採用しており、ドキュメント生成・品質チェック・SDD ワークフロー支援など 16 種類のコマンドを提供しています。すべてのコマンドで共通して利用できるグローバルオプションとして `--help` および `--project` が用意されています。 |
| [02. 技術スタックと運用](docs/02_stack_and_ops.md) | 本章では、sdd-forge が動作するために必要な技術スタックと、日常的な運用・デプロイ手順を説明します。Node.js 18 以上を実行環境とする純粋な ES モジュール CLI ツールであり、外部フレームワークや npm 依存パッケージを持たない軽量な構成です。 |
| [03. 設定とカスタマイズ](docs/03_configuration.md) | sdd-forge は `.sdd-forge/config.json` を中心とした複数の設定ファイルを読み込み、ドキュメント生成の言語・スタイル・AI プロバイダー・プロジェクト登録などを制御します。テンプレートや AI エージェントのコマンドをカスタマイズすることで、さまざまなプロジェクト環境に合わせた柔軟な運用が可能です。 |
| [03. プロジェクト構成](docs/03_project_structure.md) | 本章では sdd-forge のソースコード構成を解説します。`src/` 配下は `docs`・`specs`・`lib`・`templates` の 4 つの主要ディレクトリに整理されており、それぞれドキュメント生成・仕様管理・共通処理・テンプレートの役割を担っています。 |
| [04. 開発ガイド](docs/04_development.md) | 本章では、sdd-forge の開発環境セットアップからローカル開発の手順、テスト実行までを説明します。外部依存パッケージがないため `npm install` と `npm link` のみで開発環境を構築でき、テストは Node.js 標準の `node:test` モジュールと `node --test` コマンドで実行します。 |
| [04. 内部設計](docs/04_internal_design.md) | 本章では sdd-forge の内部構造を解説します。エントリポイント `sdd-forge.js` からサブシステムディスパッチャ（`docs.js` / `spec.js` / `flow.js`）、さらに `commands/` 配下の個別コマンドへと三層構造で委譲が行われ、`src/lib/` の共有ユーティリティが各層から横断的に利用されます。 |
| [05. CLI コマンドリファレンス](docs/05_commands.md) | `sdd-forge` が提供する 16 のサブコマンドをリファレンス形式でまとめた章です。すべてのコマンドに共通する `--project` および `--help` グローバルオプションを備え、ドキュメント生成系・SDD ワークフロー系・プロジェクト管理系の 3 つの用途に大別されるサブコマンド体系を構成しています。 |
| [05. 開発・テスト・配布](docs/05_development.md) | 本章では、`npm link` を用いたビルドレスなローカル開発環境の構築手順から、ブランチ運用・コミット規約・リリースフローまで、sdd-forge の開発に参加するために必要な情報をまとめています。外部依存ライブラリを持たない素の ES Modules 構成により、セットアップは最小限の手順で完了します。 |
| [06. 設定とカスタマイズ](docs/06_config.md) | sdd-forge は `.sdd-forge/config.json` を中心に動作し、プロジェクトタイプ・出力言語・ドキュメントスタイル・AI エージェントなどを一元管理します。`sdd-forge setup` で初期生成された設定ファイルを直接編集することで、ドキュメント生成の挙動やワークフローのマージ戦略などをカスタマイズできます。 |

## 開発ワークフロー（SDD）

本プロジェクトは Spec-Driven Development（SDD）を採用しています。

```
1. sdd-forge spec --title "..."   — 仕様ファイル作成
2. sdd-forge gate --spec ...      — 仕様ゲート（未解決事項がなければ PASS）
3. 実装
4. sdd-forge forge --prompt "..."  — ドキュメント自動更新
5. sdd-forge review               — ドキュメントレビュー
```

詳細は [CLAUDE.md](CLAUDE.md) の「SDDフロー」セクションを参照してください。

<!-- MANUAL:START -->
<!-- MANUAL:END -->
