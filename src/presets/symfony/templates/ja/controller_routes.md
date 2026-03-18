<!-- @extends -->

<!-- @block: routing -->
### ルーティング設定

<!-- {{text[mode=deep]: Symfony のルーティング方式を説明してください。#[Route] attribute と config/routes.yaml の役割を含めること。}} -->
<!-- {{/text}} -->

<!-- {{data: symfony.routes.list("メソッド|パス|コントローラ|名前")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: controller-list -->
### コントローラ一覧

<!-- {{data: symfony.controllers.list("コントローラ名|ファイル|主な責務")}} -->
<!-- {{/data}} -->

### コントローラ–アクション一覧

<!-- {{data: symfony.controllers.actions("コントローラ|アクション")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: controller-deps -->
### DI 依存一覧

<!-- {{data: symfony.controllers.di("コントローラ|依存サービス")}} -->
<!-- {{/data}} -->

### Doctrine リレーション一覧

<!-- {{data: symfony.entities.relations("エンティティ|リレーション")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: components -->
### Console コマンド

<!-- {{data: symfony.commands.list("コマンド|ファイル|説明")}} -->
<!-- {{/data}} -->
<!-- @endblock -->
