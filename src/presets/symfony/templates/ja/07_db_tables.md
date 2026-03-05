<!-- @extends -->

<!-- @block: table-list -->
### テーブル一覧（マイグレーションから抽出）

<!-- @data: tables.list("テーブル名|カラム数|主な用途") -->
<!-- @enddata -->
<!-- @endblock -->

<!-- @block: entity-columns -->
### エンティティ・カラム一覧

<!-- @data: entities.columns("エンティティ|カラム|型|NULL|PK") -->
<!-- @enddata -->
<!-- @endblock -->

<!-- @block: fk -->
### 外部キー関係（FK）

<!-- @data: tables.fk("テーブル|カラム|参照先") -->
<!-- @enddata -->
<!-- @endblock -->

<!-- @block: relations -->
### Doctrine リレーション

<!-- @data: entities.relations("エンティティ|リレーション") -->
<!-- @enddata -->
<!-- @endblock -->
