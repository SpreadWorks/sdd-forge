<!-- @extends -->

<!-- @block: dependencies -->
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
<!-- @endblock -->

<!-- @block: deploy -->
### デプロイフロー

※ デプロイ手順は本番運用チームに確認が必要。ソースコード内にデプロイスクリプトは含まれない。
<!-- @endblock -->

<!-- @block: operations -->
### 運用フロー

※ 運用手順は本番運用チームに確認が必要。
<!-- @endblock -->
