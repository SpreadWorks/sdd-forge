### Eloquent / Query Builder の使用
<!-- {%meta: {phase: [spec, impl]}%} -->
`DB::raw()` や生 SQL を使用する場合はバインディングを必須とする。クエリ内での文字列結合を禁止する。

### Controller にビジネスロジックを書かない
<!-- {%meta: {phase: [spec, impl]}%} -->
ビジネスロジックは Service または Action クラスに分離すること。Controller は薄く保つこと。

### FormRequest によるバリデーション
<!-- {%meta: {phase: [impl]}%} -->
入力バリデーションは Controller 内で直接行わず、FormRequest クラスを使用すること。

### Mass Assignment の保護必須
<!-- {%meta: {phase: [impl]}%} -->
Model は `$guarded` または `$fillable` を定義すること。`Model::unguard()` の使用を禁止する。
