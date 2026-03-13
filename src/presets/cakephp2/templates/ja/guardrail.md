### 生 SQL のサニタイズ必須
`query()` や `$db->rawQuery()` を使用する場合はプレースホルダを使用すること。文字列結合による SQL 構築を禁止する。

### Fat Model, Skinny Controller
ビジネスロジックは Model に置くこと。Controller にビジネスロジックを書いてはならない。

### 保存前バリデーション必須
Model は `beforeSave` または `$validate` でバリデーションルールを定義すること。バリデーションなしの `save()` を禁止する。

### セッション直接操作の禁止
`$_SESSION` を直接操作してはならない。`CakeSession` を使用すること。
