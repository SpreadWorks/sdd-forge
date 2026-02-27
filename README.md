# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| 言語 | Node.js (ES Modules) |
| 配布 | npm |
| テスト | — |

## クイックスタート

```bash
npm install -g {{PACKAGE_NAME}}
{{PACKAGE_NAME}} help
```

## ドキュメント

| 章 | 概要 |
|----|------|
| [01. ツール概要とアーキテクチャ](docs/01_overview.md) | `sdd-forge` は、PHP-MVC プロジェクト（CakePHP 等）における「仕様と実装の乖離」および「技術ドキュメントの作成・維持コスト」という課題を解決するための Node.js CLI ツールである。ソースコード静的解析（`scan`）・テンプレート駆動のドキュメント生成（`init` / `populate` / `tfill`）・仕様ゲート管理（`spec` / `gate`）・反復改善ループ（`forge`）を単一パッケージに統合し、Spec-Driven Development（SDD）ワークフローをコマンドラインから一貫して実行できる。 |
| [02. CLI コマンドリファレンス](docs/02_cli_commands.md) | `SCRIPTS` オブジェクトから `scan:all` を含めると 19 コマンド（エントリは 18 だが `scan:all` は別処理）が確認できます。正確な数を数えます。 |
| [03. 設定とカスタマイズ](docs/03_configuration.md) | sdd-forge の動作は `.sdd-forge/config.json` を中心とした複数の JSON 設定ファイルによって制御され、言語・テンプレートタイプ・AIプロバイダー・タイムアウト・テキスト生成挙動など幅広い項目をカスタマイズできる。プロジェクトごとのテンプレート差し替えは `project-overrides.json`、解析結果の表現上書きは `overrides.json` で行い、関心ごとに設定を分離できる構成になっている。 |
| [04. 内部設計](docs/04_internal_design.md) | `src/bin/sdd-forge.js` がサブコマンドを各モジュール（`analyzers/`・`engine/`・`spec/`・`forge/`・`flow/`）へディスパッチし、共通ユーティリティ `lib/` を底辺として解析→生成→改善の方向で一方向に依存が流れる設計になっている。PHPソースを `analyzers/` が `analysis.json` へ変換し、`engine/populate` と `engine/tfill` がそのデータをテンプレートと組み合わせて `docs/` へ展開するパイプラインが中心的な処理フローである。 |
| [05. 開発・テスト・配布](docs/05_development.md) | `npm link` を使ったビルド不要のローカル開発環境、外部依存ゼロの Node.js 実装、および `npm version` と `npm publish` による npm レジストリへのリリースフローを中心に構成された章である。テストフレームワークは現時点では導入されておらず、動作確認はコマンド直接実行による手動テストで行う。 |

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
