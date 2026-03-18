<!-- @extends -->

<!-- @block: dependencies -->
### PHP 依存パッケージ (composer.json)

<!-- {{data: laravel.config.composer("パッケージ|バージョン|用途")}} -->
<!-- {{/data}} -->

### docker-compose.yml 構成

<!-- {{data: laravel.docker.list("サービス|コンテナ名|ポート|イメージ")}} -->
<!-- {{/data}} -->

### ミドルウェア

<!-- {{data: laravel.config.middleware("クラス|ファイル|用途")}} -->
<!-- {{/data}} -->

### サービスプロバイダ

<!-- {{data: laravel.config.providers("プロバイダ|ファイル|register|boot")}} -->
<!-- {{/data}} -->

### 設定ファイル

<!-- {{data: laravel.config.files("ファイル|主要キー")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: deploy -->
### デプロイフロー

<!-- {{text: Laravel プロジェクトのデプロイ手順を説明してください。php artisan コマンド（migrate, config:cache, route:cache 等）を含めること。}} -->
<!-- {{/text}} -->
<!-- @endblock -->

<!-- @block: operations -->
### 運用フロー

<!-- {{text: Laravel プロジェクトの運用手順を説明してください。キューワーカー、スケジューラ、ログ等を含めること。}} -->
<!-- {{/text}} -->
<!-- @endblock -->
