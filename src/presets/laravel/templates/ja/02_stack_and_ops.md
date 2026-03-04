<!-- @extends -->

<!-- @block: dependencies -->
### PHP 依存パッケージ (composer.json)

<!-- @data: config.composer("パッケージ|バージョン|用途") -->

### docker-compose.yml 構成

<!-- @data: docker.list("サービス|コンテナ名|ポート|イメージ") -->

### ミドルウェア

<!-- @data: config.middleware("クラス|ファイル|用途") -->

### サービスプロバイダ

<!-- @data: config.providers("プロバイダ|ファイル|register|boot") -->

### 設定ファイル

<!-- @data: config.files("ファイル|主要キー") -->
<!-- @endblock -->

<!-- @block: deploy -->
### デプロイフロー

<!-- @text: Laravel プロジェクトのデプロイ手順を説明してください。php artisan コマンド（migrate, config:cache, route:cache 等）を含めること。 -->
<!-- @endblock -->

<!-- @block: operations -->
### 運用フロー

<!-- @text: Laravel プロジェクトの運用手順を説明してください。キューワーカー、スケジューラ、ログ等を含めること。 -->
<!-- @endblock -->
