<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# コントローラとルーティング

<!-- {%block "description"%} -->
## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。コントローラ総数、ルーティング方式を踏まえること。"})}} -->
<!-- {{/text}} -->

## 内容
<!-- {%/block%} -->

<!-- {%block "routing"%} -->
### ルーティング設定

<!-- {{text({prompt: "ルーティングの設定方式を説明してください。", mode: "deep"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "controller-config"%} -->
### 共通設定

<!-- {{data("webapp.config.auth", {labels: "項目|内容"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "controller-list"%} -->
### コントローラ一覧

<!-- {{data("webapp.controllers.list", {labels: "コントローラ名|ファイル|主な責務"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "controller-deps"%} -->
### コントローラ–モデル依存関係

<!-- {{text({prompt: "コントローラが宣言しているモデル依存の概要を説明してください。", mode: "deep"})}} -->
<!-- {{/text}} -->

<!-- {{data("webapp.controllers.deps", {labels: "コントローラ|使用モデル"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "components"%} -->
### コンポーネント

<!-- {{data("webapp.views.components", {labels: "コンポーネント|責務"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
<!-- {%/block%} -->
