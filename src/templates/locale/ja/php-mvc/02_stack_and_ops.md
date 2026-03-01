# 02. 技術スタックと運用

## 説明

<!-- @text: この章の概要を1〜2文で記述してください。使用言語・フレームワーク・DBのバージョン、コンテナ構成を踏まえること。 -->

## 内容

### 技術スタック

<!-- @data: table(config.stack, labels=カテゴリ|技術|バージョン) -->

### PHP 依存パッケージ (composer.json)

<!-- @data: table(config.composer, labels=パッケージ|バージョン|用途) -->

### docker-compose.yml 構成

<!-- @data: table(docker, labels=サービス|コンテナ名|ポート|イメージ) -->

### フロントエンドライブラリ

<!-- @data: table(config.assets, labels=ライブラリ|バージョン|用途) -->

### エラーハンドリング

<!-- @data: table(libs.errors, labels=クラス|ファイル|責務) -->

### アプリケーション初期化 (bootstrap.php)

<!-- @data: kv(config.bootstrap, labels=設定項目|値) -->

### メール通知仕様

<!-- @text: メール送信設定のデフォルト値（送信元、トランスポート）を説明してください。 -->

<!-- @data: table(email, labels=送信元ファイル|件名パターン|CC) -->

### デプロイフロー

※ デプロイ手順は本番運用チームに確認が必要。ソースコード内にデプロイスクリプトは含まれない。

### 運用フロー

※ 運用手順は本番運用チームに確認が必要。
