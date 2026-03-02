<!-- @extends -->

<!-- @block: dependencies -->
### PHP 依存パッケージ (composer.json)

<!-- @data: table(config.composer, labels=パッケージ|バージョン|用途) -->

### docker-compose.yml 構成

<!-- @data: table(docker, labels=サービス|コンテナ名|ポート|イメージ) -->

### ミドルウェア

<!-- @data: table(config.middleware, labels=クラス|ファイル|用途) -->

### サービスプロバイダ

<!-- @data: table(config.providers, labels=プロバイダ|ファイル|register|boot) -->

### 設定ファイル

<!-- @data: table(config.files, labels=ファイル|主要キー) -->
<!-- @endblock -->

<!-- @block: deploy -->
### デプロイフロー

<!-- @text: Laravel プロジェクトのデプロイ手順を説明してください。php artisan コマンド（migrate, config:cache, route:cache 等）を含めること。 -->
<!-- @endblock -->

<!-- @block: operations -->
### 運用フロー

<!-- @text: Laravel プロジェクトの運用手順を説明してください。キューワーカー、スケジューラ、ログ等を含めること。 -->
<!-- @endblock -->
