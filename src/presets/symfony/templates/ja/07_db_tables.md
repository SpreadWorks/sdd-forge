<!-- @extends -->

<!-- @block: table-list -->
### テーブル一覧（マイグレーションから抽出）

<!-- @data: table(tables, labels=テーブル名|カラム数|主な用途) -->
<!-- @endblock -->

<!-- @block: entity-columns -->
### エンティティ・カラム一覧

<!-- @data: table(entities.columns, labels=エンティティ|カラム|型|NULL|PK) -->
<!-- @endblock -->

<!-- @block: fk -->
### 外部キー関係（FK）

<!-- @data: table(tables.fk, labels=テーブル|カラム|参照先) -->
<!-- @endblock -->

<!-- @block: relations -->
### Doctrine リレーション

<!-- @data: table(entities.relations, labels=エンティティ|リレーション) -->
<!-- @endblock -->
