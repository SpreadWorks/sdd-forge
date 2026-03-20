<!-- {%extends%} -->

<!-- {%block "dependencies"%} -->
### PHP 依存パッケージ (composer.json)

<!-- {{data("symfony.config.composer", {labels: "パッケージ|バージョン|用途"})}} -->
<!-- {{/data}} -->

### Symfony Bundles

<!-- {{data("symfony.config.bundles", {labels: "Bundle|完全修飾名|用途"})}} -->
<!-- {{/data}} -->

### 設定ファイル (config/packages/)

<!-- {{data("symfony.config.packages", {labels: "ファイル|主要キー"})}} -->
<!-- {{/data}} -->

### サービス設定

<!-- {{data("symfony.config.services", {labels: "autowire|autoconfigure"})}} -->
<!-- {{/data}} -->

### docker-compose.yml 構成

<!-- {{data("symfony.docker.list", {labels: "サービス|コンテナ名|ポート|イメージ"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "deploy"%} -->
### デプロイフロー

<!-- {{text({prompt: "Symfony プロジェクトのデプロイ手順を説明してください。bin/console コマンド（doctrine:migrations:migrate, cache:clear, assets:install 等）を含めること。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "operations"%} -->
### 運用フロー

<!-- {{text({prompt: "Symfony プロジェクトの運用手順を説明してください。Messenger ワーカー、スケジューラ、ログ（Monolog）等を含めること。"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->
