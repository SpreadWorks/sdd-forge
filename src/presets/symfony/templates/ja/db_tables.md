<!-- {%extends%} -->

<!-- {%block "table-list"%} -->
### テーブル一覧（マイグレーションから抽出）

<!-- {{data("symfony.tables.list", {labels: "テーブル名|カラム数|主な用途"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "entity-columns"%} -->
### エンティティ・カラム一覧

<!-- {{data("symfony.entities.columns", {labels: "エンティティ|カラム|型|NULL|PK"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "fk"%} -->
### 外部キー関係（FK）

<!-- {{data("symfony.tables.fk", {labels: "テーブル|カラム|参照先"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->

<!-- {%block "relations"%} -->
### Doctrine リレーション

<!-- {{data("symfony.entities.relations", {labels: "エンティティ|リレーション"})}} -->
<!-- {{/data}} -->
<!-- {%/block%} -->
