<!-- @extends -->

<!-- @block: dependencies -->
### PHP 依存パッケージ (composer.json)

<!-- @data: config.composer("パッケージ|バージョン|用途") -->

### docker-compose.yml 構成

<!-- @data: docker.list("サービス|コンテナ名|ポート|イメージ") -->

### フロントエンドライブラリ

<!-- @data: config.assets("ライブラリ|バージョン|用途") -->

### エラーハンドリング

<!-- @data: libs.errors("クラス|ファイル|責務") -->

### アプリケーション初期化 (bootstrap.php)

<!-- @data: config.bootstrap("設定項目|値") -->

### メール通知仕様

<!-- @text: メール送信設定のデフォルト値（送信元、トランスポート）を説明してください。 -->

<!-- @data: email.list("送信元ファイル|件名パターン|CC") -->
<!-- @endblock -->

<!-- @block: deploy -->
### デプロイフロー

※ デプロイ手順は本番運用チームに確認が必要。ソースコード内にデプロイスクリプトは含まれない。
<!-- @endblock -->

<!-- @block: operations -->
### 運用フロー

※ 運用手順は本番運用チームに確認が必要。
<!-- @endblock -->
