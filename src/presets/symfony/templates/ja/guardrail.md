<!-- {%guardrail {phase: [spec, impl]}%} -->
### パラメータ化クエリの使用
DQL および QueryBuilder ではパラメータバインディングを必須とする。クエリ内での文字列結合を禁止する。
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [spec, impl]}%} -->
### Service 層の分離
ビジネスロジックは Service クラスに置き、Controller は薄く保つこと。
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [spec, impl]}%} -->
### Voter による認可
認可ロジックは Voter に集約すること。Controller 内での権限チェック分散を禁止する。
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### 外部入力は DTO で受ける
外部入力は DTO + Validator で受け取ること。Request からエンティティへの直接マッピングを禁止する。
<!-- {%/guardrail%} -->
