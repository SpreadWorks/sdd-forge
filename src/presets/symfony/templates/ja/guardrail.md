### パラメータ化クエリの使用
<!-- {%meta: {phase: [spec, impl]}%} -->
DQL および QueryBuilder ではパラメータバインディングを必須とする。クエリ内での文字列結合を禁止する。

### Service 層の分離
<!-- {%meta: {phase: [spec, impl]}%} -->
ビジネスロジックは Service クラスに置き、Controller は薄く保つこと。

### Voter による認可
<!-- {%meta: {phase: [spec, impl]}%} -->
認可ロジックは Voter に集約すること。Controller 内での権限チェック分散を禁止する。

### 外部入力は DTO で受ける
<!-- {%meta: {phase: [impl]}%} -->
外部入力は DTO + Validator で受け取ること。Request からエンティティへの直接マッピングを禁止する。
