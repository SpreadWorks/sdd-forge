<!-- @extends -->

<!-- @block: dependencies -->
### PHP 依存パッケージ (composer.json)

<!-- {{data: symfony.config.composer("パッケージ|バージョン|用途")}} -->
<!-- {{/data}} -->

### Symfony Bundles

<!-- {{data: symfony.config.bundles("Bundle|完全修飾名|用途")}} -->
<!-- {{/data}} -->

### 設定ファイル (config/packages/)

<!-- {{data: symfony.config.packages("ファイル|主要キー")}} -->
<!-- {{/data}} -->

### サービス設定

<!-- {{data: symfony.config.services("autowire|autoconfigure")}} -->
<!-- {{/data}} -->

### docker-compose.yml 構成

<!-- {{data: symfony.docker.list("サービス|コンテナ名|ポート|イメージ")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: deploy -->
### デプロイフロー

<!-- {{text: Symfony プロジェクトのデプロイ手順を説明してください。bin/console コマンド（doctrine:migrations:migrate, cache:clear, assets:install 等）を含めること。}} -->
<!-- {{/text}} -->
<!-- @endblock -->

<!-- @block: operations -->
### 運用フロー

<!-- {{text: Symfony プロジェクトの運用手順を説明してください。Messenger ワーカー、スケジューラ、ログ（Monolog）等を含めること。}} -->
<!-- {{/text}} -->
<!-- @endblock -->
