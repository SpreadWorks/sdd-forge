<!-- @extends -->

<!-- @block: dependencies -->
### PHP 依存パッケージ (composer.json)

<!-- @data: config.composer("パッケージ|バージョン|用途") -->

### Symfony Bundles

<!-- @data: config.bundles("Bundle|完全修飾名|用途") -->

### 設定ファイル (config/packages/)

<!-- @data: config.packages("ファイル|主要キー") -->

### サービス設定

<!-- @data: config.services("autowire|autoconfigure") -->

### docker-compose.yml 構成

<!-- @data: docker.list("サービス|コンテナ名|ポート|イメージ") -->
<!-- @endblock -->

<!-- @block: deploy -->
### デプロイフロー

<!-- @text: Symfony プロジェクトのデプロイ手順を説明してください。bin/console コマンド（doctrine:migrations:migrate, cache:clear, assets:install 等）を含めること。 -->
<!-- @endblock -->

<!-- @block: operations -->
### 運用フロー

<!-- @text: Symfony プロジェクトの運用手順を説明してください。Messenger ワーカー、スケジューラ、ログ（Monolog）等を含めること。 -->
<!-- @endblock -->
