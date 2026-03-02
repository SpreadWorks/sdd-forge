# 04. 開発ガイド

## 説明

<!-- @block: description -->
<!-- @text: この章の概要を1〜2文で記述してください。開発環境セットアップ、テスト構成を踏まえること。 -->
<!-- @endblock -->

## 内容

<!-- @block: setup -->
### 環境セットアップ

<!-- @text: ローカル開発環境のセットアップ手順を記述してください。 -->
<!-- @endblock -->

<!-- @block: dev-workflow -->
### ローカル開発手順

<!-- @text: ローカル開発の手順（起動→コーディング→テスト→確認）を記述してください。 -->
<!-- @endblock -->

<!-- @block: sdd-tools -->
### SDD ツール

| コマンド | 説明 |
| --- | --- |
| `sdd-forge spec --title "..."` | spec 初期化（feature ブランチ + spec.md 作成） |
| `sdd-forge gate --spec ...` | spec ゲート（未解決事項チェック） |
| `sdd-forge init` | docs 初期化（テンプレートから docs/ を生成） |
| `sdd-forge review` | docs レビュー（構造・内容・網羅性チェック） |
| `sdd-forge forge --prompt "..."` | docs 反復改善 |
| `sdd-forge flow --request "..."` | SDD フロー自動実行 |
<!-- @endblock -->

<!-- @block: testing -->
### テスト構成

<!-- @text: テストフレームワークとテスト実行方法を説明してください。 -->
<!-- @endblock -->
