<!-- {%extends%} -->

<!-- {%block "routing"%} -->
### ルーティング設定

<!-- {{text({prompt: "Symfony のルーティング方式を説明してください。#[Route] attribute と config/routes.yaml の役割を含めること。", mode: "deep"})}} -->
<!-- {{/text}} -->

<!-- {{data("symfony.routes.list", {labels: "メソッド|パス|コントローラ|名前"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "controller-list"%} -->
### コントローラ一覧

<!-- {{data("symfony.controllers.list", {labels: "コントローラ名|ファイル|主な責務"})}} -->
<!-- {{/data}} -->

### コントローラ–アクション一覧

<!-- {{data("symfony.controllers.actions", {labels: "コントローラ|アクション"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "controller-deps"%} -->
### DI 依存一覧

<!-- {{data("symfony.controllers.di", {labels: "コントローラ|依存サービス"})}} -->
<!-- {{/data}} -->

### Doctrine リレーション一覧

<!-- {{data("symfony.entities.relations", {labels: "エンティティ|リレーション"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "components"%} -->
### Console コマンド

<!-- {{data("symfony.commands.list", {labels: "コマンド|ファイル|説明"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
