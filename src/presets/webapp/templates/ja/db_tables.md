<!-- @extends: layout -->
<!-- @block: content -->
# DB テーブル定義

<!-- @block: description -->
## 説明

<!-- {{text: この章の概要を1〜2文で記述してください。テーブル総数、FK関係を踏まえること。}} -->
<!-- {{/text}} -->

## 内容
<!-- @endblock -->

<!-- @block: table-list -->
### テーブル一覧

<!-- {{data: webapp.tables.list("テーブル名|DB|主な用途")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: fk -->
### 外部キー関係（FK）

<!-- {{data: webapp.tables.fk("親テーブル|子テーブル|FK カラム|備考")}} -->
<!-- {{/data}} -->
<!-- @endblock -->

<!-- @block: indexes -->
### INDEX

※ インデックス定義は DB スキーマから直接確認が必要。
<!-- @endblock -->
<!-- @endblock -->
