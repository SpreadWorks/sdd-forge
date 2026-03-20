<!-- {%extends%} -->

<!-- {%block "routing"%} -->
### ルーティング設定

<!-- {{text({prompt: "Laravel のルーティング方式を説明してください。routes/web.php と routes/api.php の役割を含めること。", mode: "deep"})}} -->
<!-- {{/text}} -->

<!-- {{data("laravel.routes.list", {labels: "メソッド|URI|コントローラ|アクション"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "controller-config"%} -->
### ミドルウェア

<!-- {{data("laravel.controllers.middleware", {labels: "ミドルウェア|適用コントローラ"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "controller-list"%} -->
### コントローラ一覧

<!-- {{data("laravel.controllers.list", {labels: "コントローラ名|ファイル|主な責務"})}} -->
<!-- {{/data}} -->

### コントローラ–アクション一覧

<!-- {{data("laravel.controllers.actions", {labels: "コントローラ|アクション"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "controller-deps"%} -->
### Eloquent リレーション一覧

<!-- {{data("laravel.models.relations", {labels: "モデル|リレーション"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "components"%} -->
### Artisan コマンド

<!-- {{data("laravel.commands.list", {labels: "コマンド|ファイル|説明"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
