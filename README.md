# sdd-forge

Spec-Driven Development tooling for automated documentation generation

## クイックスタート

### インストール

```bash
# npm
npm install -g sdd-forge

# yarn
yarn global add sdd-forge

# pnpm
pnpm add -g sdd-forge
```

### 基本コマンド

```bash
# ヘルプ表示
sdd-forge help

# プロジェクトセットアップ
sdd-forge setup

# ドキュメント一括生成
sdd-forge build
```

## ドキュメント

| 章 | 概要 |
|----|------|
| [01. ツール概要とアーキテクチャ](docs/01_overview.md) | 本章では、sdd-forge がどのような課題を解決する CLI ツールであるか、およびその内部アーキテクチャの全体像を説明します。 |
| [02. CLI コマンドリファレンス](docs/02_cli_commands.md) | 本章では `sdd-forge` が提供する全 16 コマンドの仕様を説明します。 |
| [02. 技術スタックと運用](docs/02_stack_and_ops.md) | 本章では、sdd-forge が採用する技術スタックと日常的な運用手順を説明します。 |
| [03. 設定とカスタマイズ](docs/03_configuration.md) | （未記載） |
| [03. プロジェクト構成](docs/03_project_structure.md) | 本章では `src/` 以下に配置された 7 つの主要ディレクトリ（`docs/commands/`、`docs/lib/`、`specs/commands/`、`lib/`、`presets/`、`templates/`、エントリー… |
| [04. 開発ガイド](docs/04_development.md) | 本章では、sdd-forge のローカル開発環境の構築手順とコーディングから動作確認までの開発フローを説明します。 |
| [04. 内部設計](docs/04_internal_design.md) | 本章では sdd-forge の内部構造を説明します。 |
| [05. CLI コマンドリファレンス](docs/05_commands.md) | 本章では `sdd-forge` が提供する 16 のサブコマンドすべての仕様を解説します。 |
| [05. 開発・テスト・配布](docs/05_development.md) | 本章では、sdd-forge のローカル開発環境のセットアップから、テスト実行、npm レジストリへの公開までの一連のフローを説明します。 |
| [06. 設定とカスタマイズ](docs/06_config.md) | sdd-forge は `.sdd-forge/` ディレクトリ配下の JSON ファイル群によって動作を制御します。 |

<!-- MANUAL:START -->
<!-- MANUAL:END -->
