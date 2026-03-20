<!-- {%extends "layout"%} -->
<!-- {%block "content"%} -->
# データベース構成

<!-- {%block "description"%} -->
## 説明

<!-- {{text({prompt: "この章の概要を1〜2文で記述してください。DB数、各DBの用途、接続切り替え方式を踏まえること。"})}} -->
<!-- {{/text}} -->

## 内容
<!-- {%/block%} -->

<!-- {%block "db-list"%} -->
### データベース一覧

<!-- {{text({prompt: "DB構成の各DBの用途と接続設定を表形式で記述してください。", mode: "deep"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "db-switching"%} -->
### DB 切り替え方式

<!-- {{text({prompt: "DB接続の切り替え方式を説明してください。", mode: "deep"})}} -->
<!-- {{/text}} -->
<!-- {%/block%} -->

<!-- {%block "db-env"%} -->
### 環境別接続設定

<!-- {{data("webapp.config.db", {labels: "環境|DB ホスト|備考"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "er-diagram"%} -->
### ER 図（主要テーブル）

<!-- {{data("webapp.models.er")}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
<!-- {%/block%} -->
