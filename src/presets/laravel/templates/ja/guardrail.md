<!-- {%guardrail {phase: [spec, impl]}%} -->
### Eloquent / Query Builder の使用
`DB::raw()` や生 SQL を使用する場合はバインディングを必須とする。クエリ内での文字列結合を禁止する。
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [spec, impl]}%} -->
### Controller にビジネスロジックを書かない
ビジネスロジックは Service または Action クラスに分離すること。Controller は薄く保つこと。
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### FormRequest によるバリデーション
入力バリデーションは Controller 内で直接行わず、FormRequest クラスを使用すること。
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### Mass Assignment の保護必須
Model は `$guarded` または `$fillable` を定義すること。`Model::unguard()` の使用を禁止する。
<!-- {%/guardrail%} -->
