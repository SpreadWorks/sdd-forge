### Use Eloquent or Query Builder
<!-- {%meta: {phase: [spec, impl]}%} -->
When using `DB::raw()` or raw SQL, parameter bindings are required. String concatenation in queries is prohibited.

### No Business Logic in Controllers
<!-- {%meta: {phase: [spec, impl]}%} -->
Business logic shall be separated into Service or Action classes. Controllers shall remain thin.

### Use Form Request Validation
<!-- {%meta: {phase: [impl]}%} -->
Input validation shall use FormRequest classes instead of inline validation in controllers.

### No Unguarded Mass Assignment
<!-- {%meta: {phase: [impl]}%} -->
Models shall define `$guarded` or `$fillable`. Using `Model::unguard()` is prohibited.
