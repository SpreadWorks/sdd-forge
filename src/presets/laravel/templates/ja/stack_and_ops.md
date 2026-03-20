<!-- {%extends%} -->

<!-- {%block "dependencies"%} -->
### PHP 依存パッケージ (composer.json)

<!-- {{data("laravel.config.composer", {labels: "パッケージ|バージョン|用途"})}} -->
<!-- {{/data}} -->

### docker-compose.yml 構成

<!-- {{data("laravel.docker.list", {labels: "サービス|コンテナ名|ポート|イメージ"})}} -->
<!-- {{/data}} -->

### ミドルウェア

<!-- {{data("laravel.config.middleware", {labels: "クラス|ファイル|用途"})}} -->
<!-- {{/data}} -->

### サービスプロバイダ

<!-- {{data("laravel.config.providers", {labels: "プロバイダ|ファイル|register|boot"})}} -->
<!-- {{/data}} -->

### 設定ファイル

<!-- {{data("laravel.config.files", {labels: "ファイル|主要キー"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "deploy"%} -->
### デプロイフロー

<!-- {{text({prompt: "Laravel プロジェクトのデプロイ手順を説明してください。php artisan コマンド（migrate, config:cache, route:cache 等）を含めること。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "operations"%} -->
### 運用フロー

<!-- {{text({prompt: "Laravel プロジェクトの運用手順を説明してください。キューワーカー、スケジューラ、ログ等を含めること。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->
