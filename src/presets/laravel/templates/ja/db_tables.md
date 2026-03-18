<!-- @extends -->

<!-- @block: table-list -->
### テーブル一覧（マイグレーションから抽出）

<!-- {{data: laravel.tables.list("テーブル名|カラム数|主な用途")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: fk -->
### 外部キー関係（FK）

<!-- {{data: laravel.tables.fk("テーブル|カラム|参照先")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: indexes -->
### INDEX

<!-- {{data: laravel.tables.indexes("テーブル|種別|カラム")}} -->
<!-- {{/data}} -->
<!-- @endblock -->
